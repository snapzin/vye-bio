/**
 * Utilitários para criar e verificar JWT tokens
 * Sistema de autenticação próprio sem Supabase Auth
 */

import * as crypto from 'crypto';

// JWT_SECRET é obrigatório - não usar fallback inseguro
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.VITE_JWT_SECRET;
  
  if (!secret) {
    throw new Error(
      'JWT_SECRET não configurado. Configure a variável de ambiente JWT_SECRET ou VITE_JWT_SECRET.'
    );
  }

  if (secret === 'your-secret-key-change-in-production') {
    throw new Error(
      'JWT_SECRET não pode usar o valor padrão. Configure uma chave única e forte em produção.'
    );
  }

  return secret;
}

interface JWTPayload {
  userId: string;
  discordId?: string;
  email?: string;
  iat?: number;
  exp?: number;
}

export function createToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
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

  const signature = createSignature(`${base64Header}.${base64Payload}`);

  return `${base64Header}.${base64Payload}.${signature}`;
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [header, payload, signature] = parts;
    
    // Tenta verificar assinatura, mas não falha se JWT_SECRET não estiver configurado
    // (para permitir verificação em ambientes onde secret pode não estar disponível)
    try {
      const expectedSignature = createSignature(`${header}.${payload}`);
      if (signature !== expectedSignature) {
        return null;
      }
    } catch (error) {
      // Se JWT_SECRET não estiver configurado, não pode verificar
      console.error('JWT_SECRET not configured for verification');
      return null;
    }

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

function createSignature(data: string): string {
  const JWT_SECRET = getJWTSecret();
  return crypto
    .createHmac('sha256', JWT_SECRET)
    .update(data)
    .digest('base64url');
}

