import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  StatusBar,
  FlatList,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AppColors from '@constants/AppColors';
import AppFonts from '@constants/AppFonts';
import { CustomIcons } from '@components/common';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getLatestMusic } from '@api/music/musicApi';
import useDownloadedTracks from '@hooks/music/useDownloadedTracks';
import usePlaylists from '@hooks/music/usePlaylists';
import { useAppDispatch } from '@redux/store/hooks';
import { setCurrentTrack, setQueue } from '@redux/slices/player/playerSlice';

const { width } = Dimensions.get('window');
const CARD_W = width * 0.44;

const HomeScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [greeting, setGreeting] = useState('Good Morning');

  const { tracks } = useDownloadedTracks();
  const { playlists, refreshPlaylists } = usePlaylists();

  useEffect(() => {
    refreshPlaylists();
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
    getLatestMusicList();
  }, []);

  const getLatestMusicList = async () => {
    try {
      const data = await getLatestMusic();
    } catch (error) {
      console.log(error);
    }
  };

  const headerBg = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: ['transparent', AppColors.DeepPurple],
    extrapolate: 'clamp',
  });

  const handlePlayDownloadedTrack = (item: any) => {
    dispatch(setQueue({ queue: tracks, startIndex: tracks.findIndex(t => t.video_id === item.video_id) }));
    navigation.navigate('Player', { song: item });
  };

  const renderDownloadedCard = useCallback(
    ({ item }: any) => (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.featuredCard}
        onPress={() => handlePlayDownloadedTrack(item)}>
        {item.thumbnail ? (
          <Image source={{ uri: item.thumbnail }} style={StyleSheet.absoluteFillObject} />
        ) : (
          <LinearGradient colors={[AppColors.DeepBlack, AppColors.RichPurple]} style={StyleSheet.absoluteFillObject} />
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.featuredGradient}>
          <View style={{ flex: 1 }} />
          <View style={styles.featuredInfo}>
            <Text style={styles.featuredTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.featuredArtist} numberOfLines={1}>
              {item.channelTitle || 'Unknown Artist'}
            </Text>
          </View>
          <View style={styles.playChipAbs}>
            <CustomIcons name="play" type="FontAwesome5" size={12} color={AppColors.WHITE} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    ),
    [tracks],
  );

  const renderPlaylistRow = useCallback(
    ({ item, index }: any) => (
      <TouchableOpacity
        style={styles.trendingRow}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('PlaylistDetail', { playlist: item })}>
        <Text style={styles.trendingRank}>#{index + 1}</Text>
        <LinearGradient
          colors={[AppColors.NeonPurple + '80', AppColors.VibrantPink + '80']}
          style={styles.trendingEmojiBg}>
          <CustomIcons name="musical-notes" type="Ionicons" size={20} color={AppColors.WHITE} />
        </LinearGradient>
        <View style={styles.trendingMeta}>
          <Text style={styles.trendingTitle} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.trendingArtist}>{item.trackCount || 0} tracks</Text>
        </View>
        <CustomIcons name="chevron-forward" type="Ionicons" size={20} color={AppColors.SubtleGray} />
      </TouchableOpacity>
    ),
    [],
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={[AppColors.DeepBlack, AppColors.DeepPurple, AppColors.DeepBlack]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Sticky animated header */}
      <Animated.View style={[styles.header, { backgroundColor: headerBg, paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
          <Image source={require('../../assets/images/logo.jpg')} style={styles.logoImage} />
          <View>
            <Text style={styles.greeting}>{greeting} 👋</Text>
            <Text style={styles.headerTitle}>
              Music<Text style={{ color: AppColors.NeonPurple }}>Ninja</Text>
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.searchIconBtn}
          onPress={() => navigation.navigate('Search')}>
          <CustomIcons name="search1" type="AntDesign" size={20} color={AppColors.WHITE} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 80, paddingBottom: 110 }}>

        {/* Saved Downloads */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recently Saved Tracks</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Playlist')}>
            <Text style={styles.seeAll}>Library</Text>
          </TouchableOpacity>
        </View>
        {tracks.length > 0 ? (
          <FlatList
            data={tracks.slice(0, 10)}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={i => i.video_id}
            renderItem={renderDownloadedCard}
            contentContainerStyle={styles.featuredList}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No saved tracks yet. Go to Search to download some music!</Text>
          </View>
        )}

        {/* Playlists */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Playlists 🎶</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Playlist')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.trendingContainer}>
          {playlists.length > 0 ? (
            playlists.slice(0, 5).map((item, index) => renderPlaylistRow({ item, index }))
          ) : (
            <Text style={[styles.emptyText, { padding: 20 }]}>Create playlists in your Library to see them here.</Text>
          )}
        </View>

        {/* Genres placeholder */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Browse Genres</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.genreList}>
          {[
            { label: 'Hip-Hop', color: '#fc466b' },
            { label: 'Pop', color: '#6F2ECF' },
            { label: 'Rock', color: '#e96c4c' },
            { label: 'Electronic', color: '#11998e' },
            { label: 'R&B', color: '#3f5efb' },
          ].map(g => (
            <TouchableOpacity key={g.label} activeOpacity={0.8}>
              <LinearGradient
                colors={[g.color + 'CC', g.color + '55']}
                style={styles.genreChip}>
                <Text style={styles.genreLabel}>{g.label}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.ScrollView>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppColors.DeepBlack },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: AppColors.NeonPurple,
  },
  greeting: {
    fontSize: 12,
    color: AppColors.DimGray,
    fontFamily: AppFonts.MulishLight,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: AppColors.WHITE,
    fontFamily: AppFonts.MulishBold,
  },
  searchIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.GlassWhite,
    borderWidth: 1,
    borderColor: AppColors.GlassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.WHITE,
    fontFamily: AppFonts.MulishBold,
  },
  seeAll: {
    fontSize: 13,
    color: AppColors.NeonPurple,
    fontFamily: AppFonts.MulishSemiBold,
  },
  featuredList: { paddingHorizontal: 16, gap: 12 },
  featuredCard: {
    width: CARD_W,
    height: CARD_W * 1.1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: AppColors.GlassWhite,
  },
  featuredGradient: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  featuredInfo: {
    marginTop: 'auto',
  },
  featuredTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.WHITE,
    fontFamily: AppFonts.MulishBold,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  featuredArtist: {
    fontSize: 12,
    color: AppColors.SubtleGray,
    fontFamily: AppFonts.MulishRegular,
    marginTop: 2,
  },
  playChipAbs: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  trendingContainer: {
    marginHorizontal: 16,
    backgroundColor: AppColors.GlassWhite,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.GlassBorder,
    overflow: 'hidden',
  },
  trendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.GlassBorder,
  },
  trendingRank: {
    width: 24,
    fontSize: 12,
    color: AppColors.NeonPurple,
    fontFamily: AppFonts.MulishBold,
    fontWeight: '700',
  },
  trendingEmojiBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  trendingMeta: { flex: 1 },
  trendingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.WHITE,
    fontFamily: AppFonts.MulishSemiBold,
  },
  trendingArtist: {
    fontSize: 12,
    color: AppColors.DimGray,
    fontFamily: AppFonts.MulishRegular,
    marginTop: 2,
  },
  genreList: { paddingHorizontal: 16, gap: 10 },
  genreChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 50,
    minWidth: 90,
    alignItems: 'center',
  },
  genreLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.WHITE,
    fontFamily: AppFonts.MulishSemiBold,
  },
  emptyContainer: {
    marginHorizontal: 20,
    padding: 20,
    backgroundColor: AppColors.GlassWhite,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppColors.GlassBorder,
  },
  emptyText: {
    color: AppColors.DimGray,
    fontFamily: AppFonts.MulishRegular,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
  },
});
