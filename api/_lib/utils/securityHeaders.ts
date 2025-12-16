/**
 * Headers de segurança para proteger contra ataques comuns
 */

interface VercelResponse {
  setHeader: (name: string, value: string) => void;
}

/**
 * Aplica headers de segurança nas respostas
 */
export function setSecurityHeaders(res: VercelResponse): void {
  // Content Security Policy - previne XSS
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
  );

  // X-Frame-Options - previne clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // X-Content-Type-Options - previne MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // X-XSS-Protection - proteção adicional XSS (legacy)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer-Policy - controla informações de referrer
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy - controla features do navegador
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );

  // Strict-Transport-Security - força HTTPS (apenas em produção)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
}

