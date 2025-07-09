import {selectToasts} from '@redux/slices/toast/toastSelectors';
import {hideToast} from '@redux/slices/toast/toastSlice';
import {useAppDispatch, useAppSelector} from '@redux/store/hooks';
import {useTheme} from '@utills/ThemeContext';
import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  Animated,
  Easing,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import CustomIcons from './CustomIcons';

const Toast = () => {
  const toasts = useAppSelector(selectToasts);
  const dispatch = useAppDispatch();

  return (
    <View style={styles.container}>
      {toasts.map((toast: any, index: any) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          index={index}
          dispatch={dispatch}
        />
      ))}
    </View>
  );
};

const ToastItem = ({toast, index, dispatch}: any) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;
  const {theme} = useTheme();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => dispatch(hideToast(toast.id)), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          opacity: fadeAnim,
          transform: [{translateY}],
          backgroundColor: theme.BACKGROUND,
          shadowColor: theme.TEXT,
          // backgroundColor: toast.type === 'success' ? '#4CAF50' : '#D32F2F',
          bottom: index * 60 + 40,
        },
      ]}>
      <CustomIcons
        name={toast.type === 'success' ? 'check-circle' : 'error'}
        type="MaterialIcons"
        size={20}
        color={toast.type === 'success' ? '#4CAF50' : '#D32F2F'}
        customStyle={{marginRight: 10}}
      />
      <Text
        style={[styles.toastText, {color: theme.TEXT, flexShrink: 1}]}
        numberOfLines={2}>
        {toast.message}
      </Text>
      {/* <TouchableOpacity
        onPress={() => dispatch(hideToast(toast.id))}
        style={styles.closeButton}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity> */}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 10,
    left: '5%',
    width: '90%',
    alignItems: 'center',
  },
  toast: {
    position: 'absolute',
    // width: '90%',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 5,
    shadowOffset: {
      width: 0.5,
      height: 0.5,
    },
    shadowRadius: 1,
    shadowOpacity: 0.5,
  },
  toastText: {color: '#fff', fontSize: 14},
  closeButton: {marginLeft: 10},
  closeText: {color: '#fff', fontSize: 18},
});

export default Toast;
