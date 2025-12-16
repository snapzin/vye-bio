import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useAllBadges, type Badge } from "@/hooks/useProfile";
import { usePreview } from "@/contexts/PreviewContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  Users, 
  Award, 
  Search, 
  Edit,
  X, 
  Loader2,
  UserCheck,
  UserX,
  BarChart3,
  Check,
  Trash2,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  Bell,
  Send,
  AlertCircle,
  Crown,
  Calendar
} from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { BadgeIcon } from "@/lib/badgeIcons";

interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  views_count: number | null;
  is_admin: boolean | null;
  is_premium?: boolean | null;
  premium_expires_at?: string | null;
  created_at: string;
}

export function DashboardAdmin() {
  const { user } = useAuth();
  const { profile: currentProfile } = useProfile();
  const { badges: allBadges, loading: badgesLoading } = useAllBadges();
  const { setPreviewUserId, refreshPreview } = usePreview();
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [confirmingAdmin, setConfirmingAdmin] = useState<string | null>(null);
  const [userBadges, setUserBadges] = useState<Array<{ id: string; badge_id: string; is_displayed: boolean; sort_order: number; badge: Badge }>>([]);
  const [loadingUserBadges, setLoadingUserBadges] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalViews: 0,
    totalBadges: 0,
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState<"info" | "success" | "warning" | "error">("info");
  const [notificationLink, setNotificationLink] = useState("");
  const [notificationRecipients, setNotificationRecipients] = useState<"all" | "selected">("all");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [premiumDuration, setPremiumDuration] = useState<number>(30);
  const [premiumDurationUnit, setPremiumDurationUnit] = useState<"days" | "weeks" | "months">("days");
  const [updatingPremium, setUpdatingPremium] = useState(false);

  const isAdmin = currentProfile?.is_admin === true;

  useEffect(() => {
    if (!isAdmin) return;
    fetchProfiles();
    fetchStats();
  }, [isAdmin]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProfiles((data || []) as unknown as Profile[]);
    } catch (error: any) {
      toast.error("Erro ao carregar perfis: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("views_count");

      const { data: badgesData } = await supabase
        .from("user_badges")
        .select("id");

      const totalUsers = profilesData?.length || 0;
      const totalViews = profilesData?.reduce((sum, p) => sum + (p.views_count || 0), 0) || 0;
      const totalBadges = badgesData?.length || 0;

      setStats({ totalUsers, totalViews, totalBadges });
    } catch (error: any) {
      console.error("Erro ao carregar estatísticas:", error);
    }
  };

  const fetchUserBadges = async (userId: string) => {
    setLoadingUserBadges(true);
    try {
      const { data, error } = await supabase
        .from("user_badges")
        .select(`
          *,
          badge:badges(*)
        `)
        .eq("user_id", userId);

      if (error) throw error;

      const sortedData = (data || []).sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
      setUserBadges(
        sortedData.map((item: any) => ({
          id: item.id,
          badge_id: item.badge_id,
          is_displayed: item.is_displayed ?? true,
          sort_order: item.sort_order ?? 0,
          badge: item.badge as Badge,
        }))
      );
    } catch (error: any) {
      toast.error("Erro ao carregar badges: " + error.message);
    } finally {
      setLoadingUserBadges(false);
    }
  };

  const handleAssignBadges = async (userId: string, badgeIds: string[]) => {
    if (badgeIds.length === 0) return;

    try {
      // Get current max sort_order to add new badges at the end
      const maxSortOrder = userBadges.length > 0 
        ? Math.max(...userBadges.map(b => b.sort_order || 0))
        : -1;

      const badgesToInsert = badgeIds.map((badgeId, index) => ({
        user_id: userId,
        badge_id: badgeId,
        sort_order: maxSortOrder + 1 + index,
      }));

      const { error } = await supabase
        .from("user_badges")
        .insert(badgesToInsert as any);

      if (error) {
        // Check for duplicate errors
        const duplicateErrors = badgeIds.filter(() => error.code === "23505");
        if (duplicateErrors.length > 0) {
          toast.error("Algumas badges já foram atribuídas!");
        } else {
          throw error;
        }
      } else {
        toast.success(`${badgeIds.length} badge(s) atribuída(s) com sucesso!`);
        setSelectedBadges([]);
        // Buscar do banco para atualizar com IDs reais e dados completos
        await fetchUserBadges(userId);
        // Forçar atualização do preview
        refreshPreview();
        // A subscription do useUserBadges deve atualizar automaticamente via Supabase Realtime
        // Mas pode haver um pequeno delay, então forçamos um re-fetch após um breve delay
        setTimeout(() => {
          fetchUserBadges(userId);
          refreshPreview();
        }, 200);
      }
    } catch (error: any) {
      toast.error("Erro ao atribuir badges: " + error.message);
    }
  };

  const handleRemoveBadge = async (userBadgeId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from("user_badges")
        .delete()
        .eq("id", userBadgeId);

      if (error) throw error;

      // Atualizar estado local imediatamente sem recarregar
      setUserBadges(prev => prev.filter(ub => ub.id !== userBadgeId));
      // Forçar atualização do preview
      refreshPreview();
      toast.success("Badge removida com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao remover badge: " + error.message);
    }
  };

  const handleToggleBadgeDisplay = async (userBadgeId: string, isDisplayed: boolean, userId: string) => {
    try {
      const { error } = await supabase
        .from("user_badges")
        .update({ is_displayed: !isDisplayed })
        .eq("id", userBadgeId);

      if (error) throw error;

      // Atualizar estado local imediatamente
      setUserBadges(prev =>
        prev.map(ub => ub.id === userBadgeId ? { ...ub, is_displayed: !isDisplayed } : ub)
      );
      
      // Forçar atualização do preview
      refreshPreview();
      toast.success(`Badge ${!isDisplayed ? "exibida" : "ocultada"}!`);
      
      // A subscription do useUserBadges deve atualizar automaticamente via Supabase Realtime
      // Mas pode haver um pequeno delay, então forçamos um pequeno delay para garantir
      // que a mudança seja propagada antes da subscription detectar
      setTimeout(() => {
        refreshPreview();
      }, 100);
    } catch (error: any) {
      toast.error("Erro ao atualizar badge: " + error.message);
    }
  };

  const handleActivatePremium = async (userId: string) => {
    setUpdatingPremium(true);
    try {
      let expiresAt: Date | null = null;
      
      if (premiumDuration > 0) {
        expiresAt = new Date();
        switch (premiumDurationUnit) {
          case "days":
            expiresAt.setDate(expiresAt.getDate() + premiumDuration);
            break;
          case "weeks":
            expiresAt.setDate(expiresAt.getDate() + (premiumDuration * 7));
            break;
          case "months":
            expiresAt.setMonth(expiresAt.getMonth() + premiumDuration);
            break;
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          is_premium: true,
          premium_expires_at: expiresAt ? expiresAt.toISOString() : null
        })
        .eq("user_id", userId);

      if (error) throw error;

      // Atualizar estado local
      setProfiles(prev =>
        prev.map(p =>
          p.user_id === userId
            ? {
                ...p,
                is_premium: true,
                premium_expires_at: expiresAt ? expiresAt.toISOString() : null
              }
            : p
        )
      );

      // Atualizar selectedProfile se for o mesmo usuário
      if (selectedProfile?.user_id === userId) {
        setSelectedProfile(prev => prev ? {
          ...prev,
          is_premium: true,
          premium_expires_at: expiresAt ? expiresAt.toISOString() : null
        } : null);
      }

      toast.success(
        expiresAt
          ? `VIP ativado por ${premiumDuration} ${premiumDurationUnit === "days" ? "dias" : premiumDurationUnit === "weeks" ? "semanas" : "meses"}`
          : "VIP ativado permanentemente"
      );
      setPremiumDuration(30);
      setPremiumDurationUnit("days");
    } catch (error: any) {
      toast.error("Erro ao ativar VIP: " + error.message);
    } finally {
      setUpdatingPremium(false);
    }
  };

  const handleDeactivatePremium = async (userId: string) => {
    setUpdatingPremium(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          is_premium: false,
          premium_expires_at: null
        })
        .eq("user_id", userId);

      if (error) throw error;

      // Atualizar estado local
      setProfiles(prev =>
        prev.map(p =>
          p.user_id === userId
            ? { ...p, is_premium: false, premium_expires_at: null }
            : p
        )
      );

      // Atualizar selectedProfile se for o mesmo usuário
      if (selectedProfile?.user_id === userId) {
        setSelectedProfile(prev => prev ? {
          ...prev,
          is_premium: false,
          premium_expires_at: null
        } : null);
      }

      toast.success("VIP desativado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao desativar VIP: " + error.message);
    } finally {
      setUpdatingPremium(false);
    }
  };

  const isPremiumActive = (profile: Profile): boolean => {
    if (!profile.is_premium) return false;
    if (!profile.premium_expires_at) return true; // Premium permanente
    return new Date(profile.premium_expires_at) > new Date();
  };

  const handleMoveBadge = async (index: number, direction: 'up' | 'down', userId: string) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= userBadges.length) return;

    const newBadges = [...userBadges];
    [newBadges[index], newBadges[newIndex]] = [newBadges[newIndex], newBadges[index]];
    
    // Atualizar estado local imediatamente
    const updatedBadges = newBadges.map((badge, idx) => ({
      ...badge,
      sort_order: idx,
    }));
    setUserBadges(updatedBadges);
    
    // Atualizar sort_order no banco em background
    try {
      const badge1 = newBadges[index];
      const badge2 = newBadges[newIndex];
      
      await Promise.all([
        supabase
          .from("user_badges")
          .update({ sort_order: index } as any)
          .eq("id", badge1.id),
        supabase
          .from("user_badges")
          .update({ sort_order: newIndex } as any)
          .eq("id", badge2.id),
      ]);

      // Forçar atualização do preview
      refreshPreview();
      toast.success("Ordem atualizada!");
    } catch (error: any) {
      // Reverter em caso de erro
      setUserBadges(userBadges);
      toast.error("Erro ao atualizar ordem: " + error.message);
    }
  };

  const handleToggleAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_admin: !isAdmin })
        .eq("user_id", userId);

      if (error) throw error;

      setProfiles(prev =>
        prev.map(p => p.user_id === userId ? { ...p, is_admin: !isAdmin } : p)
      );
      setConfirmingAdmin(null);
      toast.success(`Permissões de admin ${!isAdmin ? "concedidas" : "removidas"}!`);
    } catch (error: any) {
      toast.error("Erro ao atualizar permissões: " + error.message);
      setConfirmingAdmin(null);
    }
  };

  const handleSendNotification = async () => {
    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      toast.error("Preencha título e mensagem");
      return;
    }

    setSendingNotification(true);
    try {
      let count = 0;

      if (notificationRecipients === "all") {
        const { data, error } = await (supabase.rpc as any)("send_notification_to_all", {
          p_title: notificationTitle,
          p_message: notificationMessage,
          p_type: notificationType,
          p_link: notificationLink || null,
        });

        if (error) {
          console.error("Error sending notification to all:", error);
          throw error;
        }
        count = data || 0;
      } else {
        if (selectedUserIds.length === 0) {
          toast.error("Selecione pelo menos um usuário");
          setSendingNotification(false);
          return;
        }

        const { data, error } = await (supabase.rpc as any)("send_notification_to_users", {
          p_user_ids: selectedUserIds,
          p_title: notificationTitle,
          p_message: notificationMessage,
          p_type: notificationType,
          p_link: notificationLink || null,
        });

        if (error) {
          console.error("Error sending notification to users:", error);
          throw error;
        }
        count = data || 0;
      }

      if (count > 0) {
        toast.success(`Notificação enviada para ${count} usuário(s)!`);
      } else {
        toast.warning("Nenhuma notificação foi enviada. Verifique se há usuários no sistema.");
      }
      setNotificationTitle("");
      setNotificationMessage("");
      setNotificationLink("");
      setNotificationType("info");
      setSelectedUserIds([]);
      setNotificationRecipients("all");
    } catch (error: any) {
      toast.error("Erro ao enviar notificação: " + error.message);
    } finally {
      setSendingNotification(false);
    }
  };

  const filteredProfiles = profiles.filter(p =>
    p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Shield className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Acesso Restrito</h3>
        <p className="text-muted-foreground text-center">
          Você não tem permissão para acessar esta área.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {!selectedProfile ? (
          <motion.div
            key="admin-main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div
                className="p-6 md:p-7 rounded-2xl bg-card border border-border/50"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total de Usuários</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalUsers}</p>
                  </div>
                  <Users className="w-8 h-8 text-accent" />
                </div>
              </motion.div>

              <motion.div
                className="p-6 md:p-7 rounded-2xl bg-card border border-border/50"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total de Visualizações</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalViews.toLocaleString()}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-accent" />
                </div>
              </motion.div>

              <motion.div
                className="p-6 md:p-7 rounded-2xl bg-card border border-border/50"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Badges Atribuídas</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalBadges}</p>
                  </div>
                  <Award className="w-8 h-8 text-accent" />
                </div>
              </motion.div>
            </div>

            {/* Notification Management */}
            <motion.div
              className="p-6 rounded-2xl bg-card border border-border/50"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-accent" />
                  <h3 className="font-semibold text-foreground">Enviar Notificações</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  {showNotifications ? "Ocultar" : "Mostrar"}
                </Button>
              </div>

              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 mt-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="recipients">Destinatários</Label>
                    <Select
                      value={notificationRecipients}
                      onValueChange={(value) => setNotificationRecipients(value as "all" | "selected")}
                    >
                      <SelectTrigger id="recipients">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os usuários</SelectItem>
                        <SelectItem value="selected">Usuários selecionados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {notificationRecipients === "selected" && (
                    <div className="space-y-2">
                      <Label>Selecionar Usuários</Label>
                      <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-2">
                        {profiles.map((profile) => (
                          <div key={profile.id} className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedUserIds.includes(profile.user_id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedUserIds([...selectedUserIds, profile.user_id]);
                                } else {
                                  setSelectedUserIds(selectedUserIds.filter(id => id !== profile.user_id));
                                }
                              }}
                            />
                            <Label className="text-sm font-normal cursor-pointer">
                              {profile.display_name || profile.username} (@{profile.username})
                            </Label>
                          </div>
                        ))}
                      </div>
                      {selectedUserIds.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {selectedUserIds.length} usuário(s) selecionado(s)
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="notification-type">Tipo</Label>
                    <Select
                      value={notificationType}
                      onValueChange={(value) => setNotificationType(value as "info" | "success" | "warning" | "error")}
                    >
                      <SelectTrigger id="notification-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="success">Sucesso</SelectItem>
                        <SelectItem value="warning">Aviso</SelectItem>
                        <SelectItem value="error">Erro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notification-title">Título *</Label>
                    <Input
                      id="notification-title"
                      placeholder="Ex: Manutenção programada"
                      value={notificationTitle}
                      onChange={(e) => setNotificationTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notification-message">Mensagem *</Label>
                    <Textarea
                      id="notification-message"
                      placeholder="Ex: Teremos uma manutenção programada no dia..."
                      value={notificationMessage}
                      onChange={(e) => setNotificationMessage(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notification-link">Link (opcional)</Label>
                    <Input
                      id="notification-link"
                      placeholder="Ex: /dashboard ou https://..."
                      value={notificationLink}
                      onChange={(e) => setNotificationLink(e.target.value)}
                    />
                  </div>

                  <Button
                    onClick={handleSendNotification}
                    disabled={sendingNotification || !notificationTitle.trim() || !notificationMessage.trim()}
                    className="w-full"
                  >
                    {sendingNotification ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Notificação
                      </>
                    )}
                  </Button>

                  {notificationRecipients === "all" && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/50 border border-border/50">
                      <AlertCircle className="w-4 h-4 text-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        Esta notificação será enviada para todos os usuários do sistema.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>

            {/* Search and Profile Management */}
            <motion.div
              className="p-6 md:p-8 rounded-2xl bg-card border border-border/50"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-accent" />
                <h3 className="font-semibold text-foreground">Gerenciar Perfis</h3>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por username ou nome..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredProfiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="p-4 rounded-xl bg-secondary/50 border border-border/30 hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <img
                          src={profile.avatar_url || "/placeholder.svg"}
                          alt={profile.username}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground truncate">
                              {profile.display_name || profile.username}
                            </p>
                            {profile.is_admin && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Shield className="w-4 h-4 text-accent" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Admin</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {isPremiumActive(profile) && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Crown className="w-4 h-4 text-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    VIP {profile.premium_expires_at 
                                      ? `expira em ${new Date(profile.premium_expires_at).toLocaleDateString('pt-BR')}`
                                      : 'permanente'}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">@{profile.username}</p>
                          <p className="text-xs text-muted-foreground">
                            {profile.views_count || 0} visualizações
                            {isPremiumActive(profile) && profile.premium_expires_at && (
                              <span className="ml-2 text-muted-foreground">
                                • VIP até {new Date(profile.premium_expires_at).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedProfile(profile);
                                setPreviewUserId(profile.user_id);
                                fetchUserBadges(profile.user_id);
                              }}
                              className="hover:bg-accent/10 hover:border-accent transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Gerenciar badges</p>
                          </TooltipContent>
                        </Tooltip>

                        {confirmingAdmin === profile.user_id ? (
                          <div className="flex items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleToggleAdmin(profile.user_id, profile.is_admin || false)}
                                  className="hover:bg-white/10 hover:border-white/20 hover:text-foreground transition-colors"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Confirmar</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setConfirmingAdmin(null)}
                                  className="hover:bg-white/10 hover:border-white/20 hover:text-foreground transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Cancelar</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setConfirmingAdmin(profile.user_id)}
                                className="hover:bg-accent/10 hover:border-accent transition-colors"
                              >
                                {profile.is_admin ? (
                                  <UserX className="w-4 h-4 text-destructive" />
                                ) : (
                                  <UserCheck className="w-4 h-4 text-accent" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{profile.is_admin ? "Remover permissões de admin" : "Tornar admin"}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="admin-edit"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedProfile(null);
                setPreviewUserId(null);
              }}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Gerenciar Perfis
            </Button>

            <div className="rounded-xl bg-secondary/30 border border-border/50 p-6 space-y-6">
              <div className="flex items-center gap-3">
                <img
                  src={selectedProfile.avatar_url || "/placeholder.svg"}
                  alt={selectedProfile.username}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Gerenciar Badges de @{selectedProfile.username}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedProfile.display_name || selectedProfile.username}
                  </p>
                </div>
              </div>

              {/* User's Current Badges */}
              <div className="mb-6">
                <Label className="mb-2 block">Badges do Usuário</Label>
            {loadingUserBadges ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-accent" />
              </div>
            ) : userBadges.length > 0 ? (
              <div className="space-y-2">
                {userBadges.map((userBadge, index) => (
                  <div
                    key={userBadge.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border/30"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex flex-col gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleMoveBadge(index, 'up', selectedProfile.user_id)}
                              disabled={index === 0}
                            >
                              <ChevronUp className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Mover para cima</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleMoveBadge(index, 'down', selectedProfile.user_id)}
                              disabled={index === userBadges.length - 1}
                            >
                              <ChevronDown className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Mover para baixo</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <BadgeIcon badgeName={userBadge.badge.name} icon={userBadge.badge.icon} className="w-6 h-6" size={24} />
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">
                          {userBadge.badge.name}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {userBadge.badge.rarity}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`display-${userBadge.id}`} className="text-xs text-muted-foreground">
                          Exibir
                        </Label>
                        <Switch
                          id={`display-${userBadge.id}`}
                          checked={userBadge.is_displayed}
                          onCheckedChange={() =>
                            handleToggleBadgeDisplay(userBadge.id, userBadge.is_displayed, selectedProfile.user_id)
                          }
                        />
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleRemoveBadge(userBadge.id, selectedProfile.user_id)
                            }
                            className="hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Remover badge</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhuma badge atribuída
              </p>
            )}
          </div>

              {/* Assign New Badge */}
              {badgesLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-accent mx-auto" />
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="badge">Atribuir Badges</Label>
                <Popover
                  open={isSelectOpen}
                  onOpenChange={(open) => {
                    setIsSelectOpen(open);
                    if (!open && selectedBadges.length > 0 && selectedProfile) {
                      // Quando fechar, atribuir todas as badges selecionadas
                      handleAssignBadges(selectedProfile.user_id, selectedBadges);
                    } else if (!open) {
                      // Se fechar sem selecionar nada, limpar seleção
                      setSelectedBadges([]);
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span>
                        {selectedBadges.length > 0
                          ? `${selectedBadges.length} badge(s) selecionada(s)`
                          : "Selecione badges para adicionar..."}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <div className="max-h-96 overflow-y-auto p-2">
                      {allBadges
                        .filter(
                          (badge) =>
                            !userBadges.some((ub) => ub.badge_id === badge.id)
                        )
                        .map((badge) => (
                          <div
                            key={badge.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer"
                            onClick={(e) => {
                              // Prevenir duplo toggle quando clicar no checkbox
                              if ((e.target as HTMLElement).closest('[role="checkbox"]')) {
                                return;
                              }
                              setSelectedBadges((prev) =>
                                prev.includes(badge.id)
                                  ? prev.filter((id) => id !== badge.id)
                                  : [...prev, badge.id]
                              );
                            }}
                          >
                            <Checkbox
                              checked={selectedBadges.includes(badge.id)}
                              onCheckedChange={(checked) => {
                                setSelectedBadges((prev) =>
                                  checked
                                    ? [...prev, badge.id]
                                    : prev.filter((id) => id !== badge.id)
                                );
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <BadgeIcon badgeName={badge.name} icon={badge.icon} className="w-5 h-5" size={20} />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{badge.name}</p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {badge.rarity}
                              </p>
                            </div>
                          </div>
                        ))}
                      {allBadges.filter(
                        (badge) => !userBadges.some((ub) => ub.badge_id === badge.id)
                      ).length === 0 && (
                        <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                          Todas as badges já foram atribuídas
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground mt-2">
                  Selecione múltiplas badges e clique fora para confirmar a atribuição
                    </p>
                  </div>
                </div>
              )}

              {/* Premium Management Section */}
              <div className="mt-6 pt-6 border-t border-border/50">
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="w-5 h-5 text-foreground" />
                  <h3 className="font-semibold text-foreground">Gerenciar VIP</h3>
                </div>

                {isPremiumActive(selectedProfile) && (
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border/50 mb-4">
                    <p className="text-sm text-muted-foreground">
                      {selectedProfile.premium_expires_at
                        ? `VIP ativo até ${new Date(selectedProfile.premium_expires_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}`
                        : 'VIP permanente'}
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="premium-duration">Duração</Label>
                      <Input
                        id="premium-duration"
                        type="number"
                        min="0"
                        value={premiumDuration}
                        onChange={(e) => setPremiumDuration(parseInt(e.target.value) || 0)}
                        placeholder="30"
                        className="h-10 bg-background border border-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="premium-unit">Unidade</Label>
                      <Select
                        value={premiumDurationUnit}
                        onValueChange={(value: "days" | "weeks" | "months") =>
                          setPremiumDurationUnit(value)
                        }
                      >
                        <SelectTrigger id="premium-unit">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="days">Dias</SelectItem>
                          <SelectItem value="weeks">Semanas</SelectItem>
                          <SelectItem value="months">Meses</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {isPremiumActive(selectedProfile) ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeactivatePremium(selectedProfile.user_id)}
                          disabled={updatingPremium}
                          className="flex-1"
                        >
                          {updatingPremium ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <X className="w-4 h-4 mr-2" />
                              Desativar VIP
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleActivatePremium(selectedProfile.user_id)}
                          disabled={updatingPremium}
                          className="flex-1 bg-primary text-primary-foreground hover:opacity-90"
                        >
                          {updatingPremium ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Calendar className="w-4 h-4 mr-2" />
                              Renovar VIP
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleActivatePremium(selectedProfile.user_id)}
                        disabled={updatingPremium}
                        className="w-full bg-primary text-primary-foreground hover:opacity-90"
                      >
                        {updatingPremium ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Crown className="w-4 h-4 mr-2" />
                            Ativar VIP
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {premiumDuration === 0 && (
                    <p className="text-xs text-muted-foreground text-center">
                      Duração 0 = VIP permanente
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

