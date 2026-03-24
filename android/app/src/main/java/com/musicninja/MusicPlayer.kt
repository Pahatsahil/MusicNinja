package com.musicninja

import android.net.Uri
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class MusicPlayer(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), LifecycleEventListener {
    private val TAG = "MusicPlayer"
    private var mediaPlayer: android.media.MediaPlayer? = null
    private var currentPath: String? = null
    private var isPlaying = false
    private var playbackTimer: java.util.Timer? = null
    private val scope = CoroutineScope(Dispatchers.Main)

    init {
        reactContext.addLifecycleEventListener(this)
    }

    override fun getName(): String {
        return "MusicPlayer"
    }

    @ReactMethod
    fun playAudio(filePath: String, promise: Promise) {
        Log.d(TAG, "Play audio requested: $filePath")

        scope.launch {
            try {
                stopPlayback()

                val formattedPath = formatPath(filePath)
                Log.d(TAG, "Formatted path: $formattedPath")

                val player = android.media.MediaPlayer()
                player.setDataSource(reactApplicationContext, Uri.parse(formattedPath))
                player.setOnPreparedListener { mp ->
                    Log.d(TAG, "Media player prepared, starting playback")
                    mp.start()
                    isPlaying = true
                    currentPath = formattedPath

                    // Start updating playback status
                    startPlaybackUpdates()

                    val result = Arguments.createMap().apply {
                        putString("path", formattedPath)
                        putDouble("duration", mp.duration / 1000.0)
                        putBoolean("isPlaying", true)
                    }

                    promise.resolve(result)
                }

                player.setOnCompletionListener { mp ->
                    Log.d(TAG, "Playback completed")
                    isPlaying = false
                    stopPlaybackUpdates()

                    val event = Arguments.createMap().apply {
                        putString("path", currentPath)
                        putBoolean("completed", true)
                    }

                    sendEvent("onPlaybackComplete", event)
                }

                player.setOnErrorListener { mp, what, extra ->
                    Log.e(TAG, "Playback error: $what, $extra")
                    isPlaying = false
                    stopPlaybackUpdates()

                    val event = Arguments.createMap().apply {
                        putString("path", currentPath)
                        putBoolean("completed", false)
                        putString("error", "Media player error: $what, $extra")
                    }

                    sendEvent("onPlaybackComplete", event)
                    true
                }

                player.prepareAsync()
                mediaPlayer = player

            } catch (e: Exception) {
                Log.e(TAG, "Error playing audio: ${e.message}")
                promise.reject("PLAY_ERROR", "Failed to play audio: ${e.message}")
            }
        }
    }

    @ReactMethod
    fun pauseAudio(promise: Promise){
        scope.launch {
            try {
                mediaPlayer?.let { player ->
                    if (player.isPlaying) {
                        player.pause()
                    }
                }
                isPlaying = false

                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("STOP_ERROR", "Failed to stop playback: ${e.message}")
            }
        }
    }

   @ReactMethod
    fun seekTo(positionInSeconds: Double, promise: Promise) {
        scope.launch {
            try {
                mediaPlayer?.let { player ->
                    val positionMs = (positionInSeconds * 1000).toInt()
                    
                    // Validate position
                    if (positionMs in 0..player.duration) {
                        player.seekTo(positionMs)
                        promise.resolve(true)
                    } else {
                        promise.reject("SEEK_ERROR", "Invalid seek position")
                    }
                } ?: run {
                    promise.reject("SEEK_ERROR", "No active player")
                }
            } catch (e: Exception) {
                promise.reject("SEEK_ERROR", "Seek failed: ${e.message}")
            }
        }
    }

    @ReactMethod
    fun resumeAudio(promise: Promise) {
        scope.launch {
            try {
                mediaPlayer?.let { player ->
                    if (!player.isPlaying) {
                        player.start()
                        isPlaying = true
                        startPlaybackUpdates()
                        promise.resolve(true)
                        return@launch
                    }
                }
                // Already playing or null
                promise.resolve(false)
            } catch (e: Exception) {
                promise.reject("RESUME_ERROR", "Failed to resume playback: ${e.message}")
            }
        }
    }

    @ReactMethod
    fun stopPlayback(promise: Promise) {
        scope.launch {
            try {
                val wasPlaying = isPlaying
                stopPlayback()

                val result = Arguments.createMap().apply {
                    putString("path", currentPath ?: "")
                    putBoolean("wasPlaying", wasPlaying)
                }

                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("STOP_ERROR", "Failed to stop playback: ${e.message}")
            }
        }
    }

    @ReactMethod
    fun getPlaybackStatus(promise: Promise) {
        val player = mediaPlayer
        val result = Arguments.createMap().apply {
            putString("path", currentPath ?: "")
            putBoolean("isPlaying", isPlaying)

            if (player != null && isPlaying) {
                putDouble("currentTime", player.currentPosition / 1000.0)
                putDouble("duration", player.duration / 1000.0)
            } else {
                putDouble("currentTime", 0.0)
                putDouble("duration", 0.0)
            }
        }

        promise.resolve(result)
    }

    private fun stopPlayback() {
        mediaPlayer?.let { player ->
            if (player.isPlaying) {
                player.stop()
            }
            player.reset()
            player.release()
            mediaPlayer = null
        }

        isPlaying = false
        stopPlaybackUpdates()
    }

    private fun formatPath(path: String): String {
        // Check if path needs to be converted to URI format
        return if (path.startsWith("/") && !path.startsWith("file://") && !path.startsWith("content://")) {
            "file://$path"
        } else {
            path
        }
    }

    private fun startPlaybackUpdates() {
        stopPlaybackUpdates()

        playbackTimer = java.util.Timer().apply {
            schedule(object : java.util.TimerTask() {
                override fun run() {
                    val player = mediaPlayer
                    if (player != null && isPlaying) {
                        try {
                            val event = Arguments.createMap().apply {
                                putString("path", currentPath)
                                putDouble("currentTime", player.currentPosition / 1000.0)
                                putDouble("duration", player.duration / 1000.0)
                                putBoolean("isPlaying", true)
                            }

                            sendEvent("onPlaybackStatus", event)
                        } catch (e: Exception) {
                            Log.e(TAG, "Error sending playback update: ${e.message}")
                        }
                    } else {
                        stopPlaybackUpdates()
                    }
                }
            }, 0, 250) // Update every 250ms
        }
    }

    private fun stopPlaybackUpdates() {
        playbackTimer?.cancel()
        playbackTimer = null
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for RN 0.65+
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for RN 0.65+
    }

    override fun onHostResume() {
        // Handle app coming to foreground if needed
    }

    override fun onHostPause() {
        // Handle app going to background if needed
    }

    override fun onHostDestroy() {
        stopPlayback()
    }
}