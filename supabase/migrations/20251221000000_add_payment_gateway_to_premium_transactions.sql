-- Adicionar coluna payment_gateway na tabela premium_transactions
-- Isso permite saber qual gateway de pagamento foi usado (visionwallet ou misticpay)

ALTER TABLE public.premium_transactions 
ADD COLUMN IF NOT EXISTS payment_gateway TEXT CHECK (payment_gateway IN ('visionwallet', 'misticpay'));

-- Adicionar comentário
COMMENT ON COLUMN public.premium_transactions.payment_gateway IS 'Gateway de pagamento usado: visionwallet ou misticpay';

-- Criar índice para consultas mais eficientes
CREATE INDEX IF NOT EXISTS idx_premium_transactions_payment_gateway 
ON public.premium_transactions(payment_gateway);

