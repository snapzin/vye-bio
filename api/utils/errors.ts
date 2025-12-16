/**
 * Utilitário para tratamento de erros
 * Evita expor detalhes internos em produção
 */

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (data: any) => void;
  setHeader: (name: string, value: string) => void;
}

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Formata erro para resposta HTTP
 * Em produção, não expõe detalhes internos
 */
export function formatError(error: any): { error: string; details?: string } {
  // Log detalhes no servidor (sempre)
  console.error('Error:', {
    message: error?.message,
    stack: error?.stack,
    code: error?.code,
  });

  // Em produção, retorna apenas mensagem genérica
  if (isProduction) {
    return {
      error: getGenericErrorMessage(error),
    };
  }

  // Em desenvolvimento, retorna detalhes
  return {
    error: getGenericErrorMessage(error),
    details: error?.message || 'Unknown error',
  };
}

/**
 * Retorna mensagem de erro genérica baseada no tipo
 */
function getGenericErrorMessage(error: any): string {
  if (error?.message === 'UNAUTHORIZED') {
    return 'Não autorizado. Faça login para continuar.';
  }

  if (error?.message === 'FORBIDDEN') {
    return 'Acesso negado. Você não tem permissão para esta operação.';
  }

  if (error?.message?.includes('JWT')) {
    return 'Token inválido. Faça login novamente.';
  }

  if (error?.message?.includes('rate limit')) {
    return 'Muitas tentativas. Tente novamente mais tarde.';
  }

  // Erro genérico
  return 'Ocorreu um erro. Tente novamente mais tarde.';
}

/**
 * Retorna código HTTP apropriado para o erro
 */
export function getStatusCode(error: any): number {
  if (error?.message === 'UNAUTHORIZED') {
    return 401;
  }

  if (error?.message === 'FORBIDDEN') {
    return 403;
  }

  if (error?.message?.includes('not found')) {
    return 404;
  }

  if (error?.message?.includes('rate limit')) {
    return 429;
  }

  if (error?.message?.includes('validation') || error?.message?.includes('invalid')) {
    return 400;
  }

  return 500;
}

/**
 * Handler de erro padrão para APIs
 */
export function handleError(
  error: any,
  res: VercelResponse,
  setCorsHeaders?: () => void
): void {
  const statusCode = getStatusCode(error);
  const errorResponse = formatError(error);

  if (setCorsHeaders) {
    setCorsHeaders();
  }

  res.status(statusCode).json(errorResponse);
}

