import { useState } from "react";
import { useUserBadges, useAllBadges, type Badge } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { usePreview } from "@/contexts/PreviewContext";
import { Loader2, Lock, Award, Trash2, GripVertical } from "lucide-react";
import { BadgeIcon } from "@/lib/badgeIcons";
import { motion, AnimatePresence } from "framer-motion";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { toast } from "@/lib/toast";

const rarityColors: Record<string, string> = {
  common: "bg-secondary text-foreground",
  uncommon: "bg-secondary/50 text-foreground",
  rare: "bg-secondary/50 text-foreground",
  epic: "bg-secondary/50 text-foreground",
  legendary: "bg-secondary/50 text-foreground",
};

const categoryLabels: Record<string, string> = {
  achievement: "🏆 Achievements",
  event: "🎉 Events",
  special: "⭐ Special",
  community: "👥 Community",
  premium: "💎 Premium",
};

interface SortableBadgeItemProps {
  badge: {
    id: string;
    badge_id: string;
    is_displayed: boolean;
    badge?: Badge;
  };
  onToggleDisplay: (id: string, isDisplayed: boolean) => void;
  onDelete: (id: string) => void;
}

function SortableBadgeItem({ badge, onToggleDisplay, onDelete }: SortableBadgeItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: badge.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 rounded-xl border transition-colors ${
        badge.is_displayed
          ? `${rarityColors[badge.badge?.rarity || 'common']} border-border/50`
          : 'bg-secondary/30 border-border/30 opacity-60'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors touch-none select-none"
          style={{ touchAction: 'none' }}
        >
          <GripVertical className="w-5 h-5" />
        </div>
        <BadgeIcon badgeName={badge.badge?.name} icon={badge.badge?.icon} className="w-6 h-6" size={24} />
        <div className="flex-1">
          <p className="font-medium text-sm">{badge.badge?.name}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {badge.badge?.rarity}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor={`display-${badge.id}`} className="text-xs text-muted-foreground cursor-pointer">
              Exibir
            </Label>
            <Switch
              id={`display-${badge.id}`}
              checked={badge.is_displayed}
              onCheckedChange={() => onToggleDisplay(badge.id, badge.is_displayed)}
            />
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(badge.id)}
                className="hover:bg-destructive/10 hover:text-destructive h-8 w-8 p-0"
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
    </div>
  );
}

export function DashboardBadges() {
  const { user } = useAuth();
  const { refreshPreview } = usePreview();
  const { badges: userBadges, loading: userBadgesLoading, updateBadge, deleteBadge, reorderBadges } = useUserBadges(user?.id, true);
  const { badges: allBadges, loading: allBadgesLoading } = useAllBadges();
  const [deleting, setDeleting] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = userBadges.findIndex((b) => b.id === active.id);
      const newIndex = userBadges.findIndex((b) => b.id === over.id);

      const newOrder = arrayMove(userBadges, oldIndex, newIndex);
      const { error } = await reorderBadges(newOrder);

      if (error) {
        toast.error("Erro ao reordenar badges");
      } else {
        toast.success("Ordem atualizada!");
        refreshPreview();
      }
    }
  };

  const handleToggleDisplay = async (id: string, isDisplayed: boolean) => {
    const { error } = await updateBadge(id, { is_displayed: !isDisplayed });
    if (error) {
      toast.error("Erro ao atualizar badge");
    } else {
      toast.success(`Badge ${!isDisplayed ? "exibida" : "ocultada"}!`);
      refreshPreview();
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const { error } = await deleteBadge(id);
    setDeleting(null);
    if (error) {
      toast.error("Erro ao remover badge");
    } else {
      toast.success("Badge removida!");
      refreshPreview();
    }
  };

  if (userBadgesLoading || allBadgesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge_id));
  const badgesByCategory = allBadges.reduce((acc, badge) => {
    const category = badge.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(badge);
    return acc;
  }, {} as Record<string, Badge[]>);

  return (
    <div className="space-y-6">
      <motion.div className="flex items-center gap-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Award className="w-5 h-5 text-accent" />
        <h3 className="font-semibold text-foreground">Suas Badges</h3>
        <span className="text-sm text-muted-foreground">({userBadges.length}/{allBadges.length})</span>
      </motion.div>

      {userBadges.length > 0 && (
        <motion.div
          className="p-6 md:p-8 rounded-2xl bg-card border border-border/50"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h4 className="font-medium text-foreground mb-4">Gerenciar Badges</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Arraste para reordenar, use o switch para exibir/ocultar e o botão de lixeira para remover
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={userBadges.map(b => b.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                <AnimatePresence>
                  {userBadges.map((badge) => (
                    <SortableBadgeItem
                      key={badge.id}
                      badge={badge}
                      onToggleDisplay={handleToggleDisplay}
                      onDelete={handleDelete}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>
          </DndContext>
        </motion.div>
      )}

      {Object.entries(badgesByCategory).map(([category, badges], i) => (
        <motion.div
          key={category}
          className="p-6 rounded-2xl bg-card border border-border/50"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <h4 className="font-medium text-foreground mb-4">{categoryLabels[category] || category}</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {badges.map((badge) => {
              const earned = earnedBadgeIds.has(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`p-4 rounded-xl ${earned ? 'bg-secondary/70' : 'bg-secondary/30 opacity-50'}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <BadgeIcon badgeName={badge.name} icon={badge.icon} className="w-6 h-6" size={24} />
                    {!earned && <Lock className="w-3 h-3 text-muted-foreground" />}
                  </div>
                  <p className="font-medium text-foreground text-sm">{badge.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{badge.rarity}</p>
                </div>
              );
            })}
          </div>
        </motion.div>
      ))}

      {allBadges.length === 0 && (
        <div className="text-center py-12">
          <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhuma badge disponível</p>
        </div>
      )}
    </div>
  );
}
