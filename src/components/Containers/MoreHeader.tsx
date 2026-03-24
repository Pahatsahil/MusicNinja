import { Pressable, StyleSheet, Text, View } from 'react-native';
import React, { FC } from 'react';
import AppStyles from '@constants/AppStyles';
import { CustomText } from '@components/common/CustomText';

interface iMoreHeader {
  heading: string;
  moreText?: string;
  onMore: () => void;
}

const MoreHeader: FC<iMoreHeader> = ({ heading, moreText, onMore }) => {
  return (
    <View style={[AppStyles.rowBetween, { paddingVertical: 10 }]}>
      <CustomText style={{ fontSize: 20, lineHeight: 24 }}>
        {heading}
      </CustomText>
      <Pressable onPress={onMore}>
        <Text>{moreText ?? 'More'}</Text>
      </Pressable>
    </View>
  );
};

export default MoreHeader;

const styles = StyleSheet.create({});
