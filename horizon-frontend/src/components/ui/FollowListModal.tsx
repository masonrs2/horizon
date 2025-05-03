import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useEffect } from 'react';
import { userApi } from '@/api';
import { Link } from 'react-router-dom';

interface User {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
  is_private: boolean;
  is_accepted: boolean;
}

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

  useEffect(() => {
    const fetchUsers = async () => {
      if (!isOpen) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = type === 'followers' 
          ? await userApi.getFollowers(username)
          : await userApi.getFollowing(username);
        
        setUsers(response);
        setIsLoading(false);
      } catch (err) {
        console.error(`Failed to load ${type}:`, err);
        setError(`Failed to load ${type}`);
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [username, type, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{type === 'followers' ? 'Followers' : 'Following'}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] overflow-y-auto pr-4">
          {isLoading ? (
            // Loading state
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-accent/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-accent/10 rounded" />
                    <div className="h-3 w-32 bg-accent/10 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            // Error state
            <div className="text-center py-8 text-destructive">
              <p>{error}</p>
              <Button variant="outline" onClick={() => setIsLoading(true)} className="mt-4">
                Try again
              </Button>
            </div>
          ) : users.length === 0 ? (
            // Empty state
            <div className="text-center py-8 text-muted-foreground">
              <p>No {type} yet</p>
            </div>
          ) : (
            // User list
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <Link 
                    to={`/${user.username}`} 
                    className="flex items-center gap-3 flex-1 hover:bg-accent/5 p-2 rounded-lg transition-colors"
                    onClick={onClose}
                  >
                    <Avatar className="h-12 w-12">
                      {user.avatar_url ? (
                        <AvatarImage src={user.avatar_url} alt={user.display_name} />
                      ) : (
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user.display_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.display_name}</p>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                      {user.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {user.bio}
                        </p>
                      )}
                    </div>
                  </Link>
                  <Button variant="outline" className="rounded-full ml-4">
                    Follow
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
} 