/**
 * Configuração de CORS
 * Restringe origens permitidas para maior segurança
 */

interface VercelResponse {
  setHeader: (name: string, value: string) => void;
}

/**
 * Lista de origens permitidas
 * Pode ser configurada via variável de ambiente
 */
function getAllowedOrigins(): string[] {
  const envOrigins = process.env.ALLOWED_ORIGINS;
  
  if (envOrigins) {
    return envOrigins.split(',').map(origin => origin.trim());
  }

  // Fallback para desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    return ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:3000'];
  }

  // Em produção, retorna vazio (deve ser configurado)
  return [];
}

/**
 * Valida se uma origem é permitida
 */
export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) {
    return false;
  }

  const allowedOrigins = getAllowedOrigins();
  
  // Se não houver origens configuradas, negar (mais seguro)
  if (allowedOrigins.length === 0) {
    return false;
  }

  return allowedOrigins.includes(origin);
}

/**
 * Configura headers CORS baseado na origem da requisição
 */
export function setCorsHeaders(
  origin: string | undefined,
  res: VercelResponse
): void {
  if (isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin!);
  } else {
    // Se origem não permitida, não definir header (bloqueia)
    // Ou definir como null para negar explicitamente
    res.setHeader('Access-Control-Allow-Origin', 'null');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
}

/**
 * Handler para requisições OPTIONS (preflight)
 */
export function handleCorsPreflight(
  origin: string | undefined,
  res: VercelResponse
): boolean {
  if (isOriginAllowed(origin)) {
    setCorsHeaders(origin, res);
    return true;
  }

  // Origem não permitida
  res.setHeader('Access-Control-Allow-Origin', 'null');
  return false;
}

