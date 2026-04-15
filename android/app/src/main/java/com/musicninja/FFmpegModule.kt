package com.musicninja

import android.media.*
import android.util.Log
import com.facebook.react.bridge.*
import java.io.File
import java.io.FileOutputStream
import java.nio.ByteBuffer

/**
 * Native FFmpeg-like module that uses Android's built-in MediaCodec/MediaExtractor
 * for audio transcoding. No external FFmpeg dependency required.
 *
 * Supports transcoding to:
 *   - MP3 (via MediaFormat.MIMETYPE_AUDIO_MPEG)
 *   - AAC/M4A (via MediaFormat.MIMETYPE_AUDIO_AAC)
 *   - OGG/Opus (via MediaFormat.MIMETYPE_AUDIO_OPUS, API 29+)
 *
 * Note: OGG/Vorbis encoding is NOT supported by MediaCodec.
 * For OGG output, we fall back to Opus encoding in an OGG container.
 */
class FFmpegModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "FFmpegModule"
        private const val TIMEOUT_US = 10_000L
    }

    @Volatile
    private var isCancelled = false

    override fun getName() = "FFmpegModule"

    // ─── transcode ───────────────────────────────────────────────────────────
    @ReactMethod
    fun transcode(
        inputPath: String,
        codec: String,
        bitrate: String,
        outputExt: String,
        promise: Promise
    ) {
        Thread {
            isCancelled = false
            try {
                val inputFile = File(inputPath)
                if (!inputFile.exists()) {
                    promise.reject("FILE_NOT_FOUND", "Input file does not exist: $inputPath", null as Throwable?)
                    return@Thread
                }

                val bitrateValue = parseBitrate(bitrate)
                val outputPath = inputPath.replace(Regex("\\.[^.]+$"), ".$outputExt")

                // Map our codec names to Android MIME types
                val mimeType = when (codec) {
                    "libmp3lame" -> MediaFormat.MIMETYPE_AUDIO_MPEG
                    "aac", "libfdk_aac" -> MediaFormat.MIMETYPE_AUDIO_AAC
                    "libvorbis", "libopus" -> {
                        if (android.os.Build.VERSION.SDK_INT >= 29) {
                            MediaFormat.MIMETYPE_AUDIO_OPUS
                        } else {
                            // Fallback to AAC on older devices
                            MediaFormat.MIMETYPE_AUDIO_AAC
                        }
                    }
                    else -> MediaFormat.MIMETYPE_AUDIO_AAC
                }

                Log.d(TAG, "Transcoding: $inputPath -> $outputPath (mime=$mimeType, bitrate=$bitrateValue)")

                transcodeAudio(inputPath, outputPath, mimeType, bitrateValue)

                // Clean up source file
                try { inputFile.delete() } catch (_: Exception) {}

                promise.resolve(outputPath)
            } catch (e: Exception) {
                if (isCancelled) {
                    promise.reject("FFMPEG_CANCELLED", "Transcoding was cancelled", e)
                } else {
                    Log.e(TAG, "Transcoding error", e)
                    promise.reject("FFMPEG_ERROR", "Transcoding failed: ${e.message}", e)
                }
            }
        }.start()
    }

    // ─── execute ─────────────────────────────────────────────────────────────
    // For backwards compat — runs a simplified command by parsing -i, -c:a, -b:a
    @ReactMethod
    fun execute(command: String, promise: Promise) {
        Thread {
            try {
                // Parse the command for basic -i input -c:a codec -b:a bitrate output pattern
                val parts = command.trim().split(Regex("\\s+"))
                var inputPath = ""
                var codecName = "aac"
                var bitrate = "128k"
                var outputPath = ""

                var i = 0
                while (i < parts.size) {
                    when (parts[i]) {
                        "-i" -> { i++; inputPath = parts[i].trim('"') }
                        "-c:a" -> { i++; codecName = parts[i] }
                        "-b:a" -> { i++; bitrate = parts[i] }
                        "-y" -> { /* skip overwrite flag */ }
                        else -> {
                            // Last non-flag argument is the output path
                            if (!parts[i].startsWith("-")) {
                                outputPath = parts[i].trim('"')
                            }
                        }
                    }
                    i++
                }

                if (inputPath.isEmpty() || outputPath.isEmpty()) {
                    promise.reject("FFMPEG_ERROR", "Could not parse command: $command", null as Throwable?)
                    return@Thread
                }

                val ext = outputPath.substringAfterLast(".", "m4a")
                val bitrateValue = parseBitrate(bitrate)
                val mimeType = when (codecName) {
                    "libmp3lame" -> MediaFormat.MIMETYPE_AUDIO_MPEG
                    "aac", "libfdk_aac" -> MediaFormat.MIMETYPE_AUDIO_AAC
                    "libvorbis", "libopus" -> {
                        if (android.os.Build.VERSION.SDK_INT >= 29) {
                            MediaFormat.MIMETYPE_AUDIO_OPUS
                        } else {
                            MediaFormat.MIMETYPE_AUDIO_AAC
                        }
                    }
                    else -> MediaFormat.MIMETYPE_AUDIO_AAC
                }

                transcodeAudio(inputPath, outputPath, mimeType, bitrateValue)

                val result = Arguments.createMap().apply {
                    putInt("returnCode", 0)
                    putString("output", "Transcoding completed successfully")
                }
                promise.resolve(result)
            } catch (e: Exception) {
                Log.e(TAG, "Execute error", e)
                promise.reject("FFMPEG_ERROR", e.message, e)
            }
        }.start()
    }

    // ─── cancel ──────────────────────────────────────────────────────────────
    @ReactMethod
    fun cancel(promise: Promise) {
        isCancelled = true
        promise.resolve(true)
    }

    // ─── getMediaInfo ────────────────────────────────────────────────────────
    @ReactMethod
    fun getMediaInfo(filePath: String, promise: Promise) {
        Thread {
            try {
                val extractor = MediaExtractor()
                extractor.setDataSource(filePath)

                val result = Arguments.createMap()

                if (extractor.trackCount > 0) {
                    val format = extractor.getTrackFormat(0)
                    val mime = format.getString(MediaFormat.KEY_MIME) ?: "unknown"
                    val sampleRate = if (format.containsKey(MediaFormat.KEY_SAMPLE_RATE))
                        format.getInteger(MediaFormat.KEY_SAMPLE_RATE) else 0
                    val channelCount = if (format.containsKey(MediaFormat.KEY_CHANNEL_COUNT))
                        format.getInteger(MediaFormat.KEY_CHANNEL_COUNT) else 0
                    val duration = if (format.containsKey(MediaFormat.KEY_DURATION))
                        format.getLong(MediaFormat.KEY_DURATION) / 1_000_000.0 else 0.0
                    val bitRate = if (format.containsKey(MediaFormat.KEY_BIT_RATE))
                        format.getInteger(MediaFormat.KEY_BIT_RATE) else 0

                    result.putString("codec", mime)
                    result.putString("sampleRate", sampleRate.toString())
                    result.putString("bitrate", bitRate.toString())
                    result.putDouble("duration", duration)
                    result.putString("format", mime)
                    result.putInt("channels", channelCount)
                } else {
                    result.putString("codec", "unknown")
                    result.putString("sampleRate", "0")
                    result.putString("bitrate", "0")
                    result.putDouble("duration", 0.0)
                    result.putString("format", "unknown")
                }

                extractor.release()
                promise.resolve(result)
            } catch (e: Exception) {
                Log.e(TAG, "Media info error", e)
                promise.reject("FFPROBE_ERROR", e.message, e)
            }
        }.start()
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private fun parseBitrate(bitrate: String): Int {
        val cleaned = bitrate.lowercase().replace("k", "000").replace("m", "000000")
        return cleaned.toIntOrNull() ?: 128_000
    }

    private fun transcodeAudio(inputPath: String, outputPath: String, targetMime: String, bitrate: Int) {
        val extractor = MediaExtractor()
        extractor.setDataSource(inputPath)

        // Find the first audio track
        var audioTrackIndex = -1
        var inputFormat: MediaFormat? = null
        for (i in 0 until extractor.trackCount) {
            val format = extractor.getTrackFormat(i)
            val mime = format.getString(MediaFormat.KEY_MIME) ?: continue
            if (mime.startsWith("audio/")) {
                audioTrackIndex = i
                inputFormat = format
                break
            }
        }

        if (audioTrackIndex == -1 || inputFormat == null) {
            extractor.release()
            throw Exception("No audio track found in input file")
        }

        extractor.selectTrack(audioTrackIndex)

        val sampleRate = inputFormat.getInteger(MediaFormat.KEY_SAMPLE_RATE)
        val channelCount = inputFormat.getInteger(MediaFormat.KEY_CHANNEL_COUNT)

        // Create decoder for the input audio
        val inputMime = inputFormat.getString(MediaFormat.KEY_MIME)!!
        val decoder = MediaCodec.createDecoderByType(inputMime)
        decoder.configure(inputFormat, null, null, 0)
        decoder.start()

        // Create encoder for the output format
        val outputFormat = MediaFormat.createAudioFormat(targetMime, sampleRate, channelCount).apply {
            setInteger(MediaFormat.KEY_BIT_RATE, bitrate)
            setInteger(MediaFormat.KEY_AAC_PROFILE, MediaCodecInfo.CodecProfileLevel.AACObjectLC)
            setInteger(MediaFormat.KEY_MAX_INPUT_SIZE, 65536)
        }

        val encoder = MediaCodec.createEncoderByType(targetMime)
        encoder.configure(outputFormat, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
        encoder.start()

        // Create muxer for the output file
        val muxerFormat = when {
            targetMime == MediaFormat.MIMETYPE_AUDIO_MPEG -> MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4
            targetMime == MediaFormat.MIMETYPE_AUDIO_OPUS -> MediaMuxer.OutputFormat.MUXER_OUTPUT_WEBM
            else -> MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4
        }
        val muxer = MediaMuxer(outputPath, muxerFormat)
        var muxerTrackIndex = -1
        var muxerStarted = false

        val bufferInfo = MediaCodec.BufferInfo()
        var inputEos = false
        var decoderOutputEos = false

        try {
            while (!decoderOutputEos && !isCancelled) {
                // Feed data to decoder
                if (!inputEos) {
                    val inBufIndex = decoder.dequeueInputBuffer(TIMEOUT_US)
                    if (inBufIndex >= 0) {
                        val inputBuffer = decoder.getInputBuffer(inBufIndex)!!
                        val sampleSize = extractor.readSampleData(inputBuffer, 0)
                        if (sampleSize < 0) {
                            decoder.queueInputBuffer(inBufIndex, 0, 0, 0,
                                MediaCodec.BUFFER_FLAG_END_OF_STREAM)
                            inputEos = true
                        } else {
                            decoder.queueInputBuffer(inBufIndex, 0, sampleSize,
                                extractor.sampleTime, 0)
                            extractor.advance()
                        }
                    }
                }

                // Get decoded (PCM) data from decoder and feed to encoder
                val decoderOutIndex = decoder.dequeueOutputBuffer(bufferInfo, TIMEOUT_US)
                if (decoderOutIndex >= 0) {
                    val decodedBuffer = decoder.getOutputBuffer(decoderOutIndex)!!
                    val isEos = (bufferInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0

                    if (bufferInfo.size > 0) {
                        // Feed decoded PCM to encoder
                        val encInBufIndex = encoder.dequeueInputBuffer(TIMEOUT_US)
                        if (encInBufIndex >= 0) {
                            val encoderInputBuffer = encoder.getInputBuffer(encInBufIndex)!!
                            encoderInputBuffer.clear()
                            val limit = minOf(decodedBuffer.remaining(), encoderInputBuffer.capacity())
                            val tempBuf = ByteArray(limit)
                            decodedBuffer.get(tempBuf, 0, limit)
                            encoderInputBuffer.put(tempBuf, 0, limit)
                            encoder.queueInputBuffer(encInBufIndex, 0, limit,
                                bufferInfo.presentationTimeUs,
                                if (isEos) MediaCodec.BUFFER_FLAG_END_OF_STREAM else 0)
                        }
                    } else if (isEos) {
                        val encInBufIndex = encoder.dequeueInputBuffer(TIMEOUT_US)
                        if (encInBufIndex >= 0) {
                            encoder.queueInputBuffer(encInBufIndex, 0, 0, 0,
                                MediaCodec.BUFFER_FLAG_END_OF_STREAM)
                        }
                    }

                    decoder.releaseOutputBuffer(decoderOutIndex, false)

                    if (isEos) decoderOutputEos = true
                }

                // Get encoded data from encoder and write to muxer
                drainEncoder(encoder, muxer, bufferInfo, muxerStarted) { trackIndex, started ->
                    muxerTrackIndex = trackIndex
                    muxerStarted = started
                }
            }

            if (isCancelled) {
                throw Exception("Transcoding was cancelled")
            }

            // Final drain of encoder
            drainEncoderFinal(encoder, muxer, bufferInfo, muxerTrackIndex, muxerStarted)

        } finally {
            try { decoder.stop() } catch (_: Exception) {}
            try { decoder.release() } catch (_: Exception) {}
            try { encoder.stop() } catch (_: Exception) {}
            try { encoder.release() } catch (_: Exception) {}
            try { if (muxerStarted) muxer.stop() } catch (_: Exception) {}
            try { muxer.release() } catch (_: Exception) {}
            extractor.release()
        }
    }

    private fun drainEncoder(
        encoder: MediaCodec,
        muxer: MediaMuxer,
        bufferInfo: MediaCodec.BufferInfo,
        muxerStarted: Boolean,
        onMuxerUpdate: (Int, Boolean) -> Unit
    ) {
        var currentMuxerStarted = muxerStarted
        var muxerTrackIndex = -1

        while (true) {
            val encOutIndex = encoder.dequeueOutputBuffer(bufferInfo, TIMEOUT_US)
            when {
                encOutIndex == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
                    if (!currentMuxerStarted) {
                        muxerTrackIndex = muxer.addTrack(encoder.outputFormat)
                        muxer.start()
                        currentMuxerStarted = true
                        onMuxerUpdate(muxerTrackIndex, true)
                    }
                }
                encOutIndex >= 0 -> {
                    val encodedData = encoder.getOutputBuffer(encOutIndex)!!
                    if (bufferInfo.size > 0 && currentMuxerStarted) {
                        encodedData.position(bufferInfo.offset)
                        encodedData.limit(bufferInfo.offset + bufferInfo.size)
                        muxer.writeSampleData(muxerTrackIndex, encodedData, bufferInfo)
                    }
                    encoder.releaseOutputBuffer(encOutIndex, false)
                    if ((bufferInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) {
                        break
                    }
                }
                else -> break
            }
        }
    }

    private fun drainEncoderFinal(
        encoder: MediaCodec,
        muxer: MediaMuxer,
        bufferInfo: MediaCodec.BufferInfo,
        muxerTrackIndex: Int,
        muxerStarted: Boolean
    ) {
        if (!muxerStarted) return
        while (true) {
            val encOutIndex = encoder.dequeueOutputBuffer(bufferInfo, TIMEOUT_US)
            if (encOutIndex >= 0) {
                val encodedData = encoder.getOutputBuffer(encOutIndex)!!
                if (bufferInfo.size > 0) {
                    encodedData.position(bufferInfo.offset)
                    encodedData.limit(bufferInfo.offset + bufferInfo.size)
                    muxer.writeSampleData(muxerTrackIndex, encodedData, bufferInfo)
                }
                val isEos = (bufferInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0
                encoder.releaseOutputBuffer(encOutIndex, false)
                if (isEos) break
            } else {
                break
            }
        }
    }
}
