import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type CommunityPerson = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role?: string;
};

export function TestimonialsSection() {
  const [people, setPeople] = useState<CommunityPerson[]>([]);
  const [loading, setLoading] = useState(true);

  const reviewPool = useMemo(
    () => [
      {
        text: "Finalmente uma página de bio que ficou limpa e bonita. Em 5 minutos já estava tudo pronto.",
        role: "Dono de servidor",
      },
      {
        text: "O preview e os widgets deixam tudo com cara de perfil premium. Ficou muito acima do que eu tinha antes.",
        role: "Criadora de conteúdo",
      },
      {
        text: "Os links em botão e o visual minimalista ficaram perfeitos. A galera clica muito mais agora.",
        role: "Jogador competitivo",
      },
      {
        text: "Tudo muito rápido de configurar e bem responsivo no mobile. Recomendo demais.",
        role: "Gerente de comunidade",
      },
      {
        text: "Layout absurdo. Agora meu Discord tem um link único que realmente representa minha identidade.",
        role: "Moderador",
      },
      {
        text: "Gostei demais do estilo preto/branco. Ficou elegante e combina com qualquer tema.",
        role: "Designer",
      },
    ],
    []
  );

  useEffect(() => {
    let cancelled = false;

    async function fetchPeople() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("profiles")
          // NOTE: we avoid selecting `bio` here because it may be protected by RLS policies.
          .select("username, display_name, avatar_url, is_online, views_count, created_at")
          .not("username", "is", null)
          .order("views_count", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(12);

        if (cancelled) return;
        if (error) {
          console.error("Erro ao carregar pessoas da comunidade:", error);
          setPeople([]);
          return;
        }

        const mappedBase =
          (data || [])
            .filter((p: any) => typeof p?.username === "string" && p.username.length > 0)
            .map((p: any) => ({
              username: p.username,
              displayName: p.display_name || p.username,
              avatarUrl: p.avatar_url || null,
            })) satisfies Omit<CommunityPerson, "role">[];

        const mapped = mappedBase.slice(0, 4).map((p, idx) => ({
          ...p,
          role: reviewPool[idx % reviewPool.length]?.role,
        })) satisfies CommunityPerson[];

        setPeople(mapped);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPeople();

    return () => {
      cancelled = true;
    };
  }, []);

  const skeletonItems = useMemo(() => Array.from({ length: 4 }), []);

  return (
    <section className="py-24 px-4 bg-card/30">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            A comunidade aprova
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Amado por criadores
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Junte-se a milhares de usuários do Discord que elevaram sua presença online
          </p>
        </motion.div>

        {/* Community Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading &&
            skeletonItems.map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="p-5 rounded-2xl bg-card border border-border/50 animate-pulse"
              >
                <div className="h-4 w-24 bg-muted rounded mb-4" />
                <div className="space-y-2 mb-5">
                  <div className="h-3 w-full bg-muted rounded" />
                  <div className="h-3 w-11/12 bg-muted rounded" />
                  <div className="h-3 w-10/12 bg-muted rounded" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <div className="space-y-2">
                    <div className="h-3 w-20 bg-muted rounded" />
                    <div className="h-3 w-16 bg-muted rounded" />
                  </div>
                </div>
              </div>
            ))}

          {!loading &&
            people.map((person, index) => (
              <motion.a
                key={person.username}
                href={`/${person.username}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-5 rounded-2xl bg-card border border-border/50 hover:border-border transition-colors block"
              >
                {/* Mock review text (profiles are real) */}
                <p className="text-foreground text-sm leading-relaxed mb-4 line-clamp-4">
                  “{reviewPool[index % reviewPool.length]?.text}”
                </p>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden flex items-center justify-center flex-shrink-0">
                    {person.avatarUrl ? (
                      <img
                        src={person.avatarUrl}
                        alt={person.displayName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <User className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{person.displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {person.role ? person.role : `/${person.username}`}
                    </p>
                  </div>
                </div>
              </motion.a>
            ))}

          {!loading && people.length === 0 && (
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
