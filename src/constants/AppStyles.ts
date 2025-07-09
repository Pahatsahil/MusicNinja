import {ImageStyle, TextStyle, ViewStyle} from 'react-native';
import AppColors from './AppColors';
import AppFonts from './AppFonts';

const AppStyles = {
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  rowCenter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,

  FlexCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  NormalCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,

  headingText: {
    color: AppColors.THEME,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: AppFonts.MulishBold,
  } as TextStyle,
  IrishFontStyle: {
    color: AppColors.TEXT_THEME,
    fontSize: 30,
    // fontWeight: '700',
    fontFamily: AppFonts.IrishRegular,
  } as TextStyle,
  normalText: {
    color: AppColors.THEME,
    fontSize: 12,
    fontWeight: '400',
    fontFamily: AppFonts.MulishRegular,
  } as TextStyle,
  subHeadingText: {
    color: AppColors.THEME,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: AppFonts.MulishSemiBold,
    lineHeight: 20,
  } as TextStyle,

  //DropdownStyles
  dropdown: {
    height: 40,
    borderColor: AppColors.borderTheme,
    backgroundColor: AppColors.light_theme,
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
    width: '80%',
    alignSelf: 'center',
    marginVertical: 10,
  } as ViewStyle,
  placeholderStyle: {
    fontSize: 16,
    fontFamily: AppFonts.MulishSemiBold,
    color: AppColors.THEME,
    opacity: 0.8,
  },
  selectedTextStyle: {
    fontSize: 16,
    fontFamily: AppFonts.MulishSemiBold,
    color: AppColors.THEME,
    opacity: 1,
  },
  dropdownItem: {
    fontSize: 16,
    fontFamily: AppFonts.MulishSemiBold,
    color: AppColors.THEME,
    opacity: 1,
  } as ViewStyle,
  seprator: {
    borderBottomWidth: 1,
    marginVertical: 5,
    borderColor: AppColors.borderWhite,
  } as ViewStyle,

  i10: {height: 100, width: 100, resizeMode: 'contain'} as ImageStyle,
  i9: {height: 90, width: 90, resizeMode: 'contain'} as ImageStyle,
  i95: {height: 95, width: 95, resizeMode: 'contain'} as ImageStyle,
  i8: {
    height: 80,
    width: 80,
    resizeMode: 'contain',
    borderRadius: 50,
  } as ImageStyle,
  i85: {
    height: 85,
    width: 85,
    resizeMode: 'contain',
    borderRadius: 50,
  } as ImageStyle,
  i7: {
    height: 70,
    width: 70,
    resizeMode: 'contain',
    borderRadius: 50,
  } as ImageStyle,
  i6: {
    height: 60,
    width: 60,
    resizeMode: 'contain',
    borderRadius: 50,
  } as ImageStyle,
  i5: {
    height: 50,
    width: 50,
    resizeMode: 'contain',
    borderRadius: 50,
  } as ImageStyle,
  i55: {height: 55, width: 55, resizeMode: 'contain'} as ImageStyle,
  i4: {height: 40, width: 40, resizeMode: 'contain'} as ImageStyle,
  i45: {height: 45, width: 45, resizeMode: 'contain'} as ImageStyle,
  i3: {height: 30, width: 30, resizeMode: 'contain'} as ImageStyle,
  i35: {height: 35, width: 35, resizeMode: 'contain'} as ImageStyle,
  i2: {height: 20, width: 20, resizeMode: 'contain'} as ImageStyle,
  i25: {height: 25, width: 25, resizeMode: 'contain'} as ImageStyle,
  i15: {height: 15, width: 15, resizeMode: 'contain'} as ImageStyle,

  ShadowStyle: {
    elevation: 20,
    shadowColor: AppColors.WHITE,
    shadowOffset: {
      width: 20,
      height: 20,
    },
    shadowRadius: 1,
    shadowOpacity: 0.1,
  } as ViewStyle,
};

export default AppStyles;
