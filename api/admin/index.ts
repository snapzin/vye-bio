/**
 * API consolidada para operações admin
 * Suporta: badges (assign, remove), users (list), premium (activate)
 */

import { requireAuth } from '../_lib/middleware/auth.js';
import { requireAdmin } from '../_lib/utils/permissions.js';
import { setCorsHeaders, handleCorsPreflight } from '../_lib/utils/cors.js';
import { handleError, getStatusCode } from '../_lib/utils/errors.js';
import { setSecurityHeaders } from '../_lib/utils/securityHeaders.js';
import { isValidUUID } from '../_lib/utils/validation.js';

interface VercelRequest {
  method?: string;
  headers?: {
    [key: string]: string | string[] | undefined;
    authorization?: string;
    cookie?: string;
    origin?: string;
  };
  body?: {
    action?: string;
    subAction?: string;
    userId?: string;
    userBadgeId?: string;
    badgeIds?: string[];
    sortOrder?: number;
    isPremium?: boolean;
    expiresAt?: string | null;
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
    const auth = requireAuth(req);
    await requireAdmin(auth.userId!);

    const { action, subAction, userId, userBadgeId, badgeIds, sortOrder, isPremium, expiresAt, searchQuery, limit, offset } = req.body || {};

    if (!action || !['badges', 'users', 'premium'].includes(action)) {
      setCorsHeaders(origin, res);
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Ação inválida. Use: badges, users ou premium' });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase not configured');
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // BADGES
    if (action === 'badges') {
      if (!subAction || !['assign', 'remove'].includes(subAction)) {
        setCorsHeaders(origin, res);
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ error: 'Sub-ação inválida. Use: assign ou remove' });
      }

      // ASSIGN BADGES
      if (subAction === 'assign') {
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

        for (const badgeId of badgeIds) {
          if (!isValidUUID(badgeId)) {
            setCorsHeaders(origin, res);
            res.setHeader('Content-Type', 'application/json');
            return res.status(400).json({ error: 'ID de badge inválido' });
          }
        }

        const { data: existingBadges } = await supabase
          .from('user_badges')
          .select('sort_order')
          .eq('user_id', userId)
          .order('sort_order', { ascending: false })
          .limit(1);

        const maxSortOrder = existingBadges && existingBadges.length > 0 
          ? (existingBadges[0].sort_order || 0)
          : -1;

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
      }

      // REMOVE BADGE
      if (!userBadgeId || !isValidUUID(userBadgeId)) {
        setCorsHeaders(origin, res);
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ error: 'ID da badge inválido' });
      }

      const { error } = await supabase
        .from('user_badges')
        .delete()
        .eq('id', userBadgeId);

      if (error) throw new Error('Erro ao remover badge');

      setCorsHeaders(origin, res);
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({ success: true });
    }

    // USERS - LIST
    if (action === 'users') {
      const validLimit = Math.min(Math.max(1, limit || 50), 100);
      const validOffset = Math.max(0, offset || 0);

      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .range(validOffset, validOffset + validLimit - 1);

      if (searchQuery && typeof searchQuery === 'string' && searchQuery.trim().length > 0) {
        const search = searchQuery.trim().toLowerCase();
        query = query.or(`username.ilike.%${search}%,display_name.ilike.%${search}%`);
      }

      const { data, error } = await query;

      if (error) throw new Error('Erro ao buscar usuários');

      setCorsHeaders(origin, res);
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({ success: true, users: data || [], limit: validLimit, offset: validOffset });
    }

    // PREMIUM - ACTIVATE
    if (!userId || !isValidUUID(userId)) {
      setCorsHeaders(origin, res);
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'ID do usuário inválido' });
    }

    if (typeof isPremium !== 'boolean') {
      setCorsHeaders(origin, res);
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'isPremium deve ser um booleano' });
    }

    let validExpiresAt: string | null = null;
    if (expiresAt !== null && expiresAt !== undefined) {
      if (typeof expiresAt === 'string') {
        const date = new Date(expiresAt);
        if (isNaN(date.getTime())) {
          setCorsHeaders(origin, res);
          res.setHeader('Content-Type', 'application/json');
          return res.status(400).json({ error: 'Data de expiração inválida' });
        }
        validExpiresAt = date.toISOString();
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        is_premium: isPremium,
        premium_expires_at: validExpiresAt,
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error('Erro ao atualizar premium');

    setCorsHeaders(origin, res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ success: true, profile: data });

  } catch (error: any) {
    console.error('Error in admin handler:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    
    // Verificar se é erro de JWT_SECRET
    if (error?.message?.includes('JWT_SECRET')) {
      setCorsHeaders(origin, res);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ 
        error: 'JWT_SECRET não configurado',
        details: 'Configure a variável de ambiente JWT_SECRET no Vercel'
      });
    }
    
    const statusCode = getStatusCode(error);
    const errorResponse = handleError(error, res, () => setCorsHeaders(origin, res));
    
    setCorsHeaders(origin, res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(statusCode).json(errorResponse);
  }
}

