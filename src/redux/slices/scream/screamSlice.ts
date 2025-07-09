import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getScenarioThunk, sendScreamThunk } from './screamThunk';
import { iMoodDetails, iScreamDetails } from './screamTypes';

interface initalScreamState {
  isLoading: boolean;
  sendScreamDetails: any;
  screamDetails: iScreamDetails;
  moodData: Array<iMoodDetails>;
  selectedMood: string;
  scenarioList: Array<any>;
  selectedScenario: string;
  error?: any;
}
const initialState: initalScreamState = {
  sendScreamDetails: {},
  isLoading: false,
  selectedMood: '',
  scenarioList: [],
  screamDetails: {
    duration: 0,
    path: '',
    sizeInKB: 0,
    type: '',
    mood: '',
  },
  selectedScenario: '',
  moodData: [],
  error: undefined,
};

const screamSlice = createSlice({
  name: 'scream',
  initialState,
  reducers: {
    setScreamDetails: (state, action: PayloadAction<any>) => {
      state.screamDetails = action.payload;
    },
    clearScream: state => {
      state = initialState;
    },
    setSelectedMood: (state, action: PayloadAction<any>) => {
      state.selectedMood = action.payload;
    },
    setSelectedscenario: (state, action: PayloadAction<any>) => {
      state.selectedScenario = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      // Send Scream Cases
      .addCase(sendScreamThunk?.pending, state => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(
        sendScreamThunk?.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.isLoading = false;
          state.sendScreamDetails = action.payload;
        },
      )
      .addCase(sendScreamThunk?.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Login failed';
      })

      // Get Moods Cases
      // .addCase(getMoodsThunk?.pending, state => {
      //   state.isLoading = true;
      //   state.error = undefined;
      // })
      // .addCase(
      //   getMoodsThunk?.fulfilled,
      //   (state, action: PayloadAction<any>) => {
      //     state.isLoading = false;
      //     state.moodData = action.payload?.data;
      //   },
      // )
      // .addCase(getMoodsThunk?.rejected, (state, action) => {
      //   state.isLoading = false;
      //   state.error = action.payload ?? 'mood failed';
      // })

      // Get scenarios Cases
      .addCase(getScenarioThunk?.pending, state => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(
        getScenarioThunk?.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.isLoading = false;
          state.scenarioList = action.payload?.data?.scenarior?.map(
            (element: string) => ({ _id: element, value: element })
          );
        },
      )
      .addCase(getScenarioThunk?.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'mood failed';
      });
  },
});

export const {
  setScreamDetails,
  clearScream,
  setSelectedMood,
  setSelectedscenario,
} = screamSlice.actions;
export default screamSlice.reducer;
