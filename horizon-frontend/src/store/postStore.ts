import { create } from 'zustand';
import { Post, CreatePostRequest } from '../types';
import { postApi } from '../api';
import { useAuthStore } from '../store/authStore';

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
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  repostPost: (postId: string) => Promise<void>;
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
      
      // Check if we have this post in our posts array with more recent like state
      const existingPost = get().posts.find(p => p.id === postId);
      if (existingPost) {
        // Use the existing post's like state if it exists
        post.has_liked = existingPost.has_liked;
        post.like_count = existingPost.like_count;
      }
      
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
        // If this is a reply, add it to the replies list and update counts
        const { replies, posts, userPosts, currentPost } = get();
        
        // Add the new reply to the beginning of the replies list
        const updatedReplies = [newPost, ...replies];
        
        // Update feed posts
        const updatedPosts = posts.map(post => 
          post.id === postData.reply_to_post_id 
            ? { ...post, reply_count: (post.reply_count || 0) + 1 }
            : post
        );

        // Update user posts
        const updatedUserPosts = userPosts.map(post => 
          post.id === postData.reply_to_post_id 
            ? { ...post, reply_count: (post.reply_count || 0) + 1 }
            : post
        );

        // Update current post if it's the parent post
        const updatedCurrentPost = currentPost && currentPost.id === postData.reply_to_post_id
          ? { ...currentPost, reply_count: (currentPost.reply_count || 0) + 1 }
          : currentPost;

        // Update all states at once
        set({
          replies: updatedReplies,
          posts: updatedPosts,
          userPosts: updatedUserPosts,
          currentPost: updatedCurrentPost,
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
  
  likePost: async (postId) => {
    try {
    await postApi.likePost(postId);
      // Update post in state
    set((state) => ({
        posts: state.posts.map((post) =>
          post.id === postId ? { ...post, has_liked: true } : post
        ),
      }));
    } catch (error) {
      console.error('Failed to like post:', error);
      throw error;
    }
  },
  
  unlikePost: async (postId) => {
    try {
    await postApi.unlikePost(postId);
      // Update post in state
    set((state) => ({
        posts: state.posts.map((post) =>
          post.id === postId ? { ...post, has_liked: false } : post
        ),
      }));
    } catch (error) {
      console.error('Failed to unlike post:', error);
      throw error;
    }
  },
  
  repostPost: async (postId) => {
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) throw new Error('User not authenticated');
      await postApi.repostPost(postId, userId);
      // Update post in state if needed
    } catch (error) {
      console.error('Failed to repost:', error);
      throw error;
    }
  },
})); 