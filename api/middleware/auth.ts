/**
 * Middleware de autenticação JWT
 * Valida tokens JWT e extrai informações do usuário
 */

import { verifyToken } from '../auth/jwt.js';

interface AuthenticatedRequest {
  userId?: string;
  email?: string;
  discordId?: string;
}

interface VercelRequest {
  headers?: {
    [key: string]: string | string[] | undefined;
    authorization?: string;
    cookie?: string;
  };
  body?: any;
}

/**
 * Extrai token JWT do header Authorization ou do cookie
 */
export function extractToken(req: VercelRequest): string | null {
  // Tenta pegar do header Authorization
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Tenta pegar do cookie
  const cookies = req.headers?.cookie || '';
  const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('auth_token='));
  if (tokenCookie) {
    return tokenCookie.split('=')[1]?.trim() || null;
  }

  // Tenta pegar do body (para compatibilidade)
  if (req.body?.token) {
    return req.body.token;
  }

  return null;
}

/**
 * Valida token JWT e retorna dados do usuário autenticado
 */
export function authenticateRequest(req: VercelRequest): AuthenticatedRequest | null {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return null;
    }

    const payload = verifyToken(token);
    
    if (!payload || !payload.userId) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      discordId: payload.discordId,
    };
  } catch (error: any) {
    // Se for erro de JWT_SECRET, relançar para ser capturado pelo handler
    if (error?.message?.includes('JWT_SECRET')) {
      throw error;
    }
    // Outros erros são tratados como token inválido
    console.error('Error in authenticateRequest:', error);
    return null;
  }
}

/**
 * Middleware para requerer autenticação
 * Retorna erro 401 se não autenticado
 */
export function requireAuth(req: VercelRequest): AuthenticatedRequest {
  const auth = authenticateRequest(req);
  
  if (!auth) {
    throw new Error('UNAUTHORIZED');
  }

  return auth;
}

