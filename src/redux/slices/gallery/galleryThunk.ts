import { getGalleryDetails, getProfileDetails } from '@api/apiCalls/galleryApi';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { iGalleryPayload } from './galleryTypes';

export const galleryDetailsThunk = createAsyncThunk<
  any,
  iGalleryPayload,
  { rejectValue: string }
>('scream/gallery', async (credentials, { rejectWithValue }) => {
  try {
    const response = await getGalleryDetails(credentials);
    // return {
    //   ...response,
    //   newData: response?.data,
    //   offset: credentials?.offset,
    //   hasMore: response?.hasMore
    // };
    return response
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'scream failed');
  }
});
export const profileTabThunk = createAsyncThunk<
  any,
  iGalleryPayload,
  { rejectValue: string }
>('scream/profile/gallery', async (credentials, { rejectWithValue }) => {
  try {
    const response = await getGalleryDetails(credentials);
    return response
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'scream failed');
  }
});


export const getProfileThunk = createAsyncThunk<
  string,
  void,
  { rejectValue: string }
>('profile/details', async (credentials, { rejectWithValue }) => {
  try {
    const response = await getProfileDetails();
    return response;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'scream failed');
  }
});
