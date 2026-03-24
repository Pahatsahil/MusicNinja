import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import React from 'react';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import AppColors from '@constants/AppColors';
import AppFonts from '@constants/AppFonts';
import { CustomIcons } from '@components/common';
import { iconsType } from '@components/common/CustomIcons';
import { useTheme } from '@utills/ThemeContext';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

const TABS: Record<number, { icon: iconsType; label: string }> = {
  0: {
    icon: { name: 'home', type: 'Ionicons', size: 22 },
    label: 'Home',
  },
  1: {
    icon: { name: 'search-outline', type: 'Ionicons', size: 22 },
    label: 'Search',
  },
  2: {
    icon: { name: 'library-outline', type: 'Ionicons', size: 22 },
    label: 'Library',
  },
};

const CustomBottomTabs: React.FC<BottomTabBarProps> = ({ navigation, state }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom + 8,
          backgroundColor: AppColors.DeepPurple,
        },
      ]}>
      {state.routeNames.map((item: string, index: number) => {
        const isFocused = state.index === index;
        const tab = TABS[index];

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
            onPress={handlePress}
            activeOpacity={0.75}>
            {isFocused ? (
              <LinearGradient
                colors={[AppColors.NeonPurple, AppColors.VibrantPink]}
                style={styles.activeIconWrap}>
                <CustomIcons
                  {...tab.icon}
                  color={AppColors.WHITE}
                />
              </LinearGradient>
            ) : (
              <View style={styles.iconWrap}>
                <CustomIcons
                  {...tab.icon}
                  color={AppColors.SubtleGray}
                />
              </View>
            )}
            <Text style={[styles.label, isFocused && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default React.memo(CustomBottomTabs);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingTop: 10,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: AppColors.GlassBorder,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  iconWrap: {
    width: 46,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconWrap: {
    width: 46,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.NeonPurple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
  },
  label: {
    fontSize: 10,
    color: AppColors.SubtleGray,
    fontFamily: AppFonts.MulishRegular,
    marginTop: 4,
  },
  labelActive: {
    color: AppColors.WHITE,
    fontFamily: AppFonts.MulishBold,
    fontWeight: '700',
  },
});
