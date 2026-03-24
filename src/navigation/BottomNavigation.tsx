import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CustomBottomTabs from './CustomBottomTabs';
import screenNames from './screenNames';
import { Home, Search } from '@screens/index';
import PlaylistScreen from '@screens/Playlist';

const BottomTab = createBottomTabNavigator();

function BottomTabNavigators() {
  return (
    <BottomTab.Navigator
      initialRouteName={screenNames.Search}
      screenOptions={{ headerShown: false }}
      tabBar={props => <CustomBottomTabs {...props} />}
    >
      {/* <BottomTab.Screen name={screenNames.Home} component={Home} /> */}
      <BottomTab.Screen name={screenNames.Search} component={Search} />
      <BottomTab.Screen name={screenNames.Playlist} component={PlaylistScreen} />
    </BottomTab.Navigator>
  );
}

export default BottomTabNavigators;
