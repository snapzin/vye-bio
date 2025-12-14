/**
 * Vercel Serverless Function para fazer proxy da API do Valorant
 * Resolve problemas de CORS em produção
 */

// Tipos para Vercel Request/Response
interface VercelRequest {
  method?: string;
  query: {
    [key: string]: string | string[] | undefined;
    path?: string | string[];
  };
  body?: any;
  url?: string;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  send: (data: string) => VercelResponse;
  json: (data: any) => VercelResponse;
  setHeader: (name: string, value: string) => void;
  end: () => void;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }

  // Extrai o path dos query params (Vercel passa o catch-all como query param)
  // O path pode vir como array ou string
  let pathString = '';
  if (req.query.path) {
    const path = req.query.path;
    pathString = Array.isArray(path) ? path.join('/') : path;
  } else if (req.url) {
    // Fallback: extrai o path da URL se não estiver nos query params
    const urlPath = new URL(req.url, 'http://localhost').pathname;
    pathString = urlPath.replace('/api/valorant', '').replace(/^\//, '');
  }
  
  // Constrói a URL da API do Valorant
  const queryString = req.url?.includes('?') ? req.url.split('?')[1] : '';
  const valorantApiUrl = `https://api.henrikdev.xyz/valorant/${pathString}${queryString ? `?${queryString}` : ''}`;
  
  console.log('Proxy request:', { pathString, valorantApiUrl, method: req.method });
  
  // Pega a API key do ambiente (se configurada)
  const apiKey = process.env.VITE_HENRIKDEV_KEY || process.env.HENRIKDEV_KEY;
  
  // Headers para a requisição
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (apiKey) {
    headers['Authorization'] = apiKey;
  }
  
  try {
    const response = await fetch(valorantApiUrl, {
      method: req.method || 'GET',
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });
    
    const data = await response.text();
    
    // Define headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', response.headers.get('Content-Type') || 'application/json');
    
    return res.status(response.status).send(data);
  } catch (error) {
    console.error('Erro ao fazer proxy para API do Valorant:', error);
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    return res.status(500).json({ 
      status: 500, 
      message: 'Erro ao conectar com a API do Valorant',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

