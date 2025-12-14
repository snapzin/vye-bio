import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Check, Loader2, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast";
import { isReservedRoute, getReservedRouteError } from "@/lib/reservedRoutes";

const Register = () => {
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState(searchParams.get("username") || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const { signUp, signInWithDiscord } = useAuth();
  const navigate = useNavigate();

  // Check username availability
  useEffect(() => {
    if (username.length < 1) {
      setUsernameAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.toLowerCase())
        .maybeSingle();
      
      setUsernameAvailable(!data);
      setCheckingUsername(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isUsernameValid) {
      toast.error("O nome de usuário deve ter pelo menos 1 caractere (apenas letras e números)");
      return;
    }

    // Verifica se é uma rota reservada
    if (isReservedRoute(username)) {
      toast.error(getReservedRouteError(username));
      return;
    }

    if (usernameAvailable === false) {
      toast.error("Nome de usuário não disponível");
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(email, password, username);
      
      if (error) {
        console.error("Signup error:", error);
        toast.error(error.message);
      } else {
        toast.success("Conta criada! Bem-vindo ao vye.bio");
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Ocorreu um erro inesperado");
    }
    
    setLoading(false);
  };

  const handleDiscordLogin = async () => {
    const { error } = await signInWithDiscord();
    if (error) {
      toast.error(error.message);
    }
  };

  const isUsernameValid = username.length >= 1 && /^[a-z0-9]+$/.test(username);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Link 
        to="/"
        className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-1.5 sm:gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-xs sm:text-sm">Voltar</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">b</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Crie sua página
          </h1>
          <p className="text-muted-foreground">
            Comece grátis
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                vye.bio/
              </span>
              <Input
                type="text"
                placeholder="nome de usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                className="pl-20 pr-10"
                required
                disabled={loading}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {checkingUsername && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                {!checkingUsername && isUsernameValid && usernameAvailable === true && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
                {!checkingUsername && isUsernameValid && usernameAvailable === false && (
                  <X className="w-4 h-4 text-red-500" />
                )}
              </div>
            </div>
            {isUsernameValid && usernameAvailable === false && (
              <p className="text-xs text-red-500">Nome de usuário já está em uso</p>
            )}
            
            <Input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <Input
              type="password"
              placeholder="Senha (mín. 8 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={loading}
            />
          </div>

          <Button 
            type="submit" 
            variant="default" 
            className="w-full" 
            size="lg" 
            disabled={loading || !isUsernameValid || usernameAvailable === false}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar conta"}
          </Button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-sm text-muted-foreground">ou</span>
            </div>
          </div>

          <Button 
            type="button" 
            variant="secondary" 
            className="w-full gap-2"
            size="lg"
            onClick={handleDiscordLogin}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            Continuar com Discord
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Já tem uma conta?{" "}
          <Link to="/login" className="text-foreground hover:underline">
            Entrar
          </Link>
        </p>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Ao se cadastrar, você concorda com nossos{" "}
          <Link to="/terms" className="hover:underline">Termos</Link>
          {" "}e{" "}
          <Link to="/privacy" className="hover:underline">Política de Privacidade</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
