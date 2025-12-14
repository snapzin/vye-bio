import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, ArrowLeft, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { misticPay } from "@/lib/misticpay";
import { visionWallet } from "@/lib/visionwallet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast";

const PREMIUM_AMOUNT = 1.00;
const EXPIRATION_MINUTES = 15;

/**
 * Gera um CPF válido automaticamente
 * Nota: Este é um CPF gerado para fins de teste/demonstração
 */
function generateCPF(): string {
  // Gera 9 dígitos aleatórios
  const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  
  // Calcula primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * (10 - i);
  }
  let digit1 = 11 - (sum % 11);
  if (digit1 >= 10) digit1 = 0;
  digits.push(digit1);
  
  // Calcula segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += digits[i] * (11 - i);
  }
  let digit2 = 11 - (sum % 11);
  if (digit2 >= 10) digit2 = 0;
  digits.push(digit2);
  
  return digits.join('');
}

export default function PremiumCheckout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  
  const [expirationTime, setExpirationTime] = useState(EXPIRATION_MINUTES * 60);
  const [progress, setProgress] = useState(100);
  const [isPaid, setIsPaid] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null); // VisionWallet payment ID
  const [qrCodeData, setQrCodeData] = useState<string>("");
  const [copyPaste, setCopyPaste] = useState<string>("");
  const [qrCodeBase64, setQrCodeBase64] = useState<string>("");
  const [paymentGateway, setPaymentGateway] = useState<'visionwallet' | 'misticpay' | null>(null);
  
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Função para salvar transação no banco de dados
  const saveTransactionToDatabase = async (tx: {
    misticpayTransactionId: string;
    appTransactionId: string;
    qrCode: string;
    qrCodeBase64: string;
  }) => {
    if (!user) return;

    try {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + EXPIRATION_MINUTES);

      const { error } = await supabase
        .from("premium_transactions")
        .insert({
          user_id: user.id,
          misticpay_transaction_id: tx.misticpayTransactionId,
          app_transaction_id: tx.appTransactionId,
          amount: PREMIUM_AMOUNT,
          status: "PENDENTE",
          qr_code: tx.qrCode,
          qr_code_base64: tx.qrCodeBase64,
          expires_at: expiresAt.toISOString(),
        });

      if (error) {
        // Se a tabela não existe, apenas logar e continuar (não bloquear o fluxo)
        if (error.code === "42P01" || error.status === 406) {
          console.warn("Tabela premium_transactions não encontrada. Transação não foi salva no banco, mas o pagamento continuará funcionando.");
          return;
        }
        console.error("Error saving transaction to database:", error);
        // Não lançar erro para não bloquear o fluxo de pagamento
      }
    } catch (error) {
      console.warn("Error saving transaction to database (non-blocking):", error);
      // Não bloquear o fluxo se houver erro ao salvar
    }
  };

  // Função para recuperar transação pendente do banco de dados
  const loadPendingTransactionFromDatabase = async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("premium_transactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "PENDENTE")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        // Se a tabela não existe ou há problema de permissão, retornar null silenciosamente
        if (error.code === "PGRST116" || error.code === "42P01" || error.status === 406) {
          console.warn("Tabela premium_transactions não encontrada ou sem acesso. Criando nova transação.");
          return null;
        }
        console.error("Error loading transaction from database:", error);
        return null;
      }

      if (!data || data.length === 0) return null;

      const transaction = data[0];

      // Calcular tempo restante
      const expiresAt = new Date(transaction.expires_at);
      const now = new Date();
      const remainingSeconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));

      if (remainingSeconds <= 0) {
        // Marcar como expirada (tentar, mas não bloquear se falhar)
        try {
          await supabase
            .from("premium_transactions")
            .update({ status: "EXPIRADO" })
            .eq("id", transaction.id);
        } catch (updateError) {
          console.warn("Could not update expired transaction:", updateError);
        }
        return null;
      }

      return {
        transactionId: transaction.misticpay_transaction_id,
        qrCodeData: transaction.qr_code || "",
        copyPaste: transaction.qr_code || "",
        qrCodeBase64: transaction.qr_code_base64 || "",
        expirationTime: remainingSeconds,
      };
    } catch (error) {
      console.error("Error loading transaction from database:", error);
      return null;
    }
  };

  // Carregar ou criar transação ao montar o componente
  useEffect(() => {
    const loadOrCreateTransaction = async () => {
      if (!user || !profile) {
        // Aguardar carregamento do usuário/perfil
        return;
      }

      // Verificar qual gateway de pagamento está configurado (prioridade: VisionWallet)
      const useVisionWallet = !!visionWallet;
      const useMisticPay = !!misticPay;

      if (!useVisionWallet && !useMisticPay) {
        toast.error("Configuração de pagamento não encontrada. Entre em contato com o suporte.");
        console.error("Nenhum gateway configurado. Verifique VITE_VISIONWALLET_API_KEY ou VITE_MISTICPAY_CLIENT_ID");
        navigate("/dashboard?tab=premium");
        return;
      }

      // Definir gateway a ser usado (prioridade: VisionWallet)
      const gateway = useVisionWallet ? 'visionwallet' : 'misticpay';
      setPaymentGateway(gateway);

      // Tentar recuperar transação pendente do banco de dados
      const stored = await loadPendingTransactionFromDatabase();
      
      if (stored) {
        // Restaurar estado da transação
        setTransactionId(stored.transactionId);
        setQrCodeData(stored.qrCodeData);
        setCopyPaste(stored.copyPaste);
        setQrCodeBase64(stored.qrCodeBase64);
        setExpirationTime(stored.expirationTime);
        setProgress((stored.expirationTime / (EXPIRATION_MINUTES * 60)) * 100);
        
        // Reiniciar polling e timer
        // TODO: Salvar gateway usado no banco de dados para recuperar corretamente
        startPolling(stored.transactionId, gateway);
        startTimer();
        
        toast.info("Transação anterior recuperada. Continue o pagamento.");
      } else {
        // Criar nova transação apenas se não houver uma existente
        // Passar o gateway diretamente para evitar problema de estado assíncrono
        createTransactionWithGateway(gateway);
      }
    };

    loadOrCreateTransaction();
  }, [user, profile]);

  const createTransaction = async () => {
    // Usar o gateway do estado, mas se não estiver definido, tentar detectar
    const gateway = paymentGateway || (visionWallet ? 'visionwallet' : 'misticpay');
    return createTransactionWithGateway(gateway);
  };

  const createTransactionWithGateway = async (gateway: 'visionwallet' | 'misticpay') => {
    
    if (!user || !profile) {
      console.error("Missing required data:", { user: !!user, profile: !!profile });
      toast.error("Dados incompletos. Tente novamente.");
      return;
    }

    if (gateway === 'visionwallet' && !visionWallet) {
      console.error("VisionWallet não configurado");
      toast.error("VisionWallet não está configurado. Verifique VITE_VISIONWALLET_API_KEY");
      return;
    }

    if (gateway === 'misticpay' && !misticPay) {
      console.error("MisticPay não configurado");
      toast.error("MisticPay não está configurado. Verifique VITE_MISTICPAY_CLIENT_ID");
      return;
    }

    setIsCreating(true);
    try {
      const appTransactionId = `PREMIUM-${user.id}-${Date.now()}`;
      if (gateway === 'visionwallet' && visionWallet) {
        // Usar VisionWallet
        const response = await visionWallet.createPayment({
          value: PREMIUM_AMOUNT,
          description: `Premium Mensal - ${profile.username}`,
          coverFee: false,
        });

        setPaymentId(response.data.id);
        setTransactionId(response.data.transactionId);
        setQrCodeData(response.data.copyPaste);
        setCopyPaste(response.data.copyPaste);
        setQrCodeBase64(response.data.qrcodeUrl);

        // Salvar no banco de dados
        await saveTransactionToDatabase({
          misticpayTransactionId: response.data.transactionId,
          appTransactionId: appTransactionId,
          qrCode: response.data.copyPaste,
          qrCodeBase64: response.data.qrcodeUrl,
        });

        // Iniciar polling
        startPolling(response.data.id, 'visionwallet');
        startTimer();
      } else if (gateway === 'misticpay' && misticPay) {
        // Usar MisticPay
        const payerName = profile.display_name || profile.username || "Cliente";
        const payerDocument = generateCPF();
        
        const response = await misticPay.createTransaction({
          amount: PREMIUM_AMOUNT,
          payerName: payerName,
          payerDocument: payerDocument,
          transactionId: appTransactionId,
          description: `Premium Mensal - ${profile.username}`,
          projectWebhook: `${window.location.origin}/api/webhook/misticpay`,
        });

        setTransactionId(response.data.transactionId);
        setQrCodeData(response.data.copyPaste);
        setCopyPaste(response.data.copyPaste);
        setQrCodeBase64(response.data.qrCodeBase64);

        // Salvar no banco de dados
        await saveTransactionToDatabase({
          misticpayTransactionId: response.data.transactionId,
          appTransactionId: appTransactionId,
          qrCode: response.data.copyPaste,
          qrCodeBase64: response.data.qrCodeBase64,
        });

        // Iniciar polling
        startPolling(response.data.transactionId, 'misticpay');
        startTimer();
      } else {
        console.error("No payment gateway available:", { gateway, visionWallet: !!visionWallet, misticPay: !!misticPay });
        throw new Error(`Gateway de pagamento '${gateway}' não está configurado corretamente`);
      }
    } catch (error: any) {
      console.error("Error creating transaction - Full error:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
        response: error.response,
      });
      
      // Verificar se é rate limit
      if (error.message && error.message.includes("Rate Limit")) {
        toast.error(`Limite de requisições atingido. ${error.message}`);
      } else if (error.message && error.message.includes("429")) {
        toast.error("Muitas requisições. Aguarde alguns segundos e tente novamente.");
      } else {
        toast.error(error.message || "Erro ao criar transação. Tente novamente.");
      }
      
      // Não navegar automaticamente, deixar o usuário tentar novamente
      // navigate("/dashboard?tab=premium");
    } finally {
      setIsCreating(false);
    }
  };

  const startPolling = (txId: string, gateway: 'visionwallet' | 'misticpay') => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }

    checkIntervalRef.current = setInterval(async () => {
      if (isPaid) {
        return;
      }

      setIsChecking(true);
      try {
        if (gateway === 'visionwallet' && visionWallet) {
          const response = await visionWallet.checkPayment(txId);
          const status = response.data?.status;
          
          if (status === "COMPLETED") {
            await handlePaymentSuccess(txId, gateway);
          } else if (status === "FAILED") {
            toast.error("Pagamento falhou. Tente novamente.");
            stopPolling();
          }
        } else if (gateway === 'misticpay' && misticPay) {
          const response = await misticPay.checkTransaction(txId);
          const state = response.transaction?.transactionState;
          
          if (state === "COMPLETO") {
            await handlePaymentSuccess(txId, gateway);
          } else if (state === "FALHA") {
            toast.error("Pagamento falhou. Tente novamente.");
            stopPolling();
          }
        }
      } catch (error: any) {
        console.error("Error checking transaction:", error);
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
          txId: txId,
          gateway: gateway
        });
        // Mostrar erro apenas se não for um erro de rede temporário
        if (error.message && !error.message.includes("Failed to fetch") && !error.message.includes("Rate Limit")) {
          toast.error(`Erro ao verificar pagamento: ${error.message}`);
        }
      } finally {
        setIsChecking(false);
      }
    }, 5000); // Verificar a cada 5 segundos
  };

  const stopPolling = () => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
  };

  const startTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    timerIntervalRef.current = setInterval(() => {
      setExpirationTime((prev) => {
        if (prev <= 0) {
          clearInterval(timerIntervalRef.current!);
          stopPolling();
          return 0;
        }
        const newTime = prev - 1;
        const newProgress = (newTime / (EXPIRATION_MINUTES * 60)) * 100;
        setProgress(newProgress);
        return newTime;
      });
    }, 1000);
  };

  const handlePaymentSuccess = async (txId: string, gateway: 'visionwallet' | 'misticpay') => {
    stopPolling();
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    try {
      // Atualizar transação no banco de dados
      const { error: updateError } = await supabase
        .from("premium_transactions")
        .update({ status: "COMPLETO" })
        .eq("misticpay_transaction_id", txId);

      if (updateError) {
        console.error("Error updating transaction status:", updateError);
      }

      // Ativar premium (30 dias)
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      const { error } = await supabase
        .from("profiles")
        .update({
          is_premium: true,
          premium_expires_at: expiresAt.toISOString(),
        })
        .eq("user_id", user!.id);

      if (error) throw error;

      // Criar notificação de ativação do premium
      try {
        await supabase
          .from("notifications")
          .insert({
            user_id: user!.id,
            title: "Premium Ativado! 🎉",
            message: `Seu Premium foi ativado com sucesso! Agora você tem acesso a todos os recursos exclusivos por 30 dias.`,
            type: "success",
            link: null,
          });
      } catch (notificationError) {
        // Não bloquear o fluxo se a notificação falhar
        console.warn("Error creating premium activation notification:", notificationError);
      }

      setIsPaid(true);
      toast.success("Premium ativado com sucesso!");
    } catch (error: any) {
      console.error("Error activating premium:", error);
      toast.error("Erro ao ativar premium. Entre em contato com o suporte.");
    }
  };

  useEffect(() => {
    return () => {
      stopPolling();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Contador regressivo e barra de progresso
  useEffect(() => {
    if (isPaid) return;

    const interval = setInterval(() => {
      setExpirationTime((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        const newTime = prev - 1;
        const totalTime = 15 * 60; // 15 minutos
        const newProgress = (newTime / totalTime) * 100;
        setProgress(newProgress);
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaid]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleBack = () => {
    navigate("/dashboard?tab=premium");
  };

  const handleCompletePurchase = () => {
    navigate("/dashboard?tab=premium");
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(copyPaste);
    toast.success("Código PIX copiado!");
  };

  const handleManualCheck = async () => {
    if (!paymentGateway) {
      toast.error("Gateway de pagamento não configurado.");
      return;
    }

    if (paymentGateway === 'visionwallet' && (!paymentId || !visionWallet)) {
      toast.error("Transação não encontrada.");
      return;
    }

    if (paymentGateway === 'misticpay' && (!transactionId || !misticPay)) {
      toast.error("Transação não encontrada.");
      return;
    }

    setIsChecking(true);
    try {
      if (paymentGateway === 'visionwallet' && paymentId && visionWallet) {
        const response = await visionWallet.checkPayment(paymentId);
        
        const status = response.data?.status;
        
        if (status === "COMPLETED") {
          await handlePaymentSuccess(paymentId, 'visionwallet');
        } else if (status === "FAILED") {
          toast.error("Pagamento falhou. Tente novamente.");
        } else if (status === "PENDING" || status === "ACTIVE") {
          toast.info("Pagamento ainda está pendente. Aguarde alguns instantes.");
        } else {
          toast.warning(`Status desconhecido: ${status}`);
        }
      } else if (paymentGateway === 'misticpay' && transactionId && misticPay) {
        const response = await misticPay.checkTransaction(transactionId);
        
        const state = response.transaction?.transactionState;
        
        if (state === "COMPLETO") {
          await handlePaymentSuccess(transactionId, 'misticpay');
        } else if (state === "FALHA") {
          toast.error("Pagamento falhou. Tente novamente.");
        } else if (state === "PENDENTE") {
          toast.info("Pagamento ainda está pendente. Aguarde alguns instantes.");
        } else {
          toast.warning(`Status desconhecido: ${state}`);
        }
      }
    } catch (error: any) {
      console.error("Manual check error:", error);
      toast.error(error.message || "Erro ao verificar pagamento.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <Button
              variant="ghost"
              onClick={handleBack}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Finalizar Compra Premium
            </h1>
            <p className="text-muted-foreground">
              Complete seu pagamento para ativar o Premium
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Resumo do Pedido */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-500" />
                    <CardTitle>Resumo do Pedido</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-foreground">Premium Mensal</p>
                      <p className="text-sm text-muted-foreground">
                        Acesso completo aos recursos premium
                      </p>
                    </div>
                    <p className="text-lg font-bold text-foreground">R$ 29,90</p>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground">R$ 29,90</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Desconto</span>
                      <span className="text-green-500">-R$ 0,00</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span className="text-foreground">Total</span>
                      <span className="text-foreground">R$ 29,90</span>
                    </div>
                  </div>

                  <div className="pt-4 space-y-2">
                    <h3 className="font-semibold text-foreground text-sm mb-2">
                      Recursos incluídos:
                    </h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Ocultar footer "vye.bio"
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Badges exclusivos
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Personalização avançada
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Suporte prioritário
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Área de Pagamento */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Pagamento via PIX</CardTitle>
                  <CardDescription>
                    Escaneie o QR code ou copie o código PIX para pagar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!isPaid ? (
                    <>
                      {isCreating ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                          <Loader2 className="w-8 h-8 animate-spin text-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Gerando pagamento...
                          </p>
                        </div>
                      ) : transactionId ? (
                    <>
                      {/* Timer e Barra de Progresso */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>Tempo restante para pagamento:</span>
                          </div>
                          <span className={`font-mono font-bold ${
                            expirationTime < 60 ? "text-red-500" : "text-foreground"
                          }`}>
                            {formatTime(expirationTime)}
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        {expirationTime === 0 && (
                          <p className="text-sm text-red-500">
                            Tempo expirado. Por favor, inicie uma nova compra.
                          </p>
                        )}
                      </div>

                      {/* QR Code */}
                          {qrCodeBase64 ? (
                            <div className="flex flex-col items-center p-6 bg-muted/30 rounded-lg border-2 border-dashed border-border">
                              <img
                                src={qrCodeBase64}
                                alt="QR Code PIX"
                                className="w-64 h-64 mb-4"
                              />
                              <p className="text-xs text-muted-foreground text-center max-w-xs">
                                Escaneie este QR code com o app do seu banco para pagar via PIX
                              </p>
                            </div>
                          ) : qrCodeData ? (
                      <div className="flex flex-col items-center p-6 bg-muted/30 rounded-lg border-2 border-dashed border-border">
                        <QRCodeSVG
                          value={qrCodeData}
                          size={256}
                          level="H"
                          includeMargin={true}
                          className="mb-4"
                        />
                        <p className="text-xs text-muted-foreground text-center max-w-xs">
                          Escaneie este QR code com o app do seu banco para pagar via PIX
                        </p>
                      </div>
                          ) : null}

                          {/* Código PIX */}
                          {copyPaste && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Código PIX (Copiar e Colar)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                                  value={copyPaste}
                            className="flex-1 px-3 py-2 text-xs bg-muted border border-border rounded-md text-foreground font-mono"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                                  onClick={handleCopyPix}
                          >
                            Copiar
                          </Button>
                        </div>
                      </div>
                          )}

                          {/* Botão de Verificação Manual */}
                          <div className="pt-2">
                            <Button
                              variant="outline"
                              onClick={handleManualCheck}
                              disabled={isChecking}
                              className="w-full"
                            >
                              {isChecking ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Verificando...
                                </>
                              ) : (
                                "Verificar Pagamento Manualmente"
                              )}
                            </Button>
                          </div>
                        </>
                      ) : null}
                    </>
                  ) : (
                    /* Status de Pagamento Confirmado */
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center p-8 text-center space-y-4"
                    >
                      <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          Pagamento Confirmado!
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Seu Premium foi ativado com sucesso
                        </p>
                      </div>
                      <Button
                        onClick={handleCompletePurchase}
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                      >
                        Ir para Dashboard
                      </Button>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

