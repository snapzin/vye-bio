import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Palette, 
  Link2, 
  Award, 
  Settings, 
  ExternalLink,
  Music,
  Video,
  Puzzle,
  Shield,
  Bell,
  Crown
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

interface DashboardSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  username: string;
  isAdmin?: boolean;
}

const menuGroups = [
  {
    id: "overview",
    label: "Visão geral",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    ]
  },
  {
    id: "customize",
    label: "Personalizar",
    items: [
      { id: "appearance", label: "Aparência", icon: Palette },
      { id: "links", label: "Links", icon: Link2 },
      { id: "badges", label: "Badges", icon: Award },
      { id: "music", label: "Música", icon: Music },
      { id: "widget", label: "Widgets", icon: Puzzle },
    ]
  },
  {
    id: "manage",
    label: "Gerenciar",
    items: [
      { id: "notifications", label: "Notificações", icon: Bell },
      { id: "premium", label: "Premium", icon: Crown },
      { id: "settings", label: "Configurações", icon: Settings },
    ]
  },
  {
    id: "admin",
    label: "Admin",
    items: [
      { id: "admin", label: "Painel", icon: Shield },
    ]
  }
];

export function DashboardSidebar({ activeTab, onTabChange, username, isAdmin = false }: DashboardSidebarProps) {
  // Buscar profile atualizado para garantir que o username está sempre atualizado
  const { profile } = useProfile();
  const currentUsername = profile?.username || username;
  
  const filteredMenuGroups = menuGroups.filter(group => {
    if (group.id === "admin") {
      return isAdmin;
    }
    return true;
  });

  return (
    <aside className="w-56 flex-shrink-0 h-screen sticky top-0 flex flex-col border-r border-border/50 bg-background">
      {/* Logo */}
      <div className="p-4 border-b border-border/50">
        <Link to="/" className="flex items-center gap-2 group">
          <img
            src="/logo.png"
            alt="vye"
            className="h-8 w-8 rounded-lg object-cover transition-transform duration-300 ease-in-out group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/50"
            draggable={false}
          />
          <span className="text-foreground font-semibold">
            vye<span className="text-muted-foreground">.bio</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {filteredMenuGroups.map((group) => (
          <div key={group.id} className="mb-6">
            <p className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative border border-transparent ${
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5 hover:border-white/10 hover:backdrop-blur-xl hover:shadow-sm"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-white/5 rounded-xl border border-white/10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <item.icon className={`w-4 h-4 relative z-10 ${isActive ? "text-foreground" : ""}`} />
                    <span className="relative z-10">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* View Profile Button */}
      <div className="p-3 border-t border-border/50">
        <Link 
          to={`/${currentUsername}`} 
          target="_blank"
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors w-full"
        >
          <ExternalLink className="w-4 h-4" />
          Ver perfil
        </Link>
      </div>
    </aside>
  );
}
