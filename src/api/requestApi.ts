import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import axiosInstance from './apiService';

interface iPrevApiDetails {
  url: string;
  payload: Record<string, any>;
  config?: AxiosRequestConfig;
}

const handleError = (error: AxiosError) => {
  if (error.response) {
    // ✅ Ensure `data` is an object before accessing properties
    const errorMessage =
      typeof error.response.data === 'object' && error.response.data !== null
        ? (error.response.data as { message?: string }).message ||
        'An error occurred.'
        : 'An error occurred.';

    requestAnimationFrame(() => {
      // Alert.alert('Error', errorMessage);
    });
  } else {
    console.error('Unexpected Error:', error.message);

    requestAnimationFrame(() => {
      //   Alert.alert('Oops!', 'Something went wrong. Please try again.');
    });
  }
};

const requestApi = {
  getApi: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await axiosInstance.get<T>(url, config);
      return response.data;
    } catch (error: any) {
      console.log("GET ERROR",error)
      if (error.response?.status === 401) {
        await requestApi.refreshTokenApi();
        console.log('AET API ER', error.response?.status === 401);
        const retryResponse = await axiosInstance.get<T>(url, config);
        return retryResponse.data;
      }
      handleError(error);
      throw error.response?.data || 'An error occurred';
    }
  },
  putApi: async <T>(
    url: string,
    payload: Record<string, any>,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> => {
    try {
      const response = await axiosInstance.put<T>(url, payload, config);
      // console.log('======PUT response=======', response);
      return response;
    } catch (error: any) {
      if (error.response?.status === 401) {
        await requestApi.refreshTokenApi();
        const retryResponse = await axiosInstance.put<T>(url, payload, config);
        return retryResponse;
      }
      console.log('PUT catch error', error);
      handleError(error);
      throw error.response?.data || 'An error occurred';
    }
  },
  postApi: async <T>(
    url: string,
    payload: Record<string, any>,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> => {
    try {
      const response = await axiosInstance.post<T>(url, payload, config);
      console.log('======response=======', response)
      return response;
    } catch (error: any) {
      console.log("pOST ERROR",error)
      if (error.response?.status === 401) {
        await requestApi.refreshTokenApi();
        const retryResponse = await axiosInstance.post<T>(url, payload, config);
        return retryResponse;
      }
      console.log('catchcatch', error);
      handleError(error);
      throw error.response?.data || 'An error occurred';
    }
  },
  deleteApi: async <T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> => {
    try {
      const response = await axiosInstance.delete<T>(url, config);
      return response;
    } catch (error: any) {
      if (error.response?.status === 401) {
        await requestApi.refreshTokenApi();
        const retryResponse = await axiosInstance.delete<T>(url, config);
        return retryResponse;
      }
      console.log('DELETE catch error', error);
      handleError(error);
      throw error.response?.data || 'An error occurred';
    }
  },
  refreshTokenApi: async <T>(): Promise<void> => {
    try {
      // const refreshToken = await getKeychain('refreshToken');
      // console.log(refreshToken, 'resToken');
      // const response = await axiosInstance.post<{accessToken: string}>(
      //   'user/rotate-token',
      //   {refreshToken},
      // );
      // console.log('res.daa', response.data);
      // const newAccessToken = response.data.accessToken;
      // if (newAccessToken) {
      //   await setAsyncStorage('accessToken', newAccessToken);

      //   // Update Axios default header
      //   axiosInstance.defaults.headers.common['Authorization'] = newAccessToken;
      // }
    } catch (error: any) {
      handleError(error);
      throw error.response?.data || 'An error occurred';
    }
  },
};

export default requestApi;
