/**
 * API protegida para atualizar perfil
 * Valida autenticação e permissões antes de permitir atualização
 */

import { requireAuth } from '../middleware/auth';
import { requireResourceAccess } from '../utils/permissions';
import { handleError, getStatusCode } from '../utils/errors';
import { setCorsHeaders, handleCorsPreflight } from '../utils/cors';
import { isValidEmail, sanitizeString } from '../utils/validation';

interface VercelRequest {
  method?: string;
  headers?: {
    [key: string]: string | string[] | undefined;
    authorization?: string;
    cookie?: string;
    origin?: string;
  };
  body?: {
    userId?: string;
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    email?: string;
    [key: string]: any;
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

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    if (handleCorsPreflight(origin, res)) {
      return res.status(204).end();
    }
    return res.status(403).end();
  }

  // Apenas POST permitido
  if (req.method !== 'POST') {
    setCorsHeaders(origin, res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Autenticar usuário
    const auth = requireAuth(req);

    // 2. Validar entrada
    const { userId: targetUserId, displayName, bio, avatarUrl, email } = req.body || {};

    if (!targetUserId) {
      setCorsHeaders(origin, res);
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'userId é obrigatório' });
    }

    // 3. Verificar permissão (usuário só pode modificar próprio perfil ou ser admin)
    await requireResourceAccess(auth.userId, targetUserId);

    // 4. Validar dados
    const updateData: any = {};

    if (displayName !== undefined) {
      const sanitized = sanitizeString(displayName);
      if (sanitized.length > 100) {
        setCorsHeaders(origin, res);
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ error: 'displayName muito longo (máximo 100 caracteres)' });
      }
      updateData.display_name = sanitized;
    }

    if (bio !== undefined) {
      const sanitized = sanitizeString(bio);
      if (sanitized.length > 500) {
        setCorsHeaders(origin, res);
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ error: 'bio muito longa (máximo 500 caracteres)' });
      }
      updateData.bio = sanitized;
    }

    if (avatarUrl !== undefined) {
      if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.length > 0) {
        // Validar URL se fornecida
        try {
          new URL(avatarUrl);
          updateData.avatar_url = avatarUrl.slice(0, 500); // Limitar comprimento
        } catch {
          setCorsHeaders(origin, res);
          res.setHeader('Content-Type', 'application/json');
          return res.status(400).json({ error: 'avatarUrl inválida' });
        }
      } else {
        updateData.avatar_url = null;
      }
    }

    if (email !== undefined) {
      if (email && !isValidEmail(email)) {
        setCorsHeaders(origin, res);
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ error: 'Email inválido' });
      }
      updateData.email = email ? email.toLowerCase().trim() : null;
    }

    // 5. Atualizar no Supabase
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase not configured');
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', targetUserId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      throw new Error('Erro ao atualizar perfil');
    }

    // 6. Retornar sucesso
    setCorsHeaders(origin, res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      success: true,
      profile: data,
    });

  } catch (error: any) {
    const statusCode = getStatusCode(error);
    const errorResponse = handleError(error, res, () => setCorsHeaders(origin, res));
    
    setCorsHeaders(origin, res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(statusCode).json(errorResponse);
  }
}

