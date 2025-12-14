/**
 * MisticPay API Client
 * 
 * Documentação: https://api.misticpay.com/api
 */

// Usa proxy no desenvolvimento para evitar CORS
// O proxy faz rewrite de /api/misticpay para /api, então usamos apenas /api/misticpay
const MISTICPAY_API_BASE = import.meta.env.DEV 
  ? '/api/misticpay'
  : 'https://api.misticpay.com/api';

interface CreateTransactionParams {
  amount: number;
  payerName: string;
  payerDocument: string;
  transactionId: string;
  description: string;
  projectWebhook?: string;
  splitUser?: string;
  splitTax?: number;
}

interface CreateTransactionResponse {
  message: string;
  data: {
    transactionId: string;
    payer: {
      name: string;
      document: string;
    };
    transactionFee: number;
    transactionType: string;
    transactionMethod: string;
    transactionAmount: number;
    transactionState: string;
    qrCodeBase64: string;
    qrcodeUrl: string;
    copyPaste: string;
  };
}

interface CheckTransactionResponse {
  message: string;
  transaction: {
    transactionId: string;
    value: number;
    fee: number;
    transactionState: 'PENDENTE' | 'COMPLETO' | 'FALHA';
    transactionType: string;
    transactionMethod: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface WebhookPayload {
  transactionId: number;
  transactionType: string;
  transactionMethod: string;
  clientName: string;
  clientDocument: string;
  status: 'COMPLETO' | 'PENDENTE' | 'FALHA';
  value: number;
  fee: number;
}

class MisticPayClient {
  private clientId: string;
  private clientSecret: string;

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${MISTICPAY_API_BASE}${endpoint}`;
    
    // Em desenvolvimento, o proxy adiciona os headers automaticamente
    // Em produção, precisamos adicionar manualmente
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (!import.meta.env.DEV) {
      // Apenas adiciona headers de autenticação em produção
      headers['ci'] = this.clientId;
      headers['cs'] = this.clientSecret;
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('MisticPay Error Response:', errorText);
      throw new Error(`MisticPay API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Cria uma nova transação de pagamento
   */
  async createTransaction(
    params: CreateTransactionParams
  ): Promise<CreateTransactionResponse> {
    return this.request<CreateTransactionResponse>('/transactions/create', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Verifica o status de uma transação
   * 
   * ⚠️ Rate Limit: 60 requisições por minuto por IP
   */
  async checkTransaction(
    transactionId: string | number
  ): Promise<CheckTransactionResponse> {
    return this.request<CheckTransactionResponse>('/transactions/check', {
      method: 'POST',
      body: JSON.stringify({ transactionId }),
    });
  }
}

/**
 * Cria uma instância do cliente MisticPay
 * 
 * @param clientId - Client ID da MisticPay
 * @param clientSecret - Client Secret da MisticPay
 */
export function createMisticPayClient(
  clientId: string,
  clientSecret: string
): MisticPayClient {
  return new MisticPayClient(clientId, clientSecret);
}

/**
 * Cliente singleton usando variáveis de ambiente
 */
export const misticPay = (() => {
  const clientId = import.meta.env.VITE_MISTICPAY_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_MISTICPAY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn('MisticPay credentials not configured. Payment features will not work.');
    return null;
  }

  return createMisticPayClient(clientId, clientSecret);
})();

export type {
  CreateTransactionParams,
  CreateTransactionResponse,
  CheckTransactionResponse,
  WebhookPayload,
};

