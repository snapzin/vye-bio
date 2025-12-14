/**
 * API admin para listar usuários
 * Requer autenticação e permissão de admin
 */

import { requireAuth } from '../../middleware/auth';
import { requireAdmin } from '../../utils/permissions';
import { setCorsHeaders, handleCorsPreflight } from '../../utils/cors';
import { handleError, getStatusCode } from '../../utils/errors';
import { setSecurityHeaders } from '../../utils/securityHeaders';

interface VercelRequest {
  method?: string;
  headers?: {
    [key: string]: string | string[] | undefined;
    authorization?: string;
    cookie?: string;
    origin?: string;
  };
  body?: {
    searchQuery?: string;
    limit?: number;
    offset?: number;
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

    const { searchQuery, limit = 50, offset = 0 } = req.body || {};

    // Validar limites
    const validLimit = Math.min(Math.max(1, limit), 100); // Entre 1 e 100
    const validOffset = Math.max(0, offset);

    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase not configured');
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .range(validOffset, validOffset + validLimit - 1);

    // Aplicar busca se fornecida
    if (searchQuery && typeof searchQuery === 'string' && searchQuery.trim().length > 0) {
      const search = searchQuery.trim().toLowerCase();
      query = query.or(`username.ilike.%${search}%,display_name.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error('Erro ao buscar usuários');
    }

    setCorsHeaders(origin, res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ success: true, users: data || [], limit: validLimit, offset: validOffset });

  } catch (error: any) {
    const statusCode = getStatusCode(error);
    const errorResponse = handleError(error, res, () => setCorsHeaders(origin, res));
    
    setCorsHeaders(origin, res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(statusCode).json(errorResponse);
  }
}

