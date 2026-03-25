package com.musicninja

import android.app.*
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.BitmapFactory
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.MediaPlayer
import android.net.Uri
import android.os.Binder
import android.os.Build
import android.os.IBinder
import androidx.media.app.NotificationCompat.MediaStyle
import android.support.v4.media.MediaMetadataCompat
import android.support.v4.media.session.MediaSessionCompat
import android.support.v4.media.session.PlaybackStateCompat
import android.util.Log
import androidx.core.app.NotificationCompat
import java.util.Timer
import java.util.TimerTask

class MusicService : Service() {

    companion object {
        const val CHANNEL_ID = "MusicNinjaPlayback"
        const val NOTIFICATION_ID = 1
        const val ACTION_PLAY = "com.musicninja.PLAY"
        const val ACTION_PAUSE = "com.musicninja.PAUSE"
        const val ACTION_NEXT = "com.musicninja.NEXT"
        const val ACTION_STOP = "com.musicninja.STOP"
        private const val TAG = "MusicService"
    }

    inner class MusicBinder : Binder() {
        fun getService(): MusicService = this@MusicService
    }

    private val binder = MusicBinder()
    var mediaPlayer: MediaPlayer? = null
    var currentPath: String? = null
    var isPlaying = false
    private var playbackTimer: Timer? = null
    private var mediaSession: MediaSessionCompat? = null
    private var audioManager: AudioManager? = null
    private var focusRequest: AudioFocusRequest? = null

    // Metadata for notification
    var nowPlayingTitle: String = "MusicNinja"
    var nowPlayingArtist: String = ""
    var nowPlayingThumbnail: String = ""

    // Callbacks to MusicPlayer module
    var onStatusUpdate: ((currentTime: Double, duration: Double, playing: Boolean) -> Unit)? = null
    var onCompletion: ((path: String?, completed: Boolean, error: String?) -> Unit)? = null

