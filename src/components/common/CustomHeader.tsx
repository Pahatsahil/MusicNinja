import {
  Image,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import React, { ReactNode } from 'react';
import { useTheme } from '@utills/ThemeContext';
import AppStyles from '@constants/AppStyles';
import images from '@assets/images';
import { goBack } from '@utills/navigationService';
import CustomBack from './CustomBack';
import CustomIcons from './CustomIcons';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

interface iCustomHeader {
  // Left Side
  appIcon?: boolean;
  backSystem?: boolean;
  backText?: string;
  leftComponent?: ReactNode;
  customBackPress?: () => void;

  // Center Side
  centerComponent?: ReactNode;

  // Right Side
  notification?: 'hasNotifications' | 'noNotifications' | 'hide';
  notificationPress?: () => void;
  rightComponent?: ReactNode;

  // Styles
  safeAreaStyle?: ViewStyle;
  rowContainerStyle?: ViewStyle;
}

const CustomHeader: React.FC<iCustomHeader> = ({
  centerComponent,
  leftComponent,
  rightComponent,
  safeAreaStyle,
  appIcon,
  backSystem,
  backText,
  notification = 'hide',
  notificationPress,
  customBackPress,
  rowContainerStyle,
}) => {
  const { theme, themeName } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.container,
        safeAreaStyle,
        {
          backgroundColor: theme.BACKGROUND,
          paddingTop: insets?.top,
        },
      ]}
    >
      <StatusBar
        backgroundColor={theme.BACKGROUND}
        barStyle={themeName == 'DARK' ? 'light-content' : 'dark-content'}
      />
      <View style={[styles.inner, AppStyles.rowBetween, rowContainerStyle]}>
        {leftComponent ? ( // Left Side
          leftComponent
        ) : appIcon ? (
          <TouchableOpacity
            disabled={true}
            // onPress={() => {
            //   resetAndNavigate('WalkThrough');
            // }}
            style={[AppStyles.rowCenter]}
          >
            {/* <Image
              source={images.walk1}
              style={AppStyles.i35}
              tintColor={'#833AB4'}
            /> */}
          </TouchableOpacity>
        ) : backSystem || backText ? (
          <CustomBack
            hideIcon={!backSystem && backText != ''}
            onPress={
              customBackPress ? customBackPress : backSystem ? goBack : () => {}
            }
            title={backText ?? ''}
          />
        ) : null}

        {centerComponent ? centerComponent : null}

        {rightComponent ? ( // Left Side
          rightComponent
        ) : notification != 'hide' ? (
          <CustomIcons
            name={notification == 'hasNotifications' ? 'bell-badge' : 'bell'}
            type="MaterialCommunityIcons"
            onPress={notificationPress}
            customStyle={{ padding: 8 }}
          />
        ) : null}
      </View>
    </View>
  );
};

export default CustomHeader;

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    // shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0.5,
    },

    shadowOpacity: 0.25,
    shadowRadius: 0.84,

    elevation: 5,
  },
  inner: {
    // width: wp(100),
    // alignSelf: 'center',
    padding: 10,
    // paddingTop: Platform?.OS == 'ios' ? 20 : 10,
  },
});
