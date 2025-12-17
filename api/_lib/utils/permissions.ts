/**
 * Utilitários para verificação de permissões
 */

import { createClient } from '@supabase/supabase-js';

function cleanEnv(v?: string): string | undefined {
  return typeof v === 'string'
    ? v
        .replace(/\\r\\n/g, '')
        .replace(/\\n/g, '')
        .replace(/\\r/g, '')
        .replace(/[\r\n]/g, '')
        .replace(/^"(.*)"$/, '$1')
        .trim()
    : v;
}

// Backend deve usar SEMPRE variáveis sem prefixo VITE_ (Vercel runtime)
const SUPABASE_URL = cleanEnv(process.env.SUPABASE_URL);
const SUPABASE_ANON_KEY = cleanEnv(process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY);

/**
 * Verifica se um usuário é admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Supabase not configured');
    return false;
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }

    return data?.is_admin === true;
  } catch (error) {
    console.error('Error in isAdmin:', error);
    return false;
  }
}

/**
 * Verifica se um usuário pode modificar um recurso
 * Retorna true se:
 * - O usuário é o dono do recurso
 * - O usuário é admin
 */
export async function canModifyResource(
  userId: string,
  resourceUserId: string
): Promise<boolean> {
  // Se for o próprio usuário, pode modificar
  if (userId === resourceUserId) {
    return true;
  }

  // Se for admin, pode modificar
  return await isAdmin(userId);
}

/**
 * Middleware para requerer permissão de admin
 */
export async function requireAdmin(userId: string): Promise<void> {
  const admin = await isAdmin(userId);
  
  if (!admin) {
    throw new Error('FORBIDDEN');
  }
}

/**
 * Middleware para verificar se pode modificar recurso
 */
export async function requireResourceAccess(
  userId: string,
  resourceUserId: string
): Promise<void> {
  const canModify = await canModifyResource(userId, resourceUserId);
  
  if (!canModify) {
    throw new Error('FORBIDDEN');
  }
}

