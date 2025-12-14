/**
 * Vercel Serverless Function para verificar token JWT e retornar dados do usuário
 * Usado após o OAuth do Discord para verificar a sessão
 */

import crypto from 'crypto';

interface VercelRequest {
  method?: string;
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

interface JWTPayload {
  userId: string;
  discordId?: string;
  email?: string;
  iat?: number;
  exp?: number;
}

// Função para verificar JWT token (implementada inline para evitar problemas de import no Vercel)
function verifyJWTToken(token: string): JWTPayload | null {
  const JWT_SECRET = process.env.JWT_SECRET || process.env.VITE_JWT_SECRET || 'your-secret-key-change-in-production';
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [header, payload, signature] = parts;
    
    // Verifica a assinatura
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (signature !== expectedSignature) {
      return null;
    }

    // Decodifica o payload
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString()) as JWTPayload;

    // Verifica expiração
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
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

  const { token } = req.body || {};

  if (!token) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ error: 'Token required' });
  }

  try {
    // Verifica o token JWT
    const payload = verifyJWTToken(token);

    if (!payload || !payload.userId) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');
      return res.status(401).json({ error: 'Invalid token', valid: false });
    }

    // Retorna os dados do token verificado
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      valid: true,
      userId: payload.userId,
      discordId: payload.discordId,
      email: payload.email,
    });
  } catch (error: any) {
    console.error('Session verification error:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error?.message || 'Unknown error'
    });
  }
}

