/**
 * API consolidada para autenticação
 * Suporta: login, register, session
 */

import crypto from 'crypto';
import { createToken, verifyToken } from './jwt.js';
import { isValidEmail, isValidUsername, isValidPassword } from '../utils/validation.js';
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
    action?: 'login' | 'register' | 'session';
    email?: string;
    password?: string;
    username?: string;
    token?: string;
  };
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (data: any) => void;
  setHeader: (name: string, value: string) => void;
  end: () => void;
}

// Função para verificar senha (bcrypt)
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const bcrypt = await import('bcryptjs');
    return await bcrypt.default.compare(password, hash);
  } catch (error) {
    console.error('Password verification error:', error);
    throw new Error('bcryptjs não está disponível. Sistema de autenticação não pode funcionar sem esta dependência.');
  }
}

// Função para hash de senha (bcrypt)
async function hashPassword(password: string): Promise<string> {
  try {
    const bcrypt = await import('bcryptjs');
    const salt = await bcrypt.default.genSalt(10);
    return await bcrypt.default.hash(password, salt);
  } catch (error) {
    console.error('Password hashing error:', error);
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

  if (req.method !== 'POST') {
    setCorsHeaders(origin, res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, email, password, username, token } = req.body || {};

  if (!action || !['login', 'register', 'session'].includes(action)) {
    setCorsHeaders(origin, res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ error: 'Ação inválida. Use: login, register ou session' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    setCorsHeaders(origin, res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // SESSION - Verificar token
    if (action === 'session') {
      if (!token) {
        setCorsHeaders(origin, res);
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ error: 'Token é obrigatório' });
      }

      const payload = verifyToken(token);

      if (!payload || !payload.userId) {
        setCorsHeaders(origin, res);
        res.setHeader('Content-Type', 'application/json');
        return res.status(401).json({ error: 'Token inválido', valid: false });
      }

      setCorsHeaders(origin, res);
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({
        valid: true,
        userId: payload.userId,
        discordId: payload.discordId,
        email: payload.email,
      });
    }

    // LOGIN
    if (action === 'login') {
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

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, email, password_hash, username, display_name, avatar_url')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (profileError || !profile || !profile.password_hash) {
        setCorsHeaders(origin, res);
        res.setHeader('Content-Type', 'application/json');
        return res.status(401).json({ error: 'Email ou senha inválidos' });
      }

      const isValid = await verifyPassword(password, profile.password_hash);
      
      if (!isValid) {
        setCorsHeaders(origin, res);
        res.setHeader('Content-Type', 'application/json');
        return res.status(401).json({ error: 'Email ou senha inválidos' });
      }

      const jwtToken = createToken({
        userId: profile.user_id,
        email: profile.email,
      });

      setCorsHeaders(origin, res);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('X-RateLimit-Limit', rateLimitConfigs.auth.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000).toString());
      
      return res.status(200).json({
        token: jwtToken,
        user: {
          id: profile.user_id,
          email: profile.email,
          username: profile.username,
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url,
        },
      });
    }

    // REGISTER
    if (action === 'register') {
      // Rate limiting (mais restritivo para registro)
      const identifier = getRateLimitIdentifier(req);
      const rateLimitResult = checkRateLimit(identifier, rateLimitConfigs.register);
      if (!rateLimitResult.allowed) {
        setCorsHeaders(origin, res);
        res.setHeader('X-RateLimit-Limit', rateLimitConfigs.register.maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
        res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000).toString());
        res.setHeader('Retry-After', Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString());
        res.setHeader('Content-Type', 'application/json');
        return res.status(429).json({
          error: 'Muitas tentativas de registro. Tente novamente mais tarde.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        });
      }

      if (!email || !password || !username) {
        setCorsHeaders(origin, res);
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ error: 'Email, senha e username são obrigatórios' });
      }

      if (!isValidEmail(email)) {
        setCorsHeaders(origin, res);
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ error: 'Email inválido' });
      }

      if (!isValidPassword(password)) {
        setCorsHeaders(origin, res);
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ error: 'Senha deve ter no mínimo 8 caracteres' });
      }

      if (!isValidUsername(username)) {
        setCorsHeaders(origin, res);
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ 
          error: 'Username inválido. Deve ter 3-20 caracteres, apenas letras minúsculas e números, e não pode ser uma palavra reservada.' 
        });
      }

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

      const userId = crypto.randomUUID();
      const passwordHash = await hashPassword(password);

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

      const jwtToken = createToken({
        userId: profile.user_id,
        email: profile.email,
      });

      setCorsHeaders(origin, res);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('X-RateLimit-Limit', rateLimitConfigs.register.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000).toString());
      
      return res.status(201).json({
        token: jwtToken,
        user: {
          id: profile.user_id,
          email: profile.email,
          username: profile.username,
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url,
        },
      });
    }

  } catch (error: any) {
    const statusCode = getStatusCode(error);
    const errorResponse = handleError(error, res, () => setCorsHeaders(origin, res));
    
    setCorsHeaders(origin, res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(statusCode).json(errorResponse);
  }
}

