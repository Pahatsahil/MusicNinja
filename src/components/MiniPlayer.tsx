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
  const { currentTrack, isPlaying, isPaused, queue, queueIndex } =
    useAppSelector(s => s.player);
  const { pauseSound, resumeSound, stopSound } = useMusicPlayer();
  const slideAnim = useRef(new Animated.Value(MINI_HEIGHT + 10)).current;
  const hasTrack = !!currentTrack;
  const { bottom } = useSafeAreaInsets();

  // Slide up when track becomes active
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: hasTrack ? 0 : MINI_HEIGHT + 10,
      useNativeDriver: true,
      friction: 10,
      tension: 80,
    }).start();
  }, [hasTrack]);

  const dragY = useRef(new Animated.Value(0)).current;
  const isDragging = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 8 && gestureState.dy > 0;
      },
      onPanResponderGrant: () => {
        isDragging.current = true;
        dragY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          dragY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: async (_, gestureState) => {
        isDragging.current = false;
        if (gestureState.dy > 50) {
          Animated.timing(dragY, {
            toValue: MINI_HEIGHT + 100,
            duration: 200,
            useNativeDriver: true,
          }).start(async () => {
            dragY.setValue(0);
            await stopSound();
            dispatch(clearQueue());
          });
        } else {
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(dragY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
        }).start();
      },
    }),
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
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.wrapper,
        {
          transform: [{ translateY: dragY }, { translateY: slideAnim }],
          bottom: bottom + 75,
        },
      ]}
    >
      <View style={styles.container}>
        {/* White accent line at top */}
        <View style={styles.topAccentLine} />

        {/* Artwork */}
        <TouchableOpacity
          onPress={handleOpenPlayer}
          style={styles.artworkWrap}
          activeOpacity={0.8}
        >
          {hasThumbnail ? (
            <Image
              source={{ uri: currentTrack.thumbnail }}
              style={styles.artwork}
            />
          ) : (
            <View style={styles.artworkPlaceholder}>
              <Text style={styles.artworkEmoji}>🎵</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Track info */}
        <TouchableOpacity
          style={styles.infoWrap}
          onPress={handleOpenPlayer}
          activeOpacity={0.7}
        >
          <Text style={styles.title} numberOfLines={1}>
            {currentTrack.title || 'Unknown Track'}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {currentTrack.channelTitle || 'Unknown Artist'}
          </Text>
        </TouchableOpacity>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            onPress={handlePlayPause}
            style={styles.playBtn}
            activeOpacity={0.7}
          >
            <View style={styles.playBtnInner}>
              <CustomIcons
                name={isPlaying && !isPaused ? 'pause' : 'play'}
                type="FontAwesome5"
                size={13}
                color={AppColors.DeepBlack}
              />
            </View>
          </TouchableOpacity>

          {hasNext && (
            <TouchableOpacity
              onPress={handleNext}
              style={styles.nextBtn}
              activeOpacity={0.7}
            >
              <CustomIcons
                name="play-skip-forward"
                type="Ionicons"
                size={20}
                color={AppColors.SubtleGray}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

export default MiniPlayer;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 20,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: MINI_HEIGHT,
    paddingHorizontal: 12,
    backgroundColor: AppColors.DeepPurple,
    borderTopWidth: 1,
    borderTopColor: AppColors.GlassBorder,
    gap: 10,
  },
  topAccentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: AppColors.WHITE,
    opacity: 0.7,
  },
  artworkWrap: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  artwork: { width: 46, height: 46, borderRadius: 8 },
  artworkPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.RichPurple,
    borderWidth: 1,
    borderColor: AppColors.GlassBorder,
  },
  artworkEmoji: { fontSize: 22 },
  infoWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
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
  playBtn: {},
  playBtnInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.WHITE,
  },
  nextBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
