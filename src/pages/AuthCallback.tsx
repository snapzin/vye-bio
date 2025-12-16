import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "@/lib/toast";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const discordId = searchParams.get('discord_id');

      if (!token) {
        toast.error("Erro ao processar autenticação");
        navigate('/login');
        return;
      }

      try {
        // Armazena o token JWT no localStorage
        localStorage.setItem('auth_token', token);
        
        // Verifica o token na API
        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'session', token }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Token verification error:', error);
          localStorage.removeItem('auth_token');
          toast.error("Erro ao verificar token");
          navigate('/login');
          return;
        }

        const { userId } = await response.json();
        
        if (!userId) {
          localStorage.removeItem('auth_token');
          toast.error("Token inválido");
          navigate('/login');
          return;
        }

        // Dispara evento para atualizar o AuthContext
        window.dispatchEvent(new CustomEvent('auth:login', { detail: { token, userId } }));

        toast.success("Login realizado com sucesso!");
        navigate('/dashboard');
      } catch (error) {
        console.error('Callback error:', error);
        localStorage.removeItem('auth_token');
        toast.error("Erro ao processar autenticação");
        navigate('/login');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Processando autenticação...</p>
      </div>
    </div>
  );
};

export default AuthCallback;

