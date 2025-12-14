import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Crown, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "@/lib/toast";

export function DashboardPremium() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useProfile();
  const [isUpdating, setIsUpdating] = useState(false);
  const [hideFooter, setHideFooter] = useState(profile?.hide_footer ?? false);

  useEffect(() => {
    if (profile?.hide_footer !== undefined) {
      setHideFooter(profile.hide_footer);
    }
  }, [profile?.hide_footer]);

  const isPremiumActive = (): boolean => {
    if (!profile?.is_premium) return false;
    if (!profile.premium_expires_at) return true; // Premium permanente
    return new Date(profile.premium_expires_at) > new Date();
  };

  const handleToggleFooter = async (checked: boolean) => {
    if (!isPremiumActive()) {
      toast.error("Você precisa ser Premium para usar este recurso");
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ hide_footer: checked })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      setHideFooter(checked);
      await refreshProfile();
      toast.success(checked ? "Footer ocultado com sucesso!" : "Footer exibido novamente");
    } catch (error) {
      console.error('Error updating hide_footer:', error);
      toast.error("Erro ao atualizar configuração");
    } finally {
      setIsUpdating(false);
    }
  };

  const isPremium = isPremiumActive();

  return (
    <div className="space-y-6">
      {/* Premium Status */}
      <motion.div 
        className="p-6 md:p-8 rounded-2xl bg-card border border-border/50"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2 rounded-lg border ${isPremium ? 'bg-white/5 border-white/10' : 'bg-muted border-border/50'}`}>
            <Crown className={`w-5 h-5 ${isPremium ? 'text-foreground' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Status Premium</h3>
            <p className="text-sm text-muted-foreground">
              {isPremium ? "Você tem acesso a recursos premium" : "Ative o Premium para desbloquear recursos exclusivos"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isPremium ? (
            <div className="flex items-center gap-2 text-sm text-foreground">
              <CheckCircle2 className="w-4 h-4" />
              <span className="font-medium">Premium Ativo</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <XCircle className="w-4 h-4" />
              <span>Premium Inativo</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Premium Features */}
      <motion.div 
        className="p-6 md:p-8 rounded-2xl bg-card border border-border/50"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-foreground">Recursos Premium</h3>
        </div>

        <div className="space-y-4">
          {/* Hide Footer Feature */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/30">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Label htmlFor="hide-footer" className="text-sm font-medium text-foreground cursor-pointer">
                  Ocultar Footer "vye.bio"
                </Label>
                {isPremium && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-secondary/50 text-foreground border border-border/50">
                    Premium
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Remove o footer "vye.bio" do final da sua página de perfil
              </p>
            </div>
            <Switch
              id="hide-footer"
              checked={hideFooter}
              onCheckedChange={handleToggleFooter}
              disabled={!isPremium || isUpdating}
            />
          </div>
        </div>
      </motion.div>

      {/* Upgrade to Premium */}
      {!isPremium && (
        <motion.div 
          className="p-6 md:p-8 rounded-2xl bg-white/5 border border-white/10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
              <Crown className="w-6 h-6 text-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-2">Upgrade para Premium</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Desbloqueie recursos exclusivos e personalize ainda mais seu perfil
              </p>
              <Button 
                className="bg-primary text-primary-foreground hover:opacity-90"
                onClick={() => navigate("/checkout/premium")}
              >
                <Crown className="w-4 h-4 mr-2" />
                Comprar Já
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

