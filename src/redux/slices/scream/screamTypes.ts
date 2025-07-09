export interface iScreamDetails {
  path: '';
  type: '';
  sizeInKB: 0;
  duration: 0;
  mood?: string;
}

export interface iMoodDetails {
  _id: string;
  value: string;
}

export interface iCreatePostPayload {
  screamId: string;
  description: string;
}

