import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CustomBottomTabs from './CustomBottomTabs';
import screenNames from './screenNames';
import { Home, Player, Search } from '@screens/index';

const BottomTab = createBottomTabNavigator();

function BottomTabNavigators() {
  return (
    <BottomTab.Navigator
      initialRouteName={screenNames.Home}
      screenOptions={{ headerShown: false }}
      tabBar={props => <CustomBottomTabs {...props} />}
    >
      <BottomTab.Screen name={screenNames.Home} component={Home} />
      <BottomTab.Screen name={screenNames.Search} component={Search} />
      <BottomTab.Screen name={screenNames.Player} component={Player} />
    </BottomTab.Navigator>
  );
}

export default BottomTabNavigators;
