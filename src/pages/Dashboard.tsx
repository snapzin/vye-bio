import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { usePreview } from "@/contexts/PreviewContext";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardPreview } from "@/components/dashboard/DashboardPreview";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { DashboardAppearance } from "@/components/dashboard/DashboardAppearance";
import { DashboardLinks } from "@/components/dashboard/DashboardLinks";
import { DashboardBadges } from "@/components/dashboard/DashboardBadges";
import { DashboardMusic } from "@/components/dashboard/DashboardMusic";
import DashboardWidget from "@/components/dashboard/DashboardWidget";
import { DashboardSettings } from "@/components/dashboard/DashboardSettings";
import { DashboardAdmin } from "@/components/dashboard/DashboardAdmin";
import { DashboardNotifications } from "@/components/dashboard/DashboardNotifications";
import { DashboardPremium } from "@/components/dashboard/DashboardPremium";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

type Tab = 'dashboard' | 'appearance' | 'links' | 'badges' | 'music' | 'widget' | 'settings' | 'admin' | 'notifications' | 'premium';

const tabTitles: Record<Tab, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Visão geral do seu perfil" },
  appearance: { title: "Aparência", subtitle: "Personalize a aparência do seu perfil" },
  links: { title: "Links", subtitle: "Gerencie seus links sociais" },
  badges: { title: "Badges", subtitle: "Suas conquistas e recompensas" },
  music: { title: "Música", subtitle: "Defina a trilha sonora do seu perfil" },
  widget: { title: "Widgets", subtitle: "Adicione widgets interativos" },
  settings: { title: "Configurações", subtitle: "Preferências da conta" },
  admin: { title: "Admin", subtitle: "Gerencie usuários e badges" },
  notifications: { title: "Notificações", subtitle: "Todas as suas notificações" },
  premium: { title: "Premium", subtitle: "Recursos exclusivos" },
};

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { setPreviewUserId } = usePreview();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Restore active tab from localStorage
  const getInitialTab = (): Tab => {
    const savedTab = localStorage.getItem('dashboard_active_tab');
    if (savedTab && ['dashboard', 'appearance', 'links', 'badges', 'music', 'widget', 'settings', 'admin', 'notifications', 'premium'].includes(savedTab)) {
      return savedTab as Tab;
    }
    return 'dashboard';
  };
  
  const [activeTab, setActiveTab] = useState<Tab>(getInitialTab());
  const hasNavigatedRef = useRef(false);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as Tab);
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  // Save active tab to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('dashboard_active_tab', activeTab);
  }, [activeTab]);

  // Listen for custom event to change tab (from NotificationDropdown)
  useEffect(() => {
    const handleTabChange = (event: CustomEvent) => {
      const tab = event.detail as Tab;
      if (tab && ['dashboard', 'appearance', 'links', 'badges', 'music', 'widget', 'settings', 'admin', 'notifications', 'premium'].includes(tab)) {
        setActiveTab(tab);
      }
    };

    window.addEventListener('dashboard:changeTab', handleTabChange as EventListener);
    return () => {
      window.removeEventListener('dashboard:changeTab', handleTabChange as EventListener);
    };
  }, []);

  // Limpar previewUserId quando sair da aba admin
  useEffect(() => {
    if (activeTab !== 'admin') {
      setPreviewUserId(null);
    }
  }, [activeTab, setPreviewUserId]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      if (!hasNavigatedRef.current) {
        hasNavigatedRef.current = true;
        navigate("/login", { replace: true });
      }
    } else {
      hasNavigatedRef.current = false;
    }
  }, [user, authLoading, navigate]);

  // Show loading state
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando seu dashboard...</p>
        </div>
      </div>
    );
  }

  // If no user after loading, show nothing (navigation will handle redirect)
  if (!user) {
    return null;
  }

  // If no profile after loading, show error state
  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Perfil não encontrado. Por favor, tente novamente.</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'appearance':
        return <DashboardAppearance />;
      case 'links':
        return <DashboardLinks />;
      case 'badges':
        return <DashboardBadges />;
      case 'music':
        return <DashboardMusic />;
      case 'widget':
        return <DashboardWidget />;
      case 'settings':
        return <DashboardSettings />;
      case 'admin':
        return <DashboardAdmin />;
      case 'notifications':
        return <DashboardNotifications />;
      case 'premium':
        return <DashboardPremium />;
      default:
        return <DashboardOverview />;
    }
  };

  const sidebarContent = (
    <DashboardSidebar 
      activeTab={activeTab} 
      onTabChange={handleTabChange} 
      username={profile.username}
      isAdmin={profile.is_admin === true}
    />
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <div className="hidden md:block">
        {sidebarContent}
      </div>

      {/* Mobile Menu Sheet */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0">
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader 
          title={tabTitles[activeTab].title} 
          subtitle={tabTitles[activeTab].subtitle}
          onMenuClick={() => setIsMobileMenuOpen(true)}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 w-full">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </div>
        </main>
      </div>

      {/* Live Preview - Desktop Only */}
      {profile && <DashboardPreview />}
    </div>
  );
};

export default Dashboard;
