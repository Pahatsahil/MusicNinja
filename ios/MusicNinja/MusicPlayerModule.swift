import Foundation
import AVFoundation
import MediaPlayer

@objc(MusicPlayerModule)
class MusicPlayerModule: RCTEventEmitter {

  private var audioPlayer: AVPlayer?
  private var timeObserver: Any?
  private var currentTitle: String = "MusicNinja"
  private var currentArtist: String = ""
  private var currentThumbnail: String = ""
  private var isPlaying: Bool = false

  override init() {
    super.init()
    setupAudioSession()
    setupRemoteCommandCenter()
  }

  // ─── Audio Session ──────────────────────────────────────────────────────
  private func setupAudioSession() {
    do {
      let session = AVAudioSession.sharedInstance()
      try session.setCategory(.playback, mode: .default, options: [])
      try session.setActive(true)
    } catch {
      print("[MusicPlayer] Audio session error: \(error)")
    }
  }

  // ─── Remote Command Center (lock screen / control center) ───────────────
  private func setupRemoteCommandCenter() {
    let center = MPRemoteCommandCenter.shared()

    center.playCommand.isEnabled = true
    center.playCommand.addTarget { [weak self] _ in
      self?.resumePlayback()
      return .success
    }

    center.pauseCommand.isEnabled = true
    center.pauseCommand.addTarget { [weak self] _ in
      self?.pausePlayback()
      return .success
    }

    center.nextTrackCommand.isEnabled = true
    center.nextTrackCommand.addTarget { [weak self] _ in
      guard let self = self else { return .commandFailed }
      let event = ["path": "", "completed": true] as [String: Any]
      self.sendEvent(withName: "onPlaybackComplete", body: event)
      return .success
    }

    center.stopCommand.isEnabled = true
    center.stopCommand.addTarget { [weak self] _ in
      self?.stopPlayback()
      return .success
    }
  }

  // ─── Supported Events ───────────────────────────────────────────────────
  override func supportedEvents() -> [String]! {
    return ["onPlaybackStatus", "onPlaybackComplete"]
  }

  override static func requiresMainQueueSetup() -> Bool { return false }

  // ─── @ReactMethod: playAudio ─────────────────────────────────────────────
  @objc func playAudio(_ filePath: String, resolver resolve: @escaping RCTPromiseResolveBlock,
                       rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }
      self.stopInternal()

      let url: URL
      if filePath.hasPrefix("file://"), let u = URL(string: filePath) {
        url = u
      } else {
        url = URL(fileURLWithPath: filePath)
      }

      let item = AVPlayerItem(url: url)
      let player = AVPlayer(playerItem: item)
      self.audioPlayer = player
      self.isPlaying = true

      // Observe playback status updates every 0.25s
      let interval = CMTime(seconds: 0.25, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
      self.timeObserver = player.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [weak self, weak player] time in
        guard let self = self, let player = player else { return }
        let current = CMTimeGetSeconds(time)
        let duration = CMTimeGetSeconds(player.currentItem?.duration ?? CMTime.zero)
        if current.isNaN || duration.isNaN { return }
        let event: [String: Any] = [
          "currentTime": current,
          "duration": duration.isInfinite ? 0 : duration,
          "isPlaying": self.isPlaying,
        ]
        self.sendEvent(withName: "onPlaybackStatus", body: event)
        self.updateNowPlayingInfo(currentTime: current, duration: duration.isInfinite ? 0 : duration)
      }

      // Observe completion
      NotificationCenter.default.addObserver(
        self,
        selector: #selector(self.playerDidFinish(_:)),
        name: .AVPlayerItemDidPlayToEndTime,
        object: item
      )

      player.play()
      resolve(["path": filePath, "isPlaying": true])
    }
  }

  @objc private func playerDidFinish(_ notification: Notification) {
    isPlaying = false
    MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
    sendEvent(withName: "onPlaybackComplete", body: ["completed": true, "path": ""])
  }

  // ─── @ReactMethod: pauseAudio ────────────────────────────────────────────
  @objc func pauseAudio(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    DispatchQueue.main.async { self.pausePlayback(); resolve(true) }
  }

  // ─── @ReactMethod: resumeAudio ───────────────────────────────────────────
  @objc func resumeAudio(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    DispatchQueue.main.async { self.resumePlayback(); resolve(true) }
  }

  // ─── @ReactMethod: stopPlayback ──────────────────────────────────────────
  @objc func stopPlayback(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    DispatchQueue.main.async { self.stopInternal(); resolve(true) }
  }

  // ─── @ReactMethod: seekTo ────────────────────────────────────────────────
  @objc func seekTo(_ positionInSeconds: Double, resolver resolve: RCTPromiseResolveBlock,
                    rejecter reject: RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      let time = CMTime(seconds: positionInSeconds, preferredTimescale: 1000)
      self.audioPlayer?.seek(to: time)
      resolve(true)
    }
  }

  // ─── @ReactMethod: updateNowPlaying ──────────────────────────────────────
  @objc func updateNowPlaying(_ params: NSDictionary, resolver resolve: RCTPromiseResolveBlock,
                               rejecter reject: RCTPromiseRejectBlock) {
    currentTitle = params["title"] as? String ?? ""
    currentArtist = params["artist"] as? String ?? ""
    currentThumbnail = params["thumbnail"] as? String ?? ""
    DispatchQueue.main.async {
      self.updateNowPlayingInfo(currentTime: nil, duration: nil)
    }
    resolve(true)
  }

  // ─── Internal helpers ────────────────────────────────────────────────────
  private func pausePlayback() {
    audioPlayer?.pause()
    isPlaying = false
    updateNowPlayingInfo(currentTime: nil, duration: nil)
  }

  private func resumePlayback() {
    audioPlayer?.play()
    isPlaying = true
    updateNowPlayingInfo(currentTime: nil, duration: nil)
    let player = audioPlayer
    let status: [String: Any] = [
      "currentTime": CMTimeGetSeconds(player?.currentTime() ?? CMTime.zero),
      "duration": CMTimeGetSeconds(player?.currentItem?.duration ?? CMTime.zero),
      "isPlaying": true,
    ]
    sendEvent(withName: "onPlaybackStatus", body: status)
  }

  private func stopInternal() {
    if let observer = timeObserver {
      audioPlayer?.removeTimeObserver(observer)
      timeObserver = nil
    }
    NotificationCenter.default.removeObserver(self, name: .AVPlayerItemDidPlayToEndTime, object: nil)
    audioPlayer?.pause()
    audioPlayer = nil
    isPlaying = false
    MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
  }

  private func updateNowPlayingInfo(currentTime: Double?, duration: Double?) {
    var info = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]
    info[MPMediaItemPropertyTitle] = currentTitle
    info[MPMediaItemPropertyArtist] = currentArtist
    info[MPNowPlayingInfoPropertyPlaybackRate] = isPlaying ? 1.0 : 0.0
    if let ct = currentTime { info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = ct }
    if let d = duration, d > 0 { info[MPMediaItemPropertyPlaybackDuration] = d }
    MPNowPlayingInfoCenter.default().nowPlayingInfo = info
  }
}
