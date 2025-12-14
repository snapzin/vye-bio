import { useState, useEffect } from "react";
import { useProfile, useUserWidgets, type UserWidget } from "@/hooks/useProfile";
import { usePreview } from "@/contexts/PreviewContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ArrowLeft, Plus, Trash2, Eye, EyeOff, GripVertical, Pencil } from "lucide-react";
import { toast } from "@/lib/toast";
import { motion, AnimatePresence } from "framer-motion";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { WidgetPreview } from "./WidgetPreview";

function WidgetBrandIcon({
  src,
  alt,
  className = "w-4 h-4",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={`${className} object-contain`}
      draggable={false}
      loading="lazy"
    />
  );
}

type WidgetType = 'discord' | 'valorant' | 'roblox' | null;

const availableWidgets = [
  {
    id: 'discord' as WidgetType,
    name: 'Discord',
    icon: (props: { className?: string }) => (
      <WidgetBrandIcon src="/discord.png" alt="Discord" className={props.className || "w-4 h-4"} />
    ),
    color: 'bg-[#5865F2]/10 border border-[#5865F2]/25',
    description: 'Mostre seu status do Discord no seu perfil'
  },
  {
    id: 'valorant' as WidgetType,
    name: 'Valorant',
    icon: (props: { className?: string }) => (
      <WidgetBrandIcon src="/riotgames.png" alt="Valorant" className={props.className || "w-4 h-4"} />
    ),
    color: 'bg-[#FF4655]/10 border border-[#FF4655]/25',
    description: 'Exiba suas estatísticas do Valorant'
  },
  {
    id: 'roblox' as WidgetType,
    name: 'Roblox',
    icon: (props: { className?: string }) => (
      <WidgetBrandIcon src="/roblox.png" alt="Roblox" className={props.className || "w-4 h-4"} />
    ),
    // keep it clean/visible in dark UI (Roblox is black), so we give it a light chip
    color: 'bg-white/85 border border-white/20',
    description: 'Mostre seu perfil do Roblox'
  }
];

interface SortableWidgetItemProps {
  widget: UserWidget;
  profile: ReturnType<typeof useProfile>['profile'];
  onToggleVisibility: (id: string, isVisible: boolean) => void;
  onEdit: (widgetType: WidgetType) => void;
  onDelete: (id: string) => void;
}

