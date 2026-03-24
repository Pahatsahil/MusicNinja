import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AppColors from '@constants/AppColors';
import AppFonts from '@constants/AppFonts';
import { CustomIcons } from '@components/common';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import usePlaylists, { IPlaylistTrack } from '@hooks/music/usePlaylists';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch } from '@redux/store/hooks';
import { setQueue } from '@redux/slices/player/playerSlice';
import { IDownloadedTrack } from '@utills/database/schema';
import screenNames from '@navigation/screenNames';

const PlaylistDetail = ({ route }: any) => {
  const { playlist } = route.params;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { fetchTracks, removeTrack } = usePlaylists();

  const [tracks, setTracks] = useState<IPlaylistTrack[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTracks = useCallback(async () => {
    setLoading(true);
    const data = await fetchTracks(playlist.id);
    setTracks(data);
    setLoading(false);
  }, [fetchTracks, playlist.id]);

  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  const playlistToQueue = (tracks: IPlaylistTrack[]): IDownloadedTrack[] =>
    tracks.map(t => ({
      video_id: t.video_id,
      title: t.title,
      channelTitle: t.channelTitle,
      thumbnail: t.thumbnail,
      filePath: t.filePath,
      downloadedAt: t.addedAt,
    }));

  const handlePlayAll = () => {
    if (tracks.length === 0) return;
    const queue = playlistToQueue(tracks);
    dispatch(setQueue({ queue, startIndex: 0 }));
    navigation.navigate(screenNames.Player, { song: queue[0] });
  };

  const handlePlayTrack = (track: IPlaylistTrack, index: number) => {
    const queue = playlistToQueue(tracks);
    dispatch(setQueue({ queue, startIndex: index }));
    navigation.navigate(screenNames.Player, { song: queue[index] });
  };

  const handleRemoveTrack = (track: IPlaylistTrack) => {
    Alert.alert(
      'Remove Track',
      `Remove "${track.title}" from "${playlist.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeTrack(playlist.id, track.video_id);
            loadTracks();
          },
        },
      ],
    );
  };

  const renderTrack = ({ item, index }: { item: IPlaylistTrack; index: number }) => (
    <TouchableOpacity
      style={styles.trackRow}
      onPress={() => handlePlayTrack(item, index)}
      onLongPress={() => handleRemoveTrack(item)}
      activeOpacity={0.8}>
      <View style={styles.trackIndex}>
        <Text style={styles.trackIndexText}>{index + 1}</Text>
      </View>
      <View style={styles.trackIconWrap}>
        <LinearGradient
          colors={[AppColors.NeonPurple + '50', AppColors.VibrantPink + '30']}
          style={styles.trackIcon}>
          <CustomIcons name="musical-note" type="Ionicons" size={18} color={AppColors.NeonPurple} />
        </LinearGradient>
      </View>
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.trackArtist} numberOfLines={1}>{item.channelTitle || 'Unknown Artist'}</Text>
      </View>
      <TouchableOpacity onPress={() => handlePlayTrack(item, index)} style={styles.playIconBtn}>
        <CustomIcons name="play-circle" type="Ionicons" size={28} color={AppColors.NeonPurple} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={[AppColors.DeepBlack, AppColors.RichPurple, AppColors.DeepBlack]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <CustomIcons name="chevron-back" type="Ionicons" size={22} color={AppColors.WHITE} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          {/* Playlist artwork */}
          <LinearGradient
            colors={[AppColors.NeonPurple, AppColors.VibrantPink]}
            style={styles.headerArtwork}>
            <CustomIcons name="musical-notes" type="Ionicons" size={40} color={AppColors.WHITE} />
          </LinearGradient>
          <Text style={styles.playlistName}>{playlist.name}</Text>
          <Text style={styles.playlistMeta}>{tracks.length} tracks</Text>

          {/* Play All button */}
          <TouchableOpacity onPress={handlePlayAll} style={styles.playAllBtn} disabled={tracks.length === 0} activeOpacity={0.8}>
            <LinearGradient colors={[AppColors.NeonPurple, AppColors.VibrantPink]} style={styles.playAllInner}>
              <CustomIcons name="play" type="FontAwesome5" size={16} color={AppColors.WHITE} />
              <Text style={styles.playAllText}>Play All</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Track List */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={AppColors.NeonPurple} />
        </View>
      ) : tracks.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🎵</Text>
          <Text style={styles.emptyTitle}>No tracks yet</Text>
          <Text style={styles.emptySubtitle}>
            Open any song in the Player and tap "Playlist" to add it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={item => `${item.id}`}
          renderItem={renderTrack}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 140 }]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default PlaylistDetail;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppColors.DeepBlack },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    zIndex: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: AppColors.GlassWhite,
    borderWidth: 1,
    borderColor: AppColors.GlassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  headerCenter: { alignItems: 'center' },
  headerArtwork: {
    width: 120,
    height: 120,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: AppColors.NeonPurple,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 20,
  },
  playlistName: {
    fontSize: 26,
    fontWeight: '800',
    color: AppColors.WHITE,
    fontFamily: AppFonts.MulishBold,
    textAlign: 'center',
    marginBottom: 4,
  },
  playlistMeta: {
    fontSize: 14,
    color: AppColors.DimGray,
    fontFamily: AppFonts.MulishRegular,
    marginBottom: 20,
  },
  playAllBtn: {
    shadowColor: AppColors.NeonPurple,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  playAllInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 10,
  },
  playAllText: {
    color: AppColors.WHITE,
    fontFamily: AppFonts.MulishBold,
    fontSize: 16,
    fontWeight: '700',
  },
  listContent: { paddingTop: 8 },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.GlassBorder,
    gap: 12,
  },
  trackIndex: { width: 24, alignItems: 'center' },
  trackIndexText: { fontSize: 13, color: AppColors.DimGray, fontFamily: AppFonts.MulishRegular },
  trackIconWrap: { borderRadius: 12, overflow: 'hidden' },
  trackIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackInfo: { flex: 1 },
  trackTitle: { fontSize: 14, fontWeight: '600', color: AppColors.WHITE, fontFamily: AppFonts.MulishSemiBold },
  trackArtist: { fontSize: 12, color: AppColors.DimGray, fontFamily: AppFonts.MulishRegular, marginTop: 2 },
  playIconBtn: { padding: 4 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 60 },
  emptyEmoji: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: AppColors.WHITE, fontFamily: AppFonts.MulishBold, marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: AppColors.DimGray, fontFamily: AppFonts.MulishLight, textAlign: 'center', lineHeight: 22 },
});
