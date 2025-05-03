import { create } from 'zustand';
import { Post, CreatePostRequest } from '../types';
import { postApi } from '../api';

interface PostState {
  posts: Post[];
  userPosts: Post[];
  currentPost: Post | null;
  replies: Post[];
  isLoading: boolean;
  error: string | null;
  
  fetchFeed: () => Promise<void>;
  fetchUserPosts: (username: string) => Promise<void>;
  fetchPostById: (postId: string) => Promise<void>;
  fetchReplies: (postId: string) => Promise<void>;
  createPost: (postData: CreatePostRequest) => Promise<Post | null>;
  likePost: (postId: string, isLiked: boolean) => Promise<void>;
  repostPost: (postId: string, userId: string) => Promise<void>;
}

export const usePostStore = create<PostState>((set, get) => ({
  posts: [],
  userPosts: [],
  currentPost: null,
  replies: [],
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
      // Fetch replies after getting the post
      get().fetchReplies(postId);
    } catch (error) {
      set({ error: 'Failed to fetch post', isLoading: false });
    }
  },

  fetchReplies: async (postId) => {
    try {
      const replies = await postApi.getReplies(postId);
      set({ replies });
    } catch (error) {
      console.error('Failed to fetch replies:', error);
    }
  },
  
  createPost: async (postData) => {
    set({ isLoading: true, error: null });
    try {
      const newPost = await postApi.createPost(postData);
      
      if (postData.reply_to_post_id) {
        // If this is a reply, add it to the replies list
        const { replies } = get();
        set({ 
          replies: [newPost, ...replies],
          isLoading: false 
        });
      } else {
        // If this is a regular post, add it to the feed
        const { posts } = get();
        set({ 
          posts: [newPost, ...posts], 
          isLoading: false 
        });
      }
      
      return newPost;
    } catch (error) {
      set({ error: 'Failed to create post', isLoading: false });
      return null;
    }
  },
  
  likePost: async (postId, isLiked) => {
    try {
      if (isLiked) {
        await postApi.unlikePost(postId);
      } else {
        await postApi.likePost(postId);
      }
      
      // Update the post in all relevant states
      const { posts, userPosts, currentPost } = get();
      
      // Update in feed
      const updatedPosts = posts.map(post => 
        post.id === postId ? { ...post, like_count: post.like_count + (isLiked ? -1 : 1) } : post
      );
      
      // Update in user posts
      const updatedUserPosts = userPosts.map(post => 
        post.id === postId ? { ...post, like_count: post.like_count + (isLiked ? -1 : 1) } : post
      );
      
      // Update current post if it's the one being liked
      const updatedCurrentPost = currentPost && currentPost.id === postId
        ? { ...currentPost, like_count: currentPost.like_count + (isLiked ? -1 : 1) }
        : currentPost;
      
      set({ 
        posts: updatedPosts, 
        userPosts: updatedUserPosts,
        currentPost: updatedCurrentPost
      });
    } catch (error) {
      set({ error: isLiked ? 'Failed to unlike post' : 'Failed to like post' });
      throw error;
    }
  },
  
  repostPost: async (postId, userId) => {
    try {
      await postApi.repostPost(postId, userId);
      
      // Update the post in all relevant states
      const { posts, userPosts, currentPost } = get();
      
      // Update in feed
      const updatedPosts = posts.map(post => 
        post.id === postId ? { ...post, repost_count: post.repost_count + 1 } : post
      );
      
      // Update in user posts
      const updatedUserPosts = userPosts.map(post => 
        post.id === postId ? { ...post, repost_count: post.repost_count + 1 } : post
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
      throw error;
    }
  },
})); 