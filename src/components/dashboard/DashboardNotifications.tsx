import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bell, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Trash2,
  CheckCheck,
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

export function DashboardNotifications() {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    if (notification.link) {
      navigate(notification.link);
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
    } else {
      toast.success("Notificação deletada");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Notificações</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {notifications.length === 0 
              ? "Nenhuma notificação" 
              : `${notifications.length} notificação${notifications.length > 1 ? 'ões' : ''} • ${unreadCount} não lida${unreadCount !== 1 ? 's' : ''}`
            }
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 px-4 rounded-2xl bg-card border border-border/50"
        >
          <Bell className="w-16 h-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhuma notificação
          </h3>
          <p className="text-sm text-muted-foreground text-center max-w-lg">
            Você não tem notificações no momento. Quando houver novas notificações, elas aparecerão aqui.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {notifications.map((notification) => {
              const Icon = typeIcons[notification.type];
              const iconColor = typeColors[notification.type];

              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`
                    relative p-6 md:p-7 rounded-xl border transition-all cursor-pointer group
                    ${notification.is_read 
                      ? 'bg-card border-border/50 hover:border-border hover:bg-secondary/30' 
                      : 'bg-secondary/30 border-accent/30 hover:border-accent/50 hover:bg-secondary/50'
                    }
                  `}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 ${iconColor}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <h4 className={`text-base font-medium text-foreground mb-1 ${!notification.is_read ? 'font-semibold' : ''}`}>
                            {notification.title}
                          </h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <div className="w-2.5 h-2.5 rounded-full bg-accent flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-opacity"
                          onClick={(e) => handleDelete(e, notification.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      {notification.link && (
                        <div className="mt-2">
                          <span className="text-xs text-accent">Clique para abrir link →</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

