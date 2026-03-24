import React, { useCallback, useEffect } from 'react';
import { View, Text, Image, Button, ActivityIndicator } from 'react-native';
import RNFS from 'react-native-fs';
import useMusicPlayer from '@hooks/music/useMusicPlayer';
import AppColors from '@constants/AppColors';
import { CustomIcons } from '@components/common';
import { downloadMusic } from '@api/music/musicApi';

const Player = ({ route }: any) => {
  const { song } = route.params;
  const { playSound2, stopSound, soundLoader, isPlaying } = useMusicPlayer();

  const handleIconPress = useCallback(async () => {
    if (isPlaying) {
      stopSound();
    } else {
      const path = await downloadMusic(song.video_id);
      playSound2('file://' + path);
    }
  }, [isPlaying, song]);

  return (
    <View style={{ alignItems: 'center', marginTop: 20 }}>
      <Image
        source={{ uri: song.thumbnail }}
        style={{ width: 200, height: 200 }}
      />
      <Text style={{ fontSize: 18, marginVertical: 10 }}>{song.title}</Text>
      <Text>{song.channelTitle}</Text>

      {soundLoader ? (
        <ActivityIndicator size={'small'} color={AppColors.WHITE} />
      ) : (
        <CustomIcons
          name={isPlaying ? 'pause' : 'play'}
          type={'FontAwesome5'}
          color={AppColors.WHITE}
          size={30}
          onPress={handleIconPress}
        />
      )}
    </View>
  );
};
export default Player;
