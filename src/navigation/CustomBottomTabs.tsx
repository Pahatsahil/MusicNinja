import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import React from 'react';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import AppColors from '@constants/AppColors';
import AppFonts from '@constants/AppFonts';
import { CustomIcons } from '@components/common';
import { iconsType } from '@components/common/CustomIcons';
import { useTheme } from '@utills/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

const CustomBottomTabs: React.FC<
  BottomTabBarProps & { hasMiniPlayer?: boolean }
> = ({ navigation, state, hasMiniPlayer }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom + 8,
        },
      ]}
    >
      {/* Top divider line */}
      <View style={styles.topDivider} />

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
            activeOpacity={0.75}
          >
            <View style={[styles.iconWrap, isFocused && styles.activeIconWrap]}>
              <CustomIcons
                {...tab.icon}
                color={isFocused ? AppColors.WHITE : AppColors.DimGray}
              />
            </View>
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
    backgroundColor: AppColors.DeepPurple,
    position: 'relative',
  },
  topDivider: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: AppColors.GlassBorder,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  iconWrap: {
    width: 46,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconWrap: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: AppColors.GlassBorder,
  },
  label: {
    fontSize: 10,
    color: AppColors.DimGray,
    fontFamily: AppFonts.MulishRegular,
    marginTop: 4,
  },
  labelActive: {
    color: AppColors.WHITE,
    fontFamily: AppFonts.MulishSemiBold,
    fontWeight: '600',
  },
});
