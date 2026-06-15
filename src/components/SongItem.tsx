import React, { FC } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import AppColors from '@constants/AppColors';
import AppFonts from '@constants/AppFonts';
import { CustomIcons } from '@components/common';
import { losslessApi } from '@api/LosslessAPI';

interface iSongItem {
  item: any;
  onPress: (item: any) => void;
}

const SongItem: FC<iSongItem> = ({ item, onPress }) => {
  const title = item.title || 'Unknown Title';
  const artistName = item.channelTitle || item.artist?.name || 'Unknown Artist';
  const thumbnailUrl = item.thumbnail || (item.album?.cover ? losslessApi.getCoverUrl(item.album.cover) : null);

  return (
    <TouchableOpacity onPress={() => onPress(item)} activeOpacity={0.8} style={styles.container}>
      {/* Thumbnail */}
      <View style={styles.thumbnailWrap}>
        {thumbnailUrl ? (
          <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailFallback]}>
            <Text style={{ fontSize: 20 }}>🎵</Text>
          </View>
        )}
      </View>

      {/* Meta */}
      <View style={styles.meta}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {artistName}
        </Text>
      </View>

      {/* Menu */}
      <TouchableOpacity style={styles.menu} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <CustomIcons name="ellipsis-vertical" type="Ionicons" size={18} color={AppColors.DimGray} />
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
    marginVertical: 3,
    backgroundColor: AppColors.RichPurple,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.GlassBorder,
    gap: 14,
  },
  thumbnailWrap: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailFallback: {
    backgroundColor: AppColors.GlassWhite,
    borderWidth: 1,
    borderColor: AppColors.GlassBorder,
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
