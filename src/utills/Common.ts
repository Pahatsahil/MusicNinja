import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import { Dimensions, Platform } from 'react-native';
import { getAsyncStorage } from './AsyncStorage';

const { width: deviceWidth, height: deviceHeight } = Dimensions.get('window');

export { deviceHeight, deviceWidth };

export const PLATFORM_IOS = Platform.OS == 'ios';

export const hp = (percentage: any) => {
  return (percentage * deviceHeight) / 100;
};

export const wp = (percentage: any) => {
  return (percentage * deviceWidth) / 100;
};

export const createRandomChars = (length: any) => {
  let text = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
};

export const encodePassword = (password: string) => {
  const passwordString = createRandomChars(10) + password;
  return btoa(passwordString);
};

export const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    return token ? token : null;
  } catch (error) {
    console.error('Error retrieving token:', error);
  }
};


export const formatShortTime = (timestamp: string) => {
  const now = moment();
  const then = moment(timestamp);
  const duration = moment.duration(now.diff(then));

  if (duration.asSeconds() < 60) {
    return `${Math.floor(duration.asSeconds())}s`;
  } else if (duration.asMinutes() < 60) {
    return `${Math.floor(duration.asMinutes())}m`;
  } else if (duration.asHours() < 24) {
    return `${Math.floor(duration.asHours())}h`;
  } else if (duration.asDays() < 30) {
    return `${Math.floor(duration.asDays())}d`;
  } else if (duration.asMonths() < 12) {
    return `${Math.floor(duration.asMonths())}mo`;
  } else {
    return `${Math.floor(duration.asYears())}y`;
  }
};

export const formatLikesCount = (count: number) => {
  if (count == undefined) return ''
  if (count < 1000) return count.toString();
  if (count < 1_000_000) return Math.floor(count / 1000) + 'k';
  if (count < 1_000_000_000) return Math.floor(count / 1_000_000) + 'M';
  return Math.floor(count / 1_000_000_000) + 'B';
};

export const getUserId = async (): Promise<string> => {
  try {
    const user_parse = await getAsyncStorage('user_Details');
    if (user_parse != null || user_parse != undefined) {
      const user_data = JSON.parse(user_parse);
      return user_data?.user_id
    }
    else {
      return ''
    }
  } catch (error) {
    return ''
  }
}