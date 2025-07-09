import {MediaType} from '@components/Posts/Types';

export interface iPostsPayload {
  offset: number;
  limit: number;
}
export interface iLikePayload {
  post_id: string;
  // type: "like" | "dislike"
}

export interface iPostsData {
  _id: string;
  output_file: string;
  thumbnail: string;
  description: string;
  scream_type: string;
  like_count: number;
  comment_count: number;
  is_liked: boolean;
  post_published_date: string;
  user: {
    username: string;
    image: string;
    _id: string;
  };
}

export interface iPostsDetails {
  offset: number;
  limit: number;
  total: number;
  hasMore: boolean;
  data: Array<iPostsData>;
}

export interface iCommentsListPayload {
  offset: number;
  limit: number;
  post_id: string;
}
export interface iMyCommentPayload {
  comment_text: string;
  post_id: string;
}

export type iNotificationTypes = 'like' | 'comment' | 'follow';
export interface iNotificationsData {
  _id: string;
  type: iNotificationTypes;
  post: {
    _id: string;
    output_file: string;
    scream_output_type: MediaType;
    thumbnail: string;
  };
  message: string;
  name: string;
  profile_image: string;
  created_at: string;
  follow_back: boolean;
  sender_id: string;
  is_read: boolean;
}

export interface iNotificationsDetails {
  offset: number;
  limit: number;
  total: number;
  hasMore: boolean;
  data: Array<iNotificationsData>;
  unRead:boolean;
}
export interface ireadUnreadPayload {
  notification_id: string;
}
