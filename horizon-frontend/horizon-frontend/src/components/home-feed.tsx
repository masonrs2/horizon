import { useState, useEffect } from "react";
import { PostCard } from "@/components/uis/post-card";
import { Button } from "@/components/uis/button";
import { Textarea } from "@/components/uis/textarea";
import { Loader2 } from "lucide-react";

// You'll need to implement these API functions 
import { fetchPosts, likePost, createPost } from "@/lib/api";

export function HomeFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch posts on component mount
    const loadPosts = async () => {
      try {
        setLoading(true);
        const data = await fetchPosts();
        setPosts(data);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  const handleLike = async (postId) => {
    try {
      await likePost(postId);
      // Optimistic update is already handled in the PostCard component
    } catch (error) {
      console.error("Failed to like post:", error);
      // You might want to revert the optimistic update here
    }
  };

  const handleSubmitPost = async () => {
    if (!newPostContent.trim()) return;
    
    try {
      setIsSubmitting(true);
      const newPost = await createPost({
        content: newPostContent,
        // Add user_id from your auth context
        // media_urls if you want to support media uploads
      });
      
      // Add new post to the top of the feed
      setPosts([newPost, ...posts]);
      setNewPostContent("");
    } catch (error) {
      console.error("Failed to create post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* New post form */}
      <div className="mb-6 bg-white rounded-lg border p-4">
        <Textarea
          placeholder="What's happening?"
          className="w-full mb-3 resize-none border-none focus-visible:ring-0 text-lg"
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
          rows={3}
        />
        <div className="flex justify-between items-center">
          <div>{/* Media upload buttons would go here */}</div>
          <Button 
            onClick={handleSubmitPost} 
            disabled={!newPostContent.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Posting
              </>
            ) : (
              "Post"
            )}
          </Button>
        </div>
      </div>

      {/* Posts feed */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No posts yet. Be the first to post!
        </div>
      ) : (
        <div>
          {posts.map((post) => (
            <PostCard 
              key={post.id}
              post={post}
              onLike={handleLike}
              onRepost={(postId) => console.log("Repost", postId)}
              onReply={(postId) => console.log("Reply", postId)}
            />
          ))}
        </div>
      )}
    </div>
  );
} 