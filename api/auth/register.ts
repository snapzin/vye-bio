/**
 * Vercel Serverless Function para registro por email/senha
 * ATUALIZADO: Removidos fallbacks inseguros, adicionadas validações robustas e rate limiting
 */

import crypto from 'crypto';
import { createToken } from './jwt';
import { isValidEmail, isValidUsername, isValidPassword } from '../utils/validation';
import { setCorsHeaders, handleCorsPreflight } from '../utils/cors';
import { handleError, getStatusCode } from '../utils/errors';
import { setSecurityHeaders } from '../utils/securityHeaders';
import { checkRateLimit, getRateLimitIdentifier, rateLimitConfigs } from '../middleware/rateLimit';

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
    username?: string;
  };
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (data: any) => void;
  setHeader: (name: string, value: string) => void;
  end: () => void;
}

// Função para hash de senha (bcrypt) - SEM FALLBACK INSEGURO
async function hashPassword(password: string): Promise<string> {
  try {
    const bcrypt = await import('bcryptjs');
    const salt = await bcrypt.default.genSalt(10);
    return await bcrypt.default.hash(password, salt);
  } catch (error) {
    console.error('Password hashing error:', error);
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

  // Rate limiting (mais restritivo para registro)
  const identifier = getRateLimitIdentifier(req);
  const rateLimitResult = checkRateLimit(identifier, rateLimitConfigs.register);
  if (!rateLimitResult.allowed) {
    setCorsHeaders(origin, res);
    res.setHeader('X-RateLimit-Limit', rateLimitConfigs.register.maxRequests);
    res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000));
    res.setHeader('Retry-After', Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000));
    res.setHeader('Content-Type', 'application/json');
    return res.status(429).json({
      error: 'Muitas tentativas de registro. Tente novamente mais tarde.',
      retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
    });
  }

  if (req.method !== 'POST') {
    setCorsHeaders(origin, res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, username } = req.body || {};

  // Validações robustas
  if (!email || !password || !username) {
    setCorsHeaders(origin, res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ error: 'Email, senha e username são obrigatórios' });
  }

  // Validação de email
  if (!isValidEmail(email)) {
    setCorsHeaders(origin, res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ error: 'Email inválido' });
  }

  // Validação de senha
  if (!isValidPassword(password)) {
    setCorsHeaders(origin, res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ error: 'Senha deve ter no mínimo 8 caracteres' });
  }

  // Validação de username
  if (!isValidUsername(username)) {
    setCorsHeaders(origin, res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ 
      error: 'Username inválido. Deve ter 3-20 caracteres, apenas letras minúsculas e números, e não pode ser uma palavra reservada.' 
    });
  }

  // Tenta pegar das variáveis de ambiente
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
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
      setCorsHeaders(origin, res);
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Verifica se username já existe
    const { data: existingUsername } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('username', username.toLowerCase())
      .maybeSingle();

    if (existingUsername) {
      setCorsHeaders(origin, res);
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Username já está em uso' });
    }

    // Gera ID único para o usuário
    const userId = crypto.randomUUID();

    // Hash da senha (SEM FALLBACK)
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
      throw new Error('Erro ao criar conta');
    }

    // Gera token JWT usando função centralizada
    const token = createToken({
      userId: profile.user_id,
      email: profile.email,
    });

    setCorsHeaders(origin, res);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-RateLimit-Limit', rateLimitConfigs.register.maxRequests);
    res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000));
    
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
    const statusCode = getStatusCode(error);
    const errorResponse = handleError(error, res, () => setCorsHeaders(origin, res));
    
    setCorsHeaders(origin, res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(statusCode).json(errorResponse);
  }
}
