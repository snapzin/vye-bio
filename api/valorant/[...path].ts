/**
 * Vercel Serverless Function para fazer proxy da API do Valorant
 * Resolve problemas de CORS em produção
 */

// Declaração de tipo para process.env no ambiente do Vercel
declare const process: {
  env: {
    [key: string]: string | undefined;
  };
} | undefined;

export default async function handler(req: Request) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace('/api/valorant', '');
  
  // Constrói a URL da API do Valorant
  const valorantApiUrl = `https://api.henrikdev.xyz/valorant${path}${url.search}`;
  
  // Pega a API key do ambiente (se configurada)
  // No Vercel, variáveis de ambiente podem ser acessadas via process.env
  const apiKey = process?.env?.VITE_HENRIKDEV_KEY || process?.env?.HENRIKDEV_KEY;
  
  // Headers para a requisição
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (apiKey) {
    headers['Authorization'] = apiKey;
  }
  
  try {
    const response = await fetch(valorantApiUrl, {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined,
    });
    
    const data = await response.text();
    
    return new Response(data, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Erro ao fazer proxy para API do Valorant:', error);
    return new Response(
      JSON.stringify({ 
        status: 500, 
        message: 'Erro ao conectar com a API do Valorant',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

