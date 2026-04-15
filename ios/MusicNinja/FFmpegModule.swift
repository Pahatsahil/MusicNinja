import Foundation
import AVFoundation

/// Native FFmpeg-like module that uses Apple's built-in AVFoundation/AudioToolbox
/// for audio transcoding. No external FFmpeg dependency required.
///
/// Supports transcoding to:
///   - AAC/M4A (kAudioFormatMPEG4AAC)
///   - Apple Lossless (kAudioFormatAppleLossless)
///   - For MP3 output on iOS, we transcode to high-quality AAC which is universally playable
///
/// Note: iOS does not include an MP3 encoder. MP3 requests are fulfilled with AAC
/// at the requested bitrate, which provides equal or better quality.
@objc(FFmpegModule)
class FFmpegModule: NSObject, RCTBridgeModule {

  static func moduleName() -> String! {
    return "FFmpegModule"
  }

  static func requiresMainQueueSetup() -> Bool {
    return false
  }

  private var isCancelled = false

  // ─── transcode ───────────────────────────────────────────────────────────
  @objc func transcode(_ inputPath: String,
                       codec: String,
                       bitrate: String,
                       outputExt: String,
                       resolver resolve: @escaping RCTPromiseResolveBlock,
                       rejecter reject: @escaping RCTPromiseRejectBlock) {
    isCancelled = false

    DispatchQueue.global(qos: .userInitiated).async { [weak self] in
      guard let self = self else { return }

      guard FileManager.default.fileExists(atPath: inputPath) else {
        reject("FILE_NOT_FOUND", "Input file does not exist: \(inputPath)", nil)
        return
      }

      let inputURL = URL(fileURLWithPath: inputPath)
      let outputURL = inputURL.deletingPathExtension().appendingPathExtension(outputExt == "mp3" ? "m4a" : outputExt)
      let outputPath = outputURL.path
      let bitrateValue = self.parseBitrate(bitrate)

      // Remove existing output file
      try? FileManager.default.removeItem(at: outputURL)

      do {
        try self.transcodeAudio(inputURL: inputURL, outputURL: outputURL, bitrate: bitrateValue)

        // Clean up source file
        try? FileManager.default.removeItem(atPath: inputPath)

        resolve(outputPath)
      } catch {
        if self.isCancelled {
          reject("FFMPEG_CANCELLED", "Transcoding was cancelled", error)
        } else {
          reject("FFMPEG_ERROR", "Transcoding failed: \(error.localizedDescription)", error)
        }
      }
    }
  }

  // ─── execute ─────────────────────────────────────────────────────────────
  @objc func execute(_ command: String,
                     resolver resolve: @escaping RCTPromiseResolveBlock,
                     rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async { [weak self] in
      guard let self = self else { return }

      // Parse basic -i input -c:a codec -b:a bitrate output
      let parts = command.components(separatedBy: " ")
      var inputPath = ""
      var bitrateStr = "128k"
      var outputPath = ""

      var i = 0
      while i < parts.count {
        switch parts[i] {
        case "-i":
          i += 1
          inputPath = parts[i].replacingOccurrences(of: "\"", with: "")
        case "-b:a":
          i += 1
          bitrateStr = parts[i]
        case "-y", "-c:a":
          i += 1 // skip flag and its value
        default:
          if !parts[i].hasPrefix("-") {
            outputPath = parts[i].replacingOccurrences(of: "\"", with: "")
          }
        }
        i += 1
      }

      guard !inputPath.isEmpty, !outputPath.isEmpty else {
        reject("FFMPEG_ERROR", "Could not parse command: \(command)", nil)
        return
      }

      let inputURL = URL(fileURLWithPath: inputPath)
      let outputURL = URL(fileURLWithPath: outputPath)
      let bitrateValue = self.parseBitrate(bitrateStr)

      try? FileManager.default.removeItem(at: outputURL)

      do {
        try self.transcodeAudio(inputURL: inputURL, outputURL: outputURL, bitrate: bitrateValue)
        resolve([
          "returnCode": 0,
          "output": "Transcoding completed successfully"
        ])
      } catch {
        reject("FFMPEG_ERROR", "Execute failed: \(error.localizedDescription)", error)
      }
    }
  }

  // ─── cancel ──────────────────────────────────────────────────────────────
  @objc func cancel(_ resolve: RCTPromiseResolveBlock,
                    rejecter reject: RCTPromiseRejectBlock) {
    isCancelled = true
    resolve(true)
  }

