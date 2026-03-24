import {ColorValue, StyleSheet, Text, TextProps, View} from 'react-native';
import React from 'react';
import {StyleProp} from 'react-native';
import {TextStyle} from 'react-native';
import {useTheme} from '@utills/ThemeContext';

// import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';
import AppColors from '@constants/AppColors';

interface textProps {
  children?: React.ReactNode | undefined;
  style?: StyleProp<TextStyle>;
  color?: ColorValue;
  textProps?: TextProps;
}
export const CustomText = ({
  children,
  style,
  color,
  textProps,
  ...rest
}: textProps) => {
  const {theme} = useTheme();
  return (
    <Text
      style={[{color: color ? color : theme?.TEXT}, style]}
      {...textProps}
      {...rest}>
      {children}
    </Text>
  );
};

export const GradientText = ({
  text,
  textStyle,
  onPress,
  color,
}: {
  text: string;
  textStyle?: StyleProp<TextStyle>;
  onPress?: any;
  color?: Array<any>;
}) => {
  return (
    // <MaskedView
    //   maskElement={<Text style={[styles.maskedText, textStyle]}>{text}</Text>}>
      <LinearGradient
        colors={
          color ? color : [AppColors?.THEME_PURPLE, AppColors?.THEME_PINK]
        }
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}>
        <Text
          disabled={!onPress}
          onPress={onPress}
          style={[styles.maskedText, {opacity: 0}, textStyle]}>
          {text}
        </Text>
      </LinearGradient>
    // </MaskedView>
  );
};

const styles = StyleSheet.create({
  maskedText: {
    fontSize: 32,
    // fontWeight: 'bold',
    // textAlign: 'center',
  },
});
