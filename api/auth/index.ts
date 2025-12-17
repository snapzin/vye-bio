/**
 * API consolidada para autenticação
 * Suporta: login, register, session
 */

// Wrapper para garantir que sempre retorne JSON, mesmo em caso de erro de importação
export default async function handler(
  req: any,
  res: any
) {
  // Garantir headers CORS e Content-Type ANTES de qualquer coisa
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');
  } catch (e) {
    // Ignorar erros de header
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    try {
      return res.status(204).end();
    } catch (e) {
      return;
    }
  }

  // Garantir que sempre retorna JSON, mesmo se houver erro de importação
  try {
    return await executeHandler(req, res);
  } catch (error: any) {
    // Fallback final - sempre retorna JSON
    try {
      return res.status(500).json({ 
        error: 'Internal server error'
      });
    } catch (e) {
      // Se tudo falhar, não fazer nada
      return;
    }
  }
}

async function executeHandler(
  req: any,
  res: any
) {
  // Importar módulos dinamicamente para capturar erros de importação
  let crypto: any;
  let createToken: any;
  let verifyToken: any;
  let isValidEmail: any;
  let isValidUsername: any;
  let isValidPassword: any;
  let setCorsHeaders: any;
  let handleCorsPreflight: any;
  let handleError: any;
  let getStatusCode: any;
  let formatError: any;
  let setSecurityHeaders: any;
  let checkRateLimit: any;
  let getRateLimitIdentifier: any;
  let rateLimitConfigs: any;

  try {
    // Importar crypto - pode ser default ou namespace
    const cryptoModule = await import('crypto');
    if (cryptoModule.default) {
      crypto = cryptoModule.default;
    } else if (cryptoModule.randomUUID) {
      crypto = cryptoModule;
    } else {
      // Fallback: criar objeto com randomUUID
      crypto = {
        randomUUID: () => {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        }
      };
    }
    const jwtModule = await import('../_lib/jwt.js');
    createToken = jwtModule.createToken;
    verifyToken = jwtModule.verifyToken;
    const validationModule = await import('../_lib/utils/validation.js');
    isValidEmail = validationModule.isValidEmail;
    isValidUsername = validationModule.isValidUsername;
    isValidPassword = validationModule.isValidPassword;
    const corsModule = await import('../_lib/utils/cors.js');
    setCorsHeaders = corsModule.setCorsHeaders;
    handleCorsPreflight = corsModule.handleCorsPreflight;
    const errorsModule = await import('../_lib/utils/errors.js');
    handleError = errorsModule.handleError;
    getStatusCode = errorsModule.getStatusCode;
    formatError = errorsModule.formatError;
    const securityHeadersModule = await import('../_lib/utils/securityHeaders.js');
    setSecurityHeaders = securityHeadersModule.setSecurityHeaders;
    const rateLimitModule = await import('../_lib/middleware/rateLimit.js');
    checkRateLimit = rateLimitModule.checkRateLimit;
    getRateLimitIdentifier = rateLimitModule.getRateLimitIdentifier;
    rateLimitConfigs = rateLimitModule.rateLimitConfigs;
  } catch (importError: any) {
    // Se houver erro de importação, retornar JSON de erro
    try {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ 
        error: 'Internal server error',
        message: 'Erro ao carregar dependências'
      });
    } catch (e) {
      // Se falhar, tentar retornar JSON básico
      try {
        return res.status(500).json({ error: 'Internal server error' });
      } catch (e2) {
        return;
      }
    }
  }

  // Wrapper de erro global para capturar qualquer erro não tratado
  try {
    const origin = req.headers?.origin as string | undefined;
    
    try {
      setSecurityHeaders(res);
    } catch (e) {
      // Se falhar, continuar sem security headers
    }

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      try {
        if (handleCorsPreflight && handleCorsPreflight(origin, res)) {
          return res.status(204).end();
        }
      } catch (e) {
        // Fallback
      }
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return res.status(204).end();
    }

    if (req.method !== 'POST') {
      try {
        if (setCorsHeaders) setCorsHeaders(origin, res);
      } catch (e) {
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
      res.setHeader('Content-Type', 'application/json');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Parse body if it's a string
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        try {
          if (setCorsHeaders) setCorsHeaders(origin, res);
        } catch (e2) {
          res.setHeader('Access-Control-Allow-Origin', '*');
        }
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ error: 'Invalid JSON body' });
      }
    }

    const { action, email, password, username, token } = body || {};

    if (!action || !['login', 'register', 'session'].includes(action)) {
      try {
        if (setCorsHeaders) setCorsHeaders(origin, res);
      } catch (e) {
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Ação inválida. Use: login, register ou session' });
    }

    const cleanEnv = (v?: string) =>
      typeof v === 'string'
        ? v
            // remove sequências escapadas (quando a env foi salva com "\r\n")
            .replace(/\\r\\n/g, '')
            .replace(/\\n/g, '')
            .replace(/\\r/g, '')
            // remove quebras reais
            .replace(/[\r\n]/g, '')
            // remove aspas ao redor
            .replace(/^"(.*)"$/, '$1')
            .trim()
        : v;

    const SUPABASE_URL = cleanEnv(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
    const SUPABASE_ANON_KEY = cleanEnv(
      process.env.SUPABASE_ANON_KEY ||
        process.env.SUPABASE_PUBLISHABLE_KEY ||
        process.env.VITE_SUPABASE_PUBLISHABLE_KEY
    );

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      try {
        if (setCorsHeaders) setCorsHeaders(origin, res);
      } catch (e) {
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Função para verificar senha (bcrypt)
    async function verifyPassword(password: string, hash: string): Promise<boolean> {
      try {
        const bcrypt = await import('bcryptjs');
        return await bcrypt.default.compare(password, hash);
      } catch (error) {
        throw new Error('bcryptjs não está disponível. Sistema de autenticação não pode funcionar sem esta dependência.');
      }
    }

    // Função para hash de senha (bcrypt)
    async function hashPassword(password: string): Promise<string> {
      try {
        const bcrypt = await import('bcryptjs');
        const salt = await bcrypt.default.genSalt(10);
        return await bcrypt.default.hash(password, salt);
      } catch (error) {
        throw new Error('bcryptjs não está disponível. Sistema de autenticação não pode funcionar sem esta dependência.');
      }
    }

    // SESSION - Verificar token
    if (action === 'session') {
      if (!token) {
        try {
          if (setCorsHeaders) setCorsHeaders(origin, res);
        } catch (e) {
          res.setHeader('Access-Control-Allow-Origin', '*');
        }
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ error: 'Token é obrigatório' });
      }

      let payload: any;
      try {
        payload = verifyToken(token);
      } catch (verifyError: any) {
        console.error('Error verifying token:', verifyError);
        try {
          if (setCorsHeaders) setCorsHeaders(origin, res);
        } catch (e) {
          res.setHeader('Access-Control-Allow-Origin', '*');
        }
        res.setHeader('Content-Type', 'application/json');
        if (verifyError?.message?.includes('JWT_SECRET')) {
          return res.status(500).json({ 
            error: 'JWT_SECRET não configurado',
            details: 'Configure a variável de ambiente JWT_SECRET no Vercel',
            valid: false
          });
        }
        return res.status(401).json({ error: 'Token inválido', valid: false });
      }

      if (!payload || !payload.userId) {
        try {
          if (setCorsHeaders) setCorsHeaders(origin, res);
        } catch (e) {
          res.setHeader('Access-Control-Allow-Origin', '*');
        }
        res.setHeader('Content-Type', 'application/json');
        return res.status(401).json({ error: 'Token inválido', valid: false });
      }

      try {
        if (setCorsHeaders) setCorsHeaders(origin, res);
      } catch (e) {
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({
        valid: true,
        userId: payload.userId,
        discordId: payload.discordId,
        email: payload.email,
      });
    }

    // LOGIN
    if (action === 'login') {
      // Rate limiting
      let identifier = '';
      let rateLimitResult: any = null;
      try {
        identifier = getRateLimitIdentifier(req);
        rateLimitResult = checkRateLimit(identifier, rateLimitConfigs.auth);
      } catch (e) {
        // Se rate limit falhar, continuar sem rate limiting
      }

      if (rateLimitResult && !rateLimitResult.allowed) {
        try {
          if (setCorsHeaders) setCorsHeaders(origin, res);
        } catch (e) {
          res.setHeader('Access-Control-Allow-Origin', '*');
        }
        res.setHeader('X-RateLimit-Limit', rateLimitConfigs.auth.maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
        res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000).toString());
        res.setHeader('Retry-After', Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString());
        res.setHeader('Content-Type', 'application/json');
        return res.status(429).json({
          error: 'Muitas tentativas de login. Tente novamente mais tarde.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        });
      }

      if (!email || !password) {
        try {
          if (setCorsHeaders) setCorsHeaders(origin, res);
        } catch (e) {
          res.setHeader('Access-Control-Allow-Origin', '*');
        }
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      if (!isValidEmail || !isValidEmail(email)) {
        try {
          if (setCorsHeaders) setCorsHeaders(origin, res);
        } catch (e) {
          res.setHeader('Access-Control-Allow-Origin', '*');
        }
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ error: 'Email inválido' });
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, email, password_hash, username, display_name, avatar_url')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (profileError || !profile || !profile.password_hash) {
        try {
          if (setCorsHeaders) setCorsHeaders(origin, res);
        } catch (e) {
          res.setHeader('Access-Control-Allow-Origin', '*');
        }
        res.setHeader('Content-Type', 'application/json');
        return res.status(401).json({ error: 'Email ou senha inválidos' });
      }

      const isValid = await verifyPassword(password, profile.password_hash);
      
      if (!isValid) {
        try {
          if (setCorsHeaders) setCorsHeaders(origin, res);
        } catch (e) {
          res.setHeader('Access-Control-Allow-Origin', '*');
        }
        res.setHeader('Content-Type', 'application/json');
        return res.status(401).json({ error: 'Email ou senha inválidos' });
      }

      let jwtToken: string;
      try {
        jwtToken = createToken({
          userId: profile.user_id,
          email: profile.email,
        });
      } catch (tokenError: any) {
        console.error('Error creating JWT token:', tokenError);
        try {
          if (setCorsHeaders) setCorsHeaders(origin, res);
        } catch (e) {
          res.setHeader('Access-Control-Allow-Origin', '*');
        }
        res.setHeader('Content-Type', 'application/json');
        if (tokenError?.message?.includes('JWT_SECRET')) {
          return res.status(500).json({ 
            error: 'JWT_SECRET não configurado',
            details: 'Configure a variável de ambiente JWT_SECRET no Vercel'
          });
        }
        return res.status(500).json({ 
          error: 'Erro ao gerar token de autenticação',
          details: tokenError?.message || 'Unknown error'
        });
      }

      try {
        if (setCorsHeaders) setCorsHeaders(origin, res);
      } catch (e) {
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
      res.setHeader('Content-Type', 'application/json');
      if (rateLimitResult) {
        res.setHeader('X-RateLimit-Limit', rateLimitConfigs.auth.maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
        res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000).toString());
      }
      
      return res.status(200).json({
        token: jwtToken,
        user: {
          id: profile.user_id,
          email: profile.email,
          username: profile.username,
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url,
        },
      });
    }

    // REGISTER
    if (action === 'register') {
      // Rate limiting (mais restritivo para registro)
      let identifier = '';
      let rateLimitResult: any = null;
      try {
        identifier = getRateLimitIdentifier(req);
        rateLimitResult = checkRateLimit(identifier, rateLimitConfigs.register);
      } catch (e) {
        // Se rate limit falhar, continuar sem rate limiting
      }

      if (rateLimitResult && !rateLimitResult.allowed) {
        try {
          if (setCorsHeaders) setCorsHeaders(origin, res);
        } catch (e) {
          res.setHeader('Access-Control-Allow-Origin', '*');
        }
        res.setHeader('X-RateLimit-Limit', rateLimitConfigs.register.maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
        res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000).toString());
        res.setHeader('Retry-After', Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString());
        res.setHeader('Content-Type', 'application/json');
        return res.status(429).json({
          error: 'Muitas tentativas de registro. Tente novamente mais tarde.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        });
      }

      if (!email || !password || !username) {
        try {
          if (setCorsHeaders) setCorsHeaders(origin, res);
        } catch (e) {
          res.setHeader('Access-Control-Allow-Origin', '*');
        }
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ error: 'Email, senha e username são obrigatórios' });
      }

      if (!isValidEmail || !isValidEmail(email)) {
        try {
          if (setCorsHeaders) setCorsHeaders(origin, res);
        } catch (e) {
          res.setHeader('Access-Control-Allow-Origin', '*');
        }
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ error: 'Email inválido' });
      }

      if (!isValidPassword || !isValidPassword(password)) {
        try {
          if (setCorsHeaders) setCorsHeaders(origin, res);
        } catch (e) {
          res.setHeader('Access-Control-Allow-Origin', '*');
        }
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ error: 'Senha deve ter no mínimo 8 caracteres' });
      }

      if (!isValidUsername || !isValidUsername(username)) {
        try {
          if (setCorsHeaders) setCorsHeaders(origin, res);
        } catch (e) {
          res.setHeader('Access-Control-Allow-Origin', '*');
        }
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ 
          error: 'Username inválido. Deve ter 3-20 caracteres, apenas letras minúsculas e números, e não pode ser uma palavra reservada.' 
        });
      }

      // Verifica se email já existe
      const { data: existingEmail } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (existingEmail) {
        try {
          if (setCorsHeaders) setCorsHeaders(origin, res);
        } catch (e) {
          res.setHeader('Access-Control-Allow-Origin', '*');
        }
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      // Verifica se username já existe
      const { data: existingUsername } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('username', username.toLowerCase())
        .maybeSingle();

      if (existingUsername) {
        try {
          if (setCorsHeaders) setCorsHeaders(origin, res);
        } catch (e) {
          res.setHeader('Access-Control-Allow-Origin', '*');
        }
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ error: 'Username já está em uso' });
      }

      const userId = crypto.randomUUID();
      const passwordHash = await hashPassword(password);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          username: username.toLowerCase(),
          display_name: username,
          email: email.toLowerCase(),
          password_hash: passwordHash,
        })
        .select()
        .single();

      if (profileError) {
        console.error('Error creating profile (register):', profileError);
        try {
          if (setCorsHeaders) setCorsHeaders(origin, res);
        } catch (e) {
          res.setHeader('Access-Control-Allow-Origin', '*');
        }
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).json({
          error: 'Erro ao criar conta',
          details: profileError.message,
          code: profileError.code,
          hint: profileError.hint,
        });
      }

      let jwtToken: string;
      try {
        jwtToken = createToken({
          userId: profile.user_id,
          email: profile.email,
        });
      } catch (tokenError: any) {
        console.error('Error creating JWT token:', tokenError);
        try {
          if (setCorsHeaders) setCorsHeaders(origin, res);
        } catch (e) {
          res.setHeader('Access-Control-Allow-Origin', '*');
        }
        res.setHeader('Content-Type', 'application/json');
        if (tokenError?.message?.includes('JWT_SECRET')) {
          return res.status(500).json({ 
            error: 'JWT_SECRET não configurado',
            details: 'Configure a variável de ambiente JWT_SECRET no Vercel'
          });
        }
        return res.status(500).json({ 
          error: 'Erro ao gerar token de autenticação',
          details: tokenError?.message || 'Unknown error'
        });
      }

      try {
        if (setCorsHeaders) setCorsHeaders(origin, res);
      } catch (e) {
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
      res.setHeader('Content-Type', 'application/json');
      if (rateLimitResult) {
        res.setHeader('X-RateLimit-Limit', rateLimitConfigs.register.maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
        res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000).toString());
      }
      
      return res.status(201).json({
        token: jwtToken,
        user: {
          id: profile.user_id,
          email: profile.email,
          username: profile.username,
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url,
        },
      });
    }

  } catch (error: any) {
    // Verificar se a resposta já foi enviada (para evitar erro de headers duplicados)
    try {
      const origin = req.headers?.origin as string | undefined;
      
      // Log do erro para debug
      console.error('Error in auth handler:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });
      
      // Tentar usar os utilitários, mas ter fallback
      try {
        if (setCorsHeaders) setCorsHeaders(origin, res);
      } catch (e) {
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
      
      try {
        res.setHeader('Content-Type', 'application/json');
      } catch (e) {
        // Headers já enviados, não fazer nada
        return;
      }
      
      // Verificar se é erro de JWT_SECRET
      if (error?.message?.includes('JWT_SECRET')) {
        return res.status(500).json({ 
          error: 'JWT_SECRET não configurado',
          details: 'Configure a variável de ambiente JWT_SECRET no Vercel'
        });
      }
      
      // Tentar usar handleError, mas ter fallback
      try {
        if (getStatusCode && formatError) {
          const statusCode = getStatusCode(error);
          const errorResponse = formatError(error);
          return res.status(statusCode).json(errorResponse);
        }
      } catch (handleErrorException) {
        // Fallback se handleError falhar
      }
      
      // Fallback final - sempre retorna JSON
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error?.message || 'Unknown error'
      });
    } catch (finalError: any) {
      // Se falhar ao enviar resposta, pode ser que headers já foram enviados
      // Não fazer nada para evitar erros
      console.error('Failed to send error response:', finalError);
    }
  }
}
