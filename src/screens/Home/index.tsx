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
import AppColors from '@constants/AppColors';
import AppFonts from '@constants/AppFonts';
import { CustomIcons } from '@components/common';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { losslessApi } from '@api/LosslessAPI';
import useDownloadedTracks from '@hooks/music/useDownloadedTracks';
import usePlaylists from '@hooks/music/usePlaylists';
import { useAppDispatch } from '@redux/store/hooks';
import { setCurrentTrack, setQueue } from '@redux/slices/player/playerSlice';

const { width } = Dimensions.get('window');
const CARD_W = width * 0.44;

const GENRES = [
  { label: 'Hip-Hop' },
  { label: 'Pop' },
  { label: 'Rock' },
  { label: 'Electronic' },
  { label: 'R&B' },
  { label: 'Jazz' },
  { label: 'Classical' },
];

const HomeScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [greeting, setGreeting] = useState('Good Morning');

  const { tracks } = useDownloadedTracks();
  const { playlists, refreshPlaylists } = usePlaylists();

  const [trendingTracks, setTrendingTracks] = useState<any[]>([]);

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
      const data = await losslessApi.searchTracks('Trending');
      setTrendingTracks(data?.items?.slice(0, 10) || []);
    } catch (error) {
      console.log('Error fetching trending:', error);
    }
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const handlePlayDownloadedTrack = (item: any) => {
    dispatch(
      setQueue({
        queue: trendingTracks,
        startIndex: trendingTracks.findIndex(t => t.id === item.id),
      }),
    );
    navigation.navigate('Player', { song: item });
  };

  const renderDownloadedCard = useCallback(
    ({ item }: any) => (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.featuredCard}
        onPress={() => handlePlayDownloadedTrack(item)}
      >
        {item.thumbnail || item.album?.cover ? (
          <Image
            source={{
              uri: item.thumbnail || losslessApi.getCoverUrl(item.album.cover),
            }}
            style={StyleSheet.absoluteFillObject}
          />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, styles.featuredCardFallback]} />
        )}
        {/* Dark gradient overlay */}
        <View style={styles.featuredGradient}>
          <View style={{ flex: 1 }} />
          <View style={styles.featuredInfo}>
            <Text style={styles.featuredTitle} numberOfLines={1}>
              {item.title || 'Unknown Title'}
            </Text>
            <Text style={styles.featuredArtist} numberOfLines={1}>
              {item.channelTitle || item.artist?.name || 'Unknown Artist'}
            </Text>
          </View>
          <View style={styles.playChipAbs}>
            <CustomIcons
              name="play"
              type="FontAwesome5"
              size={10}
              color={AppColors.DeepBlack}
            />
          </View>
        </View>
      </TouchableOpacity>
    ),
    [trendingTracks],
  );

  const renderPlaylistRow = useCallback(
    ({ item, index }: any) => (
      <TouchableOpacity
        style={styles.trendingRow}
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate('PlaylistDetail', { playlist: item })
        }
      >
        <Text style={styles.trendingRank}>#{index + 1}</Text>
        <View style={styles.trendingEmojiBg}>
          <CustomIcons
            name="musical-notes"
            type="Ionicons"
            size={18}
            color={AppColors.WHITE}
          />
        </View>
        <View style={styles.trendingMeta}>
          <Text style={styles.trendingTitle} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.trendingArtist}>
            {item.trackCount || 0} tracks
          </Text>
        </View>
        <CustomIcons
          name="chevron-forward"
          type="Ionicons"
          size={18}
          color={AppColors.DimGray}
        />
      </TouchableOpacity>
    ),
    [],
  );

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Sticky animated header */}
      <Animated.View
        style={[
          styles.headerBg,
          { opacity: headerOpacity, top: 0, paddingTop: insets.top },
        ]}
      />
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 10 },
        ]}
      >
        <View style={styles.headerLeft}>
          <Image
            source={require('../../assets/images/logo.jpg')}
            style={styles.logoImage}
          />
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.headerTitle}>
              Music<Text style={{ color: AppColors.WHITE }}>Ninja</Text>
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.searchIconBtn}
          onPress={() => navigation.navigate('Search')}
        >
          <CustomIcons
            name="search1"
            type="AntDesign"
            size={18}
            color={AppColors.WHITE}
          />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 80,
          paddingBottom: 110,
        }}
      >
        {/* Trending Tracks */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trending</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Playlist')}>
            <Text style={styles.seeAll}>Library →</Text>
          </TouchableOpacity>
        </View>
        {trendingTracks.length > 0 ? (
          <FlatList
            data={trendingTracks}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={i => String(i.id || i.video_id)}
            renderItem={renderDownloadedCard}
            contentContainerStyle={styles.featuredList}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Loading trends…</Text>
          </View>
        )}

        {/* Playlists */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Playlists</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Playlist')}>
            <Text style={styles.seeAll}>See all →</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.trendingContainer}>
          {playlists.length > 0 ? (
            playlists
              .slice(0, 5)
              .map((item, index) => renderPlaylistRow({ item, index }))
          ) : (
            <Text style={[styles.emptyText, { padding: 20 }]}>
              Create playlists in your Library to see them here.
            </Text>
          )}
        </View>

        {/* Genres */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Browse Genres</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.genreList}
        >
          {GENRES.map(g => (
            <TouchableOpacity key={g.label} activeOpacity={0.75} style={styles.genreChip}>
              <Text style={styles.genreLabel}>{g.label}</Text>
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

  // Animated header background
  headerBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: AppColors.DeepPurple,
    zIndex: 9,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.GlassBorder,
  },
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
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.GlassBorder,
  },
  greeting: {
    fontSize: 11,
    color: AppColors.DimGray,
    fontFamily: AppFonts.MulishLight,
    letterSpacing: 0.3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: AppColors.WHITE,
    fontFamily: AppFonts.MulishBold,
    letterSpacing: -0.3,
  },
  searchIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: AppColors.GlassWhite,
    borderWidth: 1,
    borderColor: AppColors.GlassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: AppColors.WHITE,
    fontFamily: AppFonts.MulishBold,
    letterSpacing: -0.2,
  },
  seeAll: {
    fontSize: 12,
    color: AppColors.SubtleGray,
    fontFamily: AppFonts.MulishSemiBold,
    letterSpacing: 0.2,
  },

  // Featured cards (horizontal scroll)
  featuredList: { paddingHorizontal: 16, gap: 10 },
  featuredCard: {
    width: CARD_W,
    height: CARD_W * 1.1,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: AppColors.RichPurple,
    borderWidth: 1,
    borderColor: AppColors.GlassBorder,
  },
  featuredCardFallback: {
    backgroundColor: AppColors.RichPurple,
  },
  featuredGradient: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  featuredInfo: {
    marginTop: 'auto',
  },
  featuredTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.WHITE,
    fontFamily: AppFonts.MulishBold,
  },
  featuredArtist: {
    fontSize: 11,
    color: AppColors.SubtleGray,
    fontFamily: AppFonts.MulishRegular,
    marginTop: 2,
  },
  playChipAbs: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: AppColors.WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Playlists
  trendingContainer: {
    marginHorizontal: 16,
    backgroundColor: AppColors.RichPurple,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.GlassBorder,
    overflow: 'hidden',
  },
  trendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.GlassBorder,
  },
  trendingRank: {
    width: 26,
    fontSize: 11,
    color: AppColors.DimGray,
    fontFamily: AppFonts.MulishBold,
    fontWeight: '700',
  },
  trendingEmojiBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: AppColors.GlassWhite,
    borderWidth: 1,
    borderColor: AppColors.GlassBorder,
  },
  trendingMeta: { flex: 1 },
  trendingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.WHITE,
    fontFamily: AppFonts.MulishSemiBold,
  },
  trendingArtist: {
    fontSize: 11,
    color: AppColors.DimGray,
    fontFamily: AppFonts.MulishRegular,
    marginTop: 2,
  },

  // Genres
  genreList: { paddingHorizontal: 16, gap: 8 },
  genreChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    backgroundColor: AppColors.RichPurple,
    borderWidth: 1,
    borderColor: AppColors.GlassBorder,
  },
  genreLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.SubtleGray,
    fontFamily: AppFonts.MulishSemiBold,
  },

  // Empty state
  emptyContainer: {
    marginHorizontal: 20,
    padding: 20,
    backgroundColor: AppColors.RichPurple,
    borderRadius: 14,
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
