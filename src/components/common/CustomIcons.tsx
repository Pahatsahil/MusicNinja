import {ColorValue, TextStyle, Pressable, StyleProp} from 'react-native';
import React, {useMemo} from 'react';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Octicons from 'react-native-vector-icons/Octicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '@utills/ThemeContext';

export interface iconsType {
  type:
    | 'FontAwesome'
    | 'FontAwesome5'
    | 'Entypo'
    | 'Feather'
    | 'MaterialCommunityIcons'
    | 'MaterialIcons'
    | 'AntDesign'
    | 'SimpleLineIcons'
    | 'Ionicons'
    | 'Octicons';
  name: string;
  size?: number;
  color?: ColorValue;
  onPress?: () => void;
  customStyle?: StyleProp<TextStyle>;
}
const CustomIcons = ({
  type,
  name,
  size = 20,
  color,
  onPress,
  customStyle,
}: iconsType) => {
  const {theme} = useTheme();
  const IconComponent =
    type === 'FontAwesome'
      ? FontAwesome
      : type === 'FontAwesome5'
      ? FontAwesome5
      : type === 'MaterialCommunityIcons'
      ? MaterialCommunityIcons
      : type === 'Octicons'
      ? Octicons
      : type === 'AntDesign'
      ? AntDesign
      : type === 'SimpleLineIcons'
      ? SimpleLineIcons
      : type === 'Ionicons'
      ? Ionicons
      : type === 'Feather'
      ? Feather
      : type === 'MaterialIcons'
      ? MaterialIcons
      : Entypo;

  const IconElement = useMemo(
    () => (
      <IconComponent
        name={name}
        size={size}
        color={color ? color : theme.TEXT}
        style={customStyle}
      />
    ),
    [name, size, color, theme, customStyle],
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} android_ripple={null}>
        {IconElement}
      </Pressable>
    );
  }

  return IconElement;
};

export default CustomIcons;
