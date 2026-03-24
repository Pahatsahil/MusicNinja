import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Image,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AppColors from '@constants/AppColors';
import AppFonts from '@constants/AppFonts';
import { CustomIcons } from '@components/common';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useDownloadedTracks from '@hooks/music/useDownloadedTracks';
import SongItem from '@components/SongItem';
import { useNavigation } from '@react-navigation/native';

const PlaylistScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { tracks, removeTrack } = useDownloadedTracks();
  const [activeTab, setActiveTab] = useState<'downloads' | 'playlists' | 'artists'>('downloads');

  const handleTrackPress = (item: any) => {
    navigation.navigate('Player', { song: item });
  };

  const handleLongPress = (item: any) => {
    Alert.alert(
      'Remove Download',
      `Are you sure you want to remove "${item.title}" from your downloads?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive', 
          onPress: () => removeTrack(item.video_id, true) 
        },
      ]
    );
  };

  const renderTrack = ({ item }: { item: any }) => (
    <SongItem 
      item={item} 
      onPress={() => handleTrackPress(item)}
    />
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
            {activeTab === 'downloads' ? `${tracks.length} tracks saved` : '0 items'}
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn}>
          <LinearGradient
            colors={[AppColors.NeonPurple, AppColors.VibrantPink]}
            style={styles.addBtnInner}>
            <CustomIcons name="plus" type="AntDesign" size={18} color={AppColors.WHITE} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['downloads', 'playlists', 'artists'] as const).map(tab => (
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
            contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📥</Text>
            <Text style={styles.emptyTitle}>No downloads yet</Text>
            <Text style={styles.emptySubtitle}>
              Search for your favorite music and play it to save it locally for offline listening.
            </Text>
            <TouchableOpacity 
              style={styles.exploreBtn}
              onPress={() => navigation.navigate('Search')}
            >
              <LinearGradient
                colors={[AppColors.NeonPurple, AppColors.VibrantPink]}
                style={styles.exploreBtnInner}
              >
                <Text style={styles.exploreText}>Explore Music</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>{activeTab === 'playlists' ? '🎶' : '🎤'}</Text>
          <Text style={styles.emptyTitle}>
            No {activeTab} yet
          </Text>
          <Text style={styles.emptySubtitle}>
            Coming soon! You'll be able to create custom {activeTab} in the next update.
          </Text>
        </View>
      )}
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
  tabLabel: {
    fontSize: 13,
    color: AppColors.DimGray,
    fontFamily: AppFonts.MulishSemiBold,
  },
  tabLabelActive: { color: AppColors.WHITE, fontFamily: AppFonts.MulishBold },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  emptyEmoji: { fontSize: 60, marginBottom: 16 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.WHITE,
    fontFamily: AppFonts.MulishBold,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: AppColors.DimGray,
    fontFamily: AppFonts.MulishLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  exploreBtn: {
    shadowColor: AppColors.NeonPurple,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  exploreBtnInner: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
  },
  exploreText: {
    color: AppColors.WHITE,
    fontFamily: AppFonts.MulishBold,
    fontSize: 16,
  },
});
