import { useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Trash2,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { toast } from "@/lib/toast";
import { useNavigate } from "react-router-dom";

const typeIcons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

const typeColors = {
  info: "text-muted-foreground",
  success: "text-foreground",
  warning: "text-muted-foreground",
  error: "text-foreground",
};

export function NotificationDropdown() {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  
  // Check if we're already on the dashboard
  const handleViewAllNotifications = () => {
    setOpen(false);
    // Navigate to dashboard and set notifications tab
    navigate('/dashboard');
    // Use setTimeout to ensure navigation happens first, then set the tab
    setTimeout(() => {
      localStorage.setItem('dashboard_active_tab', 'notifications');
      // Trigger a custom event to notify Dashboard to change tab
      window.dispatchEvent(new CustomEvent('dashboard:changeTab', { detail: 'notifications' }));
    }, 100);
  };

  // Calculate dynamic height based on number of notifications
  const getScrollAreaHeight = () => {
    if (loading || notifications.length === 0) {
      return "h-[200px]";
    }
    
    const notificationCount = notifications.length;
    
    // Use conditional classes based on notification count
    if (notificationCount <= 2) {
      return "h-[200px]";
    } else if (notificationCount <= 3) {
      return "h-[280px]";
    } else if (notificationCount <= 4) {
      return "h-[360px]";
    } else if (notificationCount <= 5) {
      return "h-[440px]";
    } else {
      // For 6+ notifications, use max height with scroll
      return "h-[500px]";
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    if (notification.link) {
      navigate(notification.link);
      setOpen(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    const { error } = await markAllAsRead();
    if (error) {
      toast.error("Erro ao marcar notificações como lidas");
    } else {
      toast.success("Todas as notificações foram marcadas como lidas");
    }
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    const { error } = await deleteNotification(notificationId);
    if (error) {
      toast.error("Erro ao deletar notificação");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-foreground relative"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center"
            >
              <span className="text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </motion.div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-foreground">Notificações</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-7 text-xs"
            >
              <CheckCheck className="w-3 h-3 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        <ScrollArea className={getScrollAreaHeight()}>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Bell className="w-12 h-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground text-center">
                Nenhuma notificação ainda
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              <AnimatePresence>
                {notifications.map((notification) => {
                  const Icon = typeIcons[notification.type];
                  const iconColor = typeColors[notification.type];

                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={`
                        relative p-4 cursor-pointer transition-colors group
                        ${notification.is_read 
                          ? 'bg-background hover:bg-secondary/50' 
                          : 'bg-secondary/30 hover:bg-secondary/50'
                        }
                      `}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 ${iconColor}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`text-sm font-medium text-foreground ${!notification.is_read ? 'font-semibold' : ''}`}>
                              {notification.title}
                            </h4>
                            {!notification.is_read && (
                              <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                              onClick={(e) => handleDelete(e, notification.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={handleViewAllNotifications}
            >
              Ver todas as notificações
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

