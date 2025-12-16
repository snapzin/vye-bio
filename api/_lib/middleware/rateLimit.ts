/**
 * Rate Limiting Middleware
 * Previne abuso e ataques de força bruta
 */

// Simples rate limiting em memória (para produção, usar Redis/Upstash)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitOptions {
  windowMs: number; // Janela de tempo em milissegundos
  maxRequests: number; // Número máximo de requisições
}

/**
 * Verifica se requisição excede rate limit
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;
  const record = rateLimitStore.get(key);

  // Limpa registros expirados periodicamente
  if (Math.random() < 0.01) {
    // 1% das vezes, limpa registros expirados
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k);
      }
    }
  }

  if (!record || record.resetTime < now) {
    // Nova janela de tempo
    const resetTime = now + options.windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetTime,
    };
  }

  if (record.count >= options.maxRequests) {
    // Excedeu limite
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  // Incrementa contador
  record.count++;
  rateLimitStore.set(key, record);

  return {
    allowed: true,
    remaining: options.maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Obtém identificador único para rate limiting
 */
export function getRateLimitIdentifier(req: any): string {
  // Tenta pegar IP do header (Vercel)
  const forwardedFor = req.headers?.['x-forwarded-for'];
  const realIp = req.headers?.['x-real-ip'];
  
  let ip = 'unknown';
  if (typeof forwardedFor === 'string') {
    ip = forwardedFor.split(',')[0].trim();
  } else if (typeof realIp === 'string') {
    ip = realIp;
  }

  // Se tiver userId no body, usa para rate limiting mais preciso
  if (req.body?.userId) {
    return `user:${req.body.userId}`;
  }

  return `ip:${ip}`;
}

/**
 * Middleware de rate limiting
 */
export function rateLimit(options: RateLimitOptions) {
  return (req: any, res: any, next?: () => void) => {
    const identifier = getRateLimitIdentifier(req);
    const result = checkRateLimit(identifier, options);

    if (!result.allowed) {
      res.setHeader('X-RateLimit-Limit', options.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
      res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
      res.setHeader('Retry-After', Math.ceil((result.resetTime - Date.now()) / 1000).toString());
      res.status(429).json({
        error: 'Muitas requisições. Tente novamente mais tarde.',
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
      });
      return;
    }

    res.setHeader('X-RateLimit-Limit', options.maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());

    if (next) {
      next();
    }
  };
}

// Configurações pré-definidas
export const rateLimitConfigs = {
  // Autenticação: 5 tentativas por minuto
  auth: { windowMs: 60 * 1000, maxRequests: 5 },
  // Registro: 3 tentativas por hora
  register: { windowMs: 60 * 60 * 1000, maxRequests: 3 },
  // Geral: 100 requisições por minuto
  general: { windowMs: 60 * 1000, maxRequests: 100 },
};

