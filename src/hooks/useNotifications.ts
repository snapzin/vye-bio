import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  link: string | null;
  created_at: string;
  updated_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchNotifications() {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (cancelled) return;

      if (error) {
        console.error('Error fetching notifications:', error);
        setLoading(false);
        return;
      }

      const fetchedNotifications = (data || []) as Notification[];
      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedNotifications.filter(n => !n.is_read).length);
      setLoading(false);
    }

    fetchNotifications();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (cancelled) return;
          
          // Handle INSERT events immediately
          if (payload.eventType === 'INSERT') {
            const newNotification = payload.new as Notification;
            setNotifications(prev => {
              // Check if notification already exists to avoid duplicates
              if (prev.some(n => n.id === newNotification.id)) {
                return prev;
              }
              // Add new notification at the beginning
              return [newNotification, ...prev].slice(0, 50);
            });
            // Update unread count if notification is unread
            if (!newNotification.is_read) {
              setUnreadCount(prev => prev + 1);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedNotification = payload.new as Notification;
            setNotifications(prev =>
              prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
            );
            // Update unread count based on is_read status
            const oldNotification = payload.old as Notification;
            if (oldNotification && !oldNotification.is_read && updatedNotification.is_read) {
              setUnreadCount(prev => Math.max(0, prev - 1));
            } else if (oldNotification && oldNotification.is_read && !updatedNotification.is_read) {
              setUnreadCount(prev => prev + 1);
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedNotification = payload.old as Notification;
            setNotifications(prev => prev.filter(n => n.id !== deletedNotification.id));
            if (deletedNotification && !deletedNotification.is_read) {
              setUnreadCount(prev => Math.max(0, prev - 1));
            }
          } else {
            // For any other event, re-fetch to be safe
            setTimeout(() => {
              if (!cancelled) {
                fetchNotifications();
              }
            }, 50);
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (!error) {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    return { error };
  };

  const markAllAsRead = async () => {
    if (!user) return { error: null };

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }

    return { error };
  };

  const deleteNotification = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user?.id); // Extra safety check

    if (error) {
      console.error('Error deleting notification:', error);
      return { error };
    }

    // Update state optimistically
    const notification = notifications.find(n => n.id === notificationId);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    if (notification && !notification.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    return { error: null };
  };

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}

