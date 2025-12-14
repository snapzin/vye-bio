import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  avatar_shape: string | null;
  background_url: string | null;
  background_type: string;
  background_color: string;
  banner_url: string | null;
  location: string | null;
  is_online: boolean;
  music_title: string | null;
  music_artist: string | null;
  music_url: string | null;
  music_image_url: string | null;
  music_autoplay: boolean | null;
  music_player_style: string | null;
  discord_user_id: string | null;
  valorant_name: string | null;
  valorant_tag: string | null;
  valorant_puuid: string | null;
  is_admin: boolean | null;
  is_premium: boolean | null;
  premium_expires_at: string | null;
  hide_footer: boolean | null;
  card_color: string | null;
  card_opacity: number | null;
  card_blur: number | null;
  card_direction: string | null;
  card_style: string | null;
  link_style: string | null;
  link_button_style: string | null;
  views_count: number;
  created_at: string;
  updated_at: string;
}

export interface UserLink {
  id: string;
  user_id: string;
  title: string;
  url: string;
  icon: string | null;
  icon_color: string | null;
  sort_order: number;
  is_visible: boolean;
  clicks_count: number;
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  category: 'achievement' | 'event' | 'special' | 'community' | 'premium';
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  is_displayed: boolean;
  sort_order: number | null;
  badge?: Badge;
}

export function useProfile(username?: string, userId?: string, refreshKey?: number) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      if (cancelled) return;
      
      setLoading(true);
      setError(null);

      try {
        let query = supabase.from('profiles').select('*');
        
        if (userId) {
          query = query.eq('user_id', userId);
        } else if (username) {
          query = query.eq('username', username.toLowerCase());
        } else if (user?.id) {
          query = query.eq('user_id', user.id);
        } else {
          if (!cancelled) {
            setLoading(false);
            setProfile(null);
          }
          return;
        }

        const { data, error: fetchError } = await query.maybeSingle();

        if (cancelled) return;

        if (fetchError) {
          setError(fetchError.message);
        } else {
          setProfile(data as Profile | null);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Falha ao carregar perfil');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchProfile();

    // Ouvir eventos de atualização de profile
    const handleProfileUpdate = () => {
      if (!cancelled) {
        fetchProfile();
      }
    };

    window.addEventListener('profile:updated', handleProfileUpdate);

    return () => {
      cancelled = true;
      window.removeEventListener('profile:updated', handleProfileUpdate);
    };
  }, [username, userId, user?.id, refreshKey]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('Não autenticado') };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id);

    if (!error) {
      setProfile(prev => {
        if (!prev) return null;
        return { ...prev, ...updates };
      });
    }

    return { error };
  };

  const refreshProfile = async () => {
    // Force re-fetch by updating a local refresh key
    // This will be handled by the parent component calling useProfile with a refreshKey
  };

  return { profile, loading, error, updateProfile, refreshProfile };
}

