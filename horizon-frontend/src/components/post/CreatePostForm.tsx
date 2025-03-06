import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { usePostStore } from '@/store/postStore';
import { toast } from 'sonner';
import { Image, Globe, Lock, Smile, X } from 'lucide-react';

interface CreatePostFormProps {
  placeholder?: string;
  replyToPostId?: string;
  onSuccess?: () => void;
}

export function CreatePostForm({ 
  placeholder = "What's happening?",
  replyToPostId, 
  onSuccess 
}: CreatePostFormProps) {
  const { user } = useAuthStore();
  const { createPost } = usePostStore();
  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
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

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
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
    <div className="w-full">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-background/60">
          <AvatarImage src={user.avatar_url || ''} alt={user.username} />
          <AvatarFallback className="bg-primary/10 text-primary">{user.display_name?.charAt(0).toUpperCase() || user.username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 flex flex-col">
          <textarea
            ref={textareaRef}
            id="create-post"
            value={content}
            onChange={handleTextareaChange}
            placeholder={replyToPostId ? "Write your reply..." : placeholder}
            className="w-full min-h-[80px] resize-none border-none bg-transparent p-0 placeholder:text-muted-foreground focus:outline-none focus:ring-0 text-base"
          />
          
          {mediaUrls.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {mediaUrls.map((url, index) => (
                <div key={index} className="relative rounded-lg overflow-hidden border border-border/40">
                  <img src={url} alt="Preview" className="w-full h-auto object-cover" />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/70 backdrop-blur-sm btn-hover-effect"
                    onClick={() => handleRemoveMedia(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-3">
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="text-primary rounded-full h-9 w-9 btn-hover-effect"
                onClick={handleAddMedia}
              >
                <Image className="h-5 w-5" />
              </Button>
              
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="text-primary rounded-full h-9 w-9 btn-hover-effect"
              >
                <Smile className="h-5 w-5" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`rounded-full h-9 w-9 btn-hover-effect ${isPrivate ? 'text-primary' : 'text-muted-foreground'}`}
                onClick={() => setIsPrivate(!isPrivate)}
              >
                {isPrivate ? <Lock className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
              </Button>
            </div>
            
            <Button 
              onClick={handleSubmit}
              className="rounded-full px-4 btn-hover-effect sunset-gradient"
              disabled={isSubmitting || !content.trim()}
            >
              {replyToPostId ? 'Reply' : 'Post'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 