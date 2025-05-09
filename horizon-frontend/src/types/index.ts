export interface User {
  id: string;
  username: string;
  email: string;
  display_name: string;
  avatar_url: string;
  bio?: string;
  location?: string;
  website?: string;
  created_at: string;
  updated_at: string;
  email_verified: boolean;
  is_private: boolean;
  followers_count: number;
  following_count: number;
  is_following?: boolean;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  is_private: boolean;
  reply_to_post_id?: string;
  allow_replies: boolean;
  media_urls: string[];
  like_count: number;
  repost_count: number;
  reply_count: number;
  has_liked: boolean;
  has_bookmarked: boolean;
  user?: User;
  parent_post?: Post;
}

export interface CreatePostRequest {
  content: string;
  is_private?: boolean;
  reply_to_post_id?: string;
  media_urls?: string[];
}

export interface LikePostRequest {
  post_id: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  display_name?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user_id: string;
  username: string;
  email: string;
  display_name: string;
  message?: string;
  is_new_user?: boolean;
}

export interface FollowResponse {
  is_following: boolean;
  is_accepted: boolean;
} 