/**
 * Vercel Serverless Function para login por email/senha
 * ATUALIZADO: Removidos fallbacks inseguros, adicionadas validações e rate limiting
 */

import { createToken } from './jwt.js';
import { isValidEmail } from '../utils/validation.js';
import { setCorsHeaders, handleCorsPreflight } from '../utils/cors.js';
import { handleError, getStatusCode } from '../utils/errors.js';
import { setSecurityHeaders } from '../utils/securityHeaders.js';
import { checkRateLimit, getRateLimitIdentifier, rateLimitConfigs } from '../middleware/rateLimit.js';

interface VercelRequest {
  method?: string;
  headers?: {
    [key: string]: string | string[] | undefined;
    origin?: string;
    'x-forwarded-for'?: string;
    'x-real-ip'?: string;
  };
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

// Função para verificar senha (bcrypt) - SEM FALLBACK INSEGURO
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const bcrypt = await import('bcryptjs');
    return await bcrypt.default.compare(password, hash);
  } catch (error) {
    console.error('Password verification error:', error);
    // Se bcryptjs não estiver disponível, FALHA explicitamente
    throw new Error('bcryptjs não está disponível. Sistema de autenticação não pode funcionar sem esta dependência.');
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const origin = req.headers?.origin as string | undefined;
  setSecurityHeaders(res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    if (handleCorsPreflight(origin, res)) {
      return res.status(204).end();
    }
    return res.status(403).end();
  }

  // Rate limiting
  const identifier = getRateLimitIdentifier(req);
  const rateLimitResult = checkRateLimit(identifier, rateLimitConfigs.auth);
  if (!rateLimitResult.allowed) {
    setCorsHeaders(origin, res);
    res.setHeader('X-RateLimit-Limit', rateLimitConfigs.auth.maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000).toString());
    res.setHeader('Retry-After', Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString());
    res.setHeader('Content-Type', 'application/json');
    return res.status(429).json({
      error: 'Muitas tentativas de login. Tente novamente mais tarde.',
      retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
    });
  }

  if (req.method !== 'POST') {
    setCorsHeaders(origin, res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body || {};

  // Validação de entrada
  if (!email || !password) {
    setCorsHeaders(origin, res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  if (!isValidEmail(email)) {
    setCorsHeaders(origin, res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ error: 'Email inválido' });
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
      throw new Error('Erro ao buscar perfil no banco de dados');
    }

    if (!profile || !profile.password_hash) {
      setCorsHeaders(origin, res);
      res.setHeader('Content-Type', 'application/json');
      // Mesma mensagem para não revelar se email existe
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    // Verifica a senha
    const isValid = await verifyPassword(password, profile.password_hash);
    
    if (!isValid) {
      setCorsHeaders(origin, res);
      res.setHeader('Content-Type', 'application/json');
      // Mesma mensagem para não revelar se email existe
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    // Gera token JWT usando função centralizada
    const token = createToken({
      userId: profile.user_id,
      email: profile.email,
    });

    setCorsHeaders(origin, res);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-RateLimit-Limit', rateLimitConfigs.auth.maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000).toString());
    
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
    const statusCode = getStatusCode(error);
    const errorResponse = handleError(error, res, () => setCorsHeaders(origin, res));
    
    setCorsHeaders(origin, res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(statusCode).json(errorResponse);
  }
}

