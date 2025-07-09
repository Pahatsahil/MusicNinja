import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import {BASE_URL} from '@env';
import {getAsyncStorage} from '@utills/AsyncStorage';
const axiosInstance: AxiosInstance = axios.create({
  // baseURL: 'https://itmcloud.org/silent-screamer/api/',
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});
// Request Interceptor
https: axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token: any = await getAsyncStorage('accessToken');
    // const parseToken = JSON.parse(token);
    console.log('mytoken apiservice', config, token);
    if (token) {
      // config.headers.Authorization = `${sprseToken?.token}`;
      // config.headers.Cookie = `auth=${sprseToken?.token}`;
      config.headers.Authorization = `${token}`;
      config.headers.Cookie = `${token}`;
      config.headers['x-access-token'] = `${token}`;
      config.headers['authorization'] = `Bearer ${token}`;
      config.headers.auth = `auth=${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    // store.dispatch(hideLoading());
    return error;
  },
);
// let isFetchingUserDetails = false;
// // Response Interceptor
// axiosInstance.interceptors.response.use(
//   (response: AxiosResponse) => {
//     const url = response.config.url || '';
//     console.log(response.config.url, 'URLs');
//     if (!url.includes('/getUserDetails') && !isFetchingUserDetails) {
//       isFetchingUserDetails = true;
//       store.dispatch(fetchUserDetails()).finally(() => {
//         isFetchingUserDetails = false;
//       });
//     }
//     console.log('tytytytytyyt', response)
//     return response;
//   },
//   async (error: AxiosError) => {
//     if (error.response?.status === 401) {
//       const url = error.config?.url || '';
//       if (!url.includes('/getUserDetails') && !isFetchingUserDetails) {
//         isFetchingUserDetails = true;
//         store.dispatch(fetchUserDetails()).finally(() => {
//           isFetchingUserDetails = false;
//         });
//       }
//     }
//     return Promise.reject(error);
//   },
// );

export default axiosInstance;
