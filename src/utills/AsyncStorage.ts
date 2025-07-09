import AsyncStorage from '@react-native-async-storage/async-storage';

export const setAsyncStorage = async (key: string, value: any) => {
  try {
    await AsyncStorage.setItem(key, value);
    console.log('Token saved securely');
  } catch (error) {
    console.error('Error saving token', error);
  }
};

export const getAsyncStorage = async (key: string) => {
  try {
    const credentials = await AsyncStorage.getItem(key);
    if (credentials) {
      //   console.log('Token retrieved:', credentials.password);
      return credentials;
    }
    return null;
  } catch (error) {
    console.error('Error retrieving token', error);
    return null;
  }
};

export const deleteAsyncStorage = async () => {
  try {
    await AsyncStorage.clear();
    console.log('Token deleted');
  } catch (error) {
    console.error('Error deleting token', error);
  }
};