    // ─── Broadcast receiver for notification actions ─────────────────────────
    private val actionReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            when (intent.action) {
                ACTION_PLAY -> resumePlayback()
                ACTION_PAUSE -> pausePlayback()
                ACTION_NEXT -> onCompletion?.invoke(currentPath, true, null)
                ACTION_STOP -> {
                    stopPlaybackInternal()
                    stopSelf()
                }
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
        setupMediaSession()

        val filter = IntentFilter().apply {
            addAction(ACTION_PLAY)
            addAction(ACTION_PAUSE)
            addAction(ACTION_NEXT)
            addAction(ACTION_STOP)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(actionReceiver, filter, RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(actionReceiver, filter)
        }
    }

    override fun onBind(intent: Intent): IBinder = binder

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIFICATION_ID, buildNotification())
        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        stopPlaybackInternal()
        mediaSession?.release()
        try { unregisterReceiver(actionReceiver) } catch (_: Exception) {}
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        super.onTaskRemoved(rootIntent)
        stopPlaybackInternal()
        stopSelf()
    }

    // ─── MediaSession setup ──────────────────────────────────────────────────
    private fun setupMediaSession() {
        mediaSession = MediaSessionCompat(this, "MusicNinja").apply {
            setCallback(object : MediaSessionCompat.Callback() {
                override fun onPlay() = resumePlayback()
                override fun onPause() = pausePlayback()
                override fun onSkipToNext() { onCompletion?.invoke(currentPath, true, null) }
                override fun onStop() { stopPlaybackInternal(); stopSelf() }
            })
            isActive = true
        }
    }

    // ─── Audio focus ─────────────────────────────────────────────────────────
    private fun requestAudioFocus(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val req = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .build()
                )
                .setOnAudioFocusChangeListener { focus ->
                    if (focus == AudioManager.AUDIOFOCUS_LOSS) pausePlayback()
                }
                .build()
            focusRequest = req
            audioManager?.requestAudioFocus(req) == AudioManager.AUDIOFOCUS_REQUEST_GRANTED
        } else {
            @Suppress("DEPRECATION")
            audioManager?.requestAudioFocus(null, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN) ==
                AudioManager.AUDIOFOCUS_REQUEST_GRANTED
        }
    }

    private fun abandonAudioFocus() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            focusRequest?.let { audioManager?.abandonAudioFocusRequest(it) }
        }
    }

    // ─── Playback control ────────────────────────────────────────────────────
    fun playAudio(filePath: String, onPrepared: () -> Unit, onError: (String) -> Unit) {
        stopPlaybackInternal()
        requestAudioFocus()

        val formattedPath = if (filePath.startsWith("/") && !filePath.startsWith("file://"))
            "file://$filePath" else filePath

        val player = MediaPlayer()
        try {
            player.setDataSource(this, Uri.parse(formattedPath))
            player.setOnPreparedListener { mp ->
                mp.start()
                isPlaying = true
                currentPath = formattedPath
                startPlaybackUpdates()
                updatePlaybackState(PlaybackStateCompat.STATE_PLAYING)
                updateNotification()
                onPrepared()
            }
            player.setOnCompletionListener {
                isPlaying = false
                stopPlaybackUpdates()
                updatePlaybackState(PlaybackStateCompat.STATE_STOPPED)
                onCompletion?.invoke(currentPath, true, null)
                updateNotification()
            }
            player.setOnErrorListener { _, what, extra ->
                isPlaying = false
                stopPlaybackUpdates()
                onCompletion?.invoke(currentPath, false, "Media player error: $what, $extra")
                true
            }
            player.prepareAsync()
            mediaPlayer = player
        } catch (e: Exception) {
            player.release()
            onError(e.message ?: "Unknown error")
        }
    }

    fun pausePlayback() {
        mediaPlayer?.let { if (it.isPlaying) it.pause() }
        isPlaying = false
        stopPlaybackUpdates()
        updatePlaybackState(PlaybackStateCompat.STATE_PAUSED)
        updateNotification()
    }

    fun resumePlayback() {
        mediaPlayer?.let {
            if (!it.isPlaying) {
                it.start()
                isPlaying = true
                startPlaybackUpdates()
                updatePlaybackState(PlaybackStateCompat.STATE_PLAYING)
                updateNotification()
            }
        }
    }

    fun seekTo(positionMs: Int) {
        mediaPlayer?.let {
            if (positionMs in 0..it.duration) it.seekTo(positionMs)
        }
    }

    fun stopPlaybackInternal() {
        stopPlaybackUpdates()
        mediaPlayer?.let {
            try { if (it.isPlaying) it.stop() } catch (_: Exception) {}
            it.reset()
            it.release()
        }
        mediaPlayer = null
        isPlaying = false
        abandonAudioFocus()
        updatePlaybackState(PlaybackStateCompat.STATE_STOPPED)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE)
        } else {
            @Suppress("DEPRECATION")
            stopForeground(true)
        }
        stopSelf()
    }

    fun updateNowPlaying(title: String, artist: String, thumbnail: String) {
        nowPlayingTitle = title
        nowPlayingArtist = artist
        nowPlayingThumbnail = thumbnail
        updateMediaMetadata()
        updateNotification()
    }

    // ─── MediaSession metadata ────────────────────────────────────────────────
    private fun updateMediaMetadata() {
        mediaSession?.setMetadata(
            MediaMetadataCompat.Builder()
                .putString(MediaMetadataCompat.METADATA_KEY_TITLE, nowPlayingTitle)
                .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, nowPlayingArtist)
                .putLong(MediaMetadataCompat.METADATA_KEY_DURATION,
                    mediaPlayer?.duration?.toLong() ?: -1L)
                .build()
        )
    }

    private fun updatePlaybackState(state: Int) {
        val position = try { mediaPlayer?.currentPosition?.toLong() ?: 0L } catch (_: Exception) { 0L }
        mediaSession?.setPlaybackState(
            PlaybackStateCompat.Builder()
                .setState(state, position, 1f)
                .setActions(
                    PlaybackStateCompat.ACTION_PLAY or
                    PlaybackStateCompat.ACTION_PAUSE or
                    PlaybackStateCompat.ACTION_SKIP_TO_NEXT or
                    PlaybackStateCompat.ACTION_STOP
                )
                .build()
        )
    }

    // ─── Notification ─────────────────────────────────────────────────────────
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Music Playback",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Music Ninja playback controls"
                setShowBadge(false)
            }
            (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
                .createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        val playPauseAction = if (isPlaying) {
            NotificationCompat.Action(
                android.R.drawable.ic_media_pause, "Pause",
                PendingIntent.getBroadcast(this, 0, Intent(ACTION_PAUSE),
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
            )
        } else {
            NotificationCompat.Action(
                android.R.drawable.ic_media_play, "Play",
                PendingIntent.getBroadcast(this, 0, Intent(ACTION_PLAY),
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
            )
        }

        val nextAction = NotificationCompat.Action(
            android.R.drawable.ic_media_next, "Next",
            PendingIntent.getBroadcast(this, 1, Intent(ACTION_NEXT),
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        )

        val stopIntent = PendingIntent.getBroadcast(this, 2, Intent(ACTION_STOP),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

        val openIntent = packageManager.getLaunchIntentForPackage(packageName)?.let {
            PendingIntent.getActivity(this, 0, it,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        }

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(nowPlayingTitle)
            .setContentText(nowPlayingArtist.ifEmpty { "MusicNinja" })
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentIntent(openIntent)
            .setDeleteIntent(stopIntent)
            .addAction(playPauseAction)
            .addAction(nextAction)
            .setStyle(
                MediaStyle()
                    .setMediaSession(mediaSession?.sessionToken)
                    .setShowActionsInCompactView(0, 1)
            )
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(isPlaying)
            .build()
    }

    private fun updateNotification() {
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.notify(NOTIFICATION_ID, buildNotification())
    }

    // ─── Playback timer ───────────────────────────────────────────────────────
    private fun startPlaybackUpdates() {
        stopPlaybackUpdates()
        playbackTimer = Timer().apply {
            schedule(object : TimerTask() {
                override fun run() {
                    val player = mediaPlayer ?: return
                    if (isPlaying) {
                        try {
                            onStatusUpdate?.invoke(
                                player.currentPosition / 1000.0,
                                player.duration / 1000.0,
                                true,
                            )
                        } catch (e: Exception) {
                            Log.e(TAG, "Timer error: ${e.message}")
                        }
                    }
                }
            }, 0, 250)
        }
    }

    private fun stopPlaybackUpdates() {
        playbackTimer?.cancel()
        playbackTimer = null
    }
}
