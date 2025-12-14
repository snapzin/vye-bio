/**
 * Vercel Serverless Function para fazer proxy da API do Valorant
 * Resolve problemas de CORS em produção
 * 
 * Esta função captura todas as rotas /api/valorant/*
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

  // Extrai o path da URL
  // O Vercel passa o path como query param quando usa rewrites
  let pathString = '';
  
  // Tenta pegar do query param 'path' (quando vem do rewrite)
  if (req.query.path) {
    const path = req.query.path;
    pathString = Array.isArray(path) ? path.join('/') : path;
  }
  // Se não tiver no query, tenta extrair da URL
  else if (req.url) {
    try {
      // Remove o protocolo e host se presente
      let urlPath = req.url;
      if (urlPath.includes('://')) {
        const url = new URL(req.url);
        urlPath = url.pathname;
      } else if (!urlPath.startsWith('/')) {
        urlPath = '/' + urlPath;
      }
      
      // Remove /api/valorant do início
      urlPath = urlPath.replace(/^\/api\/valorant\/?/, '');
      pathString = urlPath.replace(/^\//, '');
    } catch (e) {
      // Se falhar ao criar URL, tenta extrair manualmente
      const match = req.url.match(/\/api\/valorant\/(.+?)(?:\?|$)/);
      if (match) {
        pathString = match[1];
      }
    }
  }
  
  // Se ainda não tiver path, retorna erro
  if (!pathString) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({
      status: 400,
      message: 'Path não fornecido',
      error: 'A rota da API não foi encontrada',
      debug: {
        url: req.url,
        query: req.query,
        method: req.method
      }
    });
  }
  
  // Constrói a URL da API do Valorant
  const queryString = req.url?.includes('?') ? req.url.split('?')[1] : '';
  const valorantApiUrl = `https://api.henrikdev.xyz/valorant/${pathString}${queryString ? `?${queryString}` : ''}`;
  
  // Pega a API key do ambiente (se configurada)
  // No Vercel, variáveis de ambiente VITE_* podem não estar disponíveis no runtime
  // Configure HENRIKDEV_KEY no Vercel (sem prefixo VITE_) OU use VITE_HENRIKDEV_KEY
  const apiKey = process.env.HENRIKDEV_KEY || process.env.VITE_HENRIKDEV_KEY;
  
  // Headers para a requisição
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0',
  };
  
  // A API do HenrikDev usa Authorization header com a API key
  // Pode ser necessário usar "Bearer {key}" ou apenas a key diretamente
  if (apiKey) {
    // Tenta ambos os formatos: direto e com Bearer
    // A maioria das APIs aceita ambos, mas vamos tentar direto primeiro
    headers['Authorization'] = apiKey.startsWith('Bearer ') ? apiKey : apiKey;
    console.log('API Key encontrada e será enviada');
  } else {
    console.warn('API Key não encontrada. Verifique as variáveis de ambiente no Vercel.');
    console.warn('Variáveis disponíveis:', Object.keys(process.env).filter(k => k.includes('HENRIK') || k.includes('VALORANT')));
  }
  
  console.log('Proxy request:', { 
    pathString, 
    valorantApiUrl, 
    method: req.method, 
    hasApiKey: !!apiKey,
    url: req.url 
  });
  
  try {
    const response = await fetch(valorantApiUrl, {
      method: req.method || 'GET',
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });
    
    const data = await response.text();
    
    // Log para debug em caso de erro
    if (!response.ok) {
      console.error('Erro na API do Valorant:', {
        status: response.status,
        statusText: response.statusText,
        url: valorantApiUrl,
        hasApiKey: !!apiKey,
        responsePreview: data.substring(0, 200)
      });
      
      // Se for 401, retorna uma mensagem mais útil
      if (response.status === 401) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');
        return res.status(401).json({
          status: 401,
          message: 'Não autorizado. Verifique se a API key está configurada corretamente no Vercel.',
          error: 'A API do HenrikDev requer autenticação. Configure a variável de ambiente HENRIKDEV_KEY ou VITE_HENRIKDEV_KEY no Vercel.',
          debug: {
            hasApiKey: !!apiKey,
            url: valorantApiUrl
          }
        });
      }
    }
    
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

