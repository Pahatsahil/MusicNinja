import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ToastState } from './toastTypes';

const initialState: ToastState = {
  queue: [],
};

const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    showToast: (
      state,
      action: PayloadAction<{ message: string; type: 'success' | 'error' }>,
    ) => {
      // state.queue.push({id: Date.now(), ...action.payload});
      const exists = state.queue.find(
        toast => toast.message === action.payload.message,
      );
      if (!exists) {
        state.queue.push({ id: Date.now(), ...action.payload });
      }
    },
    hideToast: (state, action: PayloadAction<number>) => {
      state.queue = state.queue.filter(toast => toast.id !== action.payload);
    },
  },
});

export const { showToast, hideToast } = toastSlice.actions;
export default toastSlice.reducer;
