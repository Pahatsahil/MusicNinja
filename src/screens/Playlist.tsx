import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AppColors from '@constants/AppColors';
import AppFonts from '@constants/AppFonts';
import { CustomIcons } from '@components/common';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PLAYLISTS = [
  {
    id: '1',
    name: 'Chill Vibes',
    count: 18,
    emoji: ['🌊', '🎶', '🌙', '✨'],
    gradient: ['#1a1a2e', '#11998e'],
  },
  {
    id: '2',
    name: 'Workout Bangers',
    count: 24,
    emoji: ['💪', '🔥', '⚡', '🎸'],
    gradient: ['#fc466b', '#3f5efb'],
  },
  {
    id: '3',
    name: 'Late Night Drive',
    count: 12,
    emoji: ['🚗', '🌆', '🎵', '🌃'],
    gradient: ['#2d1b69', '#6F2ECF'],
  },
  {
    id: '4',
    name: 'Top Hits 2025',
    count: 40,
    emoji: ['⭐', '🏆', '🎤', '🎧'],
    gradient: ['#C44DFF', '#6F2ECF'],
  },
];

const PlaylistScreen = () => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'playlists' | 'albums' | 'artists'>('playlists');

  const renderPlaylist = ({ item }: any) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.85}>
      {/* Thumbnail 2x2 grid */}
      <LinearGradient colors={item.gradient} style={styles.thumbnailGrid}>
        <View style={styles.gridRow}>
          {item.emoji.slice(0, 2).map((e: string, i: number) => (
            <View key={i} style={styles.gridCell}>
              <Text style={{ fontSize: 22 }}>{e}</Text>
            </View>
          ))}
        </View>
        <View style={styles.gridRow}>
          {item.emoji.slice(2, 4).map((e: string, i: number) => (
            <View key={i} style={styles.gridCell}>
              <Text style={{ fontSize: 22 }}>{e}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <View style={styles.cardMeta}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.cardCount}>{item.count} songs</Text>
      </View>

      <TouchableOpacity style={styles.cardMenu}>
        <CustomIcons name="ellipsis-vertical" type="Ionicons" size={18} color={AppColors.SubtleGray} />
      </TouchableOpacity>
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
          <Text style={styles.headerSub}>{PLAYLISTS.length} playlists</Text>
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
        {(['playlists', 'albums', 'artists'] as const).map(tab => (
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

      {/* Playlist list */}
      {activeTab === 'playlists' ? (
        <FlatList
          data={PLAYLISTS}
          keyExtractor={i => i.id}
          renderItem={renderPlaylist}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>{activeTab === 'albums' ? '💿' : '🎤'}</Text>
          <Text style={styles.emptyTitle}>
            No {activeTab} yet
          </Text>
          <Text style={styles.emptySubtitle}>
            Search and save music to build your {activeTab} collection
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

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.GlassWhite,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColors.GlassBorder,
    padding: 12,
    gap: 14,
  },
  thumbnailGrid: {
    width: 60,
    height: 60,
    borderRadius: 14,
    overflow: 'hidden',
  },
  gridRow: { flex: 1, flexDirection: 'row' },
  gridCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMeta: { flex: 1 },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.WHITE,
    fontFamily: AppFonts.MulishSemiBold,
  },
  cardCount: {
    fontSize: 12,
    color: AppColors.DimGray,
    fontFamily: AppFonts.MulishRegular,
    marginTop: 3,
  },
  cardMenu: { padding: 6 },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
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
  },
});
