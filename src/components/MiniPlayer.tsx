import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AppColors from '@constants/AppColors';
import AppFonts from '@constants/AppFonts';
import { CustomIcons } from '@components/common';
import { useAppSelector, useAppDispatch } from '@redux/store/hooks';
import { nextTrack, clearQueue } from '@redux/slices/player/playerSlice';
import useMusicPlayer from '@hooks/music/useMusicPlayer';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const MINI_HEIGHT = 68;

const MiniPlayer = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const { currentTrack, isPlaying, isPaused, queue, queueIndex } = useAppSelector(s => s.player);
  const { pauseSound, resumeSound, stopSound } = useMusicPlayer();
  const slideAnim = useRef(new Animated.Value(MINI_HEIGHT + 10)).current;
  const hasTrack = !!currentTrack;
    const {bottom}=useSafeAreaInsets()

  // Slide up when track becomes active
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: hasTrack ? 0 : MINI_HEIGHT + 10,
      useNativeDriver: true,
      friction: 10,
      tension: 80,
    }).start();
  }, [hasTrack]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 10;
      },
      onPanResponderRelease: async (_, gestureState) => {
        if (gestureState.dy > 50) {
          await stopSound();
          dispatch(clearQueue());
        }
      },
    })
  ).current;

  if (!currentTrack) return null;

  const hasThumbnail = !!currentTrack.thumbnail;
  const hasNext = queueIndex < queue.length - 1;

  const handlePlayPause = async () => {
    if (isPlaying && !isPaused) {
      await pauseSound();
    } else {
      await resumeSound();
    }
  };

  const handleNext = () => {
    dispatch(nextTrack());
  };

  const handleOpenPlayer = () => {
    navigation.navigate('Player', { song: currentTrack });
  };

  return (
    <Animated.View {...panResponder.panHandlers} style={[styles.wrapper, { transform: [{ translateY: slideAnim }], }]}>
      <LinearGradient
        colors={[AppColors.DeepPurple, AppColors.RichPurple]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.container}>

        {/* Progress glow line at top */}
        <LinearGradient
          colors={[AppColors.NeonPurple, AppColors.VibrantPink]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.topBar}
        />

        {/* Artwork */}
        <TouchableOpacity onPress={handleOpenPlayer} style={styles.artworkWrap} activeOpacity={0.8}>
          {hasThumbnail ? (
            <Image source={{ uri: currentTrack.thumbnail }} style={styles.artwork} />
          ) : (
            <LinearGradient
              colors={[AppColors.NeonPurple, AppColors.VibrantPink]}
              style={styles.artworkPlaceholder}>
              <Text style={styles.artworkEmoji}>🎵</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>

        {/* Track info */}
        <TouchableOpacity style={styles.infoWrap} onPress={handleOpenPlayer} activeOpacity={0.7}>
          <Text style={styles.title} numberOfLines={1}>
            {currentTrack.title || 'Unknown Track'}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {currentTrack.channelTitle || 'Unknown Artist'}
          </Text>
        </TouchableOpacity>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity onPress={handlePlayPause} style={styles.playBtn} activeOpacity={0.7}>
            <LinearGradient
              colors={[AppColors.NeonPurple, AppColors.VibrantPink]}
              style={styles.playBtnInner}>
              <CustomIcons
                name={isPlaying && !isPaused ? 'pause' : 'play'}
                type="FontAwesome5"
                size={14}
                color={AppColors.WHITE}
              />
            </LinearGradient>
          </TouchableOpacity>

          {hasNext && (
            <TouchableOpacity onPress={handleNext} style={styles.nextBtn} activeOpacity={0.7}>
              <CustomIcons
                name="play-skip-forward"
                type="Ionicons"
                size={20}
                color={AppColors.SubtleGray}
              />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

export default MiniPlayer;

const styles = StyleSheet.create({
  wrapper: {
    // position: 'absolute',
    // bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    shadowColor: AppColors.NeonPurple,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 20,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: MINI_HEIGHT,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.GlassBorder,
    gap: 10,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  artworkWrap: {
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: AppColors.NeonPurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  artwork: { width: 46, height: 46, borderRadius: 10 },
  artworkPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkEmoji: { fontSize: 22 },
  infoWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.WHITE,
    fontFamily: AppFonts.MulishBold,
  },
  artist: {
    fontSize: 12,
    color: AppColors.SubtleGray,
    fontFamily: AppFonts.MulishRegular,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playBtn: {
    shadowColor: AppColors.NeonPurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  playBtnInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
