/**
 * Vercel Serverless Function para processar o callback do OAuth2 do Discord
 */

import * as crypto from 'crypto';
import { createToken } from '../jwt.js';

interface VercelRequest {
  method?: string;
  query: {
    [key: string]: string | string[] | undefined;
    code?: string;
    state?: string;
    error?: string;
  };
  body?: any;
  url?: string;
  headers?: {
    [key: string]: string | string[] | undefined;
    cookie?: string;
  };
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (data: any) => void;
  redirect: (url: string) => void;
  setHeader: (name: string, value: string) => void;
  end: () => void;
}

interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  global_name: string | null;
  avatar: string | null;
  email: string | null;
  verified: boolean;
}

interface JWTPayload {
  userId: string;
  discordId?: string;
  email?: string;
  iat?: number;
  exp?: number;
}


export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method not allowed' });
  }

    // Tenta pegar das variáveis de ambiente (prioriza sem VITE_ para serverless functions)
    const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || process.env.VITE_DISCORD_CLIENT_ID;
    const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || process.env.VITE_DISCORD_CLIENT_SECRET;
    const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || process.env.VITE_DISCORD_REDIRECT_URI || `${req.url?.split('/api')[0] || 'http://localhost:8080'}/api/auth/discord/callback`;
    // Para Supabase, tenta sem VITE_ primeiro (serverless functions não têm acesso a VITE_*)
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: 'Discord credentials not configured' });
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  // Verifica se houve erro no OAuth
  if (req.query.error) {
    return res.redirect(`/?error=${encodeURIComponent(req.query.error as string)}`);
  }

  // Verifica se temos o código de autorização
  if (!req.query.code) {
    return res.redirect('/?error=missing_code');
  }

  // Verifica o state (segurança) - mas não bloqueia se não houver cookie (pode ser primeira vez)
  const cookies = req.headers?.cookie || '';
  const stateCookie = cookies.split(';').find(c => c.trim().startsWith('discord_oauth_state='));
  const stateFromCookie = stateCookie?.split('=')[1]?.trim();
  
  // Se temos state no query, valida contra o cookie
  if (req.query.state && stateFromCookie && req.query.state !== stateFromCookie) {
    console.error('State mismatch:', { queryState: req.query.state, cookieState: stateFromCookie });
    return res.redirect('/?error=invalid_state');
  }

  try {
    // Troca o código por um token de acesso
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: req.query.code as string,
        redirect_uri: DISCORD_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Discord token error:', errorData);
      return res.redirect('/?error=token_exchange_failed');
    }

    const tokenData: DiscordTokenResponse = await tokenResponse.json();

    // Busca informações do usuário no Discord
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      return res.redirect('/?error=user_fetch_failed');
    }

    const discordUser: DiscordUser = await userResponse.json();

    console.log('Discord user fetched:', { id: discordUser.id, username: discordUser.username });

    try {
      // Conecta ao Supabase apenas como banco de dados (sem auth)
      const { createClient } = await import('@supabase/supabase-js');
      
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error('Supabase credentials missing:', { hasUrl: !!SUPABASE_URL, hasKey: !!SUPABASE_ANON_KEY });
        return res.redirect('/?error=supabase_not_configured');
      }
      
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log('Supabase client created');
      
      // Busca usuário existente pelo discord_user_id
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('user_id, username')
        .eq('discord_user_id', discordUser.id)
        .maybeSingle();

      let userId: string;
      let username: string;

      if (existingProfile) {
        // Usuário já existe, usa o user_id existente
        userId = existingProfile.user_id;
        username = existingProfile.username;
        
        // Atualiza o avatar caso tenha mudado
        await supabase
          .from('profiles')
          .update({
            avatar_url: discordUser.avatar
              ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
              : null,
            display_name: discordUser.global_name || discordUser.username || existingProfile.username,
          })
          .eq('user_id', userId);
      } else {
        // Cria novo usuário diretamente na tabela profiles (sem auth.users)
        // Gera um ID único para o usuário (UUID v4)
        try {
          userId = crypto.randomUUID();
        } catch {
          // Fallback: gera UUID manualmente
          userId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        }
        username = (discordUser.global_name || discordUser.username || `user_${discordUser.id.substring(0, 8)}`)
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '');

        // Verifica se o username já existe e adiciona sufixo se necessário
        let finalUsername = username;
        let counter = 1;
        while (true) {
          const { data: existing } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('username', finalUsername)
            .maybeSingle();
          
          if (!existing) break;
          finalUsername = `${username}${counter}`;
          counter++;
        }

        // Cria o perfil diretamente
        console.log('Creating profile:', { userId, username: finalUsername });
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            username: finalUsername,
            display_name: discordUser.global_name || discordUser.username || finalUsername,
            avatar_url: discordUser.avatar
              ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
              : null,
            discord_user_id: discordUser.id,
          })
          .select()
          .single();

        if (profileError) {
          console.error('Error creating profile:', profileError);
          console.error('Profile error details:', {
            message: profileError.message,
            code: profileError.code,
            details: profileError.details,
            hint: profileError.hint,
          });
          return res.redirect(`/?error=profile_creation_failed&details=${encodeURIComponent(profileError.message || 'Unknown error')}`);
        }
        
        console.log('Profile created successfully:', profileData);
      }

      // Gera um JWT token próprio usando função centralizada
      let token: string;
      try {
        token = createToken({
          userId,
          discordId: discordUser.id,
          email: discordUser.email || undefined,
        });
      } catch (tokenError: any) {
        console.error('Error creating JWT token:', tokenError);
        return res.redirect(`/?error=jwt_error&details=${encodeURIComponent(tokenError?.message || 'Token creation failed')}`);
      }

      // Redireciona para o frontend com o token JWT
      return res.redirect(`/auth/callback?token=${encodeURIComponent(token)}&discord_id=${discordUser.id}`);
    } catch (error: any) {
      console.error('Supabase operation error:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      });
      return res.redirect(`/?error=supabase_error&details=${encodeURIComponent(error?.message || 'Unknown error')}`);
    }
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    console.error('Error stack:', error?.stack);
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    
    // Retorna erro JSON em vez de redirect se for um erro crítico
    if (error?.message?.includes('JWT_SECRET')) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ 
        error: 'JWT_SECRET não configurado',
        details: 'Configure a variável de ambiente JWT_SECRET no Vercel'
      });
    }
    
    return res.redirect(`/?error=oauth_error&details=${encodeURIComponent(error?.message || 'Unknown error')}`);
  }
}

