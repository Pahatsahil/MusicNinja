import { createAsyncThunk } from '@reduxjs/toolkit';
import { profileUpdatePayload, signUpPayload } from './authTypes';
import { getProfileStaticDataApi, otpVerifyApi, resendOtpApi, loginUser, sendProfileDetails } from '@api/authApis';

export interface LoginCredentials {
  user_email: string;
  terms_and_condition: boolean;
}
export interface otpCredentials {
  user_id: string;
  otp: number | string;
}
export interface resendCredentials {
  user_id: string;
}

// export const signUpUser = createAsyncThunk<
//   any,
//   signUpPayload,
//   {rejectValue: string}
// >('user/signup', async (credentials, {rejectWithValue}) => {
//   try {
//     console.log('signUpPayload',credentials);
//     const response = await authAPI.signUp(credentials);
//     // console.log('firstresponse',response)
//     return response;
//   } catch (error: any) {
//     return rejectWithValue(error.response?.data?.message || 'Login failed');
//   }
// });
export const login = createAsyncThunk<
  any,
  LoginCredentials,
  { rejectValue: string }
>('user/login', async (credentials, { rejectWithValue }) => {
  try {
    console.log(credentials);
    const response = await loginUser(credentials);
    return response;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Login failed');
  }
});
export const otpVerify = createAsyncThunk<
  any,
  otpCredentials,
  { rejectValue: string }
>('user/otp', async (credentials, { rejectWithValue }) => {
  try {
    console.log(credentials);
    const response = await otpVerifyApi(credentials);
    return response;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Otp verification failed');
  }
});
export const resendOtp = createAsyncThunk<
  any,
  resendCredentials,
  { rejectValue: string }
>('user/resendOtp', async (credentials, { rejectWithValue }) => {
  try {
    console.log(credentials);
    const response = await resendOtpApi(credentials);
    return response;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Otp verification failed');
  }
});

// export const sendProfilePictureThunk = createAsyncThunk<
//   { captcha: string; uuid: string },
//   void,
//   { rejectValue: string }
// >('auth/fetchCaptcha', async (_, { rejectWithValue }) => {
//   try {
//     const response: any = await sendProfilePictureThunk();
//     return response;
//   } catch (error: any) {
//     return rejectWithValue('Failed to fetch captcha');
//   }
// });

// export const forgetPasswordUser = createAsyncThunk<
//   any,
//   ForgetCredentials,
//   {rejectValue: string}
// >('auth/forgetPasswordUser', async (credentials, {rejectWithValue}) => {
//   try {
//     const response = await authAPI.forgetPassword(credentials);
//     return response;
//   } catch (error: any) {
//     return rejectWithValue(
//       error.response?.data?.message || 'Forgot password request failed',
//     );
//   }
// });

export const sendProfileDetailsThunk = createAsyncThunk<
  any,
  profileUpdatePayload,
  { rejectValue: string }
>(
  'auth/sendProfileDetails',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await sendProfileDetails(credentials);
      console.log('this is resss', response)
      return response;
    } catch (error) {
      return rejectWithValue('Failed to fetch user details');
    }
  },
);

export const profileStaticThunk = createAsyncThunk<string, void, { rejectValue: string }>(
  'user/master/get', async (_, { rejectWithValue }) => {
    try {
      const response: any = await getProfileStaticDataApi();
      return response;

    } catch (error) {
      return rejectWithValue('profileStaticThunk');

    }
  })

// export const logoutUser = createAsyncThunk<any, void, { rejectValue: string }>(
//   'auth/logoutUser',
//   async (_, { rejectWithValue }) => {
//     try {
//       const response: any = await authAPI.logOutUser();
//       return response;
//     } catch (error: any) {
//       return rejectWithValue('logout');
//     }
//   },
// );
