import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function HeroSection() {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();
  const [socialAvatars, setSocialAvatars] = useState<Array<{ avatarUrl: string | null; alt: string }>>([]);

  const handleClaim = () => {
    if (username.trim()) {
      navigate(`/register?username=${username}`);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function fetchSocialAvatars() {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("username, display_name, avatar_url, views_count, created_at")
          .not("username", "is", null)
          .order("views_count", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(5);

        if (cancelled) return;
        if (error) {
          console.error("Erro ao carregar avatares do hero:", error);
          setSocialAvatars([]);
          return;
        }

        const mapped =
          (data || [])
            .filter((p: any) => typeof p?.username === "string" && p.username.length > 0)
            .map((p: any) => ({
              avatarUrl: p.avatar_url || null,
              alt: p.display_name || p.username,
            })) satisfies Array<{ avatarUrl: string | null; alt: string }>;

        setSocialAvatars(mapped);
      } catch {
        if (!cancelled) setSocialAvatars([]);
      }
    }

    fetchSocialAvatars();

    return () => {
      cancelled = true;
    };
  }, []);

  const avatarSlots = useMemo(() => Array.from({ length: 5 }), []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-background" />
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-white/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-white/5 blur-[150px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-accent/10 blur-[120px] rounded-full" />
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center pt-20 sm:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-6 sm:space-y-8"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/10 text-xs sm:text-sm text-foreground font-medium">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Feito para a comunidade do Discord
            </span>
          </motion.div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold tracking-tight leading-[0.95] px-2">
            <span className="text-foreground">Sua vibe,</span>
            <br />
            <span className="bg-gradient-to-r from-foreground via-muted-foreground to-foreground bg-clip-text text-transparent">
              um link.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed px-4">
            Crie uma página de bio incrível com música, badges e fundos personalizados.
            Mostre ao mundo do Discord quem você realmente é.
          </p>

          {/* Username Claim */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-lg mx-auto pt-2 sm:pt-4 px-4"
          >
            <div className="relative flex-1 w-full">
              <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm sm:text-base">
                vye.bio/
              </span>
              <Input
                type="text"
                placeholder="seunome"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                  className="pl-[75px] sm:pl-[90px] pr-4 h-12 sm:h-14 text-base sm:text-lg bg-secondary/50 border-border/50 focus:border-border"
                onKeyDown={(e) => e.key === "Enter" && handleClaim()}
              />
            </div>
            <Button
              size="lg"
              onClick={handleClaim}
              className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 gap-2 bg-primary text-primary-foreground hover:opacity-90 font-semibold text-sm sm:text-base"
            >
              Garantir
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-col items-center gap-3 sm:gap-4 pt-6 sm:pt-8"
          >
            <div className="flex -space-x-2 sm:-space-x-3">
              {avatarSlots.map((_, i) => {
                const item = socialAvatars[i];
                return (
                  <div
                    key={i}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-secondary ring-2 ring-background flex items-center justify-center overflow-hidden"
                    title={item?.alt}
                  >
                    {item?.avatarUrl ? (
                      <img
                        src={item.avatarUrl}
                        alt={item.alt}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                    )}
                  </div>
                );
              })}
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-primary-foreground ring-2 ring-background flex items-center justify-center text-xs sm:text-sm font-bold">
                +10k
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground px-4">
              Junte-se a <span className="text-foreground font-medium">10.000+</span> usuários do Discord
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
          <motion.div
            className="w-1 h-2 bg-muted-foreground/50 rounded-full"
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
        </div>
      </motion.div>
    </section>
  );
}
