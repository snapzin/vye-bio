import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { Bell, MessageSquare, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const getToastIcon = (title?: React.ReactNode, variant?: string) => {
  if (variant === "destructive") return <AlertCircle className="h-5 w-5 shrink-0" />;
  if (variant === "success") return <CheckCircle2 className="h-5 w-5 shrink-0" />;
  if (variant === "info") return <Info className="h-5 w-5 shrink-0" />;

  if (typeof title === "string") {
    const lower = title.toLowerCase();
    if (lower.includes("mensagem") || lower.includes("message")) {
      return <MessageSquare className="h-5 w-5 shrink-0" />;
    }
  }

  return <Bell className="h-5 w-5 shrink-0" />;
};

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const icon = getToastIcon(title, variant);

        return (
          <Toast key={id} variant={variant as any} {...props}>
            <div
              className={cn(
                "flex items-start gap-3 flex-1",
                variant === "destructive" && "text-destructive-foreground",
                variant === "success" && "text-white",
                variant === "info" && "text-white",
              )}
            >
              {icon && (
                <div
                  className={cn(
                    "mt-0.5",
                    variant === "default" && "text-primary",
                    variant === "destructive" && "text-destructive-foreground",
                    variant === "success" && "text-white",
                    variant === "info" && "text-white",
                  )}
                >
                  {icon}
                </div>
              )}
              <div className="grid gap-1 flex-1 min-w-0">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
