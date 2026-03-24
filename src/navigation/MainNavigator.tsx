import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { enableScreens } from 'react-native-screens';
import { RootStackParamList } from './TypeParamList';
import screenNames from './screenNames';
import BottomTabNavigators from './BottomNavigation';
import Splash from '@screens/Splash';
import Player from '@screens/Player';
import PlaylistDetail from '@screens/PlaylistDetail';

enableScreens();

const Stack = createNativeStackNavigator<RootStackParamList>();

const MainNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName={screenNames.Splash}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name={screenNames.Splash} component={Splash} />
      <Stack.Screen
        name={screenNames.BottomTabNavigators}
        component={BottomTabNavigators}
      />
      <Stack.Screen
        name={screenNames.Player}
        component={Player}
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name={screenNames.PlaylistDetail}
        component={PlaylistDetail}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;
