import { StatusBar, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@utills/ThemeContext';

const SafeContainer = ({ children, containerStyle }: any) => {
  const { themeName, theme } = useTheme();
  const { bottom, top } = useSafeAreaInsets();
  return (
    <View
      style={[{ flex: 1, top, bottom, paddingHorizontal: 8 }, containerStyle]}
    >
      <StatusBar
        barStyle={themeName == 'DARK' ? 'light-content' : 'dark-content'}
        translucent
      />
      {children}
    </View>
  );
};

export default SafeContainer;

const styles = StyleSheet.create({});
