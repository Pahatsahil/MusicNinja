import {
  Modal,
  StyleProp,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import React from 'react';
import {useTheme} from '@utills/ThemeContext';
import AppStyles from '@constants/AppStyles';
import {GradientText} from './CustomText';
import CustomIcons from './CustomIcons';

const CustomModal = ({
  isVisible,
  closeModal,
  style,
  headerText = '',
  children,
}: {
  isVisible: boolean;
  closeModal: () => void;
  headerText?: string;
  style?: {
    mainContainer?: StyleProp<ViewStyle>;
    fadeContainer?: StyleProp<ViewStyle>;
    headerContainer?: StyleProp<ViewStyle>;
  };
  children?: any;
}) => {
  const {theme} = useTheme();

  return (
    <Modal
      transparent
      statusBarTranslucent
      visible={isVisible}
      animationType="slide"
      supportedOrientations={['landscape', 'portrait']}
      onRequestClose={closeModal}>
      {/* <TouchableWithoutFeedback onPress={closeModal} style={{}}> */}
      <TouchableWithoutFeedback onPress={closeModal}>
         <View
            style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
          />
        </TouchableWithoutFeedback>

        <View
          style={[
            {
              flex: 1,
              justifyContent: 'flex-end',
              backgroundColor: '#00000040',
            },
            style?.fadeContainer,
          ]}>
          <View
            style={[
              styles.modalContainer,
              {backgroundColor: theme?.BACKGROUND},
              style?.mainContainer,
            ]}>
            <View
              style={[
                AppStyles.rowBetween,
                {paddingHorizontal: 15, marginTop: 5, marginBottom: 10},
                style?.headerContainer,
              ]}>
              <GradientText text={headerText} textStyle={{fontSize: 18}} />
              <CustomIcons
                type={'Entypo'}
                name={'cross'}
                color={theme?.BORDER}
                size={30}
                onPress={closeModal}
                // customStyle={{position:'absolute',}}
              />
            </View>
            {children}
          </View>
        </View>
      {/* </TouchableWithoutFeedback> */}
    </Modal>
  );
};

export default CustomModal;

const styles = StyleSheet.create({
  modalContainer: {
    width: '100%',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingBottom: 5,
  },
});
