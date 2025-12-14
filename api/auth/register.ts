/**
 * Vercel Serverless Function para registro por email/senha
 */

import crypto from 'crypto';

interface VercelRequest {
  method?: string;
  body?: {
    email?: string;
    password?: string;
    username?: string;
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

// Função para hash de senha (bcrypt)
async function hashPassword(password: string): Promise<string> {
  try {
    const bcrypt = await import('bcryptjs').catch(() => null);
    if (bcrypt) {
      const salt = await bcrypt.default.genSalt(10);
      return await bcrypt.default.hash(password, salt);
    }
    // Fallback: apenas para desenvolvimento (NÃO USAR EM PRODUÇÃO)
    console.warn('bcryptjs not available, using simple hash (NOT SECURE)');
    return crypto.createHash('sha256').update(password).digest('hex');
  } catch (error) {
    console.error('Password hashing error:', error);
    throw error;
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

  const { email, password, username } = req.body || {};

  if (!email || !password || !username) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ error: 'Email, password and username required' });
  }

  // Validações básicas
  if (password.length < 8) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  if (!/^[a-z0-9]+$/.test(username.toLowerCase())) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ error: 'Username must contain only lowercase letters and numbers' });
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

    // Verifica se email já existe
    const { data: existingEmail } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existingEmail) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Verifica se username já existe
    const { data: existingUsername } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('username', username.toLowerCase())
      .maybeSingle();

    if (existingUsername) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Gera ID único para o usuário
    const userId = crypto.randomUUID();

    // Hash da senha
    const passwordHash = await hashPassword(password);

    // Cria o perfil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        username: username.toLowerCase(),
        display_name: username,
        email: email.toLowerCase(),
        password_hash: passwordHash,
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error creating profile:', profileError);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ error: 'Failed to create account' });
    }

    // Gera token JWT
    const token = createJWTToken({
      userId: profile.user_id,
      email: profile.email,
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(201).json({
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
    console.error('Registration error:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error?.message || 'Unknown error'
    });
  }
}

