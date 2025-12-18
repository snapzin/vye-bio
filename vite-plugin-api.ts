/**
 * Plugin do Vite para executar funções serverless localmente
 * Elimina a necessidade do Vercel CLI em desenvolvimento
 */

import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

interface VercelRequest {
  method?: string;
  headers?: {
    [key: string]: string | string[] | undefined;
    origin?: string;
    'x-forwarded-for'?: string;
    'x-real-ip'?: string;
  };
  body?: any;
  query?: { [key: string]: string | string[] | undefined };
  url?: string;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (data: any) => void;
  setHeader: (name: string, value: string) => void;
  end: () => void;
}

function createVercelRequest(req: IncomingMessage, body: any): VercelRequest {
  const url = new URL(req.url || '/', 'http://localhost');
  return {
    method: req.method,
    headers: req.headers as any,
    body,
    query: Object.fromEntries(url.searchParams.entries()),
    url: req.url,
  };
}

function createVercelResponse(res: ServerResponse): VercelResponse {
  return {
    status: (code: number) => {
      res.statusCode = code;
      return createVercelResponse(res);
    },
    json: (data: any) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    },
    setHeader: (name: string, value: string) => {
      res.setHeader(name, value);
    },
    end: () => {
      res.end();
    },
  };
}

async function loadFunction(path: string, server: any) {
  try {
    // Usar ssrLoadModule do Vite para carregar TypeScript
    // O path vem como '/api/auth/index.ts', precisamos remover a barra inicial
    const relativePath = path.startsWith('/') ? path.slice(1) : path;
    
    // Usar ssrLoadModule do Vite (aceita caminhos relativos ao root)
    const module = await server.ssrLoadModule(relativePath);
    return module.default;
  } catch (error: any) {
    return null;
  }
}

function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

