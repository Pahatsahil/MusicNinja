import {getNotificationsList, getPostsDetails} from '@api/apiCalls/postsApi';
import {createAsyncThunk} from '@reduxjs/toolkit';
import {iPostsPayload, ireadUnreadPayload} from './postsTypes';
import requestApi from '@api/requestApi';

export const getPostsThunk = createAsyncThunk<
  any,
  iPostsPayload,
  {rejectValue: string}
>('posts/list', async (payload, {rejectWithValue}) => {
  try {
    const response = await getPostsDetails(payload);
    return {
      newData: response?.data,
      offset: payload?.offset,
      hasMore: response?.hasMore,
    };
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'get Posts failed');
  }
});

export const getNotificationListThunk = createAsyncThunk<
  any,
  iPostsPayload,
  {rejectValue: string}
>('notification/list', async (payload, {rejectWithValue}) => {
  try {
    const response = await getNotificationsList(payload);
    return response;
    // return {
    //   newData: response?.data,
    //   offset: payload?.offset,
    //   hasMore: response?.hasMore
    // };
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || 'get notifi list failed',
    );
  }
});

export const readUnreadApi = async (payload: ireadUnreadPayload) => {
  // console.log(' payload readunread', payload);
  try {
    const data = await requestApi.postApi('notification/read', payload);
    // console.log('first data followUser', data);
    if (data?.status == 200) {
      return data;
    }
  } catch (error: any) {
    console.log('first followUser followUser', error);
    if (error.response) {
      return error ?? {message: 'An error occurred'};
    } else {
      return {message: error || 'An unexpected error occurred'};
    }
  }
};
