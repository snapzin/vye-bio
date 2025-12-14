/**
 * Vercel Serverless Function para iniciar o fluxo OAuth2 do Discord
 */

interface VercelRequest {
  method?: string;
  query: {
    [key: string]: string | string[] | undefined;
  };
  body?: any;
  url?: string;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (data: any) => void;
  redirect: (url: string) => void;
  setHeader: (name: string, value: string) => void;
  end: () => void;
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

  // Tenta pegar das variáveis de ambiente (com ou sem VITE_)
  const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || process.env.VITE_DISCORD_CLIENT_ID;
  const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || process.env.VITE_DISCORD_REDIRECT_URI || `${req.url?.split('/api')[0] || 'http://localhost:8080'}/api/auth/discord/callback`;
  const DISCORD_SCOPE = 'identify email';

  if (!DISCORD_CLIENT_ID) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: 'Discord client ID not configured' });
  }

  // Gera um state aleatório para segurança
  const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  // Armazena o state em um cookie (será verificado no callback)
  res.setHeader('Set-Cookie', `discord_oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600`);

  // Constrói a URL de autorização do Discord
  const authUrl = new URL('https://discord.com/api/oauth2/authorize');
  authUrl.searchParams.set('client_id', DISCORD_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', DISCORD_REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', DISCORD_SCOPE);
  authUrl.searchParams.set('state', state);

  // Redireciona para o Discord
  return res.redirect(authUrl.toString());
}

