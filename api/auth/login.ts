/**
 * Vercel Serverless Function para login por email/senha
 */

import crypto from 'crypto';

interface VercelRequest {
  method?: string;
  body?: {
    email?: string;
    password?: string;
  };
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (data: any) => void;
  setHeader: (name: string, value: string) => void;
  end: () => void;
}

interface JWTPayload {
  userId: string;
  email?: string;
  iat?: number;
  exp?: number;
}

// Função para criar JWT token
function createJWTToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  const JWT_SECRET = process.env.JWT_SECRET || process.env.VITE_JWT_SECRET || 'your-secret-key-change-in-production';
  
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const jwtPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + (7 * 24 * 60 * 60), // 7 dias
  };

  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Payload = Buffer.from(JSON.stringify(jwtPayload)).toString('base64url');

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${base64Header}.${base64Payload}`)
    .digest('base64url');

  return `${base64Header}.${base64Payload}.${signature}`;
}

// Função para verificar senha (bcrypt)
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    // Usa bcrypt se disponível, senão usa comparação simples (não recomendado para produção)
    const bcrypt = await import('bcryptjs').catch(() => null);
    if (bcrypt) {
      return await bcrypt.default.compare(password, hash);
    }
    // Fallback: apenas para desenvolvimento (NÃO USAR EM PRODUÇÃO)
    console.warn('bcryptjs not available, using simple comparison (NOT SECURE)');
    return password === hash;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body || {};

  if (!email || !password) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ error: 'Email and password required' });
  }

  // Tenta pegar das variáveis de ambiente (prioriza sem VITE_ para serverless functions)
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Busca usuário pelo email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, email, password_hash, username, display_name, avatar_url')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ error: 'Database error' });
    }

    if (!profile || !profile.password_hash) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verifica a senha
    const isValid = await verifyPassword(password, profile.password_hash);
    
    if (!isValid) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Gera token JWT
    const token = createJWTToken({
      userId: profile.user_id,
      email: profile.email,
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      token,
      user: {
        id: profile.user_id,
        email: profile.email,
        username: profile.username,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error?.message || 'Unknown error'
    });
  }
}

