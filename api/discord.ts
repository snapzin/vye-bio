/**
 * API proxy para buscar dados do Discord via Victims API
 * Resolve problemas de CORS fazendo a requisição do servidor
 */

import { setCorsHeaders, handleCorsPreflight } from './_lib/utils/cors.js';
import { handleError, getStatusCode } from './_lib/utils/errors.js';
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

  if (req.method === 'OPTIONS') {
    if (handleCorsPreflight(origin, res)) {
      return res.status(204).end();
    }
    return res.status(403).end();
  }

  if (req.method !== 'GET') {
    setCorsHeaders(origin, res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extrair userId da query string
    const url = new URL(req.url || '', 'http://localhost');
    const userId = url.searchParams.get('userId');

    if (!userId) {
      setCorsHeaders(origin, res);
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
        setCorsHeaders(origin, res);
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

    setCorsHeaders(origin, res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Error in Discord API proxy:', error);
    const statusCode = getStatusCode(error);
    const errorResponse = handleError(error, statusCode);

    setCorsHeaders(origin, res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(statusCode).json(errorResponse);
  }
}

