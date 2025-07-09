import {View, Text, Pressable, TextStyle, StyleProp} from 'react-native';
import React from 'react';
import CustomIcons from './CustomIcons';
import AppFonts from '@constants/AppFonts';
import {useTheme} from '@utills/ThemeContext';
import {CustomText} from './CustomText';
import {StyleSheet} from 'react-native';

interface CustomBackProps {
  title: string;
  textStyle?: StyleProp<TextStyle>;
  iconColor?: string;
  onPress: () => void;
  disabled?: boolean;
  hideIcon?: boolean;
}

const CustomBack: React.FC<CustomBackProps> = ({
  onPress,
  title,
  textStyle,
  iconColor,
  disabled = false,
  hideIcon = false,
}) => {
  const {theme} = useTheme();
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={{flexDirection: 'row', alignItems: 'center'}}>
      {!hideIcon && (
        <CustomIcons
          type="Entypo"
          name={'chevron-left'}
          color={iconColor ? iconColor : theme?.TEXT}
          size={25}
        />
      )}
      <CustomText
        style={[
          {
            fontFamily: AppFonts.MontserratMedium,
            fontSize: 16,
            color: theme.TEXT,
          },
          textStyle,
        ]}>
        {title}
      </CustomText>
    </Pressable>
  );
};

export default CustomBack;
