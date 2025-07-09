import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {getSubscriptionDetailsThunk} from './subscriptionThunk';
import {subcriptionItem} from './subscriptionTypes';

interface initalGalleryState {
  isLoading: boolean;
  subscriptionDetails: Array<subcriptionItem>;
  error?: any;
  currentPlan: any;
}
const initialState: initalGalleryState = {
  isLoading: false,
  subscriptionDetails: [],
  error: undefined,

  currentPlan: {
    name: 'Tes Plan',
    desc: 'Plan for testing',
    monthly_price: 15,
    monthly_per_day_scream: 2,
    yearly_price: 150,
    yearly_per_day_scream: 3,
    plan_status: 'active',
    features: [
      'AI scream analysis + emotional tone detection',
      '20 screams per day',
      'Unlimited API usage (fair use policy)',
      'Upload up to 15 files/day',
      'Real-time audio processing',
      'Save scream history (90 days)',
      'HD audio exports (MP3, WAV, FLAC)',
      'Custom watermark removal',
      '1-on-1 support',
    ],
    plan_type: 'monthly',
    limit:3,
  },
};

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      // GET Gallery Details Cases
      .addCase(getSubscriptionDetailsThunk?.pending, state => {
        state.isLoading = true;
        state.error = undefined;
      })

      .addCase(
        getSubscriptionDetailsThunk.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.subscriptionDetails = action.payload;
          state.isLoading = false;
        },
      )
      .addCase(getSubscriptionDetailsThunk?.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'get profile failed';
      });
  },
});

export const {} = subscriptionSlice.actions;
export default subscriptionSlice.reducer;