export function vitePluginApi(): Plugin {
  return {
    name: 'vite-plugin-api',
    configResolved(config) {
      // Carregar variáveis de ambiente do arquivo .env manualmente
      // O Vite só carrega VITE_* por padrão, mas precisamos de todas
      try {
        const fs = require('fs');
        const path = require('path');
        const root = config.root || process.cwd();
        
        // Tentar carregar .env.local primeiro, depois .env
        const envFiles = ['.env.local', '.env'];
        
        for (const envFile of envFiles) {
          const envPath = path.join(root, envFile);
          try {
            if (fs.existsSync(envPath)) {
              const envContent = fs.readFileSync(envPath, 'utf-8');
              envContent.split('\n').forEach((line: string) => {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                  const [key, ...valueParts] = trimmed.split('=');
                  if (key && valueParts.length > 0) {
                    const value = valueParts.join('=').replace(/^["']|["']$/g, '');
                  const keyTrimmed = key.trim();
                  const valueTrimmed = value.trim();
                  process.env[keyTrimmed] = valueTrimmed;
                  // Se começa com VITE_, também criar sem prefixo
                  if (keyTrimmed.startsWith('VITE_')) {
                    const withoutPrefix = keyTrimmed.replace('VITE_', '');
                    if (!process.env[withoutPrefix]) {
                      process.env[withoutPrefix] = valueTrimmed;
                    }
                    // Mapeamentos especiais para compatibilidade
                    if (keyTrimmed === 'VITE_SUPABASE_PUBLISHABLE_KEY') {
                      process.env.SUPABASE_ANON_KEY = valueTrimmed;
                      process.env.SUPABASE_PUBLISHABLE_KEY = valueTrimmed;
                    }
                    if (keyTrimmed === 'VITE_SUPABASE_URL') {
                      process.env.SUPABASE_URL = valueTrimmed;
                    }
                    if (keyTrimmed === 'VITE_JWT_SECRET') {
                      process.env.JWT_SECRET = valueTrimmed;
                    }
                  }
                  }
                }
              });
            }
          } catch (e) {
            // Ignorar erros ao ler arquivo .env
          }
        }
      } catch (e) {
        // Se não conseguir carregar manualmente, usar as do Vite
        const env = config.env;
        Object.keys(env).forEach(key => {
          process.env[key] = env[key];
          if (key.startsWith('VITE_')) {
            const withoutPrefix = key.replace('VITE_', '');
            if (!process.env[withoutPrefix]) {
              process.env[withoutPrefix] = env[key];
            }
            // Mapeamentos especiais para compatibilidade
            if (key === 'VITE_SUPABASE_PUBLISHABLE_KEY') {
              process.env.SUPABASE_ANON_KEY = env[key];
              process.env.SUPABASE_PUBLISHABLE_KEY = env[key];
            }
            if (key === 'VITE_SUPABASE_URL') {
              process.env.SUPABASE_URL = env[key];
            }
            if (key === 'VITE_JWT_SECRET') {
              process.env.JWT_SECRET = env[key];
            }
          }
        });
      }
      
      // Garantir que variáveis do Vite também sejam copiadas (caso o arquivo .env não tenha sido lido)
      const env = config.env;
      Object.keys(env).forEach(key => {
        if (key.startsWith('VITE_')) {
          process.env[key] = env[key];
          const withoutPrefix = key.replace('VITE_', '');
          if (!process.env[withoutPrefix]) {
            process.env[withoutPrefix] = env[key];
          }
          // Mapeamentos especiais para compatibilidade
          if (key === 'VITE_SUPABASE_PUBLISHABLE_KEY') {
            process.env.SUPABASE_ANON_KEY = env[key];
            process.env.SUPABASE_PUBLISHABLE_KEY = env[key];
          }
          if (key === 'VITE_SUPABASE_URL') {
            process.env.SUPABASE_URL = env[key];
          }
          if (key === 'VITE_JWT_SECRET') {
            process.env.JWT_SECRET = env[key];
          }
        }
      });
      
    },
    configureServer(server) {
      // Registrar middleware ANTES dos proxies para garantir que seja executado primeiro
      // Usar uma função que retorna o middleware para garantir ordem correta
      const apiMiddleware = async (req: any, res: any, next: any) => {
        const url = req.url || '';
        
        // Ignorar rotas que já têm proxy específico
        if (url.startsWith('/api/valorant') || 
            url.startsWith('/api/misticpay') || 
            url.startsWith('/api/visionwallet')) {
          return next();
        }

        // Só processar rotas /api/auth, /api/data, /api/admin
        if (!url.startsWith('/api/auth') && 
            !url.startsWith('/api/data') && 
            !url.startsWith('/api/admin')) {
          return next();
        }


        // CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }

        try {
          let body = '';
          
          // Ler body
          req.on('data', (chunk) => {
            body += chunk.toString();
          });
          
          await new Promise<void>((resolve) => {
            req.on('end', () => resolve());
          });

          const parsedBody = body ? JSON.parse(body) : {};
          const vercelReq = createVercelRequest(req as any, parsedBody);
          const vercelRes = createVercelResponse(res);

          // Roteamento
          let handlerPath = '';
          if (url.startsWith('/api/auth') && !url.includes('/discord')) {
            handlerPath = '/api/auth/index.ts';
          } else if (url.startsWith('/api/data')) {
            handlerPath = '/api/data/index.ts';
          } else if (url.startsWith('/api/admin')) {
            handlerPath = '/api/admin/index.ts';
          } else if (url.startsWith('/api/auth/discord/callback')) {
            handlerPath = '/api/auth/discord/callback.ts';
          } else if (url.startsWith('/api/auth/discord')) {
            handlerPath = '/api/auth/discord.ts';
          } else if (url.startsWith('/api/discord')) {
            handlerPath = '/api/discord.ts';
          } else if (url.startsWith('/api/valorant')) {
            handlerPath = '/api/valorant.ts';
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Rota não encontrada' }));
            return;
          }

          // Carregar e executar função
          const handler = await loadFunction(handlerPath, server);
          if (handler) {
            try {
              await handler(vercelReq, vercelRes);
              // Verificar se a resposta foi enviada
              if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Handler não enviou resposta' }));
              }
            } catch (handlerError: any) {
              // IMPORTANTE: Verificar se headers já foram enviados antes de tentar enviar erro
              if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                  error: 'Internal server error'
                }));
              }
            }
          } else {
            if (!res.headersSent) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Função não encontrada' }));
            }
          }
        } catch (error: any) {
          // IMPORTANTE: Verificar se headers já foram enviados antes de tentar enviar erro
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              error: 'Internal server error'
            }));
          }
        }
      };

      // Registrar o middleware ANTES de qualquer outro middleware
      // Isso garante que seja executado antes dos proxies
      server.middlewares.use(apiMiddleware);
    },
  };
}

