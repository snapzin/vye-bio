-- Create premium_transactions table
CREATE TABLE IF NOT EXISTS public.premium_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  misticpay_transaction_id TEXT NOT NULL UNIQUE,
  app_transaction_id TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'COMPLETO', 'FALHA', 'EXPIRADO')),
  qr_code TEXT,
  qr_code_base64 TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_premium_transactions_user_id ON public.premium_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_transactions_status ON public.premium_transactions(status);
CREATE INDEX IF NOT EXISTS idx_premium_transactions_misticpay_id ON public.premium_transactions(misticpay_transaction_id);
CREATE INDEX IF NOT EXISTS idx_premium_transactions_expires_at ON public.premium_transactions(expires_at);

-- Enable RLS
ALTER TABLE public.premium_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own transactions" ON public.premium_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.premium_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON public.premium_transactions
  FOR UPDATE USING (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE public.premium_transactions IS 'Stores premium payment transactions from MisticPay';
COMMENT ON COLUMN public.premium_transactions.misticpay_transaction_id IS 'Transaction ID from MisticPay API';
COMMENT ON COLUMN public.premium_transactions.app_transaction_id IS 'Internal transaction ID for tracking';
COMMENT ON COLUMN public.premium_transactions.status IS 'Transaction status: PENDENTE, COMPLETO, FALHA, EXPIRADO';
COMMENT ON COLUMN public.premium_transactions.expires_at IS 'When the transaction expires (typically 15 minutes after creation)';

