/**
 * API admin para atribuir badges
 * Requer autenticação e permissão de admin
 */

import { requireAuth } from '../../middleware/auth';
import { requireAdmin } from '../../utils/permissions';
import { setCorsHeaders, handleCorsPreflight } from '../../utils/cors';
import { handleError, getStatusCode } from '../../utils/errors';
import { setSecurityHeaders } from '../../utils/securityHeaders';
import { isValidUUID } from '../../utils/validation';

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
    badgeIds?: string[];
    sortOrder?: number;
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

  try {
    // Autenticar e verificar admin
    const auth = requireAuth(req);
    await requireAdmin(auth.userId!);

    const { userId, badgeIds, sortOrder } = req.body || {};

    if (!userId || !isValidUUID(userId)) {
      setCorsHeaders(origin, res);
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'ID do usuário inválido' });
    }

    if (!badgeIds || !Array.isArray(badgeIds) || badgeIds.length === 0) {
      setCorsHeaders(origin, res);
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Lista de badges é obrigatória' });
    }

    // Validar todos os badgeIds
    for (const badgeId of badgeIds) {
      if (!isValidUUID(badgeId)) {
        setCorsHeaders(origin, res);
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ error: 'ID de badge inválido' });
      }
    }

    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase not configured');
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Buscar max sort_order atual
    const { data: existingBadges } = await supabase
      .from('user_badges')
      .select('sort_order')
      .eq('user_id', userId)
      .order('sort_order', { ascending: false })
      .limit(1);

    const maxSortOrder = existingBadges && existingBadges.length > 0 
      ? (existingBadges[0].sort_order || 0)
      : -1;

    // Inserir badges
    const badgesToInsert = badgeIds.map((badgeId, index) => ({
      user_id: userId,
      badge_id: badgeId,
      sort_order: (sortOrder !== undefined ? sortOrder : maxSortOrder + 1) + index,
      is_displayed: true,
    }));

    const { data, error } = await supabase
      .from('user_badges')
      .insert(badgesToInsert)
      .select();

    if (error) {
      // Se for erro de duplicata, retornar erro específico
      if (error.code === '23505') {
        setCorsHeaders(origin, res);
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ error: 'Algumas badges já foram atribuídas a este usuário' });
      }
      throw new Error('Erro ao atribuir badges');
    }

    setCorsHeaders(origin, res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(201).json({ success: true, badges: data });

  } catch (error: any) {
    const statusCode = getStatusCode(error);
    const errorResponse = handleError(error, res, () => setCorsHeaders(origin, res));
    
    setCorsHeaders(origin, res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(statusCode).json(errorResponse);
  }
}

