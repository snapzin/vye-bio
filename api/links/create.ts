/**
 * API protegida para criar link
 * Valida autenticação e permissões
 */

import { requireAuth } from '../middleware/auth';
import { setCorsHeaders, handleCorsPreflight } from '../utils/cors';
import { handleError, getStatusCode } from '../utils/errors';
import { setSecurityHeaders } from '../utils/securityHeaders';
import { isValidUrl, sanitizeString } from '../utils/validation';

interface VercelRequest {
  method?: string;
  headers?: {
    [key: string]: string | string[] | undefined;
    authorization?: string;
    cookie?: string;
    origin?: string;
  };
  body?: {
    title?: string;
    url?: string;
    icon?: string;
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
    // Autenticar usuário
    const auth = requireAuth(req);

    // Validar entrada
    const { title, url, icon, sortOrder } = req.body || {};

    if (!title || !url) {
      setCorsHeaders(origin, res);
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Título e URL são obrigatórios' });
    }

    if (!isValidUrl(url)) {
      setCorsHeaders(origin, res);
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'URL inválida' });
    }

    const sanitizedTitle = sanitizeString(title);
    if (sanitizedTitle.length === 0 || sanitizedTitle.length > 100) {
      setCorsHeaders(origin, res);
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Título deve ter entre 1 e 100 caracteres' });
    }

    // Criar link no Supabase
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase not configured');
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data, error } = await supabase
      .from('user_links')
      .insert({
        user_id: auth.userId,
        title: sanitizedTitle,
        url: url.slice(0, 500), // Limitar comprimento
        icon: icon ? sanitizeString(icon).slice(0, 50) : null,
        sort_order: sortOrder || 0,
        is_visible: true,
      })
      .select()
      .single();

    if (error) {
      throw new Error('Erro ao criar link');
    }

    setCorsHeaders(origin, res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(201).json({ success: true, link: data });

  } catch (error: any) {
    const statusCode = getStatusCode(error);
    const errorResponse = handleError(error, res, () => setCorsHeaders(origin, res));
    
    setCorsHeaders(origin, res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(statusCode).json(errorResponse);
  }
}

