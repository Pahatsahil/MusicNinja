import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
  creatorProfileThunk,
  searchedProfileTabThunk,
  searchThunk,
} from './searchThunk';
import {iGalleryDetails,iGalleryData} from '../gallery/galleryTypes';

interface initalSearchState {
  isLoading: boolean;
  error?: any;
  searchData?: any;
  searchList?: any;
  searchOfset?: number;
  searchedUserData?: any;
  searchedGalleryData: iGalleryDetails;
}

const initialState: initalSearchState = {
  searchData: {}, // only 1 page data with offset search
  searchList: [], // completer list with page merge search
  searchOfset: 10, // offset value for search api

  searchedUserData: [], // searched user all data with gallery data
  searchedGalleryData: {
    offset: 0,
    limit: 6,
    total: 0,
    hasMore: false,
    data: [],
  },
  isLoading: false,
  error: undefined,
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    resetsearchedUserData: state => {
      state.searchedUserData = initialState.searchedUserData;
    },
    resetSearchList: state => {
      state.searchList = initialState?.searchList;
      state.searchOfset = initialState?.searchOfset;
    },
    resetSearchedTabData: state => {
      state.searchedGalleryData = initialState.searchedGalleryData;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(searchThunk?.pending, state => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(searchThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.searchList = [...state.searchList, ...action.payload?.data];
        state.searchData = action.payload;
        if (action?.payload?.hasMore) {
          state.searchOfset = state.searchList?.length;
        }
      })
      .addCase(searchThunk?.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'search failed';
      })
      //search user gallery data
      .addCase(searchedProfileTabThunk?.pending, state => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(searchedProfileTabThunk.fulfilled, (state, action) => {
        
        state.searchedGalleryData.offset = action.payload.offset;
        state.searchedGalleryData.limit = action.payload.limit;
        state.searchedGalleryData.total = action.payload.total;
        state.searchedGalleryData.hasMore = action.payload.hasMore;

        state.searchedGalleryData.data.push(...action.payload.data);

        console.log(
          'Updated data length:',
          state.searchedGalleryData.data.length,
        );
        state.isLoading = false;
      })
      .addCase(searchedProfileTabThunk?.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Gallery data failed';
      })

      // profile data of searched user
      .addCase(creatorProfileThunk?.pending, state => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(creatorProfileThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.searchedUserData = action.payload;
      })
      .addCase(creatorProfileThunk?.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'search failed';
      });
  },
});

export const {resetsearchedUserData, resetSearchList,resetSearchedTabData} = searchSlice.actions;
export default searchSlice.reducer;
