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

  // Extrair userId da query string
  let userId: string | null = null;
  
  try {
    // No Vercel, pode vir como req.query ou na URL
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
    const victimsUrl = `https://api.victims.bio/discord/user/${userId}`;

    const victimsResponse = await fetch(victimsUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Vye-Bio/1.0',
      },
    });

      if (!victimsResponse.ok) {
        // Se 404, retornar null para usar fallback no frontend
        if (victimsResponse.status === 404) {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Content-Type', 'application/json');
          return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const errorText = await victimsResponse.text();
        console.error('Victims API error:', {
          status: victimsResponse.status,
          statusText: victimsResponse.statusText,
          errorText: errorText.substring(0, 200)
        });
        throw new Error(
          `Victims API error: ${victimsResponse.status} - ${errorText.substring(0, 100)}`
        );
      }

      let data;
      try {
        data = await victimsResponse.json();
      } catch (parseError: any) {
        console.error('Error parsing JSON from Victims API:', parseError);
        const textResponse = await victimsResponse.text();
        console.error('Raw response:', textResponse.substring(0, 500));
        throw new Error('Resposta inválida da API Victims (não é JSON válido)');
      }

      // Validação mais flexível - aceita qualquer objeto com id
      // A API do Victims pode retornar formatos diferentes
      if (!data || typeof data !== 'object') {
        console.error('Invalid Victims API response: not an object', {
          dataType: typeof data,
          data: String(data).substring(0, 200)
        });
        throw new Error('Resposta inválida da API Victims (não é um objeto)');
      }

      // Verificar se tem id (pode ser string ou número)
      const hasId = data.id !== null && data.id !== undefined;
      
      // Verificar se tem username direto ou dentro de user
      const hasUsername = 
        ('username' in data && (data.username !== null && data.username !== undefined)) ||
        (data.user && data.user.username !== null && data.user.username !== undefined);

      // Aceitar se tiver pelo menos o id (username pode estar ausente em alguns casos)
      if (!hasId) {
        console.error('Invalid Victims API response: missing id', {
          dataKeys: Object.keys(data),
          fullData: JSON.stringify(data).substring(0, 1000)
        });
        throw new Error('Resposta inválida da API Victims (falta id)');
      }

      // Se não tiver username, ainda assim aceitar (pode ser um usuário sem username)
      if (!hasUsername) {
        console.warn('Victims API response missing username, but accepting anyway', {
          dataKeys: Object.keys(data),
          hasUser: !!data.user
        });
      }

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json(data);
  } catch (error: any) {
    console.error('Error in Discord API proxy:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      userId: userId || 'unknown'
    });
    const statusCode = getStatusCode(error);
    const errorResponse = {
      error: error?.message || 'Erro ao buscar dados do Discord',
      status: statusCode,
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    };

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(statusCode).json(errorResponse);
  }
}

