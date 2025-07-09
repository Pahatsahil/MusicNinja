import React, { useEffect } from 'react';
import { View, Text, Image, Button } from 'react-native';
import RNFS from 'react-native-fs';
import { getAudio } from '../api/api';
import useMusicPlayer from '@hooks/music/useMusicPlayer';

const Player = ({ route }: any) => {
  const { song } = route.params;
  const { playSound, stopSound } = useMusicPlayer();

  //   useEffect(() => {
  //     (async () => {
  //       await TrackPlayer.setupPlayer();
  //       const path = await getAudio(song.video_id);
  //       await TrackPlayer.add({
  //         id: song.video_id,
  //         url: `file://${path}`,
  //         title: song.title,
  //         artist: song.channelTitle,
  //         artwork: song.thumbnail,
  //       });
  //       await TrackPlayer.play();
  //     })();

  //     return () => {
  //       TrackPlayer.stop();
  //     };
  //   }, []);

  return (
    <View style={{ alignItems: 'center', marginTop: 20 }}>
      <Image
        source={{ uri: song.thumbnail }}
        style={{ width: 200, height: 200 }}
      />
      <Text style={{ fontSize: 18, marginVertical: 10 }}>{song.title}</Text>
      <Text>{song.channelTitle}</Text>
    </View>
  );
};
export default Player;
