import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CustomBottomTabs from './CustomBottomTabs';
import screenNames from './screenNames';
import Search from '@screens/Search';
import Player from '@screens/Player';

const BottomTab = createBottomTabNavigator();

function BottomTabNavigators() {
  return (
    <BottomTab.Navigator
      initialRouteName={screenNames.Search}
      screenOptions={{ headerShown: false }}
      tabBar={props => <CustomBottomTabs {...props} />}
    >
      <BottomTab.Screen name={screenNames.Search} component={Search} />
      <BottomTab.Screen name={screenNames.Player} component={Player} />
    </BottomTab.Navigator>
  );
}

export default BottomTabNavigators;
