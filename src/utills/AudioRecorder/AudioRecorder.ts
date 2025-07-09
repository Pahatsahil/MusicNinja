// SoundRecorder.ts
import {
  NativeModules,
  NativeEventEmitter,
  EmitterSubscription,
} from 'react-native';

const { SoundRecorder } = NativeModules;

// Add removeListeners method to the module
const enhancedSoundRecorder = {
  ...SoundRecorder,
  removeListeners: (count: number) => {
    // This empty implementation satisfies the interface requirement
  }
};
const SoundRecorderEvents = new NativeEventEmitter(SoundRecorder);
export type soundTypes = 'Screaming' | 'Silent' | 'Normal' | 'BackgroundNoise' | 'Speaking+BackgroundNoise'
export interface AudioAnalysis {
  volume: number;
  noiseLevel: number;
  // isTooFar: boolean;
  path?: string; // Optional during recording
  type?: string; // Optional during recording
  duration?: number; // Optional during recording
  sizeInKB?: number; // Optional during recording
  soundType: soundTypes
}

export interface RecordingInfo {
  path: string;
  type: string;
  duration: number;
  sizeInKB: number;
}

/**
 * Enhanced Sound Recorder for React Native
 */
const AudioRecorder = {
  /**
   * Start recording audio
   * @returns {Promise<RecordingInfo>} Initial recording info
   */
  startRecording: (): Promise<RecordingInfo> => {
    return SoundRecorder.startRecording();
  },

  /**
   * Stop recording audio
   * @returns {Promise<RecordingInfo>} Complete recording info
   */
  stopRecording: (): Promise<RecordingInfo> => {
    return SoundRecorder.stopRecording();
  },

  /**
   * Get information about the current or last recording
   * @returns {Promise<RecordingInfo>} Recording info
   */
  getRecordingInfo: (): Promise<RecordingInfo> => {
    return SoundRecorder.getRecordingInfo();
  },

  /**
   * Check if currently recording
   * @returns {Promise<boolean>} Recording status
   */
  getIsRecording: (): Promise<boolean> => {
    return SoundRecorder.getIsRecording();
  },

  /**
   * Add listener for audio analysis events
   * @param {Function} callback Function to call with analysis data
   * @returns {EmitterSubscription} Subscription that can be removed
   */
  onAudioAnalysis: (
    callback: (data: AudioAnalysis) => void,
  ): EmitterSubscription => {
    return SoundRecorderEvents.addListener('onAudioAnalysis', callback);
  },
};

export default AudioRecorder;
