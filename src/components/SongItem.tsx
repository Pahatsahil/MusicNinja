import React, { FC } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AppColors from '@constants/AppColors';
import AppFonts from '@constants/AppFonts';
import { CustomIcons } from '@components/common';

interface iSongItem {
  item: any;
  onPress: (item: any) => void;
}

const SongItem: FC<iSongItem> = ({ item, onPress }) => {
  return (
    <TouchableOpacity onPress={() => onPress(item)} activeOpacity={0.8} style={styles.container}>
      {/* Thumbnail */}
      <View style={styles.thumbnailWrap}>
        {item.thumbnail ? (
          <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
        ) : (
          <LinearGradient
            colors={[AppColors.NeonPurple, AppColors.VibrantPink]}
            style={styles.thumbnail}>
            <Text style={{ fontSize: 20 }}>🎵</Text>
          </LinearGradient>
        )}
      </View>

      {/* Meta */}
      <View style={styles.meta}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title || 'Unknown Title'}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {item.channelTitle || 'Unknown Artist'}
        </Text>
      </View>

      {/* Menu */}
      <TouchableOpacity style={styles.menu} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <CustomIcons name="ellipsis-vertical" type="Ionicons" size={18} color={AppColors.SubtleGray} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default SongItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    backgroundColor: AppColors.GlassWhite,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.GlassBorder,
    gap: 14,
  },
  thumbnailWrap: {
    shadowColor: AppColors.NeonPurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { flex: 1 },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.WHITE,
    fontFamily: AppFonts.MulishSemiBold,
  },
  artist: {
    fontSize: 12,
    color: AppColors.DimGray,
    fontFamily: AppFonts.MulishRegular,
    marginTop: 3,
  },
  menu: { padding: 4 },
});
