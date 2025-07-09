import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
  galleryDetailsThunk,
  getProfileThunk,
  profileTabThunk,
} from './galleryThunk';
import {iCategory, iGalleryDetails} from './galleryTypes';
import {searchedProfileTabThunk} from '../search/searchThunk';

interface initalGalleryState {
  isLoading: boolean;
  galleryDetails: iGalleryDetails;
  profileTabData: iGalleryDetails;
  error?: any;
  profileDetails?: any;
  galleryTab?: number;
  profileTab?: number;
  otherProfileTab?: number;
}
const initialState: initalGalleryState = {
  isLoading: false,
  galleryDetails: {
    offset: 0,
    limit: 6,
    total: 0,
    hasMore: false,
    data: [],
  },
  profileTabData: {
    offset: 0,
    limit: 6,
    total: 0,
    hasMore: false,
    data: [],
  },
  
  profileDetails: null,
  error: undefined,
  galleryTab: 0,
  profileTab: 0,
  otherProfileTab: 0,
};

const gallerySlice = createSlice({
  name: 'gallery',
  initialState,
  reducers: {
    clearGallery: state => {
      console.log('enter in gallery clear function', state);
      state.isLoading = false;
      state.galleryDetails = {
        offset: 0,
        limit: 6,
        total: 0,
        hasMore: false,
        data: [],
      };
      state.profileTabData = {
        offset: 0,
        limit: 6,
        total: 0,
        hasMore: false,
        data: [],
      };
     
      state.profileDetails = null;
      state.error = undefined;
      state.galleryTab = 0;
      state.profileTab = 0;
      state.otherProfileTab = 0;
    },
    resetGalleryData: state => {
      state.galleryDetails = initialState.galleryDetails;
    },
    resetProfileTabData: state => {
      state.profileTabData = initialState.profileTabData;
    },
  
    setGalleryTab: (state, action) => {
      state.galleryTab = action?.payload;
    },
    setProfileTab: (state, action) => {
      state.profileTab = action?.payload;
    },
    // setOtherProfileTab: (state, action) => {
    //   state.otherProfileTab = action?.payload;
    // },
  },
  extraReducers: builder => {
    builder
      // GET Gallery Details Cases
      .addCase(galleryDetailsThunk?.pending, state => {
        state.isLoading = true;
        state.error = undefined;
      })

      .addCase(galleryDetailsThunk.fulfilled, (state, action) => {
        // Fix 3: Update properties individually, don't reassign the whole object
        state.galleryDetails.offset = action.payload.offset;
        state.galleryDetails.limit = action.payload.limit;
        state.galleryDetails.total = action.payload.total;
        state.galleryDetails.hasMore = action.payload.hasMore;

        // Fix 4: Push new data directly to the existing array
        state.galleryDetails.data.push(...action.payload.data);
        state.isLoading = false;
      })
      .addCase(galleryDetailsThunk?.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Gallery data failed';
      })

      .addCase(profileTabThunk?.pending, state => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(profileTabThunk.fulfilled, (state, action) => {
        console.log('this si action', action);
        state.profileTabData.offset = action.payload.offset;
        state.profileTabData.limit = action.payload.limit;
        state.profileTabData.total = action.payload.total;
        state.profileTabData.hasMore = action.payload.hasMore;

        state.profileTabData.data.push(...action.payload.data);

        console.log('Updated data length:', state.profileTabData.data.length);
        state.isLoading = false;
      })
      .addCase(profileTabThunk?.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Gallery data failed';
      })

      .addCase(getProfileThunk?.pending, state => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(
        getProfileThunk?.fulfilled,
        (state, action: PayloadAction<any>) => {
          console.log('enter in set gallery profile', state, action?.payload);
          state.isLoading = false;
          state.profileDetails = action.payload;
        },
      )
      .addCase(getProfileThunk?.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Profile failed';
      });
  },
});

export const {
  clearGallery,
  resetGalleryData,
  resetProfileTabData,
  setGalleryTab,
  setProfileTab,
} = gallerySlice.actions;
export default gallerySlice.reducer;
