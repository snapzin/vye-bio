import { useState, useEffect, useRef } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { usePreview } from "@/contexts/PreviewContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, Loader2, Save, Upload, Image, User, Square, Circle, Palette, X, Layout, AlignLeft, AlignCenter, FileText } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { ColorPicker } from "@/components/ui/color-picker";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast";
import { motion } from "framer-motion";

const avatarShapes = [
  { id: "square", label: "Square", icon: Square },
  { id: "rounded", label: "Rounded", icon: Square },
  { id: "circle", label: "Circle", icon: Circle },
];

export function DashboardAppearance() {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { setPreviewData, refreshPreview } = usePreview();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    display_name: profile?.display_name || "",
    bio: profile?.bio || "",
    location: profile?.location || "",
    background_color: profile?.background_color || "#0a0a0b",
    avatar_shape: profile?.avatar_shape || "rounded",
    card_color: profile?.card_color || "#000000",
    card_opacity: profile?.card_opacity ?? 100,
    card_blur: profile?.card_blur ?? 0,
    card_direction: profile?.card_direction || "center",
    card_style: profile?.card_style || "default",
  });

  // Sync formData with profile when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || "",
        bio: profile.bio || "",
        location: profile.location || "",
        background_color: profile.background_color || "#0a0a0b",
        avatar_shape: profile.avatar_shape || "rounded",
        card_color: profile.card_color || "#000000",
        card_opacity: profile.card_opacity ?? 100,
        card_blur: profile.card_blur ?? 0,
        card_direction: profile.card_direction || "center",
        card_style: profile.card_style || "default",
      });
    }
  }, [profile]);

  // Update preview in real-time as user types
  useEffect(() => {
    if (profile) {
      setPreviewData({
        ...formData,
        background_url: profile.background_url,
        background_type: profile.background_type as 'solid' | 'image' | undefined,
        avatar_url: profile.avatar_url,
        avatar_shape: formData.avatar_shape,
        username: profile.username,
        banner_url: profile.banner_url,
      });
    }
  }, [formData, profile, setPreviewData]);

  // Update preview when background is uploaded
  useEffect(() => {
    if (profile) {
      setPreviewData({
        display_name: profile.display_name,
        bio: profile.bio,
        location: profile.location,
        background_color: profile.background_color,
        background_url: profile.background_url,
        background_type: profile.background_type as 'solid' | 'image' | undefined,
        avatar_url: profile.avatar_url,
        avatar_shape: profile.avatar_shape,
        username: profile.username,
        banner_url: profile.banner_url,
      });
    }
  }, [profile?.background_url, profile?.background_type, profile?.banner_url, setPreviewData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile(formData);
    
    if (error) {
      toast.error("Falha ao salvar alterações");
    } else {
      toast.success("Alterações salvas!");
      refreshPreview();
    }
    setSaving(false);
  };

  const uploadFile = async (file: File, bucket: string) => {
    if (!user) return null;
    
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading('avatar');
    try {
      const url = await uploadFile(file, 'avatars');
      if (url) {
        await updateProfile({ avatar_url: url });
        toast.success("Avatar atualizado!");
        refreshPreview();
      }
    } catch (error) {
      toast.error("Falha ao enviar avatar");
    }
    setUploading(null);
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading('background');
    try {
      const url = await uploadFile(file, 'backgrounds');
      if (url) {
        await updateProfile({ 
          background_url: url,
          background_type: 'image'
        });
        toast.success("Plano de fundo atualizado!");
        refreshPreview();
      }
    } catch (error) {
      toast.error("Falha ao enviar plano de fundo");
    }
    setUploading(null);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading('banner');
    try {
      const url = await uploadFile(file, 'backgrounds');
      if (url) {
        await updateProfile({ banner_url: url });
        toast.success("Banner atualizado!");
        refreshPreview();
      }
    } catch (error) {
      toast.error("Falha ao enviar banner");
    }
    setUploading(null);
  };

  if (!profile) return null;

  return (
    <div className="space-y-6">
      {/* Assets Section */}
      <motion.div 
        className="p-6 md:p-8 rounded-2xl bg-card border border-border/50"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-6">
          <Image className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-lg text-foreground">Assets</h3>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Avatar Section */}
          <div className="md:col-span-2 lg:col-span-1">
            <div className="flex gap-6">
              {/* Avatar */}
              <div className="relative w-24 h-24 flex-shrink-0 group cursor-pointer" onClick={() => setAvatarModalOpen(true)}>
                <img
                  src={profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.display_name || profile.username}`}
                  alt="Avatar"
                  className="w-full h-full rounded-2xl object-cover bg-secondary transition-opacity group-hover:opacity-70"
                />
                <div className="absolute inset-0 w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-2xl">
                  <Camera className="w-7 h-7 text-white" />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Avatar Modal */}
        <Dialog open={avatarModalOpen} onOpenChange={setAvatarModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-accent" />
                Personalizar Avatar
              </DialogTitle>
              <DialogDescription>
                Envie uma nova imagem de avatar e escolha seu formato de exibição
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Avatar Preview */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-32 h-32 group">
                  <img
                    src={profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.display_name || profile.username}`}
                    alt="Avatar Preview"
                    className={`w-full h-full object-cover bg-secondary transition-all ${
                      formData.avatar_shape === 'circle' ? 'rounded-full' :
                      formData.avatar_shape === 'rounded' ? 'rounded-2xl' :
                      'rounded-none'
                    }`}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploading === 'avatar'}
                  className="gap-2"
                >
                  {uploading === 'avatar' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Enviar Novo Avatar
                    </>
                  )}
                </Button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>

              {/* Avatar Shape Selection */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Palette className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Formato do Avatar</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {avatarShapes.map((shape) => (
                    <button
                      key={shape.id}
                      onClick={async () => {
                        setFormData(prev => ({ ...prev, avatar_shape: shape.id }));
                        await updateProfile({ avatar_shape: shape.id });
                        refreshPreview();
                      }}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                        formData.avatar_shape === shape.id
                          ? 'bg-accent/20 border-2 border-accent' 
                          : 'bg-secondary/50 border-2 border-transparent hover:bg-secondary hover:border-border/50'
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${
                        formData.avatar_shape === shape.id
                          ? 'bg-accent' 
                          : 'bg-secondary'
                      }`}>
                        <User className={`w-7 h-7 text-foreground ${
                          shape.id === 'circle' ? 'rounded-full' : 
                          shape.id === 'rounded' ? 'rounded-md' : 
                          'rounded-none'
                        }`} />
                      </div>
                      <span className={`text-sm font-medium ${
                        formData.avatar_shape === shape.id
                          ? 'text-accent' 
                          : 'text-muted-foreground'
                      }`}>
                        {shape.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Background & Banner */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {/* Background Image */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">Imagem de Fundo</p>
            <div 
              onClick={() => backgroundInputRef.current?.click()}
              className="h-32 rounded-xl border-2 border-dashed border-border hover:border-accent/50 cursor-pointer flex flex-col items-center justify-center gap-2 transition-colors group"
              style={{
                backgroundColor: profile.background_type === 'image' && profile.background_url ? undefined : profile.background_color,
                backgroundImage: profile.background_type === 'image' && profile.background_url 
                  ? `url(${profile.background_url})` 
                  : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {!profile.background_url && (
                <>
                  <Upload className="w-6 h-6 text-muted-foreground group-hover:text-accent transition-colors" />
                  <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    Drag and drop file here or <span className="text-accent">Choose File</span>
                  </p>
                  <p className="text-xs text-muted-foreground">.jpeg, .png, .gif, .webp, .jpg</p>
                </>
              )}
              {uploading === 'background' && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-xl">
                  <Loader2 className="w-6 h-6 animate-spin text-accent" />
                </div>
              )}
            </div>
            <input
              ref={backgroundInputRef}
              type="file"
              accept="image/*"
              onChange={handleBackgroundUpload}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground mt-2">Recommended size: 1920x1080</p>
          </div>

          {/* Banner Image */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">Imagem do Banner</p>
            <div 
              onClick={() => bannerInputRef.current?.click()}
              className="h-32 rounded-xl border-2 border-dashed border-border hover:border-accent/50 cursor-pointer flex flex-col items-center justify-center gap-2 transition-colors group relative overflow-hidden"
              style={{
                backgroundImage: profile.banner_url 
                  ? `url(${profile.banner_url})` 
                  : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {!profile.banner_url && (
                <>
                  <Upload className="w-6 h-6 text-muted-foreground group-hover:text-accent transition-colors" />
                  <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    Drag and drop file here or <span className="text-accent">Choose File</span>
                  </p>
                  <p className="text-xs text-muted-foreground">.jpeg, .png, .gif, .webp, .jpg</p>
                </>
              )}
              {uploading === 'banner' && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-xl">
                  <Loader2 className="w-6 h-6 animate-spin text-accent" />
                </div>
              )}
            </div>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              onChange={handleBannerUpload}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground mt-2">Recommended size: 1920x1080</p>
          </div>
        </div>

        {/* Color Picker */}
        <div className="mt-6">
          <label className="text-sm font-medium text-foreground mb-3 block">Cor de Fundo</label>
          <ColorPicker
            value={formData.background_color || "#0a0a0b"}
            onChange={(color) => {
              setFormData(prev => ({ ...prev, background_color: color }));
              updateProfile({ background_color: color });
              refreshPreview();
            }}
            className="w-full"
          />
        </div>
      </motion.div>

      {/* Basic Info Section */}
      <motion.div 
        className="p-6 md:p-8 rounded-2xl bg-card border border-border/50"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-6">
          <User className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-lg text-foreground">Profile Info</h3>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Nome de Exibição</label>
            <Input
              name="display_name"
              value={formData.display_name}
              onChange={handleInputChange}
              placeholder="Seu nome"
              className="bg-secondary/50"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Location</label>
            <Input
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Cidade, País"
              className="bg-secondary/50"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm text-muted-foreground mb-1.5 block">Bio</label>
          <Textarea
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            placeholder="Conte aos outros sobre você..."
            className="min-h-[100px] bg-secondary/50 resize-none"
          />
        </div>
      </motion.div>

      {/* Card Settings */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4">Configurações do Card</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card Color */}
          <div className="p-4 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Palette className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-medium text-foreground">Card Color</h4>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Choose the color of your card</p>
            <ColorPicker
              value={formData.card_color}
              onChange={(color) => setFormData(prev => ({ ...prev, card_color: color }))}
            />
          </div>

          {/* Card Opacity */}
          <div className="p-4 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Image className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-medium text-foreground">Card Opacity</h4>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Choose the opacity of your card</p>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-8">{formData.card_opacity}</span>
              <Slider
                value={[formData.card_opacity]}
                onValueChange={(value) => setFormData(prev => ({ ...prev, card_opacity: value[0] }))}
                max={100}
                min={0}
                step={1}
                className="flex-1"
              />
            </div>
          </div>

          {/* Card Blur */}
          <div className="p-4 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Image className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-medium text-foreground">Card Blur</h4>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Adjust the blur effect of your card</p>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-8">{formData.card_blur}</span>
              <Slider
                value={[formData.card_blur]}
                onValueChange={(value) => setFormData(prev => ({ ...prev, card_blur: value[0] }))}
                max={100}
                min={0}
                step={1}
                className="flex-1"
              />
            </div>
          </div>

          {/* Card Layout */}
          <div className="p-4 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Layout className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-medium text-foreground">Card Layout</h4>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Choose how your information is displayed</p>
            
            <div className="space-y-3">
              {/* Card Direction */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Card Direction</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, card_direction: 'left' }))}
                    className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                      formData.card_direction === 'left'
                        ? 'bg-accent/20 border-accent text-foreground'
                        : 'bg-secondary/50 border-border text-muted-foreground hover:border-border/50'
                    }`}
                  >
                    <AlignLeft className="w-4 h-4" />
                    <span className="text-sm">Left</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, card_direction: 'center' }))}
                    className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                      formData.card_direction === 'center'
                        ? 'bg-accent/20 border-accent text-foreground'
                        : 'bg-secondary/50 border-border text-muted-foreground hover:border-border/50'
                    }`}
                  >
                    <AlignCenter className="w-4 h-4" />
                    <span className="text-sm">Center</span>
                  </button>
                </div>
              </div>

              {/* Card Style */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Card Style</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, card_style: 'default' }))}
                    className={`relative p-3 rounded-lg border transition-colors text-left ${
                      formData.card_style === 'default'
                        ? 'bg-accent/20 border-accent'
                        : 'bg-secondary/50 border-border hover:border-border/50'
                    }`}
                  >
                    <FileText className="w-4 h-4 mb-1 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">Default</p>
                    <p className="text-xs text-muted-foreground">Classic profile layout</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, card_style: 'banner' }))}
                    className={`relative p-3 rounded-lg border transition-colors text-left ${
                      formData.card_style === 'banner'
                        ? 'bg-accent/20 border-accent'
                        : 'bg-secondary/50 border-border hover:border-border/50'
                    }`}
                  >
                    {formData.card_style === 'banner' && (
                      <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-500" />
                    )}
                    <FileText className="w-4 h-4 mb-1 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">Banner</p>
                    <p className="text-xs text-muted-foreground">Estilo de cabeçalho grande</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Button 
          onClick={handleSave} 
          disabled={saving} 
          className="w-full h-12 bg-primary text-primary-foreground hover:opacity-90 font-semibold"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
        </Button>
      </motion.div>
    </div>
  );
}
