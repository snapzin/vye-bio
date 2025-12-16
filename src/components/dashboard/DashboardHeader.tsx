import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationDropdown } from "./NotificationDropdown";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
}

export function DashboardHeader({ title, subtitle, onMenuClick }: DashboardHeaderProps) {
  const { signOut } = useAuth();

  return (
    <header className="h-16 border-b border-border/50 flex items-center justify-between px-4 sm:px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden text-muted-foreground hover:text-foreground"
          >
            <Menu className="w-5 h-5" />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">{title}</h1>
          {subtitle && <p className="text-xs sm:text-sm text-muted-foreground truncate">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <NotificationDropdown />
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={signOut}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}
