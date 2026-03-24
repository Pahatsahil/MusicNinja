import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AppColors from '@constants/AppColors';
import AppFonts from '@constants/AppFonts';
import { CustomIcons } from '@components/common';
import useMusicPlayer from '@hooks/music/useMusicPlayer';
import useDownloadedTracks from '@hooks/music/useDownloadedTracks';
import usePlaylists from '@hooks/music/usePlaylists';
import { downloadMusic } from '@api/music/musicApi';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '@redux/store/hooks';
import { showToast } from '@redux/slices/toast/toastSlice';
import {
  setCurrentTrack,
  setIsPlaying,
  nextTrack,
  prevTrack,
  setRepeatMode,
  toggleShuffle,
} from '@redux/slices/player/playerSlice';
import { IPlaylist } from '@utills/database/schema';

const { width, height } = Dimensions.get('window');
const ARTWORK_SIZE = width * 0.75;

const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const Player = ({ route, navigation }: any) => {
  const { song } = route.params;
  const dispatch = useAppDispatch();
  const { isPlaying, isPaused, queue, queueIndex, repeatMode, shuffle } = useAppSelector(s => s.player);

  const {
    playSound,
    pauseSound,
    resumeSound,
    stopSound,
    updateNowPlaying,
  } = useMusicPlayer();
  const { getCachedPath, saveTrack } = useDownloadedTracks();
  const { playlists, addTrack } = usePlaylists();
  const insets = useSafeAreaInsets();

  const [isLiked, setIsLiked] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [soundLoader, setSoundLoader] = useState(false);
  const [playerStatus, setPlayerStatus] = useState({ elapsedTime: 0, duration: 0 });
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

  // Track the song currently loaded in native player
  const loadedVideoId = useRef<string | null>(null);

  const artworkScale = useRef(new Animated.Value(1)).current;

  const currentDisplayTrack = useAppSelector(s => s.player.currentTrack) ?? song;

  useEffect(() => {
    Animated.spring(artworkScale, {
      toValue: isPlaying ? 1.06 : 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [isPlaying]);

  // ─── Subscribe to native status events ────────────────────────────────────
  const { NativeModules, NativeEventEmitter } = require('react-native');
  const MusicPlayerEvents = useRef(new NativeEventEmitter(NativeModules.MusicPlayer)).current;

  useEffect(() => {
    const statusSub = MusicPlayerEvents.addListener('onPlaybackStatus', (status: any) => {
      setSoundLoader(false);
      setPlayerStatus({
        elapsedTime: status.currentTime,
        duration: status.duration,
      });
    });
    return () => statusSub.remove();
  }, []);

  // ─── Auto-play current track whenever it changes ──────────────────────────
  useEffect(() => {
    if (currentDisplayTrack && currentDisplayTrack.video_id !== loadedVideoId.current) {
      handlePlay(currentDisplayTrack);
    }
  }, [currentDisplayTrack?.video_id]);

  // ─── Initial play ─────────────────────────────────────────────────────────
  useEffect(() => {
    // Set Redux currentTrack if not already set
    if (!useAppSelector) return;
    dispatch(setCurrentTrack(song));
    handlePlay(song);
  }, []);

  // ─── Core play logic ──────────────────────────────────────────────────────
  const handlePlay = useCallback(async (trackToPlay = currentDisplayTrack) => {
    if (!trackToPlay) return;
    try {
      setSoundLoader(true);
      setDownloading(true);
      loadedVideoId.current = trackToPlay.video_id;

      let filePath = await getCachedPath(trackToPlay.video_id);
      if (!filePath) {
        filePath = await downloadMusic(trackToPlay.video_id);
        await saveTrack(trackToPlay, filePath);
      }

      await playSound('file://' + filePath);
      dispatch(setCurrentTrack(trackToPlay));
      dispatch(setIsPlaying(true));

      // Update native lock screen / notification metadata
      updateNowPlaying(
        trackToPlay.title || 'Unknown Track',
        trackToPlay.channelTitle || 'Unknown Artist',
        trackToPlay.thumbnail,
      );
    } catch (err: any) {
      dispatch(showToast({ message: 'Failed to load track. Try again.', type: 'error' }));
      console.error('handlePlay error:', err?.message);
    } finally {
      setDownloading(false);
      setSoundLoader(false);
    }
  }, [getCachedPath, saveTrack, playSound, updateNowPlaying, dispatch]);

  // ─── Play / Pause toggle ──────────────────────────────────────────────────
  const handlePlayPause = useCallback(async () => {
    if (downloading || soundLoader) return;
    if (isPlaying && !isPaused) {
      await pauseSound();
    } else if (isPaused || !isPlaying) {
      await resumeSound();
    }
  }, [downloading, soundLoader, isPlaying, isPaused, pauseSound, resumeSound]);

  // ─── Queue navigation ──────────────────────────────────────────────────────
  const handleNext = useCallback(() => {
    dispatch(nextTrack());
  }, [dispatch]);

  const handlePrev = useCallback(() => {
    dispatch(prevTrack());
  }, [dispatch]);

  const goBack = async () => {
    // Don't stop — keep playing in background, MiniPlayer takes over
    navigation.goBack();
  };

  // ─── Progress bar ──────────────────────────────────────────────────────────
  const { elapsedTime, duration } = playerStatus;
  const progressPct = duration > 0 ? Math.min(elapsedTime / duration, 1) : 0;
  const progressBarWidth = (width - 48) * progressPct;

  const isLoading = downloading || soundLoader;

  const hasThumbnail = !!currentDisplayTrack?.thumbnail;

  // ─── Add to Playlist modal ─────────────────────────────────────────────────
  const handleAddToPlaylist = async (playlist: IPlaylist) => {
    await addTrack(playlist.id, {
      video_id: currentDisplayTrack.video_id,
      title: currentDisplayTrack.title,
      channelTitle: currentDisplayTrack.channelTitle || '',
      thumbnail: currentDisplayTrack.thumbnail || '',
      filePath: loadedVideoId.current ? '' : '',
    });
    setShowPlaylistModal(false);
    dispatch(showToast({ message: `Added to "${playlist.name}"`, type: 'success' }));
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <LinearGradient
        colors={[AppColors.DeepBlack, AppColors.RichPurple, AppColors.DeepBlack]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.glowBehind} />

      {/* ── Top bar ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={goBack}>
          <CustomIcons name="chevron-down" type="Ionicons" size={22} color={AppColors.WHITE} />
        </TouchableOpacity>

        <View style={styles.topCenter}>
          <Text style={styles.topLabel}>NOW PLAYING</Text>
          <Text style={styles.topSub} numberOfLines={1}>
            {currentDisplayTrack?.channelTitle || 'Unknown Artist'}
          </Text>
        </View>

        <TouchableOpacity style={styles.iconBtn}>
          <CustomIcons name="ellipsis-vertical" type="Ionicons" size={20} color={AppColors.WHITE} />
        </TouchableOpacity>
      </View>

      {/* ── Artwork ── */}
      <View style={styles.artworkWrap}>
        <Animated.View style={[styles.artworkShadow, { transform: [{ scale: artworkScale }] }]}>
          {hasThumbnail ? (
            <Image source={{ uri: currentDisplayTrack.thumbnail }} style={styles.artwork} />
          ) : (
            <LinearGradient colors={[AppColors.NeonPurple, AppColors.VibrantPink, AppColors.DeepPurple]} style={styles.artwork}>
              <Text style={styles.artworkEmoji}>🎵</Text>
            </LinearGradient>
          )}
        </Animated.View>

        {isLoading && (
          <View style={styles.artworkLoadingOverlay}>
            <ActivityIndicator size="large" color={AppColors.WHITE} />
            <Text style={styles.loadingText}>{downloading ? 'Downloading…' : 'Buffering…'}</Text>
          </View>
        )}
      </View>

      {/* ── Song info + like ── */}
      <View style={styles.songInfoRow}>
        <View style={styles.songInfoText}>
          <Text style={styles.songTitle} numberOfLines={1}>
            {currentDisplayTrack?.title || 'Unknown Track'}
          </Text>
          <Text style={styles.songArtist} numberOfLines={1}>
            {currentDisplayTrack?.channelTitle || 'Unknown Artist'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setIsLiked(v => !v)}
          style={[styles.likeBtn, isLiked && styles.likeBtnActive]}>
          <CustomIcons
            name={isLiked ? 'heart' : 'heart-outline'}
            type="Ionicons"
            size={22}
            color={isLiked ? AppColors.VibrantPink : AppColors.SubtleGray}
          />
        </TouchableOpacity>
      </View>

      {/* ── Progress bar ── */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={[AppColors.NeonPurple, AppColors.VibrantPink]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: progressBarWidth }]}
          />
          <View style={[styles.progressThumb, { left: progressBarWidth - 6 }]} />
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(elapsedTime)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>

      {/* ── Controls ── */}
      <View style={styles.controlsRow}>
        {/* Shuffle */}
        <TouchableOpacity
          onPress={() => dispatch(toggleShuffle())}
          style={styles.controlSide}
          activeOpacity={0.7}>
          <CustomIcons
            name="shuffle"
            type="Ionicons"
            size={22}
            color={shuffle ? AppColors.NeonPurple : AppColors.SubtleGray}
          />
          {shuffle && <View style={styles.activeDot} />}
        </TouchableOpacity>

        {/* Prev */}
        <TouchableOpacity style={styles.controlBtn} activeOpacity={0.7} onPress={handlePrev}>
          <CustomIcons name="play-skip-back" type="Ionicons" size={30} color={AppColors.WHITE} />
        </TouchableOpacity>

        {/* Play / Pause */}
        <TouchableOpacity
          style={styles.playBtn}
          onPress={handlePlayPause}
          activeOpacity={0.8}
          disabled={isLoading}>
          <LinearGradient
            colors={isLoading
              ? [AppColors.DimGray as string, AppColors.DimGray as string]
              : [AppColors.NeonPurple, AppColors.VibrantPink]}
            style={styles.playBtnInner}>
            {isLoading ? (
              <ActivityIndicator size="small" color={AppColors.WHITE} />
            ) : (
              <CustomIcons
                name={isPlaying && !isPaused ? 'pause' : 'play'}
                type="FontAwesome5"
                size={26}
                color={AppColors.WHITE}
              />
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Next */}
        <TouchableOpacity style={styles.controlBtn} activeOpacity={0.7} onPress={handleNext}>
          <CustomIcons name="play-skip-forward" type="Ionicons" size={30} color={AppColors.WHITE} />
        </TouchableOpacity>

        {/* Repeat */}
        <TouchableOpacity
          style={styles.controlSide}
          onPress={() => dispatch(setRepeatMode(((repeatMode + 1) % 3) as 0 | 1 | 2))}
          activeOpacity={0.7}>
          <CustomIcons
            name={repeatMode === 1 ? 'repeat-once' : 'repeat'}
            type="MaterialCommunityIcons"
            size={22}
            color={repeatMode > 0 ? AppColors.NeonPurple : AppColors.SubtleGray}
          />
          {repeatMode > 0 && <View style={styles.activeDot} />}
        </TouchableOpacity>
      </View>

      {/* ── Bottom actions ── */}
      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.actionBtn}>
          <CustomIcons name="list-music" type="MaterialCommunityIcons" size={22} color={AppColors.SubtleGray} />
          <Text style={styles.actionLabel}>Queue</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => setShowPlaylistModal(true)}>
          <CustomIcons name="add-circle-outline" type="Ionicons" size={22} color={AppColors.SubtleGray} />
          <Text style={styles.actionLabel}>Playlist</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <CustomIcons name="share-social-outline" type="Ionicons" size={22} color={AppColors.SubtleGray} />
          <Text style={styles.actionLabel}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* ── Add to Playlist Modal ── */}
      <Modal visible={showPlaylistModal} transparent animationType="slide" onRequestClose={() => setShowPlaylistModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowPlaylistModal(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Add to Playlist</Text>
          {playlists.length === 0 ? (
            <Text style={styles.emptyText}>No playlists yet. Create one in your Library.</Text>
          ) : (
            <FlatList
              data={playlists}
              keyExtractor={item => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.playlistRow} onPress={() => handleAddToPlaylist(item)}>
                  <LinearGradient
                    colors={[AppColors.NeonPurple + '40', AppColors.VibrantPink + '20']}
                    style={styles.playlistIcon}>
                    <CustomIcons name="musical-notes" type="Ionicons" size={18} color={AppColors.NeonPurple} />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.playlistRowName}>{item.name}</Text>
                    <Text style={styles.playlistRowCount}>{item.trackCount ?? 0} tracks</Text>
                  </View>
                  <CustomIcons name="add" type="Ionicons" size={20} color={AppColors.NeonPurple} />
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

export default Player;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppColors.DeepBlack },
  glowBehind: {
    position: 'absolute',
    width: width,
    height: width,
    borderRadius: width / 2,
    backgroundColor: AppColors.SoftGlow,
    top: height * 0.1,
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
    zIndex: 1,
  },
  topCenter: { flex: 1, alignItems: 'center' },
  topLabel: {
    fontSize: 11,
    color: AppColors.DimGray,
    fontFamily: AppFonts.MulishSemiBold,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  topSub: {
    fontSize: 13,
    color: AppColors.SubtleGray,
    fontFamily: AppFonts.MulishRegular,
    marginTop: 2,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: AppColors.GlassWhite,
    borderWidth: 1,
    borderColor: AppColors.GlassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkWrap: { alignItems: 'center', marginTop: 20, marginBottom: 32 },
  artworkShadow: {
    shadowColor: AppColors.NeonPurple,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 25,
  },
  artwork: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkEmoji: { fontSize: 80 },
  artworkLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    top: 0,
    left: (width - ARTWORK_SIZE) / 2,
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
  },
  loadingText: { fontSize: 14, color: AppColors.WHITE, fontFamily: AppFonts.MulishSemiBold },
  songInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  songInfoText: { flex: 1 },
  songTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: AppColors.WHITE,
    fontFamily: AppFonts.MulishBold,
  },
  songArtist: {
    fontSize: 15,
    color: AppColors.SubtleGray,
    fontFamily: AppFonts.MulishRegular,
    marginTop: 4,
  },
  likeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.GlassWhite,
    borderWidth: 1,
    borderColor: AppColors.GlassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  likeBtnActive: { borderColor: AppColors.VibrantPink },
  progressContainer: { paddingHorizontal: 24, marginBottom: 32 },
  progressTrack: {
    height: 4,
    backgroundColor: AppColors.GlassWhite,
    borderRadius: 2,
    position: 'relative',
  },
  progressFill: { height: 4, borderRadius: 2, position: 'absolute', left: 0, top: 0 },
  progressThumb: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: AppColors.WHITE,
    position: 'absolute',
    top: -4,
    shadowColor: AppColors.WHITE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  timeText: { fontSize: 12, color: AppColors.DimGray, fontFamily: AppFonts.MulishRegular },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    marginBottom: 36,
  },
  controlSide: { width: 44, alignItems: 'center' },
  controlBtn: { width: 50, alignItems: 'center' },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: AppColors.NeonPurple,
    marginTop: 4,
  },
  playBtn: {
    shadowColor: AppColors.NeonPurple,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 16,
  },
  playBtnInner: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.GlassBorder,
  },
  actionBtn: { alignItems: 'center', gap: 6 },
  actionLabel: { fontSize: 11, color: AppColors.DimGray, fontFamily: AppFonts.MulishLight },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: {
    backgroundColor: AppColors.DeepPurple,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: '60%',
    borderTopWidth: 1,
    borderTopColor: AppColors.GlassBorder,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: AppColors.SubtleGray,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.WHITE,
    fontFamily: AppFonts.MulishBold,
    marginBottom: 16,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.GlassBorder,
    gap: 12,
  },
  playlistIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistRowName: {
    fontSize: 15,
    color: AppColors.WHITE,
    fontFamily: AppFonts.MulishSemiBold,
  },
  playlistRowCount: {
    fontSize: 12,
    color: AppColors.DimGray,
    fontFamily: AppFonts.MulishRegular,
    marginTop: 2,
  },
  emptyText: {
    color: AppColors.DimGray,
    fontFamily: AppFonts.MulishRegular,
    textAlign: 'center',
    marginTop: 20,
  },
});
