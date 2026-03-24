import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IDownloadedTrack } from '@utills/database/schema';

interface PlayerState {
  currentTrack: IDownloadedTrack | null;
  queue: IDownloadedTrack[];
  queueIndex: number;
  isPlaying: boolean;
  isPaused: boolean;
  repeatMode: 0 | 1 | 2; // 0=none, 1=repeat-one, 2=repeat-all
  shuffle: boolean;
}

const initialState: PlayerState = {
  currentTrack: null,
  queue: [],
  queueIndex: 0,
  isPlaying: false,
  isPaused: false,
  repeatMode: 0,
  shuffle: false,
};

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setCurrentTrack: (state, action: PayloadAction<IDownloadedTrack | null>) => {
      state.currentTrack = action.payload;
    },
    setQueue: (state, action: PayloadAction<{ queue: IDownloadedTrack[]; startIndex?: number }>) => {
      state.queue = action.payload.queue;
      state.queueIndex = action.payload.startIndex ?? 0;
      state.currentTrack = action.payload.queue[action.payload.startIndex ?? 0] ?? null;
    },
    addToQueue: (state, action: PayloadAction<IDownloadedTrack>) => {
      state.queue.push(action.payload);
      // If nothing is playing, start with this track
      if (!state.currentTrack) {
        state.currentTrack = action.payload;
        state.queueIndex = state.queue.length - 1;
      }
    },
    nextTrack: (state) => {
      if (state.queue.length === 0) return;
      if (state.repeatMode === 1) {
        // repeat-one: stay on same index, just signal replay (consumer re-triggers play)
        return;
      }
      let nextIndex = state.queueIndex + 1;
      if (nextIndex >= state.queue.length) {
        if (state.repeatMode === 2) {
          nextIndex = 0; // loop
        } else {
          // queue ended
          state.isPlaying = false;
          state.isPaused = false;
          return;
        }
      }
      state.queueIndex = nextIndex;
      state.currentTrack = state.queue[nextIndex];
    },
    prevTrack: (state) => {
      if (state.queue.length === 0) return;
      let prevIndex = state.queueIndex - 1;
      if (prevIndex < 0) {
        prevIndex = state.repeatMode === 2 ? state.queue.length - 1 : 0;
      }
      state.queueIndex = prevIndex;
      state.currentTrack = state.queue[prevIndex];
    },
    setIsPlaying: (state, action: PayloadAction<boolean>) => {
      state.isPlaying = action.payload;
      if (action.payload) state.isPaused = false;
    },
    setIsPaused: (state, action: PayloadAction<boolean>) => {
      state.isPaused = action.payload;
    },
    setRepeatMode: (state, action: PayloadAction<0 | 1 | 2>) => {
      state.repeatMode = action.payload;
    },
    toggleShuffle: (state) => {
      state.shuffle = !state.shuffle;
    },
    clearQueue: (state) => {
      state.queue = [];
      state.queueIndex = 0;
      state.currentTrack = null;
      state.isPlaying = false;
      state.isPaused = false;
    },
  },
});

export const {
  setCurrentTrack,
  setQueue,
  addToQueue,
  nextTrack,
  prevTrack,
  setIsPlaying,
  setIsPaused,
  setRepeatMode,
  toggleShuffle,
  clearQueue,
} = playerSlice.actions;

export const playerReducer = playerSlice.reducer;
export default playerSlice;
