// AnimatedSwitch.tsx
import AppColors from '@constants/AppColors';
import React from 'react';
import {Pressable, View, StyleSheet, StyleProp, ViewStyle} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

interface AnimatedSwitchProps {
  isOn: boolean;
  onToggle: () => void;
  style?: {
    mainContainer?: StyleProp<ViewStyle>;
    thumb?: StyleProp<ViewStyle>;
    backgroundView?: StyleProp<ViewStyle>;
  };
}

export default function AnimatedSwitch({
  isOn,
  onToggle,
  style,
}: AnimatedSwitchProps) {
  const translateX = useSharedValue(isOn ? 20 : 0);

  React.useEffect(() => {
    translateX.value = withTiming(isOn ? 20 : 0, {duration: 200});
  }, [isOn]);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value}],
  }));

  return (
    <Pressable onPress={onToggle} style={[style?.mainContainer]}>
      <View
        style={[
          styles.track,
          isOn ? styles.trackOn : styles.trackOff,
          style?.backgroundView,
        ]}>
        <Animated.View style={[styles.thumb, circleStyle, style?.thumb]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 42,
    height: 22,
    borderRadius: 15,
    padding: 3,
    justifyContent: 'center',
  },
  trackOn: {
    backgroundColor: AppColors?.THEME_PURPLE,
  },
  trackOff: {
    backgroundColor: '#ccc',
  },
  thumb: {
    width: 16,
    height: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
});
