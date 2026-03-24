import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CustomBottomTabs from './CustomBottomTabs';
import screenNames from './screenNames';
import { Home, Search } from '@screens/index';
import PlaylistScreen from '@screens/Playlist';
import MiniPlayer from '@components/MiniPlayer';
import { useAppSelector } from '@redux/store/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BottomTab = createBottomTabNavigator();

function BottomTabNavigators() {
  const insets = useSafeAreaInsets();
  const currentTrack = useAppSelector(s => s.player.currentTrack);

  return (
    <View style={styles.root}>
      <BottomTab.Navigator
        initialRouteName={screenNames.Search}
        screenOptions={{ headerShown: false }}
        tabBar={props => (
          <View>
            <MiniPlayer />
            <CustomBottomTabs {...props} hasMiniPlayer={!!currentTrack} />
          </View>
        )}>
        <BottomTab.Screen name={screenNames.Home} component={Home} />
        <BottomTab.Screen name={screenNames.Search} component={Search} />
        <BottomTab.Screen name={screenNames.Playlist} component={PlaylistScreen} />
      </BottomTab.Navigator>
    </View>
  );
}

export default BottomTabNavigators;

const styles = StyleSheet.create({
  root: { flex: 1 },
});
