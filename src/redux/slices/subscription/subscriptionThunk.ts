import { getSubscriptionDetails } from '@api/apiCalls/subscriptionApi';
import { createAsyncThunk } from '@reduxjs/toolkit';

export const getSubscriptionDetailsThunk = createAsyncThunk<
  string,
  void,
  { rejectValue: string }
>('subscription/details', async (credentials, { rejectWithValue }) => {
  try {
    const response = await getSubscriptionDetails();
    return response;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'scream failed');
  }
});
