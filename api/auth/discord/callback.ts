/**
 * Vercel Serverless Function para processar o callback do OAuth2 do Discord
 */

import * as crypto from 'crypto';
import { createToken } from '../../_lib/jwt.js';

function cleanEnv(v?: string): string | undefined {
  if (typeof v !== 'string') return v;
  return v
    .replace(/\\r\\n/g, '')
    .replace(/\\n/g, '')
    .replace(/\\r/g, '')
    .replace(/[\r\n]/g, '')
    .trim();
}

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
  // Wrapper global de tratamento de erros para evitar crashes não capturados
  try {
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

    const cleanEnv = (v?: string) =>
      typeof v === 'string'
        ? v
            .replace(/\\r\\n/g, '')
            .replace(/\\n/g, '')
            .replace(/\\r/g, '')
            .replace(/[\r\n]/g, '')
            .replace(/^"(.*)"$/, '$1')
            .trim()
        : v;

    // Tenta pegar das variáveis de ambiente (prioriza sem VITE_ para serverless functions)
    const DISCORD_CLIENT_ID = cleanEnv(process.env.DISCORD_CLIENT_ID || process.env.VITE_DISCORD_CLIENT_ID);
    const DISCORD_CLIENT_SECRET = cleanEnv(process.env.DISCORD_CLIENT_SECRET || process.env.VITE_DISCORD_CLIENT_SECRET);
    const DISCORD_REDIRECT_URI = cleanEnv(
      process.env.DISCORD_REDIRECT_URI ||
        process.env.VITE_DISCORD_REDIRECT_URI ||
        `${req.url?.split('/api')[0] || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:8080')}/api/auth/discord/callback`
    );

    // Supabase (em produção, use SEMPRE SUPABASE_URL/SUPABASE_ANON_KEY no Vercel)
    // Evitamos fallback para VITE_* aqui para não “pegar” valores antigos do frontend e quebrar o backend.
    const SUPABASE_URL = cleanEnv(process.env.SUPABASE_URL);
    const SUPABASE_ANON_KEY = cleanEnv(process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY);
    // Verificar JWT_SECRET também
    const JWT_SECRET = cleanEnv(process.env.JWT_SECRET || process.env.VITE_JWT_SECRET);

    if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
      console.error('Discord credentials missing');
      try {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).json({ 
          error: 'Discord credentials not configured',
          details: 'Configure DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET in Vercel'
        });
      } catch (e) {
        console.error('Error sending Discord credentials error:', e);
        return;
      }
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Supabase credentials missing');
      try {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).json({ 
          error: 'Supabase not configured',
          details: 'Configure SUPABASE_URL and SUPABASE_ANON_KEY in Vercel'
        });
      } catch (e) {
        console.error('Error sending Supabase error:', e);
        return;
      }
    }

    if (!JWT_SECRET) {
      console.error('JWT_SECRET missing');
      try {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).json({ 
          error: 'JWT_SECRET não configurado',
          details: 'Configure a variável de ambiente JWT_SECRET no Vercel'
        });
      } catch (e) {
        console.error('Error sending JWT_SECRET error:', e);
        return;
      }
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
          client_id: (DISCORD_CLIENT_ID || '').trim(),
          client_secret: (DISCORD_CLIENT_SECRET || '').trim(),
          grant_type: 'authorization_code',
          code: (req.query.code as string).trim(),
          redirect_uri: (DISCORD_REDIRECT_URI || '').trim(),
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        const statusCode = tokenResponse.status;
        console.error('Discord token error:', {
          status: statusCode,
          statusText: tokenResponse.statusText,
          error: errorData,
          redirectUri: DISCORD_REDIRECT_URI,
          hasClientId: !!DISCORD_CLIENT_ID,
          hasClientSecret: !!DISCORD_CLIENT_SECRET,
          codeLength: req.query.code?.toString().length,
        });
        
        // Retornar JSON com detalhes do erro para debug
        try {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Content-Type', 'application/json');
          return res.status(500).json({ 
            error: 'Token exchange failed',
            details: errorData,
            status: statusCode,
            redirectUri: DISCORD_REDIRECT_URI,
            debug: {
              clientIdLength: DISCORD_CLIENT_ID?.length || 0,
              clientIdHasWhitespace: /\s/.test(DISCORD_CLIENT_ID || ''),
              clientSecretLength: DISCORD_CLIENT_SECRET?.length || 0,
              clientSecretHasWhitespace: /\s/.test(DISCORD_CLIENT_SECRET || ''),
              redirectUriLength: DISCORD_REDIRECT_URI?.length || 0,
              redirectUriHasWhitespace: /\s/.test(DISCORD_REDIRECT_URI || ''),
            },
            hint: 'invalid_client = DISCORD_CLIENT_ID/DISCORD_CLIENT_SECRET incorretos (ou com whitespace). Confira no Discord Developer Portal e no Vercel.'
          });
        } catch (e) {
          return res.redirect(`/?error=token_exchange_failed&details=${encodeURIComponent(errorData.substring(0, 100))}`);
        }
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

    try {
      // Conecta ao Supabase apenas como banco de dados (sem auth)
      const { createClient } = await import('@supabase/supabase-js');
      
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error('Supabase credentials missing:', { hasUrl: !!SUPABASE_URL, hasKey: !!SUPABASE_ANON_KEY });
        return res.redirect('/?error=supabase_not_configured');
      }
      
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
        // Usa o username do Discord como base, mantendo o máximo possível do nome original
        // Prioriza global_name (nome de exibição), depois username do Discord
        const discordUsername = discordUser.global_name || discordUser.username;
        
        // Sanitiza o username: converte para minúsculas, mantém letras, números, underscore e hífen
        // Remove apenas caracteres especiais inválidos e espaços
        if (discordUsername) {
          username = discordUsername
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '_') // Substitui espaços por underscore
            .replace(/[^a-z0-9_-]/g, '') // Remove caracteres inválidos
            .replace(/^[-_]+|[-_]+$/g, '') // Remove underscores e hífens no início/fim
            .substring(0, 30); // Limita a 30 caracteres
        }
        
        // Se o username resultante estiver vazio ou muito curto, usa fallback
        if (!username || username.length < 3) {
          username = `user_${discordUser.id.substring(0, 8)}`;
        }

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
        const { error: profileError } = await supabase
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
        console.error('Token error details:', {
          message: tokenError?.message,
          stack: tokenError?.stack,
          name: tokenError?.name,
        });
        
        // Se for erro de JWT_SECRET, retornar JSON em vez de redirect
        if (tokenError?.message?.includes('JWT_SECRET')) {
          try {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Type', 'application/json');
            return res.status(500).json({ 
              error: 'JWT_SECRET não configurado',
              details: 'Configure a variável de ambiente JWT_SECRET no Vercel'
            });
          } catch (e) {
            console.error('Error sending JWT_SECRET error response:', e);
            return;
          }
        }
        
        try {
          return res.redirect(`/?error=jwt_error&details=${encodeURIComponent(tokenError?.message || 'Token creation failed')}`);
        } catch (e) {
          console.error('Error redirecting after JWT error:', e);
          return;
        }
      }

      // Redireciona para o frontend com o token JWT
      try {
        return res.redirect(`/auth/callback?token=${encodeURIComponent(token)}&discord_id=${discordUser.id}`);
      } catch (redirectError: any) {
        console.error('Error redirecting to frontend:', redirectError);
        try {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Content-Type', 'application/json');
          return res.status(500).json({ 
            error: 'Erro ao redirecionar',
            details: redirectError?.message || 'Unknown error'
          });
        } catch (e) {
          console.error('Error sending redirect error response:', e);
          return;
        }
      }
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
  } catch (globalError: any) {
    // Captura qualquer erro não tratado anteriormente
    console.error('Unhandled error in Discord callback:', globalError);
    console.error('Stack trace:', globalError?.stack);
    console.error('Error details:', {
      message: globalError?.message,
      name: globalError?.name,
      code: globalError?.code,
      type: typeof globalError,
    });
    
    try {
      // Verificar se é erro de JWT_SECRET
      if (globalError?.message?.includes('JWT_SECRET')) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).json({
          error: 'JWT_SECRET não configurado',
          details: 'Configure a variável de ambiente JWT_SECRET no Vercel'
        });
      }
      
      // Verificar se é erro de importação
      if (globalError?.message?.includes('Cannot find module') || globalError?.code === 'MODULE_NOT_FOUND') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).json({
          error: 'Erro ao carregar módulo',
          details: globalError?.message || 'Module not found'
        });
      }
      
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({
        error: 'Internal server error',
        message: globalError?.message || 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? globalError?.stack : undefined
      });
    } catch (responseError: any) {
      // Se falhar ao enviar resposta, logar o erro
      console.error('Failed to send error response:', responseError);
      console.error('Original error was:', globalError);
      // Tentar retornar um erro básico
      try {
        res.status(500).json({ error: 'Internal server error' });
      } catch (e) {
        // Se tudo falhar, não fazer nada
        console.error('Complete failure in error handling:', e);
      }
    }
  }
}

