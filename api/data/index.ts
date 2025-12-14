/**
 * API consolidada para gerenciar dados do usuário
 * Suporta: profiles (update), links (create, update, delete)
 */

import { requireAuth } from '../middleware/auth.js';
import { requireResourceAccess } from '../utils/permissions.js';
import { setCorsHeaders, handleCorsPreflight } from '../utils/cors.js';
import { handleError, getStatusCode } from '../utils/errors.js';
import { setSecurityHeaders } from '../utils/securityHeaders.js';
import { isValidUrl, sanitizeString, isValidUUID, isValidEmail } from '../utils/validation.js';

interface VercelRequest {
  method?: string;
  headers?: {
    [key: string]: string | string[] | undefined;
    authorization?: string;
    cookie?: string;
    origin?: string;
  };
  body?: {
    resource?: 'profile' | 'links';
    action?: 'update' | 'create' | 'delete';
    userId?: string;
    linkId?: string;
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    email?: string;
    title?: string;
    url?: string;
    icon?: string;
    sortOrder?: number;
    isVisible?: boolean;
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
    const auth = requireAuth(req);
    const { resource, action, userId, linkId, displayName, bio, avatarUrl, email, title, url, icon, sortOrder, isVisible } = req.body || {};

    if (!resource || !['profile', 'links'].includes(resource)) {
      setCorsHeaders(origin, res);
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Recurso inválido. Use: profile ou links' });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase not configured');
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // PROFILE UPDATE
    if (resource === 'profile') {
      if (action !== 'update') {
        setCorsHeaders(origin, res);
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ error: 'Apenas update é suportado para profile' });
      }

      if (!userId) {
        setCorsHeaders(origin, res);
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ error: 'userId é obrigatório' });
      }

      await requireResourceAccess(auth.userId, userId);

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
          try {
            new URL(avatarUrl);
            updateData.avatar_url = avatarUrl.slice(0, 500);
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

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        throw new Error('Erro ao atualizar perfil');
      }

      setCorsHeaders(origin, res);
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({
        success: true,
        profile: data,
      });
    }

    // LINKS
    if (resource === 'links') {
      if (!action || !['create', 'update', 'delete'].includes(action)) {
        setCorsHeaders(origin, res);
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ error: 'Ação inválida. Use: create, update ou delete' });
      }

      // CREATE
      if (action === 'create') {
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

        const { data, error } = await supabase
          .from('user_links')
          .insert({
            user_id: auth.userId,
            title: sanitizedTitle,
            url: url.slice(0, 500),
            icon: icon ? sanitizeString(icon).slice(0, 50) : null,
            sort_order: sortOrder || 0,
            is_visible: true,
          })
          .select()
          .single();

        if (error) throw new Error('Erro ao criar link');

        setCorsHeaders(origin, res);
        res.setHeader('Content-Type', 'application/json');
        return res.status(201).json({ success: true, link: data });
      }

      // UPDATE ou DELETE - precisa de linkId
      if (!linkId || !isValidUUID(linkId)) {
        setCorsHeaders(origin, res);
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ error: 'ID do link inválido' });
      }

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

      await requireResourceAccess(auth.userId!, existingLink.user_id);

      // DELETE
      if (action === 'delete') {
        const { error } = await supabase
          .from('user_links')
          .delete()
          .eq('id', linkId);

        if (error) throw new Error('Erro ao deletar link');

        setCorsHeaders(origin, res);
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json({ success: true });
      }

      // UPDATE
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

      const { data, error } = await supabase
        .from('user_links')
        .update(updateData)
        .eq('id', linkId)
        .select()
        .single();

      if (error) throw new Error('Erro ao atualizar link');

      setCorsHeaders(origin, res);
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({ success: true, link: data });
    }

  } catch (error: any) {
    const statusCode = getStatusCode(error);
    const errorResponse = handleError(error, res, () => setCorsHeaders(origin, res));
    
    setCorsHeaders(origin, res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(statusCode).json(errorResponse);
  }
}

