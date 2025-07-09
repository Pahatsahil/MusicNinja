import {Image, StyleSheet, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import AppStyles from '@constants/AppStyles';
import AppColors from '@constants/AppColors';
import {CustomIcons} from '@components/common';
import {iconsType} from '@components/common/CustomIcons';
import {useTheme} from '@utills/ThemeContext';
import Svg, {Circle} from 'react-native-svg';
import {useAppSelector} from '@redux/store/hooks';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const icon: Record<number, iconsType> = {
  0: {
    name: 'home',
    type: 'SimpleLineIcons',
    // type: 'Octicons',
    size: 22,
  },
  1: {
    name: 'search1',
    type: 'AntDesign',
    // type: 'Octicons',
    size: 22,
  },
  2: {
    name: 'mic-outline',
    type: 'Ionicons',
    size: 25,
    // name: 'microphone-outline',
    // type: 'MaterialCommunityIcons',
  },
  3: {
    name: 'picture',
    type: 'SimpleLineIcons',
    size: 22,
  },
  4: {
    name: 'user',
    type: 'AntDesign',
    size: 22,
  },
};

const CustomBottomTabs: React.FC<BottomTabBarProps> = ({navigation, state}) => {
  const {theme} = useTheme();
  const {profileImage} = useAppSelector(state => state.auth);
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        AppStyles.rowBetween,
        styles.container,
        {
          backgroundColor: theme.BACKGROUND,
          paddingBottom: insets?.bottom + 10,
        },
      ]}>
      {state.routeNames.map((item: string, index: number) => {
        const isFocused = state.index === index;

        const handlePress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: state.routes[index].key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(state.routeNames[index]);
          }
        };

        return (
          <TouchableOpacity
            key={index}
            style={styles.item}
            onPress={handlePress}>
            {/* If user add Image show that instead of Icon  */}
            {index == 4 && profileImage ? (
              <Image
                source={{uri: profileImage}}
                style={{
                  height: 25,
                  width: 25,
                  resizeMode: 'contain',
                  borderRadius: 13,
                }}
              />
            ) : (
              <CustomIcons {...icon[index]} />
            )}
            <Svg width={8} height={8} fill="none" style={{marginTop: 5}}>
              {isFocused && <Circle cx={4} cy={4} r={4} fill="#672DC2" />}
            </Svg>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default React.memo(CustomBottomTabs);

const styles = StyleSheet.create({
  container: {
    // backgroundColor: AppColors.BottomTab,
    paddingTop: 10,
    paddingHorizontal: 15,
    paddingBottom: 15,
    elevation: 10,
    shadowOffset: {
      width: 20,
      height: 20,
    },
    shadowRadius: 1,
  },
  item: {
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: 'red',
    width: '20%',
  },
  focus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
});
