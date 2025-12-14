import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type ShowcaseProfile = {
  username: string;
  displayName: string;
  avatarUrl: string;
  online: boolean;
};

export function ProfileShowcase() {
  const [profiles, setProfiles] = useState<ShowcaseProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchProfiles() {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("profiles")
          .select("username, display_name, avatar_url, is_online, views_count, created_at")
          .not("username", "is", null)
          .order("views_count", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(12);

        if (cancelled) return;
        if (error) {
          console.error("Erro ao carregar perfis da comunidade:", error);
          setProfiles([]);
          return;
        }

        const mapped =
          (data || [])
            .filter((p: any) => typeof p?.username === "string" && p.username.length > 0)
            .map((p: any) => ({
              username: p.username,
              displayName: p.display_name || p.username,
              avatarUrl:
                p.avatar_url ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.display_name || p.username)}`,
              online: Boolean(p.is_online),
            })) satisfies ShowcaseProfile[];

        setProfiles(mapped);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProfiles();

    return () => {
      cancelled = true;
    };
  }, []);

  const skeletonItems = useMemo(() => Array.from({ length: 6 }), []);

  return (
    <section className="py-24 px-4 bg-gradient-to-b from-background to-card/30">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-sm text-muted-foreground uppercase tracking-wider mb-3">
              Confiado por criadores
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Faça parte da comunidade
          </h2>
        </motion.div>

        {/* Profiles Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {loading &&
            skeletonItems.map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="p-4 rounded-2xl bg-card/60 border border-border/30 text-center animate-pulse"
              >
                <div className="inline-block mb-3">
                  <div className="w-14 h-14 rounded-full bg-muted ring-2 ring-background" />
                </div>
                <div className="h-4 w-24 mx-auto bg-muted rounded mb-2" />
                <div className="h-3 w-16 mx-auto bg-muted rounded" />
              </div>
            ))}

          {!loading && profiles.map((profile, index) => (
            <motion.a
              key={profile.username}
              href={`/${profile.username}`}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="group relative p-4 rounded-2xl bg-card hover:bg-secondary/50 transition-all duration-300 text-center"
            >
              <div className="relative inline-block mb-3">
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-background"
                />
                {profile.online && (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full ring-2 ring-card" />
                )}
              </div>
              <h3 className="text-sm font-medium text-foreground truncate">
                {profile.displayName}
              </h3>
              <p className="text-xs text-muted-foreground">
                /{profile.username}
              </p>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.a>
          ))}

          {!loading && profiles.length === 0 && (
            <div className="col-span-full text-center py-8">
              <p className="text-sm text-muted-foreground">
                Ainda não há perfis públicos para mostrar.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
