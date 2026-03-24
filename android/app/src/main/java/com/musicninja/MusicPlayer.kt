package com.musicninja

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.Build
import android.os.IBinder
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class MusicPlayer(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), LifecycleEventListener {

    private val TAG = "MusicPlayer"
    private val scope = CoroutineScope(Dispatchers.Main)
    private var musicService: MusicService? = null
    private var isBound = false

    private val serviceConnection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName, binder: IBinder) {
            musicService = (binder as MusicService.MusicBinder).getService()
            isBound = true
            Log.d(TAG, "MusicService connected")

            // Wire callbacks from service → JS events
            musicService?.onStatusUpdate = { currentTime, duration, playing ->
                val event = Arguments.createMap().apply {
                    putDouble("currentTime", currentTime)
                    putDouble("duration", duration)
                    putBoolean("isPlaying", playing)
                }
                sendEvent("onPlaybackStatus", event)
            }

            musicService?.onCompletion = { path, completed, error ->
                val event = Arguments.createMap().apply {
                    putString("path", path ?: "")
                    putBoolean("completed", completed)
                    if (error != null) putString("error", error)
                }
                sendEvent("onPlaybackComplete", event)
            }
        }

        override fun onServiceDisconnected(name: ComponentName) {
            musicService = null
            isBound = false
            Log.d(TAG, "MusicService disconnected")
        }
    }

    init {
        reactContext.addLifecycleEventListener(this)
        startAndBindService()
    }

    override fun getName() = "MusicPlayer"

    private fun startAndBindService() {
        val intent = Intent(reactApplicationContext, MusicService::class.java)
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactApplicationContext.startForegroundService(intent)
            } else {
                reactApplicationContext.startService(intent)
            }
            reactApplicationContext.bindService(intent, serviceConnection, Context.BIND_AUTO_CREATE)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start/bind MusicService: ${e.message}")
        }
    }

    // ─── @ReactMethods ────────────────────────────────────────────────────────

    @ReactMethod
    fun playAudio(filePath: String, promise: Promise) {
        scope.launch {
            val service = musicService
            if (service == null) {
                promise.reject("SERVICE_ERROR", "Music service not ready")
                return@launch
            }
            service.playAudio(
                filePath,
                onPrepared = {
                    val result = Arguments.createMap().apply {
                        putString("path", filePath)
                        putBoolean("isPlaying", true)
                    }
                    promise.resolve(result)
                },
                onError = { msg ->
                    promise.reject("PLAY_ERROR", msg)
                }
            )
        }
    }

    @ReactMethod
    fun pauseAudio(promise: Promise) {
        scope.launch {
            try {
                musicService?.pausePlayback()
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("PAUSE_ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun resumeAudio(promise: Promise) {
        scope.launch {
            try {
                musicService?.resumePlayback()
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("RESUME_ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun seekTo(positionInSeconds: Double, promise: Promise) {
        scope.launch {
            try {
                val ms = (positionInSeconds * 1000).toInt()
                musicService?.seekTo(ms)
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("SEEK_ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun stopPlayback(promise: Promise) {
        scope.launch {
            try {
                musicService?.stopPlaybackInternal()
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("STOP_ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun getPlaybackStatus(promise: Promise) {
        val service = musicService
        val result = Arguments.createMap().apply {
            putBoolean("isPlaying", service?.isPlaying ?: false)
            val mp = service?.mediaPlayer
            putDouble("currentTime", if (mp != null && service.isPlaying) mp.currentPosition / 1000.0 else 0.0)
            putDouble("duration", if (mp != null) try { mp.duration / 1000.0 } catch (_: Exception) { 0.0 } else 0.0)
        }
        promise.resolve(result)
    }

    @ReactMethod
    fun updateNowPlaying(params: ReadableMap, promise: Promise) {
        scope.launch {
            try {
                val title = params.getString("title") ?: ""
                val artist = params.getString("artist") ?: ""
                val thumbnail = params.getString("thumbnail") ?: ""
                musicService?.updateNowPlaying(title, artist, thumbnail)
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("NOW_PLAYING_ERROR", e.message)
            }
        }
    }

    // ─── Required for RN event emitter ───────────────────────────────────────
    @ReactMethod fun addListener(eventName: String) {}
    @ReactMethod fun removeListeners(count: Int) {}

    // ─── Lifecycle ────────────────────────────────────────────────────────────
    override fun onHostResume() {}
    override fun onHostPause() {}
    override fun onHostDestroy() {
        if (isBound) {
            try { reactApplicationContext.unbindService(serviceConnection) } catch (_: Exception) {}
            isBound = false
        }
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }
}