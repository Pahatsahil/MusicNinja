import React, { FC } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';

interface iSongItem {
  item: any;
  onPress: (item: any) => void;
}

const SongItem: FC<iSongItem> = ({ item, onPress }) => {
  return (
    <TouchableOpacity onPress={() => onPress(item)}>
      <View style={{ flexDirection: 'row', padding: 10 }}>
        <Image
          source={{ uri: item.thumbnail }}
          style={{ width: 50, height: 50 }}
        />
        <Text style={{ marginLeft: 10, flex: 1 }}>{item.title}</Text>
      </View>
    </TouchableOpacity>
  );
};
export default SongItem;
