import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Heart, Repeat, MessageCircle, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

import { notificationApi, Notification } from '../api/notificationApi';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { MainLayout } from '../components/layout/MainLayout';
import { RightSidebar } from '../components/layout/RightSidebar';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';

const NOTIFICATIONS_PER_PAGE = 20;

export default function NotificationsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { loadUnreadCount } = useNotificationStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial notifications
  useEffect(() => {
    // Only load notifications if authenticated and not in loading state
    if (isAuthenticated && !authLoading) {
      loadNotifications(0);
    }
  }, [isAuthenticated, authLoading]); // Add dependencies to ensure effect runs when auth state changes

  // Load notifications
  const loadNotifications = async (offset: number) => {
    try {
      setError(null);
      const newNotifications = await notificationApi.getNotifications(NOTIFICATIONS_PER_PAGE, offset);
      if (offset === 0) {
        setNotifications(newNotifications);
      } else {
        setNotifications(prev => [...prev, ...newNotifications]);
      }
      setHasMore(newNotifications.length === NOTIFICATIONS_PER_PAGE);
    } catch (error: any) {
      console.error('Failed to load notifications:', error);
      // Only set error if it's not a 401 (which will be handled by the auth interceptor)
      if (error.response?.status !== 401) {
        setError('Failed to load notifications. Please try again.');
        toast.error('Failed to load notifications');
      }
    } finally {
      setLoading(false);
    }
  };

  // Load more notifications when scrolling
  const loadMore = () => {
    if (!loading && hasMore && !error && isAuthenticated) {
      loadNotifications(notifications.length);
    }
  };

  // Set up infinite scroll
  const { observerRef } = useInfiniteScroll(loadMore);

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (!isAuthenticated) return;
    
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      // Refresh the unread count
      loadUnreadCount();
      // Trigger a refresh of the unread count in the navbar
      const event = new CustomEvent('notifications-updated');
      window.dispatchEvent(event);
      toast.success('All notifications marked as read');
    } catch (error: any) {
      // Only show error if it's not a 401
      if (error.response?.status !== 401) {
        console.error('Failed to mark all notifications as read:', error);
        toast.error('Failed to mark notifications as read');
      }
    }
  };

  // Mark a single notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    if (!isAuthenticated) return;
    
    try {
      await notificationApi.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );
      // Refresh the unread count
      loadUnreadCount();
      // Trigger a refresh of the unread count in the navbar
      const event = new CustomEvent('notifications-updated');
      window.dispatchEvent(event);
    } catch (error: any) {
      // Only show error if it's not a 401
      if (error.response?.status !== 401) {
        console.error('Failed to mark notification as read:', error);
        toast.error('Failed to mark notification as read');
      }
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'like':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'repost':
        return <Repeat className="h-5 w-5 text-green-500" />;
      case 'reply':
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case 'follow':
        return <UserPlus className="h-5 w-5 text-purple-500" />;
    }
  };

  // Get notification text based on type
  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case 'like':
        return 'liked your post';
      case 'repost':
        return 'reposted your post';
      case 'reply':
        return 'replied to your post';
      case 'follow':
        return 'followed you';
    }
  };

  // Wait for auth check to complete
  if (authLoading) {
    return (
      <MainLayout title="Notifications" rightContent={<RightSidebar />}>
        <div className="flex h-[200px] items-center justify-center">
          <Spinner />
        </div>
      </MainLayout>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const NotificationsList = () => {
    if (loading && notifications.length === 0) {
      return (
        <div className="flex h-[200px] items-center justify-center">
          <Spinner />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center gap-4 py-8">
          <p className="text-destructive">{error}</p>
          <Button onClick={() => loadNotifications(0)} variant="outline">
            Try Again
          </Button>
        </div>
      );
    }

    if (!loading && notifications.length === 0) {
      return (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Bell className="h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium">No notifications yet</p>
          <p className="text-sm text-muted-foreground">
            When someone interacts with your posts or follows you, you'll see it here.
          </p>
        </div>
      );
    }

    return (
      <div className="divide-y">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`flex items-start gap-3 p-4 transition-colors hover:bg-muted/5 ${
              !notification.read ? 'bg-muted/10' : ''
            }`}
            onClick={() => !notification.read && handleMarkAsRead(notification.id)}
          >
            <div className="flex-shrink-0">{getNotificationIcon(notification.type)}</div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                {notification.actor_username ? (
                  <Link
                    to={`/profile/${notification.actor_username}`}
                    className="flex items-center gap-2 font-medium hover:underline"
                  >
                    <Avatar
                      src={notification.actor_avatar_url || undefined}
                      alt={notification.actor_username}
                      size="sm"
                    />
                    <span>{notification.actor_display_name || notification.actor_username}</span>
                  </Link>
                ) : (
                  <span>A user</span>
                )}
                <span className="text-sm text-muted-foreground">
                  {getNotificationText(notification)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </span>
              </div>

              {notification.post_content && (
                <Link
                  to={`/post/${notification.post_id}`}
                  className="rounded bg-muted/5 p-2 text-sm text-muted-foreground hover:bg-muted/10"
                >
                  {notification.post_content}
                </Link>
              )}
            </div>
          </div>
        ))}
        <div ref={observerRef} className="h-4" />
      </div>
    );
  };

  return (
    <MainLayout
      title="Notifications"
      showBackButton
      rightContent={
        <div className="space-y-4">
          {notifications.some(n => !n.read) && (
            <Button onClick={handleMarkAllAsRead} variant="outline" className="w-full">
              Mark all as read
            </Button>
          )}
          <RightSidebar />
        </div>
      }
    >
      <NotificationsList />
    </MainLayout>
  );
} 