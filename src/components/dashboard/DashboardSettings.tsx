import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Trash2, LogOut, Loader2, Save } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast";
import { isReservedRoute, getReservedRouteError } from "@/lib/reservedRoutes";

export function DashboardSettings() {
  const { user, signOut } = useAuth();
  const { profile, updateProfile } = useProfile();
  const [editingUsername, setEditingUsername] = useState(false);
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.username) {
      setUsername(profile.username);
    }
  }, [profile]);

  const validateUsername = (value: string): string | null => {
    if (!value) {
      return "Username é obrigatório";
    }

    // Validar formato: apenas letras, números, underscore e hífen
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(value)) {
      return "Username pode conter apenas letras, números, underscore (_) e hífen (-)";
    }

    // Validar comprimento máximo
    if (value.length > 30) {
      return "Username deve ter no máximo 30 caracteres";
    }

    // Verifica dinamicamente se é uma rota reservada
    if (isReservedRoute(value)) {
      return getReservedRouteError(value);
    }

    return null;
  };

  const checkUsernameAvailability = async (usernameValue: string): Promise<boolean> => {
    if (!usernameValue || usernameValue.toLowerCase() === profile?.username?.toLowerCase()) {
      return true; // Se não mudou, está disponível
    }

    setCheckingUsername(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', usernameValue.toLowerCase())
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return !data; // Disponível se não encontrou nenhum perfil
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    setUsernameError(null);

    const validationError = validateUsername(value);
    if (validationError) {
      setUsernameError(validationError);
      return;
    }

    // Verificar disponibilidade apenas se mudou
    if (value.toLowerCase() !== profile?.username?.toLowerCase()) {
      const isAvailable = await checkUsernameAvailability(value);
      if (!isAvailable) {
        setUsernameError("Este username já está em uso");
      }
    }
  };

  const handleSaveUsername = async () => {
    if (!username || username.toLowerCase() === profile?.username?.toLowerCase()) {
      setEditingUsername(false);
      return;
    }

    const validationError = validateUsername(username);
    if (validationError) {
      setUsernameError(validationError);
      toast.error(validationError);
      return;
    }

    // Verificar disponibilidade novamente antes de salvar
    const isAvailable = await checkUsernameAvailability(username);
    if (!isAvailable) {
      setUsernameError("Este username já está em uso");
      toast.error("Username já está em uso. Escolha outro.");
      return;
    }

    setSaving(true);
    setUsernameError(null);

    try {
      const { error } = await updateProfile({ username: username.toLowerCase() });

      if (error) {
        // Verificar se é erro de username duplicado
        if (error.code === '23505' || error.message?.includes('unique') || error.message?.includes('duplicate')) {
          setUsernameError("Este username já está em uso");
          toast.error("Username já está em uso. Escolha outro.");
        } else {
          toast.error("Falha ao atualizar username");
        }
      } else {
        toast.success("Username atualizado com sucesso!");
        setEditingUsername(false);
        
        // Forçar atualização do profile no hook
        // O updateProfile já atualiza o estado, mas garantimos que está sincronizado
        if (profile) {
          // O hook useProfile já deve atualizar automaticamente, mas podemos forçar um refresh
          window.dispatchEvent(new CustomEvent('profile:updated'));
        }
      }
    } catch (error: any) {
      toast.error("Erro ao salvar: " + (error.message || "Erro desconhecido"));
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setUsername(profile?.username || "");
    setUsernameError(null);
    setEditingUsername(false);
  };

  return (
    <div className="space-y-6">
      {/* Account Info */}
      <motion.div 
        className="p-6 md:p-8 rounded-2xl bg-card border border-border/50"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-foreground">Conta</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border/50">
            <div>
              <p className="text-sm font-medium text-foreground">E-mail</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="py-3 border-b border-border/50">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-foreground">Nome de usuário</p>
                {!editingUsername ? (
                  <p className="text-sm text-muted-foreground">@{profile?.username}</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    <div className="relative">
                      <Input
                        value={username}
                        onChange={handleUsernameChange}
                        placeholder="seuusername"
                        className={usernameError ? "border-destructive" : ""}
                        disabled={saving}
                      />
                      {checkingUsername && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    {usernameError && (
                      <p className="text-xs text-destructive">{usernameError}</p>
                    )}
                    {!usernameError && username && username.toLowerCase() !== profile?.username?.toLowerCase() && (
                      <p className="text-xs text-muted-foreground">
                        Seu perfil estará em: /{username.toLowerCase()}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveUsername}
                        disabled={saving || !!usernameError || username.toLowerCase() === profile?.username?.toLowerCase()}
                        className="gap-2"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="w-3 h-3" />
                            Salvar
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={saving}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              {!editingUsername && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingUsername(true)}
                  className="text-xs"
                >
                  Editar
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Membro desde</p>
              <p className="text-sm text-muted-foreground">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "N/D"}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div 
        className="p-6 md:p-8 rounded-2xl bg-card border border-border/50"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="font-semibold text-foreground mb-6">Ações</h3>

        <div className="space-y-3">
          <Button 
            variant="secondary" 
            className="w-full justify-start gap-3"
            onClick={signOut}
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>

          <Button 
            variant="destructive" 
            className="w-full justify-start gap-3 opacity-50 cursor-not-allowed"
            disabled
          >
            <Trash2 className="w-4 h-4" />
            Excluir conta
            <span className="ml-auto text-xs opacity-70">Em breve</span>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
