import { useState } from "react";
import { useUserLinks, useProfile } from "@/hooks/useProfile";
import { usePreview } from "@/contexts/PreviewContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ExternalLink, Eye, EyeOff, Loader2, Link2, MousePointer, GripVertical, LayoutGrid, List, Type, ImageIcon, Palette, Settings2, Edit } from "lucide-react";
import { toast } from "@/lib/toast";
import { motion, AnimatePresence } from "framer-motion";
import { socialPlatforms, getSocialIcon } from "@/lib/socialIcons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColorPicker } from "@/components/ui/color-picker";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function DashboardLinks() {
  const { refreshPreview, setPreviewData } = usePreview();
  const { links, addLink, updateLink, deleteLink, loading } = useUserLinks();
  const { profile, updateProfile } = useProfile();
  const [newLink, setNewLink] = useState({ title: "", url: "", icon: "" });
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLink, setEditingLink] = useState<{ id: string; icon_color: string | null; icon: string | null } | null>(null);
  const [editingLinkData, setEditingLinkData] = useState<{ id: string; title: string; url: string; icon: string } | null>(null);
  
  // Handle URL change
  const handleUrlChange = (url: string) => {
    setNewLink(prev => ({ ...prev, url }));
  };
  
  // Handle platform selection
  const handlePlatformSelect = (platformName: string) => {
    if (platformName === "custom") {
      // Allow custom icon when "Personalizado" is selected
      return;
    }
    
    // Clear custom icon when selecting a specific platform
    // The icon will be auto-detected from the URL
    setNewLink(prev => ({ ...prev, icon: "" }));
  };

  const handleAddLink = async () => {
    if (!newLink.title || !newLink.url) {
      toast.error("Por favor, preencha o título e a URL");
      return;
    }
    setAdding(true);
    const { error } = await addLink(newLink);
    if (error) {
      toast.error("Falha ao adicionar link");
    } else {
      toast.success("Link adicionado!");
      setNewLink({ title: "", url: "", icon: "" });
      setShowAddForm(false);
      refreshPreview();
    }
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    await deleteLink(id);
    toast.success("Link removido");
    refreshPreview();
  };

  const toggleVisibility = async (id: string, isVisible: boolean) => {
    const { error } = await updateLink(id, { is_visible: !isVisible });
    if (error) {
      toast.error("Erro ao atualizar link");
    } else {
      toast.success(isVisible ? "Link oculto" : "Link visível");
      refreshPreview();
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
    <div className="space-y-4 sm:space-y-6">
      <motion.div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-foreground text-base sm:text-lg">Seus Links</h3>
          <span className="text-sm text-muted-foreground">({links.length})</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Link Style Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/50 border border-border/50">
            <button
              onClick={async () => {
                const { error } = await updateProfile({ link_style: 'cards' });
                if (!error) {
                  // Update preview immediately with new value (merge with existing previewData)
                  setPreviewData((prev: any) => ({ ...prev, link_style: 'cards' }));
                  // Then refresh to sync with database
                  refreshPreview();
                }
              }}
              className={`p-1.5 rounded-md transition-colors ${
                (profile?.link_style || 'cards') === 'cards'
                  ? 'bg-accent/20 text-accent'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Cards"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={async () => {
                const { error } = await updateProfile({ link_style: 'buttons' });
                if (!error) {
                  // Update preview immediately with new value (merge with existing previewData)
                  setPreviewData((prev: any) => ({ ...prev, link_style: 'buttons' }));
                  // Then refresh to sync with database
                  refreshPreview();
                }
              }}
              className={`p-1.5 rounded-md transition-colors ${
                profile?.link_style === 'buttons'
                  ? 'bg-accent/20 text-accent'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Botões"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          
          {/* Link Button Style Toggle - Only show when buttons style is selected */}
          {(profile?.link_style || 'cards') === 'buttons' && (
            <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/50 border border-border/50">
              <button
                onClick={async () => {
                  const { error } = await updateProfile({ link_button_style: 'icon_only' });
                  if (!error) {
                    // Update preview immediately with new value (merge with existing previewData)
                    setPreviewData((prev: any) => ({ ...prev, link_button_style: 'icon_only' }));
                    // Then refresh to sync with database
                    refreshPreview();
                  }
                }}
                className={`p-1.5 rounded-md transition-colors ${
                  (profile?.link_button_style || 'with_text') === 'icon_only'
                    ? 'bg-accent/20 text-accent'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Apenas Ícone"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
              <button
                onClick={async () => {
                  const { error } = await updateProfile({ link_button_style: 'with_text' });
                  if (!error) {
                    // Update preview immediately with new value (merge with existing previewData)
                    setPreviewData((prev: any) => ({ ...prev, link_button_style: 'with_text' }));
                    // Then refresh to sync with database
                    refreshPreview();
                  }
                }}
                className={`p-1.5 rounded-md transition-colors ${
                  (profile?.link_button_style || 'with_text') === 'with_text'
                    ? 'bg-accent/20 text-accent'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Ícone com Texto"
              >
                <Type className="w-4 h-4" />
              </button>
            </div>
          )}
          <Button onClick={() => setShowAddForm(!showAddForm)} size="sm" className="gap-2 bg-accent hover:bg-accent/90 text-xs sm:text-sm">
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Adicionar Link</span>
            <span className="sm:hidden">Adicionar</span>
          </Button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div className="p-4 sm:p-6 md:p-7 rounded-xl sm:rounded-2xl bg-card border border-border/50" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <h4 className="font-medium text-base sm:text-lg text-foreground mb-3 sm:mb-4">Adicionar Novo Link</h4>
            <div className="space-y-3 sm:space-y-4">
              {/* Platform Selector */}
              <div>
                <label className="text-xs sm:text-sm text-muted-foreground mb-1.5 block">Rede Social (opcional)</label>
                <Select onValueChange={handlePlatformSelect}>
                  <SelectTrigger className="bg-secondary/50 text-sm">
                    <SelectValue placeholder="Selecione uma rede social" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Personalizado</SelectItem>
                    {socialPlatforms.map((platform) => {
                      const Icon = platform.icon;
                      return (
                        <SelectItem key={platform.name} value={platform.name}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" style={{ color: platform.color }} />
                            <span>{platform.name}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <Input placeholder="Título do link" value={newLink.title} onChange={(e) => setNewLink(prev => ({ ...prev, title: e.target.value }))} className="bg-secondary/50 text-sm" />
                <Input placeholder="URL" value={newLink.url} onChange={(e) => handleUrlChange(e.target.value)} className="bg-secondary/50 text-sm" />
                <Input placeholder="Ícone emoji (opcional)" value={newLink.icon} onChange={(e) => setNewLink(prev => ({ ...prev, icon: e.target.value }))} className="bg-secondary/50 md:col-span-2 text-sm" />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button onClick={handleAddLink} disabled={adding} className="flex-1 bg-primary text-primary-foreground hover:opacity-90 text-sm">
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Adicionar Link"}
                </Button>
                <Button variant="secondary" onClick={() => setShowAddForm(false)} className="text-sm">Cancelar</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialog para editar link */}
      <Dialog open={!!editingLinkData} onOpenChange={(open) => !open && setEditingLinkData(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-accent" />
              Editar Link
            </DialogTitle>
            <DialogDescription>
              Edite as informações do link
            </DialogDescription>
          </DialogHeader>

          {editingLinkData && (
            <div className="space-y-4 py-4">
              {/* Platform Selector */}
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Rede Social (opcional)</label>
                <Select onValueChange={(value) => {
                  if (value === "custom") {
                    return;
                  }
                  setEditingLinkData(prev => prev ? { ...prev, icon: "" } : null);
                }}>
                  <SelectTrigger className="bg-secondary/50">
                    <SelectValue placeholder="Selecione uma rede social" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Personalizado</SelectItem>
                    {socialPlatforms.map((platform) => {
                      const Icon = platform.icon;
                      return (
                        <SelectItem key={platform.name} value={platform.name}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" style={{ color: platform.color }} />
                            <span>{platform.name}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  placeholder="Título do link" 
                  value={editingLinkData.title} 
                  onChange={(e) => setEditingLinkData(prev => prev ? { ...prev, title: e.target.value } : null)} 
                  className="bg-secondary/50" 
                />
                <Input 
                  placeholder="URL" 
                  value={editingLinkData.url} 
                  onChange={(e) => setEditingLinkData(prev => prev ? { ...prev, url: e.target.value } : null)} 
                  className="bg-secondary/50" 
                />
                <Input 
                  placeholder="Ícone emoji (opcional)" 
                  value={editingLinkData.icon} 
                  onChange={(e) => setEditingLinkData(prev => prev ? { ...prev, icon: e.target.value } : null)} 
                  className="bg-secondary/50 md:col-span-2" 
                />
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={async () => {
                    if (!editingLinkData) return;
                    await updateLink(editingLinkData.id, {
                      title: editingLinkData.title,
                      url: editingLinkData.url,
                      icon: editingLinkData.icon || null,
                    });
                    toast.success("Link atualizado!");
                    refreshPreview();
                    setEditingLinkData(null);
                  }}
                  className="flex-1 bg-primary text-primary-foreground hover:opacity-90"
                >
                  Salvar Alterações
                </Button>
                <Button variant="secondary" onClick={() => setEditingLinkData(null)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {links.map((link, index) => (
            <motion.div key={link.id} className="p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-card border border-border/50 hover:border-border transition-colors group" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }} transition={{ delay: index * 0.05 }}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto flex-1 sm:flex-initial min-w-0">
                  <div className="text-muted-foreground/50 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                    {(() => {
                      const { Icon, color, isCustom } = getSocialIcon(link.url, link.icon);
                      const iconColor = link.icon_color || color;
                      if (isCustom && link.icon) {
                        return <span className="text-lg">{link.icon}</span>;
                      }
                      return <Icon className="w-5 h-5" style={iconColor ? { color: iconColor } : undefined} />;
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate text-sm sm:text-base ${link.is_visible ? 'text-foreground' : 'text-muted-foreground'}`}>{link.title}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{link.url}</p>
                  </div>
                </div>
                <div className="flex items-center justify-end w-full sm:w-auto gap-2 sm:gap-4 ml-auto">
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                    <MousePointer className="w-3 h-3" />
                    <span>{link.clicks_count || 0}</span>
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => setEditingLinkData({ id: link.id, title: link.title, url: link.url, icon: link.icon || "" })} title="Editar link">
                      <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => setEditingLink({ id: link.id, icon_color: link.icon_color, icon: link.icon })} title="Personalizar ícone">
                      <Settings2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => toggleVisibility(link.id, link.is_visible)} title={link.is_visible ? "Ocultar" : "Mostrar"}>
                      {link.is_visible ? <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => window.open(link.url, '_blank')} title="Abrir link">
                      <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(link.id)} title="Deletar">
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {links.length === 0 && !showAddForm && (
          <motion.div className="text-center py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
              <Link2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">Nenhum link ainda</p>
            <Button onClick={() => setShowAddForm(true)} variant="secondary" className="gap-2">
              <Plus className="w-4 h-4" />
              Adicionar seu primeiro link
            </Button>
          </motion.div>
        )}
      </div>

      {/* Dialog para personalizar ícone */}
      <Dialog open={!!editingLink} onOpenChange={(open) => !open && setEditingLink(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-accent" />
              Personalizar Ícone
            </DialogTitle>
            <DialogDescription>
              Personalize a cor e o ícone deste link
            </DialogDescription>
          </DialogHeader>

          {editingLink && (
            <div className="space-y-6 py-4">
              {/* Preview do ícone */}
              <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-secondary/50">
                <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center">
                  {(() => {
                    const link = links.find(l => l.id === editingLink.id);
                    if (!link) return null;
                    const { Icon, color, isCustom } = getSocialIcon(link.url, editingLink.icon || link.icon);
                    const iconColor = editingLink.icon_color || color;
                    if (isCustom && (editingLink.icon || link.icon)) {
                      return <span className="text-2xl">{editingLink.icon || link.icon}</span>;
                    }
                    return <Icon className="w-8 h-8" style={iconColor ? { color: iconColor } : undefined} />;
                  })()}
                </div>
                <p className="text-sm text-muted-foreground">Preview do ícone</p>
              </div>

              {/* Cor personalizada */}
              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">Cor do Ícone</label>
                <ColorPicker
                  value={editingLink.icon_color || (() => {
                    const link = links.find(l => l.id === editingLink.id);
                    if (!link) return '#ffffff';
                    const { color } = getSocialIcon(link.url, link.icon);
                    return color || '#ffffff';
                  })()}
                  onChange={(color) => {
                    setEditingLink(prev => prev ? { ...prev, icon_color: color } : null);
                  }}
                  className="w-full"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => {
                    setEditingLink(prev => prev ? { ...prev, icon_color: null } : null);
                  }}
                >
                  Usar cor padrão
                </Button>
              </div>

              {/* Ícone personalizado (emoji) */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Ícone Personalizado (Emoji)</label>
                <Input
                  placeholder="Ex: 🎮, 🔗, ⚡"
                  value={editingLink.icon || ''}
                  onChange={(e) => {
                    setEditingLink(prev => prev ? { ...prev, icon: e.target.value || null } : null);
                  }}
                  className="bg-secondary/50 text-2xl text-center"
                  maxLength={2}
                />
                <p className="text-xs text-muted-foreground mt-2">Deixe vazio para usar o ícone padrão da rede social</p>
              </div>

              {/* Botões de ação */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={async () => {
                    if (!editingLink) return;
                    await updateLink(editingLink.id, {
                      icon_color: editingLink.icon_color,
                      icon: editingLink.icon,
                    });
                    toast.success("Ícone personalizado atualizado!");
                    refreshPreview();
                    setEditingLink(null);
                  }}
                  className="flex-1 bg-primary text-primary-foreground hover:opacity-90"
                >
                  Salvar
                </Button>
                <Button variant="secondary" onClick={() => setEditingLink(null)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
