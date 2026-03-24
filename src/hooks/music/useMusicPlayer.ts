import { useCallback, useEffect, useRef } from 'react';
import { NativeEventEmitter, NativeModules } from 'react-native';
import { PLATFORM_IOS } from '@utills/Common';
import { useAppDispatch, useAppSelector } from '@redux/store/hooks';
import { showToast } from '@redux/slices/toast/toastSlice';
import {
  setIsPlaying,
  setIsPaused,
  nextTrack,
} from '@redux/slices/player/playerSlice';

const { MusicPlayer } = NativeModules;
const MusicPlayerEvents = new NativeEventEmitter(MusicPlayer);

/**
 * Queue-aware music player hook.
 * Reads isPlaying/isPaused from Redux; emits events to native module.
 * On completion → dispatches nextTrack (auto-advance queue).
 */
const useMusicPlayer = () => {
  const dispatch = useAppDispatch();
  const { isPlaying, isPaused, currentTrack } = useAppSelector(s => s.player);
  const soundLoaderRef = useRef(false);
  const setSoundLoader = (v: boolean) => { soundLoaderRef.current = v; };

  useEffect(() => {
    const statusSub = MusicPlayerEvents.addListener('onPlaybackStatus', status => {
      if (PLATFORM_IOS && status?.status === 'started') {
        setSoundLoader(false);
      }
      dispatch(setIsPlaying(status.isPlaying));
    });

    const completionSub = MusicPlayerEvents.addListener('onPlaybackComplete', data => {
      setSoundLoader(false);
      if (!data.completed && data.error) {
        dispatch(showToast({ message: 'Unable to load the music file.', type: 'error' }));
      }
      if (data.completed) {
        // Auto-advance queue (playerSlice.nextTrack handles repeat logic)
        dispatch(nextTrack());
      }
      dispatch(setIsPlaying(false));
    });

    return () => {
      statusSub.remove();
      completionSub.remove();
    };
  }, [dispatch]);

  // ─── Core playback ───────────────────────────────────────────────────────

  const playSoundIos = useCallback(async (uri: string) => {
    try {
      setSoundLoader(true);
      MusicPlayer?.convertWavToM4a(uri).then(async (newUri: string) => {
        await MusicPlayer?.playAudio(newUri);
      });
    } catch (error) {
      console.log('ERROR PLAY IOS', error);
    }
  }, []);

  const playSoundAndroid = useCallback(async (uri: string) => {
    try {
      setSoundLoader(true);
      await MusicPlayer?.playAudio(uri);
    } catch (error) {
      console.log('ERROR PLAY ANDROID', error);
    } finally {
      setSoundLoader(false);
    }
  }, []);

  const pauseSound = useCallback(async () => {
    if (isPlaying) {
      await MusicPlayer?.pauseAudio();
      dispatch(setIsPaused(true));
      dispatch(setIsPlaying(false));
    }
  }, [isPlaying, dispatch]);

  const resumeSound = useCallback(async () => {
    if (isPaused) {
      await MusicPlayer?.resumeAudio();
      dispatch(setIsPaused(false));
      dispatch(setIsPlaying(true));
    }
  }, [isPaused, dispatch]);

  const stopSound = useCallback(async () => {
    await MusicPlayer?.stopPlayback();
    dispatch(setIsPlaying(false));
    dispatch(setIsPaused(false));
    setSoundLoader(false);
  }, [dispatch]);

  /**
   * updateNowPlaying — tells native module (Android MediaSession / iOS MPNowPlayingInfoCenter)
   * about the currently playing track so lock screen + notification shows correct metadata.
   */
  const updateNowPlaying = useCallback((title: string, artist: string, thumbnail?: string) => {
    try {
      MusicPlayer?.updateNowPlaying?.({ title, artist, thumbnail: thumbnail ?? '' });
    } catch (_) {}
  }, []);

  return {
    playSound: PLATFORM_IOS ? playSoundIos : playSoundAndroid,
    pauseSound,
    resumeSound,
    stopSound,
    updateNowPlaying,
    isPlaying,
    isPaused,
    soundLoader: soundLoaderRef.current,
  };
};

export default useMusicPlayer;