function SortableWidgetItem({ widget, profile, onToggleVisibility, onEdit, onDelete }: SortableWidgetItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const widgetInfo = availableWidgets.find(w => w.id === widget.widget_type);
  const IconComponent = widgetInfo?.icon || ((props: { className?: string }) => <WidgetBrandIcon src="/discord.png" alt="Discord" className={props.className || "w-4 h-4"} />);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-2 rounded-xl border transition-colors ${
        widget.is_visible
          ? 'bg-secondary/50 border-border/50'
          : 'bg-secondary/30 border-border/30 opacity-60'
      }`}
    >
      <div className="flex items-center gap-2">
        {/* Drag Handle e Actions à esquerda */}
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleVisibility(widget.id, widget.is_visible)}
                className="h-6 w-6 p-0 border border-border/50 transform-gpu transition-[transform,background-color,border-color,color] duration-200 hover:-translate-y-0.5 hover:scale-[1.03] active:scale-[0.97] hover:bg-white/10 hover:border-white/20"
              >
                {widget.is_visible ? (
                  <Eye className="w-3 h-3" />
                ) : (
                  <EyeOff className="w-3 h-3" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{widget.is_visible ? 'Ocultar' : 'Mostrar'}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(widget.widget_type as WidgetType)}
                className="h-6 w-6 p-0 border border-border/50 transform-gpu transition-[transform,background-color,border-color,color] duration-200 hover:-translate-y-0.5 hover:scale-[1.03] active:scale-[0.97] hover:bg-white/10 hover:border-white/20"
              >
                <Pencil className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Editar</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(widget.id)}
                className="h-6 w-6 p-0 border border-destructive/50 transform-gpu transition-[transform,background-color,border-color,color] duration-200 hover:-translate-y-0.5 hover:scale-[1.03] active:scale-[0.97] hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Remover widget</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Preview */}
        <div className="flex-1 min-w-0 flex items-center justify-center min-h-[120px]">
          <WidgetPreview widgetType={widget.widget_type} profile={profile} />
        </div>
      </div>
    </div>
  );
}

const DashboardWidget = () => {
  const { refreshPreview } = usePreview();
  const { profile, updateProfile } = useProfile();
  const { widgets, loading, addWidget, updateWidget, deleteWidget, reorderWidgets } = useUserWidgets(undefined, true);
  const [selectedWidget, setSelectedWidget] = useState<WidgetType>(null);
  const [discordUserId, setDiscordUserId] = useState("");
  const [valorantName, setValorantName] = useState("");
  const [valorantTag, setValorantTag] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (profile) {
      setDiscordUserId(profile.discord_user_id || "");
      setValorantName(profile.valorant_name || "");
      setValorantTag(profile.valorant_tag || "");
    }
  }, [profile]);

  const openWidgetConfig = (widgetType: WidgetType) => {
    if (!widgetType) return;

    // Ensure fields are up-to-date when opening config (useful when switching accounts)
    if (widgetType === 'discord') {
      setDiscordUserId(profile?.discord_user_id || "");
    }
    if (widgetType === 'valorant') {
      setValorantName(profile?.valorant_name || "");
      setValorantTag(profile?.valorant_tag || "");
    }

    setSelectedWidget(widgetType);
  };

  const handleAddWidget = async (widgetType: WidgetType) => {
    if (!widgetType) return;
    
    const { error } = await addWidget(widgetType);
    if (error) {
      toast.error("Erro ao adicionar widget");
      return;
    }
    
    // Se o widget precisa de configuração, abrir a tela de config
    if (widgetType === 'discord' && !profile?.discord_user_id) {
      openWidgetConfig(widgetType);
    } else if (widgetType === 'valorant' && (!profile?.valorant_name || !profile?.valorant_tag)) {
      openWidgetConfig(widgetType);
    } else {
      toast.success("Widget adicionado com sucesso!");
      refreshPreview();
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      if (selectedWidget === 'discord') {
        const { error } = await updateProfile({ discord_user_id: discordUserId || null });
        if (error) {
          throw error;
        }
        toast.success("ID do Discord salvo com sucesso!");
      } else if (selectedWidget === 'valorant') {
        const { error } = await updateProfile({ 
          valorant_name: valorantName || null,
          valorant_tag: valorantTag || null
        });
        if (error) {
          throw error;
        }
        toast.success("Dados do Valorant salvos com sucesso!");
      }
      setSelectedWidget(null);
      refreshPreview();
    } catch (error) {
      console.error("Error saving widget:", error);
      toast.error("Erro ao salvar dados");
    }
  };

  const handleToggleVisibility = async (id: string, isVisible: boolean) => {
    const { error } = await updateWidget(id, { is_visible: !isVisible });
    if (error) {
      toast.error("Erro ao atualizar widget");
    } else {
      toast.success(`Widget ${!isVisible ? "exibido" : "ocultado"}!`);
      refreshPreview();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteWidget(id);
    if (error) {
      toast.error("Erro ao remover widget");
    } else {
      toast.success("Widget removido!");
      refreshPreview();
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = widgets.findIndex((w) => w.id === active.id);
      const newIndex = widgets.findIndex((w) => w.id === over.id);

      const newOrder = arrayMove(widgets, oldIndex, newIndex);
      const { error } = await reorderWidgets(newOrder);

      if (error) {
        toast.error("Erro ao reordenar widgets");
      } else {
        toast.success("Ordem atualizada!");
        refreshPreview();
      }
    }
  };

  const renderWidgetConfig = () => {
    if (selectedWidget === 'discord') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="discord-user-id">
              ID do Usuário Discord <span className="text-destructive">*</span>
            </Label>
            <Input
              id="discord-user-id"
              type="text"
              placeholder="Ex: 1266150820039098471"
              value={discordUserId}
              onChange={(e) => setDiscordUserId(e.target.value)}
              className="w-full max-w-md"
            />
            <p className="text-xs text-muted-foreground">
              Para encontrar seu ID do Discord, ative o Modo Desenvolvedor nas configurações do Discord
              e clique com o botão direito no seu perfil → "Copiar ID"
            </p>
          </div>

          <Button onClick={handleSave} className="mt-4">
            Salvar
          </Button>

          {discordUserId && (
            <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-sm text-muted-foreground">
                O card do Discord aparecerá no seu perfil quando alguém visitar.
              </p>
            </div>
          )}
        </div>
      );
    }

    if (selectedWidget === 'valorant') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="valorant-name">
              Nome do Jogador <span className="text-destructive">*</span>
            </Label>
            <Input
              id="valorant-name"
              type="text"
              placeholder="Ex: Player"
              value={valorantName}
              onChange={(e) => setValorantName(e.target.value)}
              className="w-full max-w-md"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="valorant-tag">
              Tag <span className="text-destructive">*</span>
            </Label>
            <Input
              id="valorant-tag"
              type="text"
              placeholder="Ex: 1234"
              value={valorantTag}
              onChange={(e) => {
                setValorantTag(e.target.value.replace(/[^a-zA-Z0-9]/g, ""));
              }}
              className="w-full max-w-md"
            />
            <p className="text-xs text-muted-foreground">
              Digite apenas o número/letras da tag (sem o #)
            </p>
          </div>

          <Button onClick={handleSave} className="mt-4">
            Salvar
          </Button>

          {valorantName && valorantTag && (
            <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-sm text-muted-foreground">
                O card do Valorant aparecerá no seu perfil quando alguém visitar.
              </p>
            </div>
          )}
        </div>
      );
    }

    if (selectedWidget === 'roblox') {
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Configuração do widget Roblox em breve...
          </p>
        </div>
      );
    }

    return null;
  };

  const addedWidgetTypes = widgets.map(w => w.widget_type);
  const availableToAdd = availableWidgets.filter(w => !addedWidgetTypes.includes(w.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Widgets</h2>
          <p className="text-muted-foreground">
            Personalize seus widgets ao seu gosto
          </p>
        </div>
        
        {/* Ícones pequenos no topo direito */}
        {availableToAdd.length > 0 && (
          <div className="flex items-center gap-2">
            {availableToAdd.map((widget) => {
              const IconComponent = widget.icon;
              return (
                <Tooltip key={widget.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddWidget(widget.id)}
                      className="h-10 w-10 p-0 transform-gpu transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:scale-[1.05] hover:bg-white/10 active:scale-[0.97]"
                    >
                      <IconComponent className="w-6 h-6" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Adicionar {widget.name}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!selectedWidget ? (
          <motion.div
            key="widget-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Carregando widgets...</p>
              </div>
            ) : widgets.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">Nenhum widget adicionado ainda</p>
                <div className="flex items-center justify-center gap-2">
                  {availableWidgets.map((widget) => {
                    const IconComponent = widget.icon;
                    return (
                      <Tooltip key={widget.id}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddWidget(widget.id)}
                            className="h-14 w-14 p-0 transform-gpu transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:scale-[1.05] active:scale-[0.97]"
                          >
                            <IconComponent className="w-8 h-8" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Adicionar {widget.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-card border border-border/50 p-6">
                <h3 className="font-medium text-foreground mb-4">Seus Widgets</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Arraste para reordenar, use os botões para exibir/ocultar ou remover
                </p>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={widgets.map(w => w.id)} strategy={verticalListSortingStrategy}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <AnimatePresence>
                        {widgets.map((widget) => (
                          <SortableWidgetItem
                            key={widget.id}
                            widget={widget}
                            profile={profile}
                            onToggleVisibility={handleToggleVisibility}
                            onEdit={openWidgetConfig}
                            onDelete={handleDelete}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="widget-config"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Button
              variant="ghost"
              onClick={() => setSelectedWidget(null)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Widgets
            </Button>

            <div className="rounded-xl bg-secondary/30 border border-border/50 p-6 space-y-4">
              <div className="flex items-center gap-3">
                {(() => {
                  const widget = availableWidgets.find(w => w.id === selectedWidget);
                  if (!widget) return null;
                  const IconComponent = widget.icon;
                  return (
                    <>
                      <div className={`${widget.color} w-10 h-10 rounded-lg flex items-center justify-center`}>
                        <IconComponent className="w-8 h-8 text-foreground" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{widget.name}</h3>
                        <p className="text-sm text-muted-foreground">{widget.description}</p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {renderWidgetConfig()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardWidget;
