import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useEffect } from 'react';
import { userApi } from '@/api';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { User } from '@/types';

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  type: 'followers' | 'following';
}

export function FollowListModal({ isOpen, onClose, username, type }: FollowListModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    const fetchUsers = async () => {
      if (!isOpen) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = type === 'followers' 
          ? await userApi.getFollowers(username)
          : await userApi.getFollowing(username);
        setUsers(data);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setError('Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen, username, type]);

  const handleFollowToggle = async (user: User) => {
    try {
      const isFollowing = users.find(u => u.id === user.id)?.is_following;
      
      if (isFollowing) {
        await userApi.unfollowUser(user.username);
      } else {
        await userApi.followUser(user.username);
      }

      // Refresh the list
      const data = type === 'followers' 
        ? await userApi.getFollowers(username)
        : await userApi.getFollowing(username);
      setUsers(data);
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    }
  };

  const handleUserClick = (username: string) => {
    navigate(`/${username}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {type === 'followers' ? 'Followers' : 'Following'}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] overflow-y-auto px-1">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              {error}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {type === 'followers' 
                ? 'No followers yet'
                : `@${username} isn't following anyone`
              }
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div 
                    className="flex items-center gap-3 cursor-pointer hover:opacity-80"
                    onClick={() => handleUserClick(user.username)}
                  >
                    <Avatar>
                      {user.avatar_url ? (
                        <AvatarImage src={user.avatar_url} alt={user.display_name} />
                      ) : (
                        <AvatarFallback>
                          {user.display_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.display_name}</p>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>
                  
                  {currentUser && currentUser.username !== user.username && (
                    <Button
                      variant={user.is_following ? "outline" : "default"}
                      size="sm"
                      className="rounded-full"
                      onClick={() => handleFollowToggle(user)}
                    >
                      {user.is_following ? 'Following' : 'Follow'}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
} 