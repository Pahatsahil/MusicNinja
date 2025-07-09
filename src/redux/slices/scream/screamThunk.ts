import { getScenario, postScream } from '@api/apiCalls/screamApi';
import { createAsyncThunk } from '@reduxjs/toolkit';

export const sendScreamThunk = createAsyncThunk<
  any,
  any,
  { rejectValue: string }
>('scream/generate', async (credentials, { rejectWithValue }) => {
  try {
    const response = await postScream(credentials);
    return response;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'scream failed');
  }
});

// export const getMoodsThunk = createAsyncThunk(
//   'scream/moods',
//   async (_, {rejectWithValue}) => {
//     try {
//       const response = await getMoods();
//       return response;
//     } catch (error: any) {
//       return rejectWithValue(error.response?.data?.message || 'moods failed');
//     }
//   },
// );
export const getScenarioThunk = createAsyncThunk<
  any,
  any,
  { rejectValue: string }
>('scream/scenario', async (credentials, { rejectWithValue }) => {
  console.log('scenarion api [payload', credentials)
  try {
    const response = await getScenario(credentials);
    return response;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'moods failed');
  }
});
