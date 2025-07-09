import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {getNotificationListThunk, getPostsThunk} from './postsThunk';
import {iNotificationsDetails, iPostsData, iPostsDetails} from './postsTypes';

interface initalScreamState {
  isLoading: boolean;
  postsData: iPostsDetails;
  notificationsData: iNotificationsDetails;
  error?: any;
  openComments: boolean;
}
const initialState: initalScreamState = {
  postsData: {
    data: [],
    hasMore: false,
    limit: 3,
    offset: 0,
    total: 0,
  },
  notificationsData: {
    data: [],
    hasMore: false,
    limit: 15,
    offset: 0,
    total: 0,
    unRead: false,
  },
  isLoading: false,
  openComments: false,
  error: undefined,
};

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    clearScream: state => {
      state = initialState;
    },
    resetPostsData: state => {
      state.postsData = {
        ...initialState.postsData,
        data: state.postsData.data,
      };
    },
    resetNotificationsData: state => {
      state.notificationsData = {
        ...initialState.notificationsData,
        data: state.notificationsData.data,
      };
    },
    setOpenComments: (state, action: PayloadAction<boolean>) => {
      state.openComments = action.payload;
    },
    updatePostComments: (
      state,
      action: PayloadAction<{id: string; type: 'add' | 'delete'}>,
    ) => {
      const postID = action.payload.id;
      const postIndex = state.postsData.data.findIndex(
        item => item._id === postID,
      );

      if (postIndex !== -1) {
        const post = state.postsData.data[postIndex];
        const updatedPost = {
          ...post,
          comment_count:
            action.payload.type === 'add'
              ? post.comment_count + 1
              : Math.max(post.comment_count - 1, 0), // prevent negative
        };

        state.postsData.data[postIndex] = updatedPost;
      }
    },
  },
  extraReducers: builder => {
    builder
      // get posts Cases
      .addCase(getPostsThunk?.pending, state => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(
        getPostsThunk?.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.isLoading = false;

          if (action.payload.offset == 0) {
            state.postsData.data = action.payload.newData;
          } else {
            // Append new data instead of replacing
            state.postsData.data = [
              ...state.postsData.data,
              ...action.payload.newData,
            ];
          }

          // Update pagination metadata
          state.postsData.offset = action.payload.offset;
          state.postsData.hasMore = action.payload.hasMore;
          state.postsData.total = state.postsData.data.length;
          // state.postsData = action.payload;
        },
      )
      .addCase(getPostsThunk?.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Login failed';
      })

      //Get Notifications Cases
      .addCase(getNotificationListThunk?.pending, state => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(getNotificationListThunk?.fulfilled, (state, action) => {
        const data =
          action.payload.offset == 0 ? [] : state.notificationsData.data;
        // Fix 3: Update properties individually, don't reassign the whole object
        state.notificationsData.offset = action.payload.offset;
        state.notificationsData.limit = action.payload.limit;
        state.notificationsData.total = action.payload.total;
        state.notificationsData.hasMore = action.payload.hasMore;

        // Fix 4: Push new data directly to the existing array
        data.push(...action.payload.data);
        state.notificationsData.data = data;
        state.isLoading = false;

        const unreadstatus = data?.some(i => i?.is_read == false);
        state.notificationsData.unRead = unreadstatus;
      })
      .addCase(getNotificationListThunk?.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Login failed';
      });
  },
});

export const {
  clearScream,
  resetPostsData,
  resetNotificationsData,
  setOpenComments,
  updatePostComments,
} = postsSlice.actions;
export default postsSlice.reducer;
