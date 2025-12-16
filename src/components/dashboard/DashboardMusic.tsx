import { useState, useEffect, useRef } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { usePreview } from "@/contexts/PreviewContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Music, Loader2, Play, Upload, Image as ImageIcon, Square, Maximize2, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

export function DashboardMusic() {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { setPreviewData, refreshPreview } = usePreview();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    music_title: profile?.music_title || "",
    music_artist: profile?.music_artist || "",
    music_url: profile?.music_url || "",
    music_image_url: profile?.music_image_url || "",
    music_player_style: profile?.music_player_style || "card",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        music_title: profile.music_title || "",
        music_artist: profile.music_artist || "",
        music_url: profile.music_url || "",
        music_image_url: profile.music_image_url || "",
        music_player_style: profile.music_player_style || "card",
      });
    }
  }, [profile]);

  // Update preview in real-time as user types
  useEffect(() => {
    if (profile) {
      setPreviewData({
        music_title: formData.music_title,
        music_artist: formData.music_artist,
        music_url: formData.music_url,
        music_image_url: formData.music_image_url,
        display_name: profile.display_name,
        bio: profile.bio,
        location: profile.location,
        background_color: profile.background_color,
        background_url: profile.background_url,
        background_type: profile.background_type as 'solid' | 'image' | undefined,
        avatar_url: profile.avatar_url,
        username: profile.username,
      });
    }
  }, [formData, profile, setPreviewData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
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

  const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a)$/i)) {
      toast.error("Por favor, selecione um arquivo de áudio válido (MP3, WAV, OGG, M4A)");
      return;
    }

    setUploading('music');
    try {
      const url = await uploadFile(file, 'music');
      if (url) {
        setFormData(prev => ({ ...prev, music_url: url }));
        toast.success("Música enviada com sucesso!");
        refreshPreview();
      }
    } catch (error) {
      toast.error("Falha ao enviar música");
    }
    setUploading(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error("Por favor, selecione uma imagem válida (JPG, PNG, WEBP)");
      return;
    }

    setUploading('image');
    try {
      const url = await uploadFile(file, 'music');
      if (url) {
        setFormData(prev => ({ ...prev, music_image_url: url }));
        // Salvar automaticamente após upload
        await updateProfile({ music_image_url: url });
        toast.success("Imagem enviada e salva com sucesso!");
        refreshPreview();
      }
    } catch (error) {
      toast.error("Falha ao enviar imagem");
    }
    setUploading(null);
  };

  const handleClearMusic = async () => {
    setFormData(prev => ({
      ...prev,
      music_title: "",
      music_artist: "",
      music_url: "",
      music_image_url: ""
    }));
    
    setSaving(true);
    const { error } = await updateProfile({
      music_title: "",
      music_artist: "",
      music_url: "",
      music_image_url: ""
    });
    
    if (error) {
      toast.error("Falha ao limpar música");
    } else {
      toast.success("Música removida com sucesso!");
      refreshPreview();
    }
    setSaving(false);
  };

  const handleClearImage = async () => {
    setFormData(prev => ({
      ...prev,
      music_image_url: ""
    }));
    
    const { error } = await updateProfile({
      music_image_url: ""
    });
    
    if (error) {
      toast.error("Falha ao remover imagem");
    } else {
      toast.success("Imagem removida com sucesso!");
      refreshPreview();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile(formData);
    
    if (error) {
      toast.error("Falha ao salvar alterações");
    } else {
      toast.success("Configurações de música salvas!");
      refreshPreview();
    }
    setSaving(false);
  };

  if (!profile) return null;

  return (
    <div className="space-y-6">
      {/* Music Player Preview */}
      <motion.div 
        className="p-6 md:p-8 rounded-2xl bg-card border border-border/50"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-6">
          <Music className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-foreground">Música do perfil</h3>
        </div>

        {/* Preview Card */}
        {(formData.music_title || formData.music_artist || formData.music_image_url) && (
          <div className="mb-6 p-4 rounded-xl bg-secondary/50 flex items-center gap-4">
            {formData.music_image_url ? (
              <img 
                src={formData.music_image_url} 
                alt="Capa da música"
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-secondary/50 border border-border/50 flex items-center justify-center">
                <Music className="w-8 h-8 text-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">
                {formData.music_title || "Título da música"}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {formData.music_artist || "Artista"}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Título da Música</label>
            <Input
              name="music_title"
              value={formData.music_title}
              onChange={handleInputChange}
              placeholder="Digite o nome da música"
              className="bg-secondary/50"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Artista</label>
            <Input
              name="music_artist"
              value={formData.music_artist}
              onChange={handleInputChange}
              placeholder="Digite o nome do artista"
              className="bg-secondary/50"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">
              Arquivo de Música
            </label>
            <div className="flex gap-2">
              <Input
                name="music_url"
                value={formData.music_url}
                onChange={handleInputChange}
                placeholder="URL do arquivo de áudio ou faça upload"
                className="bg-secondary/50 flex-1"
                readOnly
              />
              <input
                ref={musicInputRef}
                type="file"
                accept="audio/*"
                onChange={handleMusicUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => musicInputRef.current?.click()}
                disabled={uploading === 'music'}
              >
                {uploading === 'music' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
              </Button>
              {formData.music_url && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearMusic}
                  disabled={saving}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
            {formData.music_url && (
              <p className="text-xs text-muted-foreground mt-1.5">✓ Arquivo de música carregado</p>
            )}
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">
              Imagem da Música (Capa)
            </label>
            <div className="flex gap-2">
              <Input
                name="music_image_url"
                value={formData.music_image_url}
                onChange={handleInputChange}
                placeholder="URL da imagem ou faça upload"
                className="bg-secondary/50 flex-1"
                readOnly
              />
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploading === 'image'}
              >
                {uploading === 'image' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ImageIcon className="w-4 h-4" />
                )}
              </Button>
              {formData.music_image_url && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearImage}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
            {formData.music_image_url && (
              <p className="text-xs text-muted-foreground mt-1.5">✓ Imagem carregada</p>
            )}
          </div>

          {/* Player Style Selection */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/50">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                Estilo do Player
              </label>
              <p className="text-xs text-muted-foreground">
                Escolha como o player de música será exibido no seu perfil
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  setFormData(prev => ({ ...prev, music_player_style: 'card' }));
                  await updateProfile({ music_player_style: 'card' });
                  refreshPreview();
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  formData.music_player_style === 'card'
                    ? 'bg-accent text-white'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                <Square className="w-4 h-4 inline mr-2" />
                Card
              </button>
              <button
                onClick={async () => {
                  setFormData(prev => ({ ...prev, music_player_style: 'floating' }));
                  await updateProfile({ music_player_style: 'floating' });
                  refreshPreview();
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  formData.music_player_style === 'floating'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                <Maximize2 className="w-4 h-4 inline mr-2" />
                Flutuante
              </button>
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
