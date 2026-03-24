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

const { width } = Dimensions.get('window');
const CARD_W = width * 0.44;

const FEATURED = [
  {
    id: '1',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    gradient: ['#1a1a2e', '#16213e', '#0f3460'],
    emoji: '🌆',
  },
  {
    id: '2',
    title: 'Levitating',
    artist: 'Dua Lipa',
    gradient: ['#2d1b69', '#11998e', '#38ef7d'],
    emoji: '🪐',
  },
  {
    id: '3',
    title: 'Stay',
    artist: 'The Kid LAROI',
    gradient: ['#fc466b', '#3f5efb'],
    emoji: '🔥',
  },
  {
    id: '4',
    title: 'Heat Waves',
    artist: 'Glass Animals',
    gradient: ['#1a1a2e', '#e96c4c'],
    emoji: '🌊',
  },
];

const TRENDING = [
  { id: 'a', title: 'Starboy', artist: 'The Weeknd', plays: '1.2B', emoji: '⭐' },
  { id: 'b', title: 'Peaches', artist: 'Justin Bieber', plays: '980M', emoji: '🍑' },
  { id: 'c', title: 'Good 4 U', artist: 'Olivia Rodrigo', plays: '870M', emoji: '💜' },
  { id: 'd', title: 'Montero', artist: 'Lil Nas X', plays: '760M', emoji: '🎸' },
];

const HomeScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [greeting, setGreeting] = useState('Good Morning');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
    getLatestMusicList()
  }, []);
const getLatestMusicList = async () => {
  try {
 const data = await getLatestMusic()
  console.log("DATA",data)   
  } catch (error) {
    console.log(error)
  }
}
  const headerBg = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: ['transparent', AppColors.DeepPurple],
    extrapolate: 'clamp',
  });

  const renderFeaturedCard = useCallback(
    ({ item }: any) => (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.featuredCard}
        onPress={() =>
          navigation.navigate('Player', {
            song: {
              title: item.title,
              channelTitle: item.artist,
              thumbnail: null,
              video_id: item.id,
            },
          })
        }>
        <LinearGradient colors={item.gradient} style={styles.featuredGradient}>
          <Text style={styles.featuredEmoji}>{item.emoji}</Text>
          <View style={styles.featuredInfo}>
            <Text style={styles.featuredTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.featuredArtist} numberOfLines={1}>
              {item.artist}
            </Text>
          </View>
          <View style={styles.playChip}>
            <CustomIcons name="play" type="FontAwesome5" size={10} color={AppColors.WHITE} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    ),
    [],
  );

  const renderTrendingItem = useCallback(
    ({ item, index }: any) => (
      <TouchableOpacity
        style={styles.trendingRow}
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate('Player', {
            song: {
              title: item.title,
              channelTitle: item.artist,
              thumbnail: null,
              video_id: item.id,
            },
          })
        }>
        <Text style={styles.trendingRank}>#{index + 1}</Text>
        <View style={styles.trendingEmojiBg}>
          <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
        </View>
        <View style={styles.trendingMeta}>
          <Text style={styles.trendingTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.trendingArtist}>{item.artist}</Text>
        </View>
        <Text style={styles.trendingPlays}>{item.plays}</Text>
        <CustomIcons name="play-circle" type="Ionicons" size={28} color={AppColors.NeonPurple} />
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
        <View>
          <Text style={styles.greeting}>{greeting} 👋</Text>
          <Text style={styles.headerTitle}>
            Music<Text style={{ color: AppColors.NeonPurple }}>Ninja</Text>
          </Text>
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

        {/* Featured */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={FEATURED}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={i => i.id}
          renderItem={renderFeaturedCard}
          contentContainerStyle={styles.featuredList}
        />

        {/* Trending */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trending 🔥</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.trendingContainer}>
          {TRENDING.map((item, index) => renderTrendingItem({ item, index }))}
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
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  greeting: {
    fontSize: 12,
    color: AppColors.DimGray,
    fontFamily: AppFonts.MulishLight,
  },
  headerTitle: {
    fontSize: 26,
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
    height: CARD_W * 1.2,
    borderRadius: 20,
    overflow: 'hidden',
  },
  featuredGradient: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  featuredEmoji: { fontSize: 36 },
  featuredInfo: {},
  featuredTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.WHITE,
    fontFamily: AppFonts.MulishBold,
  },
  featuredArtist: {
    fontSize: 12,
    color: AppColors.SubtleGray,
    fontFamily: AppFonts.MulishRegular,
    marginTop: 2,
  },
  playChip: {
    alignSelf: 'flex-end',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 28,
    fontSize: 12,
    color: AppColors.NeonPurple,
    fontFamily: AppFonts.MulishBold,
    fontWeight: '700',
  },
  trendingEmojiBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: AppColors.GlassWhite,
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
  trendingPlays: {
    fontSize: 11,
    color: AppColors.SubtleGray,
    fontFamily: AppFonts.MulishLight,
    marginRight: 10,
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
});
