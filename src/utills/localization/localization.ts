import LocalizedStrings from 'react-native-localization';
import { ITranslations } from './localizationTypes';
import en from '../../languages/en';
import hi from '../../languages/hi';

export const getLocalization = (key: string): string => localization[key as keyof ITranslations]

const localization = new LocalizedStrings<ITranslations>({
  en,
  hi,
});

export default localization;
