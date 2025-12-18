/**
 * API proxy para buscar dados do Discord via Victims API
 * Resolve problemas de CORS fazendo a requisição do servidor
 */

import { setCorsHeaders, handleCorsPreflight } from './_lib/utils/cors.js';
import { getStatusCode } from './_lib/utils/errors.js';
import { setSecurityHeaders } from './_lib/utils/securityHeaders.js';

interface VercelRequest {
  method?: string;
  headers?: {
    [key: string]: string | string[] | undefined;
    origin?: string;
  };
  query?: {
    userId?: string;
  };
  url?: string;
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

  // Handle CORS preflight - permitir todas as origens como no valorant.ts
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extrair userId da query string
    // No Vercel, pode vir como req.query ou na URL
    let userId: string | null = null;
    
    if (req.query?.userId) {
      userId = Array.isArray(req.query.userId) ? req.query.userId[0] : req.query.userId;
    } else if (req.url) {
      try {
        const url = new URL(req.url, 'http://localhost');
        userId = url.searchParams.get('userId');
      } catch (e) {
        // Se falhar ao criar URL, tentar extrair manualmente
        const match = req.url.match(/[?&]userId=([^&]+)/);
        if (match) {
          userId = decodeURIComponent(match[1]);
        }
      }
    }

    if (!userId) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'userId é obrigatório' });
    }

    // Fazer requisição para a API do Victims
    const victimsResponse = await fetch(
      `https://api.victims.bio/discord/user/${userId}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Vye-Bio/1.0',
        },
      }
    );

    if (!victimsResponse.ok) {
      // Se 404, retornar null para usar fallback no frontend
      if (victimsResponse.status === 404) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const errorText = await victimsResponse.text();
      throw new Error(
        `Victims API error: ${victimsResponse.status} - ${errorText}`
      );
    }

    const data = await victimsResponse.json();

    // Validar resposta
    const isValid = data && (
      // Simple format
      (data.id && 'username' in data && data.username) ||
      // Complex format
      (data.id && 'user' in data && data.user && data.user.id && data.user.username)
    );

    if (!isValid) {
      throw new Error('Resposta inválida da API Victims');
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Error in Discord API proxy:', error);
    const statusCode = getStatusCode(error);
    const errorResponse = {
      error: error?.message || 'Erro ao buscar dados do Discord',
      status: statusCode,
    };

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(statusCode).json(errorResponse);
  }
}

