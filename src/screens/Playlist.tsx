import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Image,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AppColors from '@constants/AppColors';
import AppFonts from '@constants/AppFonts';
import { CustomIcons } from '@components/common';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useDownloadedTracks from '@hooks/music/useDownloadedTracks';
import usePlaylists from '@hooks/music/usePlaylists';
import SongItem from '@components/SongItem';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch } from '@redux/store/hooks';
import { setQueue, setCurrentTrack } from '@redux/slices/player/playerSlice';
import { IPlaylist } from '@utills/database/schema';
import screenNames from '@navigation/screenNames';

const PlaylistScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { tracks, removeTrack } = useDownloadedTracks();
  const { playlists, addPlaylist, removePlaylist } = usePlaylists();
  const [activeTab, setActiveTab] = useState<'downloads' | 'playlists'>('downloads');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const handleTrackPress = (item: any) => {
    dispatch(setCurrentTrack(item));
    navigation.navigate(screenNames.Player, { song: item });
  };

  const handlePlayAllDownloads = () => {
    if (tracks.length === 0) return;
    dispatch(setQueue({ queue: tracks, startIndex: 0 }));
    navigation.navigate(screenNames.Player, { song: tracks[0] });
  };

  const handleLongPress = (item: any) => {
    Alert.alert(
      'Remove Download',
      `Remove "${item.title}" from your downloads?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeTrack(item.video_id, true) },
      ],
    );
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    await addPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setShowCreateModal(false);
  };

  const handleDeletePlaylist = (playlist: IPlaylist) => {
    Alert.alert(
      'Delete Playlist',
      `Delete "${playlist.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removePlaylist(playlist.id) },
      ],
    );
  };

  const renderTrack = ({ item }: { item: any }) => (
    <SongItem item={item} onPress={() => handleTrackPress(item)} />
  );

  const renderPlaylist = ({ item }: { item: IPlaylist }) => (
    <TouchableOpacity
      style={styles.playlistCard}
      onPress={() => navigation.navigate(screenNames.PlaylistDetail, { playlist: item })}
      onLongPress={() => handleDeletePlaylist(item)}
      activeOpacity={0.8}>
      <LinearGradient
        colors={[AppColors.NeonPurple + '30', AppColors.VibrantPink + '15']}
        style={styles.playlistIcon}>
        <CustomIcons name="musical-notes" type="Ionicons" size={24} color={AppColors.NeonPurple} />
      </LinearGradient>
      <View style={styles.playlistInfo}>
        <Text style={styles.playlistName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.playlistCount}>{item.trackCount ?? 0} tracks</Text>
      </View>
      <CustomIcons name="chevron-forward" type="Ionicons" size={20} color={AppColors.SubtleGray} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={[AppColors.DeepBlack, AppColors.DeepPurple, AppColors.DeepBlack]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View>
          <Text style={styles.headerTitle}>Your Library</Text>
          <Text style={styles.headerSub}>
            {activeTab === 'downloads' ? `${tracks.length} tracks saved` : `${playlists.length} playlists`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            if (activeTab === 'downloads') handlePlayAllDownloads();
            else setShowCreateModal(true);
          }}>
          <LinearGradient colors={[AppColors.NeonPurple, AppColors.VibrantPink]} style={styles.addBtnInner}>
            <CustomIcons
              name={activeTab === 'downloads' ? 'play' : 'plus'}
              type={activeTab === 'downloads' ? 'FontAwesome5' : 'AntDesign'}
              size={activeTab === 'downloads' ? 14 : 18}
              color={AppColors.WHITE}
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['downloads', 'playlists'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}>
            {activeTab === tab && (
              <LinearGradient
                colors={[AppColors.NeonPurple, AppColors.VibrantPink]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
            )}
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'downloads' ? (
        tracks.length > 0 ? (
          <FlatList
            data={tracks}
            keyExtractor={i => i.video_id}
            renderItem={renderTrack}
            contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📥</Text>
            <Text style={styles.emptyTitle}>No downloads yet</Text>
            <Text style={styles.emptySubtitle}>
              Search and play music to save it offline.
            </Text>
            <TouchableOpacity style={styles.exploreBtn} onPress={() => navigation.navigate('Search')}>
              <LinearGradient colors={[AppColors.NeonPurple, AppColors.VibrantPink]} style={styles.exploreBtnInner}>
                <Text style={styles.exploreText}>Explore Music</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )
      ) : (
        playlists.length > 0 ? (
          <FlatList
            data={playlists}
            keyExtractor={i => String(i.id)}
            renderItem={renderPlaylist}
            contentContainerStyle={styles.playlistList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎶</Text>
            <Text style={styles.emptyTitle}>No playlists yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap + to create your first playlist.
            </Text>
            <TouchableOpacity style={styles.exploreBtn} onPress={() => setShowCreateModal(true)}>
              <LinearGradient colors={[AppColors.NeonPurple, AppColors.VibrantPink]} style={styles.exploreBtnInner}>
                <Text style={styles.exploreText}>Create Playlist</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )
      )}

      {/* Create Playlist Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCreateModal(false)} />
        <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>New Playlist</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Playlist name…"
            placeholderTextColor={AppColors.DimGray}
            value={newPlaylistName}
            onChangeText={setNewPlaylistName}
            autoFocus
            onSubmitEditing={handleCreatePlaylist}
          />
          <TouchableOpacity onPress={handleCreatePlaylist} activeOpacity={0.8}>
            <LinearGradient
              colors={[AppColors.NeonPurple, AppColors.VibrantPink]}
              style={styles.createBtn}>
              <Text style={styles.createBtnText}>Create</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

export default PlaylistScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppColors.DeepBlack },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: AppColors.WHITE,
    fontFamily: AppFonts.MulishBold,
  },
  headerSub: {
    fontSize: 13,
    color: AppColors.DimGray,
    fontFamily: AppFonts.MulishLight,
    marginTop: 4,
  },
  addBtn: {
    shadowColor: AppColors.NeonPurple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 12,
  },
  addBtnInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: AppColors.GlassWhite,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.GlassBorder,
    overflow: 'hidden',
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
    overflow: 'hidden',
  },
  tabActive: {},
  tabLabel: { fontSize: 13, color: AppColors.DimGray, fontFamily: AppFonts.MulishSemiBold },
  tabLabelActive: { color: AppColors.WHITE, fontFamily: AppFonts.MulishBold },

  // Playlist list
  playlistList: { paddingHorizontal: 16, paddingBottom: 140, gap: 10 },
  playlistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.GlassWhite,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.GlassBorder,
    padding: 14,
    gap: 14,
  },
  playlistIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistInfo: { flex: 1 },
  playlistName: { fontSize: 15, color: AppColors.WHITE, fontFamily: AppFonts.MulishSemiBold, fontWeight: '600' },
  playlistCount: { fontSize: 12, color: AppColors.DimGray, fontFamily: AppFonts.MulishRegular, marginTop: 2 },

  // Empty states
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 60 },
  emptyEmoji: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: AppColors.WHITE, fontFamily: AppFonts.MulishBold, marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: AppColors.DimGray, fontFamily: AppFonts.MulishLight, textAlign: 'center', lineHeight: 20, marginBottom: 30 },
  exploreBtn: { shadowColor: AppColors.NeonPurple, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 10 },
  exploreBtnInner: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30 },
  exploreText: { color: AppColors.WHITE, fontFamily: AppFonts.MulishBold, fontSize: 16 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: {
    backgroundColor: AppColors.DeepPurple,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: AppColors.GlassBorder,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: AppColors.SubtleGray, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: AppColors.WHITE, fontFamily: AppFonts.MulishBold, marginBottom: 16 },
  textInput: {
    backgroundColor: AppColors.GlassWhite,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.GlassBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: AppColors.WHITE,
    fontFamily: AppFonts.MulishRegular,
    marginBottom: 16,
  },
  createBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  createBtnText: { color: AppColors.WHITE, fontFamily: AppFonts.MulishBold, fontSize: 16, fontWeight: '700' },
});
