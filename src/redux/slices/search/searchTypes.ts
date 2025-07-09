import {iTHEMES} from '@utills/ThemeContext';

export interface intialSearch {
  // prefrences: {
  //     art: Array<string>,
  //     music: Array<string>,
  //     poetry: Array<string>,
  // },
  // // language:                                  Language Types
  // theme: keyof iTHEMES,
  // report: {
  //     type: string,
  //     description: string,
  //     image?: {
  //         name: string
  //         path: string
  //         type: string
  //     }
  // }
}
export interface searchPayload {
  offset: number;
  limit: number;
  search: string;
}
export interface followPayload {
  followingId: string;
}
export interface creatorProfilePayload {
  id: string;
}
