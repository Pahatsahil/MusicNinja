import {
  ActivityIndicator,
  ColorValue,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewStyle,
} from 'react-native';
import React from 'react';
import {wp} from '../../utills/Common';
import AppColors from '../../constants/AppColors';
import AppStyles from '../../constants/AppStyles';
import LinearGradient from 'react-native-linear-gradient';
import {CustomText} from './CustomText';
import {useTheme} from '@utills/ThemeContext';

interface ButtonProps extends TouchableOpacityProps {
  buttonColors?: {
    activeBG: ColorValue;
    inActiveBG: ColorValue;
    activeText: ColorValue;
    inActiveText: ColorValue;
  };
  buttonStyle?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  value: string;
  loader?: boolean;
  border?: boolean;
  colors?: Array<any>;
  gradientStyle?: StyleProp<ViewStyle>;
}

const defaultColors = {
  activeBG: AppColors.THEME,
  inActiveBG: AppColors.BorderColor,
  activeText: AppColors.WHITE,
  inActiveText: AppColors.Black,
};

// Whenever pass Paddings, maargins then use both gradientStyle & buttonStyle. Otherwise, buttonStyle is sufficient

const CustomButton = ({
  value = '',
  buttonColors = defaultColors,
  buttonStyle,
  textStyle,
  disabled = false,
  loader = false,
  border = false,
  colors = [AppColors?.THEME_PURPLE, AppColors?.THEME_PINK],
  gradientStyle,
  ...rest
}: ButtonProps) => {
  const {theme} = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      style={[
        // AppStyles.NormalCenter,
        {
          borderRadius: 5,
          // width: wp(40),
          // padding: 10,
          // margin: 5,
          // backgroundColor: disabled
          //   ? buttonColors?.inActiveBG
          //   : buttonColors?.activeBG,
        },
        styles.navBtn,
        {opacity: 1},
        border && styles.borderStyle,
        buttonStyle,
      ]}
      {...rest}>
      <LinearGradient
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        colors={border ? ['transparent', 'transparent'] : colors}
        style={[{borderRadius: 5}, StyleSheet.absoluteFill, gradientStyle]}
      />
      {loader ? (
        <ActivityIndicator
          size={'small'}
          color={
            disabled ? buttonColors?.inActiveText : buttonColors?.activeText
          }
          animating={loader}
        />
      ) : (
        <CustomText
          style={[
            AppStyles.subHeadingText,
            {
              // color: disabled
              //   ? theme?.TEXT_LIGHT
              //   : theme?.TEXT,
              color: border ? theme?.TEXT : disabled ? '#ffffff80' : '#ffffff',
            },
            textStyle,
          ]}>
          {value}
        </CustomText>
      )}
    </TouchableOpacity>
  );
};

export default CustomButton;

const styles = StyleSheet.create({
  navBtn: {
    backgroundColor: AppColors?.THEME_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 5,
  },
  borderStyle: {
    borderWidth: 1,
    borderRadius: 5,
    borderColor: 'rgba(000,000,000,.1)',
    backgroundColor: 'transparent',
  },
});
