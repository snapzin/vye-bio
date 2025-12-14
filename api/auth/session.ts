/**
 * Vercel Serverless Function para verificar token JWT e retornar dados do usuário
 * ATUALIZADO: Usa função centralizada de verificação, remove fallback inseguro
 */

import { verifyToken } from './jwt.js';
import { setCorsHeaders, handleCorsPreflight } from '../utils/cors.js';
import { handleError, getStatusCode } from '../utils/errors.js';
import { setSecurityHeaders } from '../utils/securityHeaders.js';

interface VercelRequest {
  method?: string;
  headers?: {
    [key: string]: string | string[] | undefined;
    origin?: string;
  };
  body?: {
    token?: string;
  };
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (data: any) => void;
  setHeader: (name: string, value: string) => void;
  end: () => void;
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

  const { token } = req.body || {};

  if (!token) {
    setCorsHeaders(origin, res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ error: 'Token é obrigatório' });
  }

  try {
    // Verifica o token JWT usando função centralizada
    const payload = verifyToken(token);

    if (!payload || !payload.userId) {
      setCorsHeaders(origin, res);
      res.setHeader('Content-Type', 'application/json');
      return res.status(401).json({ error: 'Token inválido', valid: false });
    }

    // Retorna os dados do token verificado
    setCorsHeaders(origin, res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      valid: true,
      userId: payload.userId,
      discordId: payload.discordId,
      email: payload.email,
    });
  } catch (error: any) {
    const statusCode = getStatusCode(error);
    const errorResponse = handleError(error, res, () => setCorsHeaders(origin, res));
    
    setCorsHeaders(origin, res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(statusCode).json(errorResponse);
  }
}
