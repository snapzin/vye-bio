/**
 * API protegida para atualizar link
 * Valida autenticação e permissões
 */

import { requireAuth } from '../middleware/auth';
import { requireResourceAccess } from '../utils/permissions';
import { setCorsHeaders, handleCorsPreflight } from '../utils/cors';
import { handleError, getStatusCode } from '../utils/errors';
import { setSecurityHeaders } from '../utils/securityHeaders';
import { isValidUrl, sanitizeString, isValidUUID } from '../utils/validation';

interface VercelRequest {
  method?: string;
  headers?: {
    [key: string]: string | string[] | undefined;
    authorization?: string;
    cookie?: string;
    origin?: string;
  };
  body?: {
    linkId?: string;
    title?: string;
    url?: string;
    icon?: string;
    sortOrder?: number;
    isVisible?: boolean;
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

    const { linkId, title, url, icon, sortOrder, isVisible } = req.body || {};

    if (!linkId || !isValidUUID(linkId)) {
      setCorsHeaders(origin, res);
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'ID do link inválido' });
    }

    // Buscar link para verificar ownership
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase not configured');
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data: existingLink, error: fetchError } = await supabase
      .from('user_links')
      .select('user_id')
      .eq('id', linkId)
      .maybeSingle();

    if (fetchError || !existingLink) {
      setCorsHeaders(origin, res);
      res.setHeader('Content-Type', 'application/json');
      return res.status(404).json({ error: 'Link não encontrado' });
    }

    // Verificar permissão
    await requireResourceAccess(auth.userId, existingLink.user_id);

    // Validar e preparar dados de atualização
    const updateData: any = {};

    if (title !== undefined) {
      const sanitized = sanitizeString(title);
      if (sanitized.length === 0 || sanitized.length > 100) {
        setCorsHeaders(origin, res);
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ error: 'Título deve ter entre 1 e 100 caracteres' });
      }
      updateData.title = sanitized;
    }

    if (url !== undefined) {
      if (!isValidUrl(url)) {
        setCorsHeaders(origin, res);
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ error: 'URL inválida' });
      }
      updateData.url = url.slice(0, 500);
    }

    if (icon !== undefined) {
      updateData.icon = icon ? sanitizeString(icon).slice(0, 50) : null;
    }

    if (sortOrder !== undefined) {
      updateData.sort_order = sortOrder;
    }

    if (isVisible !== undefined) {
      updateData.is_visible = isVisible;
    }

    // Atualizar link
    const { data, error } = await supabase
      .from('user_links')
      .update(updateData)
      .eq('id', linkId)
      .select()
      .single();

    if (error) {
      throw new Error('Erro ao atualizar link');
    }

    setCorsHeaders(origin, res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ success: true, link: data });

  } catch (error: any) {
    const statusCode = getStatusCode(error);
    const errorResponse = handleError(error, res, () => setCorsHeaders(origin, res));
    
    setCorsHeaders(origin, res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(statusCode).json(errorResponse);
  }
}

