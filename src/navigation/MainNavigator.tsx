import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';

import { enableScreens } from 'react-native-screens';
import { RootStackParamList } from './TypeParamList.ts';
// import {
// } from '@screens/index.tsx';
import screenNames from './screenNames.ts';
import BottomTabNavigators from './BottomNavigation.tsx';
import Splash from '@screens/Splash.tsx';

enableScreens();

const Stack = createNativeStackNavigator<RootStackParamList>();

const MainNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName={screenNames.BottomTabNavigators}
      screenOptions={{
        headerShown: false,
        //   gestureEnabled: true,
        //   animation: lastDirection,
      }}
    >
      <Stack.Screen name={screenNames.Splash} component={Splash} />
      <Stack.Screen
        name={screenNames.BottomTabNavigators}
        component={BottomTabNavigators}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;
