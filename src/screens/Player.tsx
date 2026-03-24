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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AppColors from '@constants/AppColors';
import AppFonts from '@constants/AppFonts';
import { CustomIcons } from '@components/common';
import useMusicPlayer from '@hooks/music/useMusicPlayer';
import { downloadMusic } from '@api/music/musicApi';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const ARTWORK_SIZE = width * 0.75;

const Player = ({ route, navigation }: any) => {
  const { song } = route.params;
  const { playSound2, stopSound, soundLoader, isPlaying } = useMusicPlayer();
  const insets = useSafeAreaInsets();

  const [isLiked, setIsLiked] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeat] = useState(0); // 0=off, 1=one, 2=all

  // artwork breathing animation
  const artworkScale = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isPlaying) {
      Animated.spring(artworkScale, { toValue: 1.06, useNativeDriver: true, friction: 8 }).start();
    } else {
      Animated.spring(artworkScale, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
    }
  }, [isPlaying]);

  const handlePlayPause = useCallback(async () => {
    if (isPlaying) {
      stopSound();
    } else {
      const path = await downloadMusic(song.video_id);
      playSound2('file://' + path);
    }
  }, [isPlaying, song]);

  const goBack = () => {
    if (isPlaying) stopSound();
    navigation.goBack();
  };

  const hasThumbnail = !!song.thumbnail;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background gradient */}
      <LinearGradient
        colors={[AppColors.DeepBlack, AppColors.RichPurple, AppColors.DeepBlack]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Glow behind artwork */}
      <View style={styles.glowBehind} />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={goBack}>
          <CustomIcons name="chevron-down" type="Ionicons" size={22} color={AppColors.WHITE} />
        </TouchableOpacity>

        <View style={styles.topCenter}>
          <Text style={styles.topLabel}>NOW PLAYING</Text>
        </View>

        <TouchableOpacity style={styles.iconBtn}>
          <CustomIcons name="ellipsis-vertical" type="Ionicons" size={20} color={AppColors.WHITE} />
        </TouchableOpacity>
      </View>

      {/* Artwork */}
      <View style={styles.artworkWrap}>
        <Animated.View style={[styles.artworkShadow, { transform: [{ scale: artworkScale }] }]}>
          {hasThumbnail ? (
            <Image source={{ uri: song.thumbnail }} style={styles.artwork} />
          ) : (
            <LinearGradient
              colors={[AppColors.NeonPurple, AppColors.VibrantPink, AppColors.DeepPurple]}
              style={styles.artwork}>
              <Text style={styles.artworkEmoji}>🎵</Text>
            </LinearGradient>
          )}
        </Animated.View>
      </View>

      {/* Song info + like */}
      <View style={styles.songInfoRow}>
        <View style={styles.songInfoText}>
          <Text style={styles.songTitle} numberOfLines={1}>
            {song.title || 'Unknown Track'}
          </Text>
          <Text style={styles.songArtist} numberOfLines={1}>
            {song.channelTitle || 'Unknown Artist'}
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

      {/* Progress bar (visual only) */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={[AppColors.NeonPurple, AppColors.VibrantPink]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.progressFill}
          />
          <View style={styles.progressThumb} />
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>0:00</Text>
          <Text style={styles.timeText}>3:45</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controlsRow}>
        {/* Shuffle */}
        <TouchableOpacity onPress={() => setIsShuffle(v => !v)} style={styles.controlSide}>
          <CustomIcons
            name="shuffle"
            type="Ionicons"
            size={22}
            color={isShuffle ? AppColors.NeonPurple : AppColors.SubtleGray}
          />
        </TouchableOpacity>

        {/* Prev */}
        <TouchableOpacity style={styles.controlBtn}>
          <CustomIcons name="play-skip-back" type="Ionicons" size={28} color={AppColors.WHITE} />
        </TouchableOpacity>

        {/* Play/Pause */}
        <TouchableOpacity style={styles.playBtn} onPress={handlePlayPause} activeOpacity={0.8}>
          <LinearGradient
            colors={[AppColors.NeonPurple, AppColors.VibrantPink]}
            style={styles.playBtnInner}>
            {soundLoader ? (
              <ActivityIndicator size="small" color={AppColors.WHITE} />
            ) : (
              <CustomIcons
                name={isPlaying ? 'pause' : 'play'}
                type="FontAwesome5"
                size={24}
                color={AppColors.WHITE}
              />
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Next */}
        <TouchableOpacity style={styles.controlBtn}>
          <CustomIcons name="play-skip-forward" type="Ionicons" size={28} color={AppColors.WHITE} />
        </TouchableOpacity>

        {/* Repeat */}
        <TouchableOpacity
          style={styles.controlSide}
          onPress={() => setRepeat(r => (r + 1) % 3)}>
          <CustomIcons
            name={repeatMode === 1 ? 'repeat-once' : 'repeat'}
            type="MaterialCommunityIcons"
            size={22}
            color={repeatMode > 0 ? AppColors.NeonPurple : AppColors.SubtleGray}
          />
        </TouchableOpacity>
      </View>

      {/* Bottom actions */}
      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.actionBtn}>
          <CustomIcons name="list-music" type="MaterialCommunityIcons" size={22} color={AppColors.SubtleGray} />
          <Text style={styles.actionLabel}>Queue</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <CustomIcons name="share-social-outline" type="Ionicons" size={22} color={AppColors.SubtleGray} />
          <Text style={styles.actionLabel}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <CustomIcons name="download-outline" type="Ionicons" size={22} color={AppColors.SubtleGray} />
          <Text style={styles.actionLabel}>Save</Text>
        </TouchableOpacity>
      </View>
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
  artworkWrap: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
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
  progressContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  progressTrack: {
    height: 4,
    backgroundColor: AppColors.GlassWhite,
    borderRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressFill: {
    height: 4,
    width: '38%',
    borderRadius: 2,
  },
  progressThumb: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: AppColors.WHITE,
    marginLeft: -1,
    shadowColor: AppColors.WHITE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  timeText: {
    fontSize: 12,
    color: AppColors.DimGray,
    fontFamily: AppFonts.MulishRegular,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    marginBottom: 36,
  },
  controlSide: { width: 40, alignItems: 'center' },
  controlBtn: { width: 50, alignItems: 'center' },
  playBtn: {
    shadowColor: AppColors.NeonPurple,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 16,
  },
  playBtnInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
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
  actionLabel: {
    fontSize: 11,
    color: AppColors.DimGray,
    fontFamily: AppFonts.MulishLight,
  },
});
