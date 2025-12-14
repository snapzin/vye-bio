/**
 * Verifica dinamicamente se um username é uma rota reservada
 * Esta função verifica se o pathname corresponderia a uma rota estática
 * antes do catch-all /:username no React Router
 */

// Define as rotas estáticas baseadas no App.tsx
// Esta lista é gerada automaticamente baseada nas rotas definidas
const STATIC_ROUTE_PATHS = [
  '/',
  '/login',
  '/register',
  '/dashboard',
  '/premium',
  '/checkout/premium',
] as const;

/**
 * Verifica se um pathname corresponde a uma rota estática
 * @param pathname - O pathname a ser verificado (ex: '/login')
 * @returns true se o pathname corresponde a uma rota estática
 */
function matchesStaticRoute(pathname: string): boolean {
  const normalizedPath = pathname.toLowerCase().trim();
  
  // Verifica correspondência exata
  if (STATIC_ROUTE_PATHS.some(route => route.toLowerCase() === normalizedPath)) {
    return true;
  }
  
  // Verifica se começa com uma rota estática (para rotas aninhadas)
  // Ex: /checkout/premium bloqueia 'checkout' e 'premium' como username
  for (const route of STATIC_ROUTE_PATHS) {
    if (route === '/') continue; // Ignora a rota raiz
    
    const routeWithoutSlash = route.replace(/^\//, ''); // Remove a barra inicial
    const segments = routeWithoutSlash.split('/');
    
    // Verifica se o pathname corresponde a qualquer segmento da rota
    for (const segment of segments) {
      if (segment && normalizedPath === segment.toLowerCase()) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Verifica se um username é uma rota reservada
 * @param username - O username a ser verificado
 * @returns true se o username é uma rota reservada
 */
export function isReservedRoute(username: string): boolean {
  if (!username) return false;
  
  const lowerUsername = username.toLowerCase().trim();
  
  // Verifica se corresponde a uma rota estática
  if (matchesStaticRoute(`/${lowerUsername}`)) {
    return true;
  }
  
  // Verifica se o username começa com caracteres que indicam uma rota especial
  // Ex: rotas que começam com underscore, ponto, etc.
  if (lowerUsername.startsWith('_') || lowerUsername.startsWith('.')) {
    return true;
  }
  
  // Bloqueia palavras comuns que podem ser rotas futuras
  const commonRouteKeywords = [
    'api',
    'admin',
    'auth',
    'logout',
    'signin',
    'signup',
    'sign-out',
    'sign-in',
    'sign-up',
    'not-found',
    '404',
    '500',
    'error',
  ];
  
  if (commonRouteKeywords.includes(lowerUsername)) {
    return true;
  }
  
  return false;
}

/**
 * Obtém a mensagem de erro para um username reservado
 */
export function getReservedRouteError(username: string): string {
  return "Este username é reservado e não pode ser usado";
}

