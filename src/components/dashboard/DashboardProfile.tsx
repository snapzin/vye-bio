import { useState, useEffect, useRef } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { usePreview } from "@/contexts/PreviewContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast";

export function DashboardProfile() {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { setPreviewData } = usePreview();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    display_name: profile?.display_name || "",
    bio: profile?.bio || "",
    location: profile?.location || "",
    music_title: profile?.music_title || "",
    music_artist: profile?.music_artist || "",
    background_color: profile?.background_color || "#0a0a0b",
  });

  // Sync formData with profile when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || "",
        bio: profile.bio || "",
        location: profile.location || "",
        music_title: profile.music_title || "",
        music_artist: profile.music_artist || "",
        background_color: profile.background_color || "#0a0a0b",
      });
    }
  }, [profile]);

  // Update preview in real-time as user types
  useEffect(() => {
    if (profile) {
      setPreviewData({
        ...formData,
        background_url: profile.background_url,
        background_type: profile.background_type,
        avatar_url: profile.avatar_url,
        username: profile.username,
        music_url: profile.music_url,
        music_image_url: profile.music_image_url,
      });
    }
  }, [formData, profile, setPreviewData]);

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
      toast.success("Perfil atualizado!");
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

    setUploading(true);
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
    setUploading(false);
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
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
    setUploading(false);
  };

  if (!profile) return null;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Editar Perfil</h2>
        <p className="text-muted-foreground">Personalize como os outros te veem</p>
      </div>

      {/* Avatar & Background */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Avatar */}
        <div className="p-6 rounded-2xl bg-card">
          <h3 className="font-medium text-foreground mb-4">Avatar</h3>
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.display_name || profile.username}`}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover"
              />
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Clique para enviar</p>
              <p>PNG, JPG, GIF up to 2MB</p>
            </div>
          </div>
        </div>

        {/* Background */}
        <div className="p-6 rounded-2xl bg-card">
          <h3 className="font-medium text-foreground mb-4">Plano de Fundo</h3>
          <div 
            onClick={() => backgroundInputRef.current?.click()}
            className="relative h-24 rounded-xl cursor-pointer overflow-hidden group"
            style={{
              backgroundColor: profile.background_color || '#0a0a0b',
              backgroundImage: profile.background_type === 'image' && profile.background_url 
                ? `url(${profile.background_url})` 
                : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <input
              ref={backgroundInputRef}
              type="file"
              accept="image/*"
              onChange={handleBackgroundUpload}
              className="hidden"
            />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Ou escolha uma cor:</span>
            <input
              type="color"
              value={formData.background_color}
              onChange={async (e) => {
                setFormData(prev => ({ ...prev, background_color: e.target.value }));
                await updateProfile({ 
                  background_color: e.target.value,
                  background_type: 'solid'
                });
                refreshPreview();
              }}
              className="w-8 h-8 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="p-6 rounded-2xl bg-card space-y-4">
        <h3 className="font-medium text-foreground">Informações Básicas</h3>
        
        <div>
          <label className="text-sm text-muted-foreground mb-1.5 block">Nome de Exibição</label>
          <Input
            name="display_name"
            value={formData.display_name}
            onChange={handleInputChange}
            placeholder="Seu nome"
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1.5 block">Bio</label>
          <Textarea
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            placeholder="Conte ao mundo sobre você..."
            className="min-h-[100px] bg-secondary/50 border-0 focus:ring-1 focus:ring-white/10"
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1.5 block">Localização</label>
          <Input
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="Cidade, País"
          />
        </div>
      </div>

      {/* Music */}
      <div className="p-6 rounded-2xl bg-card space-y-4">
        <h3 className="font-medium text-foreground">Música do Perfil</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Título da Música</label>
            <Input
              name="music_title"
              value={formData.music_title}
              onChange={handleInputChange}
              placeholder="Nome da música"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Artista</label>
            <Input
              name="music_artist"
              value={formData.music_artist}
              onChange={handleInputChange}
              placeholder="Nome do artista"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <Button onClick={handleSave} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Salvar Alterações
      </Button>
    </div>
  );
}
