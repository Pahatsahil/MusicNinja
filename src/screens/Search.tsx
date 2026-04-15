import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Animated,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import AppColors from '@constants/AppColors';
import AppFonts from '@constants/AppFonts';
import { CustomIcons } from '@components/common';
import { losslessApi } from '@api/LosslessAPI';
import SongItem from '@components/SongItem';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const RECENT_SEARCHES_KEY = '@recent_searches';

const Search = ({ navigation }: any) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
  const barAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setFocused(true);
    Animated.timing(barAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };
  const handleBlur = () => {
    Animated.timing(barAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start(() => setFocused(false));
  };

  React.useEffect(() => {
    const loadRecentSearches = async () => {
      try {
        const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
        if (stored) {
          setRecentSearches(JSON.parse(stored));
        }
      } catch (err) {
        console.error('Failed to load recent searches', err);
      }
    };
    loadRecentSearches();
  }, []);

  const borderColor = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [AppColors.GlassBorder, AppColors.NeonPurple],
  });

  const handleSearch = useCallback(
    async (q?: string) => {
      const term = q ?? query;
      if (!term.trim()) return;

      // Save recent search
      setRecentSearches(prev => {
        const updated = [
          term.trim(),
          ...prev.filter(s => s.toLowerCase() !== term.trim().toLowerCase()),
        ].slice(0, 5);
        AsyncStorage.setItem(
          RECENT_SEARCHES_KEY,
          JSON.stringify(updated),
        ).catch(() => {});
        return updated;
      });

      Keyboard.dismiss();
      setLoading(true);
      try {
        const res = await losslessApi.searchTracks(term, { limit: 20 });
        setResults(res?.items || []);
      } catch (err) {
        console.log('Search error:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [query],
  );

  const handleClear = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  const isEmpty = !loading && results.length === 0 && query.length > 0;
  const isIdle = !loading && results.length === 0 && query.length === 0;

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <LinearGradient
        colors={[
          AppColors.DeepBlack,
          AppColors.DeepPurple,
          AppColors.DeepBlack,
        ]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={styles.headerTitle}>Search</Text>

        {/* Search Bar */}
        <Animated.View style={[styles.searchBar, { borderColor }]}>
          <CustomIcons
            name="search1"
            type="AntDesign"
            size={18}
            color={AppColors.SubtleGray}
          />
          <TextInput
            ref={inputRef}
            placeholder="Songs, artists, podcasts..."
            placeholderTextColor={AppColors.DimGray}
            value={query}
            onChangeText={setQuery}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
            style={styles.input}
            selectionColor={AppColors.NeonPurple}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={handleClear}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <CustomIcons
                name="closecircle"
                type="AntDesign"
                size={16}
                color={AppColors.DimGray}
              />
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={AppColors.NeonPurple} />
          <Text style={styles.loadingText}>Finding beats...</Text>
        </View>
      ) : isIdle ? (
        <View style={styles.idleContainer}>
          <Text style={styles.idleEmoji}>🎵</Text>
          <Text style={styles.idleTitle}>What do you want to listen to?</Text>
          <Text style={styles.recentLabel}>Recent Searches</Text>
          <View style={styles.recentContainer}>
            {recentSearches.map(s => (
              <TouchableOpacity
                key={s}
                style={styles.recentChip}
                onPress={() => {
                  setQuery(s);
                  handleSearch(s);
                }}
              >
                <CustomIcons
                  name="history"
                  type="MaterialIcons"
                  size={14}
                  color={AppColors.SubtleGray}
                />
                <Text style={styles.recentText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : isEmpty ? (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>😔</Text>
          <Text style={styles.emptyTitle}>No results for "{query}"</Text>
          <Text style={styles.emptySubtitle}>Try a different search term</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item: any) => String(item.id || item.video_id)}
          renderItem={({ item }) => (
            <SongItem
              item={item}
              onPress={() => navigation.navigate('Player', { song: item })}
            />
          )}
          contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default Search;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppColors.DeepBlack },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: AppColors.WHITE,
    fontFamily: AppFonts.MulishBold,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.GlassWhite,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: AppColors.WHITE,
    fontFamily: AppFonts.MulishRegular,
    padding: 0,
  },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: AppColors.SubtleGray,
    fontFamily: AppFonts.MulishLight,
    marginTop: 12,
  },

  idleContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 30 },
  idleEmoji: { fontSize: 52, alignSelf: 'center', marginBottom: 12 },
  idleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.WHITE,
    fontFamily: AppFonts.MulishBold,
    textAlign: 'center',
    marginBottom: 32,
  },
  recentLabel: {
    fontSize: 13,
    color: AppColors.DimGray,
    fontFamily: AppFonts.MulishSemiBold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 14,
  },
  recentContainer: { gap: 10 },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    backgroundColor: AppColors.GlassWhite,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.GlassBorder,
  },
  recentText: {
    fontSize: 14,
    color: AppColors.WHITE,
    fontFamily: AppFonts.MulishRegular,
  },

  emptyEmoji: { fontSize: 52 },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: AppColors.WHITE,
    fontFamily: AppFonts.MulishBold,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: AppColors.DimGray,
    fontFamily: AppFonts.MulishLight,
  },
});
