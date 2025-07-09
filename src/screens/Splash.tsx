import { Image, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import AppStyles from '@constants/AppStyles';
import images from '@assets/images';

const Splash = () => {
  return (
    <View style={AppStyles.FlexCenter}>
      <Image style={StyleSheet.absoluteFillObject} source={images.splash} />
    </View>
  );
};

export default Splash;

const styles = StyleSheet.create({});
