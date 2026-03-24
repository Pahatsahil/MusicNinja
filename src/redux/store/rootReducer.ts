import { combineReducers } from '@reduxjs/toolkit';
import { authReducer } from '../slices/auth';
import { toastReducer } from '@redux/slices/toast';
import { screamReducer } from '@redux/slices/scream';
import { settingsReducer } from '@redux/slices/settings';
import { galleryReducer } from '@redux/slices/gallery';
import { postsReducer } from '@redux/slices/posts';
import { searchReducer } from '@redux/slices/search';
import { subscriptionReducer } from '@redux/slices/subscription';
import { playerReducer } from '@redux/slices/player/playerSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  scream: screamReducer,
  toast: toastReducer,
  settings: settingsReducer,
  gallery: galleryReducer,
  posts: postsReducer,
  search: searchReducer,
  subscription: subscriptionReducer,
  player: playerReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