export function useUserLinks(userId?: string, refreshKey?: number) {
  const { user } = useAuth();
  const [links, setLinks] = useState<UserLink[]>([]);
  const [loading, setLoading] = useState(true);

  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchLinks() {
      const { data } = await supabase
        .from('user_links')
        .select('*')
        .eq('user_id', targetUserId)
        .order('sort_order');

      if (cancelled) return;

      setLinks((data || []) as UserLink[]);
      setLoading(false);
    }

    fetchLinks();

    // Escutar mudanças em tempo real
    const channel = supabase
      .channel(`user_links:${targetUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_links',
          filter: `user_id=eq.${targetUserId}`,
        },
        () => {
          // Re-fetch quando houver mudanças
          if (!cancelled) {
            setTimeout(() => {
              if (!cancelled) {
                fetchLinks();
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
  }, [targetUserId, refreshKey]);

  const addLink = async (link: { title: string; url: string; icon?: string }) => {
    if (!user) return { error: new Error('Não autenticado') };

    const { data, error } = await supabase
      .from('user_links')
      .insert({
        user_id: user.id,
        title: link.title,
        url: link.url,
        icon: link.icon,
        sort_order: links.length,
      })
      .select()
      .single();

    if (data) {
      setLinks(prev => [...prev, data as UserLink]);
    }

    return { data, error };
  };

  const updateLink = async (id: string, updates: Partial<UserLink>) => {
    const { error } = await supabase
      .from('user_links')
      .update(updates)
      .eq('id', id);

    if (!error) {
      setLinks(prev => prev.map(link => link.id === id ? { ...link, ...updates } : link));
    }

    return { error };
  };

  const deleteLink = async (id: string) => {
    const { error } = await supabase
      .from('user_links')
      .delete()
      .eq('id', id);

    if (!error) {
      setLinks(prev => prev.filter(link => link.id !== id));
    }

    return { error };
  };

  return { links, loading, addLink, updateLink, deleteLink };
}

export function useUserBadges(userId?: string, includeHidden = false, refreshKey?: number) {
  const { user } = useAuth();
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchBadges() {
      let query = supabase
        .from('user_badges')
        .select(`
          *,
          badge:badges(*)
        `)
        .eq('user_id', targetUserId);

      if (!includeHidden) {
        query = query.eq('is_displayed', true);
      }

      const { data } = await query.order('sort_order', { ascending: true });

      if (cancelled) return;

      const sortedData = (data || []).sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
      
      setBadges(sortedData.map(item => ({
        ...item,
        badge: item.badge as Badge
      })));
      setLoading(false);
    }

    fetchBadges();

    // Escutar mudanças em tempo real
    const channel = supabase
      .channel(`user_badges:${targetUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_badges',
          filter: `user_id=eq.${targetUserId}`,
        },
        (payload) => {
          // Re-fetch quando houver mudanças
          if (!cancelled) {
            // Pequeno delay para garantir que a mudança foi processada no banco
            setTimeout(() => {
              if (!cancelled) {
                fetchBadges();
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
  }, [targetUserId, includeHidden, refreshKey]);

  const updateBadge = async (id: string, updates: Partial<UserBadge>) => {
    const { error } = await supabase
      .from('user_badges')
      .update(updates)
      .eq('id', id);

    if (!error) {
      setBadges(prev => prev.map(badge => badge.id === id ? { ...badge, ...updates } : badge));
    }

    return { error };
  };

  const deleteBadge = async (id: string) => {
    const { error } = await supabase
      .from('user_badges')
      .delete()
      .eq('id', id);

    if (!error) {
      setBadges(prev => prev.filter(badge => badge.id !== id));
    }

    return { error };
  };

  const reorderBadges = async (newOrder: UserBadge[]) => {
    // Salvar estado anterior para possível reversão
    const previousBadges = [...badges];
    
    // Atualizar estado local imediatamente
    const updatedOrder = newOrder.map((badge, index) => ({ ...badge, sort_order: index }));
    setBadges(updatedOrder);
    
    // Update sort_order for all badges in background
    const updates = Promise.all(
      newOrder.map((badge, index) =>
        supabase
          .from('user_badges')
          .update({ sort_order: index } as any)
          .eq('id', badge.id)
      )
    );

    const results = await updates;
    const error = results.find(r => r.error)?.error;

    if (error) {
      // Reverter em caso de erro
      setBadges(previousBadges);
      return { error };
    }

    return { error: null };
  };

  return { badges, loading, updateBadge, deleteBadge, reorderBadges };
}

export function useAllBadges() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBadges() {
      const { data } = await supabase
        .from('badges')
        .select('*')
        .eq('is_active', true);

      setBadges(data || []);
      setLoading(false);
    }

    fetchBadges();
  }, []);

  return { badges, loading };
}

export interface UserWidget {
  id: string;
  user_id: string;
  widget_type: 'discord' | 'valorant' | 'roblox';
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export function useUserWidgets(userId?: string, includeHidden = false, refreshKey?: number) {
  const { user } = useAuth();
  const [widgets, setWidgets] = useState<UserWidget[]>([]);
  const [loading, setLoading] = useState(true);

  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchWidgets() {
      try {
        let query = (supabase as any)
          .from('user_widgets')
          .select('*')
          .eq('user_id', targetUserId);

        if (!includeHidden) {
          query = query.eq('is_visible', true);
        }

        const { data, error } = await query.order('sort_order', { ascending: true });

        if (cancelled) return;

        if (error) {
          console.error('Error fetching widgets:', error);
          setWidgets([]);
          setLoading(false);
          return;
        }

        const sortedData = (data || []).sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
        setWidgets(sortedData as UserWidget[]);
        setLoading(false);
      } catch (err) {
        console.error('Error in fetchWidgets:', err);
        setWidgets([]);
        setLoading(false);
      }
    }

    fetchWidgets();

    // Escutar mudanças em tempo real
    const channel = supabase
      .channel(`user_widgets:${targetUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_widgets',
          filter: `user_id=eq.${targetUserId}`,
        },
        () => {
          if (!cancelled) {
            setTimeout(() => {
              if (!cancelled) {
                fetchWidgets();
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
  }, [targetUserId, includeHidden, refreshKey]);

  const addWidget = async (widgetType: 'discord' | 'valorant' | 'roblox') => {
    if (!targetUserId) return { error: new Error('Usuário não encontrado') };

    // Verificar se já existe
    const { data: existing, error: existingError } = await (supabase as any)
      .from('user_widgets')
      .select('id')
      .eq('user_id', targetUserId)
      .eq('widget_type', widgetType)
      .maybeSingle();

    if (existingError) {
      // Não bloquear criação por erro "no rows" / 406 (quando ainda não existe)
      console.warn('Error checking existing widget:', existingError);
    }

    if (existing) {
      return { error: new Error('Widget já existe') };
    }

    // Pegar o maior sort_order
    const { data: maxOrder, error: maxOrderError } = await (supabase as any)
      .from('user_widgets')
      .select('sort_order')
      .eq('user_id', targetUserId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (maxOrderError) {
      console.warn('Error fetching max widget order:', maxOrderError);
    }

    const newSortOrder = (maxOrder?.sort_order ?? -1) + 1;

    const { data, error } = await (supabase as any)
      .from('user_widgets')
      .insert({
        user_id: targetUserId,
        widget_type: widgetType,
        sort_order: newSortOrder,
        is_visible: true,
      })
      .select()
      .single();

    if (!error && data) {
      setWidgets(prev => [...prev, data as UserWidget].sort((a, b) => a.sort_order - b.sort_order));
    }

    return { error, data };
  };

  const updateWidget = async (id: string, updates: Partial<UserWidget>) => {
    const { error } = await (supabase as any)
      .from('user_widgets')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      setWidgets(prev => prev.map(widget => widget.id === id ? { ...widget, ...updates } : widget));
    }

    return { error };
  };

  const deleteWidget = async (id: string) => {
    const { error } = await (supabase as any)
      .from('user_widgets')
      .delete()
      .eq('id', id);

    if (!error) {
      setWidgets(prev => prev.filter(widget => widget.id !== id));
    }

    return { error };
  };

  const reorderWidgets = async (newOrder: UserWidget[]) => {
    const previousWidgets = [...widgets];
    
    const updatedOrder = newOrder.map((widget, index) => ({ ...widget, sort_order: index }));
    setWidgets(updatedOrder);
    
    const updates = Promise.all(
      newOrder.map((widget, index) =>
        (supabase as any)
          .from('user_widgets')
          .update({ sort_order: index, updated_at: new Date().toISOString() })
          .eq('id', widget.id)
      )
    );

    const results = await updates;
    const error = results.find(r => r.error)?.error;

    if (error) {
      setWidgets(previousWidgets);
      return { error };
    }

    return { error: null };
  };

  return { widgets, loading, addWidget, updateWidget, deleteWidget, reorderWidgets };
}
