import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
  login,
  otpVerify,
  resendOtp,
  profileStaticThunk,
  sendProfileDetailsThunk,
} from './authThunk';
import {AuthState, CaptchaResponse, iProfileStaticData} from './authTypes';
import {BASE_URL} from '@env';

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  // captcha: '',
  // uuid: '',
  userDetails: null,
  profileDetails: {},
  profileImage: '',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: state => {
      state.user = null;
      state.loading = false;
      state.error = null;
      state.userDetails = null;
      state.profileDetails = {};
      state.profileImage = '';
    },
    setProfileImage: (state, action: PayloadAction<string>) => {
      state.profileImage = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      // Login Cases
      .addCase(login?.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login?.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(login?.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Login failed';
      })
      //otp
      .addCase(otpVerify?.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(otpVerify?.fulfilled, (state, action: PayloadAction<any>) => {
        console.log('this is otp payload ', action?.payload);
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(otpVerify?.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Login failed';
      })
      //resend otp
      .addCase(resendOtp?.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resendOtp?.fulfilled, (state, action: PayloadAction<any>) => {
        console.log('this is resend payload ', action?.payload);
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(resendOtp?.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Resend failed';
      })
      // getProfile Static Data
      .addCase(profileStaticThunk?.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        profileStaticThunk?.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          const normalized: iProfileStaticData = {};
          action.payload?.data.forEach(
            ({_id, items}: {_id: string; items: []}) => {
              normalized[_id] = items;
            },
          );
          state.profileDetails = normalized;
        },
      )
      .addCase(profileStaticThunk?.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Login failed';
      })
      // get UserDetails
      .addCase(sendProfileDetailsThunk?.pending, state => {
        state.loading = true;
      })
      .addCase(
        sendProfileDetailsThunk?.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.userDetails = action.payload;
        },
      )
      .addCase(sendProfileDetailsThunk?.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : 'Failed to fetch user details';
      });
  },
});

export const {logout, setProfileImage} = authSlice.actions;
export default authSlice.reducer;
