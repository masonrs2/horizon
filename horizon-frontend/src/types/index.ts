export interface User {
  id: string;
  username: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  email_verified: boolean;
  last_login?: string;
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
  user?: User;
}

export interface CreatePostRequest {
  user_id: string;
  content: string;
  is_private: boolean;
  reply_to_post_id?: string;
  media_urls?: string[];
}

export interface LikePostRequest {
  user_id: string;
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
  user_id: string;
  username: string;
  display_name: string;
  email: string;
  access_token: string;
  refresh_token: string;
} 