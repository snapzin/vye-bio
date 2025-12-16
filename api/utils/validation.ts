/**
 * Utilitários de validação de entrada
 * Previne dados inválidos e ataques de injeção
 */

/**
 * Lista de usernames reservados
 */
const RESERVED_USERNAMES = [
  'admin', 'administrator', 'root', 'api', 'www', 'mail', 'ftp',
  'localhost', 'test', 'dev', 'development', 'staging', 'prod', 'production',
  'login', 'logout', 'register', 'signup', 'signin', 'signout',
  'dashboard', 'profile', 'settings', 'admin', 'premium', 'notifications',
  'auth', 'oauth', 'discord', 'valorant', 'api', 'static', 'assets',
  'images', 'css', 'js', 'fonts', 'favicon', 'robots', 'sitemap',
];

/**
 * Valida formato de email
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Regex básico para email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return false;
  }

  // Validações adicionais
  if (email.length > 254) { // Limite RFC 5321
    return false;
  }

  if (email.length < 3) { // Mínimo: a@b.c
    return false;
  }

  return true;
}

/**
 * Valida formato de username
 */
export function isValidUsername(username: string): boolean {
  if (!username || typeof username !== 'string') {
    return false;
  }

  // Comprimento: 3-20 caracteres
  if (username.length < 3 || username.length > 20) {
    return false;
  }

  // Apenas letras minúsculas e números
  if (!/^[a-z0-9]+$/.test(username.toLowerCase())) {
    return false;
  }

  // Não pode ser reservado
  if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
    return false;
  }

  return true;
}

/**
 * Valida força de senha
 */
export function isValidPassword(password: string): boolean {
  if (!password || typeof password !== 'string') {
    return false;
  }

  // Mínimo 8 caracteres
  if (password.length < 8) {
    return false;
  }

  // Máximo 128 caracteres (prevenir DoS)
  if (password.length > 128) {
    return false;
  }

  // Opcional: adicionar mais validações (maiúsculas, números, etc.)
  // Por enquanto, apenas comprimento mínimo

  return true;
}

/**
 * Valida formato de URL
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    
    // Apenas HTTP e HTTPS permitidos
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }

    // Validar comprimento
    if (url.length > 2048) { // Limite comum de URL
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitiza string para prevenir XSS
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove caracteres de controle
  return input
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim()
    .slice(0, 10000); // Limite de comprimento
}

/**
 * Valida UUID
 */
export function isValidUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

