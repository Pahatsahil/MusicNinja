import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect } from 'react';
import images from '@assets/images';
import AppStyles from '@constants/AppStyles';
import SafeContainer from '@components/common/SafeContainer';
import { CustomText } from '@components/common/CustomText';
import { CustomIcons } from '@components/common';
import axios from 'axios';
import MoreHeader from '@components/Containers/MoreHeader';

const index = () => {
  useEffect(() => {
    getList();
  }, []);
  const getList = async () => {
    try {
      // const resp = await axios.post('https://vikingfile.com/api/list-files', {
      //   user: 'eO5U3hp4X9',
      //   page: 1,
      // });
      const resp = await axios('https://vikingfile.com/api/get-server');
      console.log(resp);
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <SafeContainer>
      <View style={[AppStyles.rowBetween]}>
        <TouchableOpacity activeOpacity={1} style={AppStyles.rowCenter}>
          <Image
            source={images.splash}
            style={[AppStyles.i45, { borderRadius: 30, marginRight: 6 }]}
            resizeMode="cover"
          />
          <CustomText style={{ fontSize: 16, lineHeight: 20 }}>
            musicNinja
          </CustomText>
        </TouchableOpacity>
        <CustomIcons name="search1" type="AntDesign" />
      </View>
      <MoreHeader heading="NewRelease" onMore={() => {}} />
    </SafeContainer>
  );
};

export default index;

const styles = StyleSheet.create({});
