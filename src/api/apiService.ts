import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';
// import {BASE_URL} from '@env';
import { getAsyncStorage } from '@utills/AsyncStorage';


const LOCAL_IP = 'http://192.168.29.27:6000'; // your Flask server IP

const axiosInstance: AxiosInstance = axios.create({
  // baseURL: 'https://itmcloud.org/silent-screamer/api/',
  baseURL: LOCAL_IP,
  timeout: 10000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});
// Request Interceptor
https: axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error: AxiosError) => {
    return error;
  },
);

export default axiosInstance;
