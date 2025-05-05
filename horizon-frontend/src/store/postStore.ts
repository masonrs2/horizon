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
  likePost: (postId: string, userId: string) => Promise<void>;
  unlikePost: (postId: string, userId: string) => Promise<void>;
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
  
  likePost: async (postId, userId) => {
    await postApi.likePost(postId);
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, has_liked: true, like_count: (p.like_count || 0) + 1 } : p
      ),
      currentPost: state.currentPost?.id === postId 
        ? { ...state.currentPost, has_liked: true, like_count: (state.currentPost.like_count || 0) + 1 }
        : state.currentPost,
      userPosts: state.userPosts.map((p) =>
        p.id === postId ? { ...p, has_liked: true, like_count: (p.like_count || 0) + 1 } : p
      )
    }));
  },
  
  unlikePost: async (postId, userId) => {
    await postApi.unlikePost(postId);
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, has_liked: false, like_count: Math.max(0, (p.like_count || 0) - 1) } : p
      ),
      currentPost: state.currentPost?.id === postId
        ? { ...state.currentPost, has_liked: false, like_count: Math.max(0, (state.currentPost.like_count || 0) - 1) }
        : state.currentPost,
      userPosts: state.userPosts.map((p) =>
        p.id === postId ? { ...p, has_liked: false, like_count: Math.max(0, (p.like_count || 0) - 1) } : p
      )
    }));
  },
  
  repostPost: async (postId, userId) => {
    await postApi.repostPost(postId);
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, repost_count: (p.repost_count || 0) + 1 } : p
      ),
      currentPost: state.currentPost?.id === postId
        ? { ...state.currentPost, repost_count: (state.currentPost.repost_count || 0) + 1 }
        : state.currentPost,
      userPosts: state.userPosts.map((p) =>
        p.id === postId ? { ...p, repost_count: (p.repost_count || 0) + 1 } : p
      )
    }));
  },
})); 