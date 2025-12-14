import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Interface de usuário própria (sem Supabase Auth)
interface AppUser {
  id: string;
  email?: string;
  discordId?: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithDiscord: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Verifica token JWT no localStorage
  const verifyToken = async (token: string): Promise<AppUser | null> => {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (!data.valid || !data.userId) {
        return null;
      }

      // Busca dados do perfil no Supabase (apenas banco de dados)
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url, email, discord_user_id')
        .eq('user_id', data.userId)
        .maybeSingle();

      if (error || !profile) {
        return null;
      }

      return {
        id: profile.user_id,
        email: profile.email || undefined,
        discordId: profile.discord_user_id || undefined,
        username: profile.username,
        displayName: profile.display_name || undefined,
        avatarUrl: profile.avatar_url || undefined,
      };
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Verifica se há token salvo
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      verifyToken(token).then((userData) => {
        if (!mounted) return;
        setUser(userData);
        setLoading(false);
      }).catch(() => {
        if (!mounted) return;
        localStorage.removeItem('auth_token');
        setUser(null);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }

    // Listener para eventos de login
    const handleLogin = async (event: CustomEvent) => {
      const { token } = event.detail;
      if (token) {
        localStorage.setItem('auth_token', token);
        const userData = await verifyToken(token);
        if (mounted) {
          setUser(userData);
        }
      }
    };

    window.addEventListener('auth:login', handleLogin as EventListener);

    return () => {
      mounted = false;
      window.removeEventListener('auth:login', handleLogin as EventListener);
    };
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    // Mantém compatibilidade com Supabase Auth para registro por email
    // (você pode implementar seu próprio sistema depois)
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username: username.toLowerCase(),
          display_name: username,
        }
      }
    });
    
    if (!error && data.session) {
      // Converte para nosso formato de usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url, email')
        .eq('user_id', data.session.user.id)
        .maybeSingle();

      if (profile) {
        setUser({
          id: profile.user_id,
          email: profile.email || undefined,
          username: profile.username,
          displayName: profile.display_name || undefined,
          avatarUrl: profile.avatar_url || undefined,
        });
      }
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    // Mantém compatibilidade com Supabase Auth para login por email
    // (você pode implementar seu próprio sistema depois)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error) {
      // Busca dados do perfil
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url, email')
          .eq('user_id', authUser.id)
          .maybeSingle();

        if (profile) {
          setUser({
            id: profile.user_id,
            email: profile.email || undefined,
            username: profile.username,
            displayName: profile.display_name || undefined,
            avatarUrl: profile.avatar_url || undefined,
          });
        }
      }
    }

    return { error };
  };

  const signInWithDiscord = async () => {
    // Redireciona para nossa própria API de OAuth
    const apiUrl = import.meta.env.DEV 
      ? '/api/auth/discord'
      : `${window.location.origin}/api/auth/discord`;
    
    window.location.href = apiUrl;
    return { error: null };
  };

  const signOut = async () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    // Limpa sessão do Supabase Auth se existir (para compatibilidade)
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signUp,
      signIn,
      signInWithDiscord,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
