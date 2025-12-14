/**
 * Utilitários para criar e verificar JWT tokens
 * Sistema de autenticação próprio sem Supabase Auth
 */

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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
    const expectedSignature = createSignature(`${header}.${payload}`);

    if (signature !== expectedSignature) {
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
  const crypto = require('crypto');
  return crypto
    .createHmac('sha256', JWT_SECRET)
    .update(data)
    .digest('base64url');
}

