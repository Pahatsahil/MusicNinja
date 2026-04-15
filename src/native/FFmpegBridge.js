/**
 * FFmpegBridge — JS wrapper around the native FFmpegModule.
 *
 * Replaces the third-party `ffmpeg-kit-react-native` package with our own
 * native module that links `mobile-ffmpeg` directly.
 *
 * Usage:
 *   import FFmpegBridge from '@native/FFmpegBridge';
 *
 *   // Execute raw command
 *   const { returnCode, output } = await FFmpegBridge.execute('-i input.flac -c:a libmp3lame output.mp3');
 *
 *   // Convenience transcode
 *   const outputPath = await FFmpegBridge.transcode('/path/to/input.flac', 'libmp3lame', '320k', 'mp3');
 *
 *   // Get media info
 *   const info = await FFmpegBridge.getMediaInfo('/path/to/file.flac');
 *
 *   // Cancel running operation
 *   await FFmpegBridge.cancel();
 */

import { NativeModules } from 'react-native';

const { FFmpegModule } = NativeModules;

if (!FFmpegModule) {
  console.error(
    '[FFmpegBridge] Native FFmpegModule is not available. ' +
    'Make sure the native module is properly linked and the app is rebuilt.',
  );
}

const FFmpegBridge = {
  /**
   * Execute an arbitrary FFmpeg command.
   * @param {string} command - The FFmpeg command (without the leading `ffmpeg`).
   * @returns {Promise<{ returnCode: number, output: string }>}
   */
  async execute(command) {
    if (!FFmpegModule) {
      throw new Error('FFmpegModule native module is not available');
    }
    return FFmpegModule.execute(command);
  },

  /**
   * Transcode an audio file.
   * @param {string} inputPath  - Absolute path to the input file.
   * @param {string} codec      - FFmpeg codec name (e.g. 'libmp3lame', 'libvorbis').
   * @param {string} bitrate    - Target bitrate (e.g. '320k', '128k').
   * @param {string} outputExt  - Output file extension (e.g. 'mp3', 'ogg').
   * @returns {Promise<string>}   Absolute path to the transcoded output file.
   */
  async transcode(inputPath, codec, bitrate, outputExt) {
    if (!FFmpegModule) {
      throw new Error('FFmpegModule native module is not available');
    }
    return FFmpegModule.transcode(inputPath, codec, bitrate, outputExt);
  },

  /**
   * Cancel any currently running FFmpeg execution.
   * @returns {Promise<void>}
   */
  async cancel() {
    if (!FFmpegModule) {
      throw new Error('FFmpegModule native module is not available');
    }
    return FFmpegModule.cancel();
  },

  /**
   * Get media information for a file.
   * @param {string} filePath - Absolute path to the media file.
   * @returns {Promise<{ duration: number, codec: string, sampleRate: string, bitrate: string, format: string }>}
   */
  async getMediaInfo(filePath) {
    if (!FFmpegModule) {
      throw new Error('FFmpegModule native module is not available');
    }
    return FFmpegModule.getMediaInfo(filePath);
  },
};

export default FFmpegBridge;
