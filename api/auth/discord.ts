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
  const cleanEnv = (v?: string) =>
    typeof v === 'string'
      ? v
          .replace(/\\r\\n/g, '')
          .replace(/\\n/g, '')
          .replace(/\\r/g, '')
          .replace(/[\r\n]/g, '')
          .trim()
      : v;

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
  const DISCORD_CLIENT_ID = cleanEnv(process.env.DISCORD_CLIENT_ID || process.env.VITE_DISCORD_CLIENT_ID);
  const DISCORD_REDIRECT_URI =
    cleanEnv(process.env.DISCORD_REDIRECT_URI || process.env.VITE_DISCORD_REDIRECT_URI) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api/auth/discord/callback` : undefined);
  const DISCORD_SCOPE = 'identify email';

  if (!DISCORD_CLIENT_ID) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: 'Discord client ID not configured' });
  }

  if (!DISCORD_REDIRECT_URI) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: 'Discord redirect URI not configured' });
  }

  // Gera um state aleatório para segurança
  const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  // Armazena o state em um cookie seguro (será verificado no callback)
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = [
    `discord_oauth_state=${state}`,
    'HttpOnly',
    isProduction ? 'Secure' : '',
    'SameSite=Lax',
    'Path=/',
    'Max-Age=600'
  ].filter(Boolean).join('; ');
  res.setHeader('Set-Cookie', cookieOptions);

  // Constrói a URL de autorização do Discord
  const authUrl = new URL('https://discord.com/api/oauth2/authorize');
  authUrl.searchParams.set('client_id', DISCORD_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', DISCORD_REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', DISCORD_SCOPE);
  authUrl.searchParams.set('state', state);

  // Modo debug: retorna JSON com a URL gerada (não redireciona)
  // Use: /api/auth/discord?debug=1
  if (req.query?.debug === '1') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      ok: true,
      clientId: DISCORD_CLIENT_ID,
      redirectUri: DISCORD_REDIRECT_URI,
      scope: DISCORD_SCOPE,
      authUrl: authUrl.toString(),
      note:
        'Se o Discord mostrar "redirect_uri inválido", então esse redirectUri NÃO está cadastrado na Application desse clientId no Discord Developer Portal (OAuth2 -> Redirects).',
    });
  }

  // Redireciona para o Discord
  return res.redirect(authUrl.toString());
}

