import { Image } from "react-native-image-crop-picker";

// payload
export interface signUpPayload {
  user_fname: string;
  user_lname: string;
  user_email: string;
  password: string;
  confirm_password: string;
}

export interface profileUpdatePayload {
  name: string
  username: string
  age_group: string
  bio: string
  gender: string | object;
}
export interface profilePicturePayload {
  profileImage: Image
}

export interface iDropdownItem {
  id: string;
  value: string;
}

export interface iProfileStaticData {
  [key: string]: iDropdownItem[];
}

export interface AuthState {
  user: any;
  loading: boolean;
  error: string | null;
  // captcha: string;
  // uuid: string;
  userDetails?: any;
  profileDetails?: iProfileStaticData;
  profileImage?: string
}

export interface CaptchaResponse {
  captcha: string;
  uuid: string;
}
export interface socialCrediential {
  idToken: string;
}

export interface mobileLoginPayload {
  phone: string,
  country_code: string
}