import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  creatorProfile,
  followUser,
  searchProfile,
} from '@api/apiCalls/searchApi';
import {
  creatorProfilePayload,
  followPayload,
  searchPayload,
} from './searchTypes';
import { iGalleryPayload } from '../gallery/galleryTypes';
import { getGalleryDetails } from '@api/apiCalls/galleryApi';

export const searchThunk = createAsyncThunk<
  any,
  searchPayload,
  { rejectValue: string }
>('search/profile', async (credentials, { rejectWithValue }) => {
  try {
    const response = await searchProfile(credentials);
    if (response?.data) {
      return response?.data;
    }
    return rejectWithValue('search failed');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'search failed');
  }
});

export const creatorProfileThunk = createAsyncThunk<
  any,
  creatorProfilePayload,
  { rejectValue: string }
>('search/profile/data', async (credentials, { rejectWithValue }) => {
  try {
    const response = await creatorProfile(credentials);
    return response?.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'search failed');
  }
});

export const searchedProfileTabThunk = createAsyncThunk<
  any,
  iGalleryPayload,
  { rejectValue: string }
>('scream/searched/gallery', async (credentials, { rejectWithValue }) => {
  try {
    const response = await getGalleryDetails(credentials);
    return response
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'scream failed');
  }
});

// export const followUserThunk = createAsyncThunk<
//   any,
//   followPayload,
//   {rejectValue: string}
// >('follow/profile', async (credentials, {rejectWithValue}) => {
//   try {
//     const response = await followUser(credentials);
//     return response?.data;
//     // return {
//     //   // newData: response?.data,
//     //   // offset: credentials?.offset,
//     //   // hasMore: response?.hasMore,
//     // };
//   } catch (error: any) {
//     return rejectWithValue(error.response?.data?.message || 'search failed');
//   }
// });
