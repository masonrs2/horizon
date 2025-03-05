import { create } from 'zustand';
import { Post, CreatePostRequest } from '../types';
import { postApi } from '../api';

interface PostState {
  posts: Post[];
  userPosts: Post[];
  currentPost: Post | null;
  isLoading: boolean;
  error: string | null;
  
  fetchFeed: () => Promise<void>;
  fetchUserPosts: (username: string) => Promise<void>;
  fetchPostById: (postId: string) => Promise<void>;
  createPost: (postData: CreatePostRequest) => Promise<Post | null>;
  likePost: (postId: string, userId: string) => Promise<void>;
  repostPost: (postId: string, userId: string) => Promise<void>;
}

export const usePostStore = create<PostState>((set, get) => ({
  posts: [],
  userPosts: [],
  currentPost: null,
  isLoading: false,
  error: null,
  
  fetchFeed: async () => {
    set({ isLoading: true, error: null });
    try {
      const posts = await postApi.getFeedPosts();
      set({ posts, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch feed', isLoading: false });
    }
  },
  
  fetchUserPosts: async (username) => {
    set({ isLoading: true, error: null });
    try {
      const userPosts = await postApi.getUserPosts(username);
      set({ userPosts, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch user posts', isLoading: false });
    }
  },
  
  fetchPostById: async (postId) => {
    set({ isLoading: true, error: null });
    try {
      const post = await postApi.getPostById(postId);
      set({ currentPost: post, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch post', isLoading: false });
    }
  },
  
  createPost: async (postData) => {
    set({ isLoading: true, error: null });
    try {
      const newPost = await postApi.createPost(postData);
      
      // Update the feed with the new post
      const { posts } = get();
      set({ 
        posts: [newPost, ...posts], 
        isLoading: false 
      });
      
      return newPost;
    } catch (error) {
      set({ error: 'Failed to create post', isLoading: false });
      return null;
    }
  },
  
  likePost: async (postId, userId) => {
    try {
      await postApi.likePost(postId, { user_id: userId });
      
      // Update the post in the feed
      const { posts, userPosts, currentPost } = get();
      
      // Update in feed
      const updatedPosts = posts.map(post => 
        post.id === postId 
          ? { ...post, like_count: post.like_count + 1 } 
          : post
      );
      
      // Update in user posts
      const updatedUserPosts = userPosts.map(post => 
        post.id === postId 
          ? { ...post, like_count: post.like_count + 1 } 
          : post
      );
      
      // Update current post if it's the one being liked
      const updatedCurrentPost = currentPost && currentPost.id === postId
        ? { ...currentPost, like_count: currentPost.like_count + 1 }
        : currentPost;
      
      set({ 
        posts: updatedPosts, 
        userPosts: updatedUserPosts,
        currentPost: updatedCurrentPost
      });
    } catch (error) {
      set({ error: 'Failed to like post' });
    }
  },
  
  repostPost: async (postId, userId) => {
    try {
      await postApi.repostPost(postId, userId);
      
      // Update the post in the feed
      const { posts, userPosts, currentPost } = get();
      
      // Update in feed
      const updatedPosts = posts.map(post => 
        post.id === postId 
          ? { ...post, repost_count: post.repost_count + 1 } 
          : post
      );
      
      // Update in user posts
      const updatedUserPosts = userPosts.map(post => 
        post.id === postId 
          ? { ...post, repost_count: post.repost_count + 1 } 
          : post
      );
      
      // Update current post if it's the one being reposted
      const updatedCurrentPost = currentPost && currentPost.id === postId
        ? { ...currentPost, repost_count: currentPost.repost_count + 1 }
        : currentPost;
      
      set({ 
        posts: updatedPosts, 
        userPosts: updatedUserPosts,
        currentPost: updatedCurrentPost
      });
    } catch (error) {
      set({ error: 'Failed to repost' });
    }
  },
})); 