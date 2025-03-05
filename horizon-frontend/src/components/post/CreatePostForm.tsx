import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { FaImage, FaGlobe, FaLock } from 'react-icons/fa';
import { useAuthStore } from '@/store/authStore';
import { usePostStore } from '@/store/postStore';
import { toast } from 'sonner';

interface CreatePostFormProps {
  replyToPostId?: string;
  onSuccess?: () => void;
}

export function CreatePostForm({ replyToPostId, onSuccess }: CreatePostFormProps) {
  const { user } = useAuthStore();
  const { createPost } = usePostStore();
  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  
  // This would be replaced with actual file upload functionality
  const handleAddMedia = () => {
    // For demo purposes, we'll just add a placeholder image URL
    setMediaUrls([...mediaUrls, 'https://placehold.co/600x400']);
  };
  
  const handleRemoveMedia = (index: number) => {
    const updatedMediaUrls = [...mediaUrls];
    updatedMediaUrls.splice(index, 1);
    setMediaUrls(updatedMediaUrls);
  };
  
  const handleSubmit = async () => {
    if (!user) return;
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      await createPost({
        user_id: user.id,
        content,
        is_private: isPrivate,
        reply_to_post_id: replyToPostId,
        media_urls: mediaUrls,
      });
      
      setContent('');
      setMediaUrls([]);
      setIsPrivate(false);
      
      toast.success('Post created successfully!');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error('Failed to create post. Please try again.');
      console.error('Failed to create post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!user) {
    return null;
  }
  
  return (
    <Card className="mb-4 border-0 border-b rounded-none">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar_url || ''} alt={user.username} />
            <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <Textarea
              placeholder={replyToPostId ? "Write your reply..." : "What's happening?"}
              className="min-h-[100px] border-0 focus-visible:ring-0 resize-none p-0 text-lg"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            
            {mediaUrls.length > 0 && (
              <div className="mt-3 grid gap-2 grid-cols-2">
                {mediaUrls.map((url, index) => (
                  <div key={index} className="relative rounded-md overflow-hidden">
                    <img src={url} alt="Media preview" className="w-full h-auto" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 rounded-full"
                      onClick={() => handleRemoveMedia(index)}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-primary rounded-full"
            onClick={handleAddMedia}
          >
            <FaImage className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full ${isPrivate ? 'text-primary' : 'text-muted-foreground'}`}
            onClick={() => setIsPrivate(!isPrivate)}
          >
            {isPrivate ? <FaLock className="h-4 w-4" /> : <FaGlobe className="h-4 w-4" />}
          </Button>
        </div>
        
        <Button
          disabled={!content.trim() || isSubmitting}
          onClick={handleSubmit}
          className="rounded-full"
        >
          {replyToPostId ? 'Reply' : 'Post'}
        </Button>
      </CardFooter>
    </Card>
  );
} 