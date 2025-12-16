/**
 * VisionWallet API Client
 * 
 * Documentação: https://api.visionwallet.com.br
 */

// Usa proxy no desenvolvimento para evitar CORS
const VISIONWALLET_API_BASE = import.meta.env.DEV 
  ? '/api/visionwallet'
  : 'https://api.visionwallet.com.br';

interface CreatePaymentParams {
  value: number; // Valor em reais (mínimo: 1.00, máximo: 1000.00)
  description?: string;
  coverFee?: boolean; // Se true, o valor é líquido e a taxa é adicionada
  splitUser?: string; // Email de outro usuário para dividir
  splitTax?: number; // Porcentagem para split (1-100)
}

interface CreatePaymentResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    transactionId: string;
    value: number; // Em centavos
    valueInReais: number; // Em reais
    netValue: number; // Valor líquido em centavos
    fee: number; // Taxa em centavos
    status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'FAILED';
    qrcodeUrl: string; // Base64 data URI
    copyPaste: string; // Código PIX
    createdAt: string;
  };
}

interface CheckPaymentResponse {
  success: boolean;
  data: {
    id: string;
    transactionId: string;
    value: number;
    valueInReais: number;
    netValue: number;
    fee: number;
    status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'FAILED';
    qrcodeUrl?: string;
    copyPaste?: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface VisionWalletError {
  success: false;
  error: string;
  message: string;
  retryAfter?: number;
}

class VisionWalletClient {
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("VisionWallet: API Key is required.");
    }
    this.apiKey = apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${VISIONWALLET_API_BASE}${endpoint}`;
    
    const headers: HeadersInit = {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Verificar rate limit
      if (response.status === 429) {
        let errorData: VisionWalletError;
        try {
          errorData = await response.json();
        } catch {
          errorData = { success: false, error: "Too Many Requests", message: "Rate limit exceeded" };
        }
        const retryAfter = errorData.retryAfter || 1;
        console.error('VisionWallet Rate Limit:', errorData);
        throw new Error(`VisionWallet Rate Limit: ${errorData.message}. Retry after ${retryAfter} seconds.`);
      }

      if (!response.ok) {
        let errorText: string;
        try {
          errorText = await response.text();
        } catch {
          errorText = `HTTP ${response.status} ${response.statusText}`;
        }
        
        console.error('VisionWallet API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        
        let errorData: VisionWalletError;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error(`VisionWallet API Error: ${response.status} - ${errorText}`);
        }
        throw new Error(`VisionWallet API Error: ${errorData.message || errorData.error || errorText}`);
      }

      const json = await response.json();
      
      if (!json.success) {
        const errorData = json as VisionWalletError;
        console.error('VisionWallet API returned success=false:', errorData);
        throw new Error(`VisionWallet API Error: ${errorData.message || errorData.error}`);
      }

      return json;
    } catch (error: any) {
      console.error('VisionWallet Request Error:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      throw error;
    }
  }

  /**
   * Cria um novo pagamento PIX
   * 
   * @param params Parâmetros do pagamento
   * @returns Dados do pagamento criado
   */
  async createPayment(
    params: CreatePaymentParams
  ): Promise<CreatePaymentResponse> {
    // Validar valor
    if (params.value < 1 || params.value > 1000) {
      throw new Error("VisionWallet: Valor deve estar entre R$ 1,00 e R$ 1.000,00");
    }

    return this.request<CreatePaymentResponse>('/api/v1/payment/create', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Verifica o status de um pagamento
   * 
   * @param paymentId ID do pagamento
   * @returns Status do pagamento
   */
  async checkPayment(
    paymentId: string
  ): Promise<CheckPaymentResponse> {
    return this.request<CheckPaymentResponse>(`/api/v1/payment/get/${paymentId}`, {
      method: 'GET',
    });
  }

  /**
   * Lista pagamentos (com cache de 60 segundos)
   * 
   * @param limit Limite de resultados
   * @returns Lista de pagamentos
   */
  async listPayments(limit: number = 10): Promise<any> {
    return this.request(`/api/v1/payment/list?limit=${limit}`, {
      method: 'GET',
    });
  }
}

/**
 * Factory function para criar cliente VisionWallet
 */
export function createVisionWalletClient(apiKey: string): VisionWalletClient {
  return new VisionWalletClient(apiKey);
}

/**
 * Cliente singleton usando variável de ambiente
 */
export const visionWallet = (() => {
  const apiKey = import.meta.env.VITE_VISIONWALLET_API_KEY;

  if (!apiKey) {
    console.warn('VisionWallet API Key not configured. Payment features will not work.');
    return null;
  }

  return createVisionWalletClient(apiKey);
})();

export type {
  CreatePaymentParams,
  CreatePaymentResponse,
  CheckPaymentResponse,
};

