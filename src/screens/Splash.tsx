import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AppColors from '@constants/AppColors';
import AppFonts from '@constants/AppFonts';
import { CustomIcons } from '@components/common';

const { width, height } = Dimensions.get('window');

const Splash = ({ navigation }: any) => {
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, {
          toValue: 1.3,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(glowScale, {
          toValue: 0.9,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    const timer = setTimeout(() => {
      navigation.replace('BottomTabNavigators');
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={[AppColors.DeepBlack, AppColors.DeepPurple, AppColors.RichPurple]}
      locations={[0, 0.5, 1]}
      style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background glow orb */}
      <Animated.View
        style={[styles.glowOrb, { transform: [{ scale: glowScale }] }]}
      />

      {/* Logo area */}
      <Animated.View
        style={[
          styles.logoWrap,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}>
        {/* Icon circle */}
        <LinearGradient
          colors={[AppColors.NeonPurple, AppColors.VibrantPink]}
          style={styles.iconCircle}>
          <CustomIcons
            name="musical-notes"
            type="Ionicons"
            size={52}
            color={AppColors.WHITE}
          />
        </LinearGradient>

        <Text style={styles.appName}>MusicNinja</Text>
        <View style={styles.taglineRow}>
          <View style={styles.taglineLine} />
          <Text style={styles.tagline}>Your Music. Your Vibe.</Text>
          <View style={styles.taglineLine} />
        </View>
      </Animated.View>

      {/* Subtitle */}
      <Animated.View style={[styles.bottomWrap, { opacity: subtitleOpacity }]}>
        <Text style={styles.poweredBy}>Powered by yt-dlp</Text>
        <View style={styles.dotsRow}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[styles.dot, i === 1 && styles.dotActive]} />
          ))}
        </View>
      </Animated.View>
    </LinearGradient>
  );
};

export default Splash;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOrb: {
    position: 'absolute',
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: width * 0.425,
    backgroundColor: AppColors.SoftGlow,
    alignSelf: 'center',
    top: height * 0.15,
  },
  logoWrap: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: AppColors.NeonPurple,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 20,
  },
  appName: {
    fontSize: 42,
    color: AppColors.WHITE,
    fontFamily: AppFonts.IrishRegular,
    letterSpacing: 1,
    marginBottom: 16,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  taglineLine: {
    flex: 1,
    height: 1,
    backgroundColor: AppColors.GlassBorder,
    maxWidth: 50,
  },
  tagline: {
    fontSize: 14,
    color: AppColors.SubtleGray,
    fontFamily: AppFonts.MulishLight,
    letterSpacing: 1.5,
  },
  bottomWrap: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  poweredBy: {
    fontSize: 12,
    color: AppColors.DimGray,
    fontFamily: AppFonts.MulishLight,
    marginBottom: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AppColors.GlassBorder,
  },
  dotActive: {
    width: 20,
    backgroundColor: AppColors.NeonPurple,
  },
});
