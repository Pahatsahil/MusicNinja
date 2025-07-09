import AppColors from '@constants/AppColors';
import AppStyles from '@constants/AppStyles';
import React, { useEffect } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnUI,
  measure,
} from 'react-native-reanimated';
import CustomIcons from './CustomIcons';
import { useTheme } from '@utills/ThemeContext';
import { CustomText } from './CustomText';

interface iAccordianProps {
  containerStyle?: ViewStyle;
  header: string;
  children?: React.ReactNode;
  childrenContainerStyle?: StyleProp<ViewStyle>;
  toggleComponent?: React.ReactNode;
  customHeader?: React.ReactNode;
  activeIndex: number | null;
  setActiveIndex: (index: number | null) => void;
  index: number;
  disabled?: boolean;
  showTextArrow?: boolean;
  onTextArrowPress?: () => void;
}

const CustomAccordian: React.FC<iAccordianProps> = ({
  index,
  children,
  customHeader,
  activeIndex,
  header,
  containerStyle,
  childrenContainerStyle,
  setActiveIndex,
  disabled,
  showTextArrow,
  onTextArrowPress,
  toggleComponent,
}) => {
  const { theme } = useTheme();
  const isActive = index === activeIndex;
  const contentRef = useAnimatedRef<View>();
  const heightValue = useSharedValue(0);
  const rotateIcon = useSharedValue('180deg');

  const toggleAccordion = () => {
    setActiveIndex(isActive ? null : index);
  };

  const updateHeight = () => {
    'worklet';
    const measuredHeight = measure(contentRef)?.height || 0;
    heightValue.value = withTiming(measuredHeight, {
      duration: 300,
      easing: Easing.out(Easing.ease),
    });
  };

  useEffect(() => {
    if (isActive) {
      runOnUI(() => {
        updateHeight();
        rotateIcon.value = withTiming('0deg', {
          duration: 600,
          easing: Easing.out(Easing.ease),
        });
      })();
    } else {
      heightValue.value = withTiming(0, {
        duration: 300,
        easing: Easing.in(Easing.ease),
      });
      rotateIcon.value = withTiming('180deg', {
        duration: 300,
        easing: Easing.in(Easing.ease),
      });
    }
  }, [isActive]);

  // ✅ Listen for layout changes when open
  const onLayout = () => {
    if (isActive) {
      runOnUI(() => updateHeight())();
    }
  };

  const animatedHeight = useAnimatedStyle(() => ({
    height: heightValue.value,
  }));

  const imgRotate = useAnimatedStyle(() => ({
    transform: [{ rotate: rotateIcon.value }],
  }));

  return (
    <View
      style={[
        styles.container,
        containerStyle,
        { backgroundColor: theme.BACKGROUND, borderColor: theme.BORDER },
      ]}
    >
      <Pressable
        disabled={disabled}
        style={[styles.header, AppStyles.rowBetween]}
        onPress={toggleAccordion}
      >
        {customHeader ? (
          customHeader
        ) : (
          <CustomText
            style={[
              AppStyles.subHeadingText,
              { color: disabled ? '#999' : AppColors.Black },
            ]}
          >
            {header}
            {'  '}
            {showTextArrow && (
              <TouchableOpacity onPress={onTextArrowPress}>
                {/* <Image
                source={images.arrowUp}
                style={styles.image2}
                resizeMode="contain"
              /> */}
              </TouchableOpacity>
            )}
          </CustomText>
        )}
        {toggleComponent ? (
          toggleComponent
        ) : (
          <CustomIcons
            type={'SimpleLineIcons'}
            name={'arrow-right'}
            color={theme.PRIMARY_COLOR}
            size={10}
            customStyle={{
              transform: [{ rotate: isActive ? '270deg' : '90deg' }],
            }}
          />
        )}
        {/* <Animated.Image
          source={images.arrowTop}
          tintColor={disabled ? '#555555' : undefined}
          style={[styles.image, imgRotate]}
          resizeMode="contain"
        /> */}
      </Pressable>
      <Animated.View
        style={[
          styles.content,
          animatedHeight,
          childrenContainerStyle,
          {
            overflow: 'hidden',
            backgroundColor: theme.BACKGROUND,
            marginBottom: 5,
          },
        ]}
      >
        <View
          ref={contentRef}
          style={{ position: 'absolute', opacity: 0 }}
          onLayout={onLayout}
        >
          {children}
        </View>
        {isActive && children}
      </Animated.View>
    </View>
  );
};

export default CustomAccordian;

const styles = StyleSheet.create({
  container: {
    marginVertical: 5,
    padding: 5,
    // backgroundColor: AppColors.bgTheme,
    // borderColor: AppColors.borderWhite,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    width: '100%',
  },
  header: {
    padding: 5,
  },
  image: {
    width: 12,
    height: 12,
  },
  image2: {
    width: 10,
    height: 10,
  },
  content: {
    paddingHorizontal: 15,
    // backgroundColor: AppColors.bgTheme,
  },
});