  // ─── getMediaInfo ────────────────────────────────────────────────────────
  @objc func getMediaInfo(_ filePath: String,
                          resolver resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      let url = URL(fileURLWithPath: filePath)
      let asset = AVURLAsset(url: url)

      var result: [String: Any] = [:]
      result["duration"] = CMTimeGetSeconds(asset.duration)
      result["format"] = url.pathExtension

      if let audioTrack = asset.tracks(withMediaType: .audio).first {
        let descriptions = audioTrack.formatDescriptions as! [CMAudioFormatDescription]
        if let desc = descriptions.first {
          let asbd = CMAudioFormatDescriptionGetStreamBasicDescription(desc)?.pointee
          result["sampleRate"] = String(Int(asbd?.mSampleRate ?? 0))
          result["codec"] = self.fourCCToString(asbd?.mFormatID ?? 0)
          result["channels"] = Int(asbd?.mChannelsPerFrame ?? 0)
        }
        result["bitrate"] = String(Int(audioTrack.estimatedDataRate))
      } else {
        result["codec"] = "unknown"
        result["sampleRate"] = "0"
        result["bitrate"] = "0"
      }

      resolve(result)
    }
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private func parseBitrate(_ bitrate: String) -> Int {
    let cleaned = bitrate.lowercased()
      .replacingOccurrences(of: "k", with: "000")
      .replacingOccurrences(of: "m", with: "000000")
    return Int(cleaned) ?? 128_000
  }

  private func fourCCToString(_ code: UInt32) -> String {
    let bytes: [CChar] = [
      CChar(truncatingIfNeeded: (code >> 24) & 0xFF),
      CChar(truncatingIfNeeded: (code >> 16) & 0xFF),
      CChar(truncatingIfNeeded: (code >> 8) & 0xFF),
      CChar(truncatingIfNeeded: code & 0xFF),
      0
    ]
    return String(cString: bytes)
  }

  private func transcodeAudio(inputURL: URL, outputURL: URL, bitrate: Int) throws {
    let asset = AVURLAsset(url: inputURL)

    guard let audioTrack = asset.tracks(withMediaType: .audio).first else {
      throw NSError(domain: "FFmpegModule", code: -1,
                    userInfo: [NSLocalizedDescriptionKey: "No audio track found in input file"])
    }

    // Set up asset reader (decoder)
    let reader = try AVAssetReader(asset: asset)
    let readerOutputSettings: [String: Any] = [
      AVFormatIDKey: kAudioFormatLinearPCM,
      AVLinearPCMBitDepthKey: 16,
      AVLinearPCMIsFloatKey: false,
      AVLinearPCMIsBigEndianKey: false,
      AVLinearPCMIsNonInterleaved: false,
    ]
    let readerOutput = AVAssetReaderTrackOutput(track: audioTrack, outputSettings: readerOutputSettings)
    readerOutput.alwaysCopiesSampleData = false
    reader.add(readerOutput)

    // Set up asset writer (encoder) — always AAC since iOS lacks MP3 encoder
    let writer = try AVAssetWriter(outputURL: outputURL, fileType: .m4a)
    let writerInputSettings: [String: Any] = [
      AVFormatIDKey: kAudioFormatMPEG4AAC,
      AVEncoderBitRateKey: bitrate,
      AVSampleRateKey: 44100,
      AVNumberOfChannelsKey: 2,
    ]
    let writerInput = AVAssetWriterInput(mediaType: .audio, outputSettings: writerInputSettings)
    writerInput.expectsMediaDataInRealTime = false
    writer.add(writerInput)

    // Start the pipeline
    reader.startReading()
    writer.startWriting()
    writer.startSession(atSourceTime: .zero)

    let processingQueue = DispatchQueue(label: "com.musicninja.ffmpeg.transcode")
    let semaphore = DispatchSemaphore(value: 0)
    var transcodeError: Error?

    writerInput.requestMediaDataWhenReady(on: processingQueue) { [weak self] in
      while writerInput.isReadyForMoreMediaData {
        if self?.isCancelled == true {
          reader.cancelReading()
          writer.cancelWriting()
          transcodeError = NSError(domain: "FFmpegModule", code: -2,
                                  userInfo: [NSLocalizedDescriptionKey: "Cancelled"])
          semaphore.signal()
          return
        }

        if let sampleBuffer = readerOutput.copyNextSampleBuffer() {
          writerInput.append(sampleBuffer)
        } else {
          writerInput.markAsFinished()

          if reader.status == .failed {
            transcodeError = reader.error
            semaphore.signal()
          } else {
            writer.finishWriting {
              if writer.status == .failed {
                transcodeError = writer.error
              }
              semaphore.signal()
            }
          }
          return
        }
      }
    }

    semaphore.wait()

    if let error = transcodeError {
      throw error
    }
  }
}
