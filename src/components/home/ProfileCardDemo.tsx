import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, MapPin, Pause, Play } from "lucide-react";
import { BadgeIcon } from "@/lib/badgeIcons";
import { getSocialIcon } from "@/lib/socialIcons";
import DiscordStatusCard from "@/components/DiscordStatusCard";
import ValorantStatusCard from "@/components/ValorantStatusCard";
import { supabase } from "@/integrations/supabase/client";

const mockProfile = {
  username: "nex",
  display_name: "Nex",
  avatar_url: "https://api.dicebear.com/7.x/initials/svg?seed=Nex",
  bio: "Gamer competitivo • staff no Discord • sempre online",
  location: "São Paulo, BR",
  is_online: true,
  // Card settings (matches Profile.tsx)
  card_color: "#0A0A0B",
  card_opacity: 92,
  card_blur: 10,
  card_direction: "center" as const,
  card_style: "default" as const,
  // Link settings (matches Profile.tsx)
  link_style: "cards" as const,
  link_button_style: "with_text" as const,
  // Music
  music: {
    title: "Blinding Lights",
    artist: "The Weeknd",
  },
  // Badges (matches new badge icon system)
  badges: ["Staff", "Developer", "Bug Hunter"] as const,
  // Links (urls used to drive getSocialIcon)
  links: [
    { title: "Discord", url: "https://discord.gg/example", icon: null as string | null, icon_color: null as string | null },
    { title: "Twitch", url: "https://twitch.tv/example", icon: null as string | null, icon_color: null as string | null },
    { title: "TikTok", url: "https://tiktok.com/@example", icon: null as string | null, icon_color: null as string | null },
  ],
  stats: {
    views: 12847,
  },
  widgets: ["discord", "valorant"] as const,
};

type FeaturedWidgetProfile = {
  discord_user_id: string | null;
  valorant_name: string | null;
  valorant_tag: string | null;
  valorant_puuid: string | null;
};

export function ProfileCardDemo({
  className,
  showStats = true,
}: {
  className?: string;
  showStats?: boolean;
}) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [viewCount, setViewCount] = useState(mockProfile.stats.views);
  const [linkStyle, setLinkStyle] = useState<"cards" | "buttons">(mockProfile.link_style);
  const [buttonStyle, setButtonStyle] = useState<"with_text" | "icon_only">(mockProfile.link_button_style);
  const [featured, setFeatured] = useState<FeaturedWidgetProfile | null>(null);

  // Simulate live view count
  useEffect(() => {
    const interval = setInterval(() => {
      setViewCount((prev) => prev + Math.floor(Math.random() * 3));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Pick a real user that has Discord + Valorant widgets visible, and use their IDs for widgets.
  useEffect(() => {
    let cancelled = false;

    async function fetchFeaturedWidgetProfile() {
      try {
        // 1) Prefer matching by user_widgets visibility
        const { data: widgetRows, error: widgetError } = await (supabase as any)
          .from("user_widgets")
          .select("user_id, widget_type, is_visible, updated_at")
          .eq("is_visible", true)
          .in("widget_type", ["discord", "valorant"])
          .order("updated_at", { ascending: false })
          .limit(200);

        let candidateUserId: string | null = null;

        if (!widgetError && Array.isArray(widgetRows)) {
          const map = new Map<string, Set<string>>();
          for (const row of widgetRows) {
            if (!row?.user_id || !row?.widget_type) continue;
            if (!map.has(row.user_id)) map.set(row.user_id, new Set());
            map.get(row.user_id)!.add(row.widget_type);
          }
          for (const [userId, set] of map.entries()) {
            if (set.has("discord") && set.has("valorant")) {
              candidateUserId = userId;
              break;
            }
          }
        }

        // 2) Fallback: any profile that has both ids set (in case user_widgets isn't readable)
        let profileQuery = supabase
          .from("profiles")
          .select("discord_user_id, valorant_name, valorant_tag, valorant_puuid, views_count, created_at")
          .not("discord_user_id", "is", null)
          .not("valorant_name", "is", null)
          .not("valorant_tag", "is", null)
          .order("views_count", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(1);

        if (candidateUserId) {
          profileQuery = supabase
            .from("profiles")
            .select("discord_user_id, valorant_name, valorant_tag, valorant_puuid")
            .eq("user_id", candidateUserId)
            .limit(1);
        }

        const { data: profilesData, error: profileError } = await profileQuery;
        if (cancelled) return;
        if (profileError) {
          console.warn("ProfileCardDemo: erro ao buscar perfil com widgets:", profileError);
          setFeatured(null);
          return;
        }

        const p = Array.isArray(profilesData) ? profilesData[0] : null;
        if (!p) {
          setFeatured(null);
          return;
        }

        setFeatured({
          discord_user_id: p.discord_user_id ?? null,
          valorant_name: p.valorant_name ?? null,
          valorant_tag: p.valorant_tag ?? null,
          valorant_puuid: p.valorant_puuid ?? null,
        });
      } catch (err) {
        if (!cancelled) setFeatured(null);
      }
    }

    fetchFeaturedWidgetProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  // Demo: switch between cards/buttons + labels
  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let labelTimeout: number | undefined;
    const intervalMs = prefersReducedMotion ? 7000 : 4500;
    const labelDelayMs = prefersReducedMotion ? 0 : 900;

    const interval = window.setInterval(() => {
      setLinkStyle((prev) => {
        const next = prev === "cards" ? "buttons" : "cards";

        if (next === "buttons") {
          setButtonStyle("with_text");
          if (labelTimeout) window.clearTimeout(labelTimeout);
          labelTimeout = window.setTimeout(() => {
            setButtonStyle("icon_only");
          }, labelDelayMs);
        } else {
          setButtonStyle("with_text");
          if (labelTimeout) window.clearTimeout(labelTimeout);
          labelTimeout = undefined;
        }

        return next;
      });
    }, intervalMs);

    return () => {
      if (labelTimeout) window.clearTimeout(labelTimeout);
      window.clearInterval(interval);
    };
  }, []);

  const links = useMemo(() => mockProfile.links, []);

  return (
    <motion.div
      layout
      className={className}
      style={{
        backgroundColor: mockProfile.card_color,
        opacity: mockProfile.card_opacity / 100,
        backdropFilter: `blur(${mockProfile.card_blur}px)`,
        WebkitBackdropFilter: `blur(${mockProfile.card_blur}px)`,
      }}
    >
      <div className="p-6 md:p-8 text-center">
        {/* Avatar */}
        <div className="relative inline-block mb-6">
          <img
            src={mockProfile.avatar_url}
            alt={mockProfile.display_name}
            className="w-28 h-28 object-cover ring-4 ring-background shadow-2xl rounded-2xl"
          />
          {mockProfile.is_online && (
            <span className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 rounded-full ring-4 ring-background" />
          )}
        </div>

        {/* Name */}
        <h3 className="text-2xl font-bold text-foreground mb-1">{mockProfile.display_name}</h3>

        {/* Location */}
        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-4">
          <MapPin className="w-3.5 h-3.5" />
          <span>{mockProfile.location}</span>
        </div>

        {/* Bio */}
        <p className="text-muted-foreground max-w-sm mx-auto mb-6">{mockProfile.bio}</p>

        {/* Badges */}
        <div className="flex items-center justify-center flex-wrap gap-3 mb-8">
          {mockProfile.badges.map((name) => (
            <span key={name} className="inline-flex items-center justify-center leading-none w-6 h-6">
              <BadgeIcon badgeName={name} className="w-6 h-6 text-foreground" size={24} />
            </span>
          ))}
        </div>

        {/* Widgets (mocked, no API calls) */}
        <div className="space-y-3 mb-6">
          {mockProfile.widgets.includes("discord") && (
            <DiscordStatusCard discordUserId={featured?.discord_user_id ?? null} variant="preview" />
          )}
          {mockProfile.widgets.includes("valorant") && (
            <ValorantStatusCard
              valorantName={featured?.valorant_name ?? null}
              valorantTag={featured?.valorant_tag ?? null}
              valorantPuuid={featured?.valorant_puuid ?? null}
              variant="preview"
            />
          )}
        </div>

        {/* Music */}
        <div className="rounded-xl bg-secondary/50 border border-border/50 overflow-hidden mb-6">
          <div className="flex gap-3 p-3 items-center">
            <button
              className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center"
              onClick={() => setIsPlaying((v) => !v)}
              type="button"
              aria-label={isPlaying ? "Pausar" : "Tocar"}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-foreground truncate">{mockProfile.music.title}</p>
              <p className="text-xs text-muted-foreground truncate">{mockProfile.music.artist}</p>
            </div>
          </div>
        </div>

        {/* Links */}
        <motion.div layout className="relative">
          <AnimatePresence initial={false} mode="wait">
            {linkStyle === "cards" ? (
              <motion.div
                key="cards"
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="space-y-3"
              >
                {links.map((link) => {
                  const { Icon, color, isCustom } = getSocialIcon(link.url, link.icon);
                  const iconColor = link.icon_color || color;

                  return (
                    <a
                      key={link.title}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between p-4 rounded-2xl bg-secondary/50 hover:bg-secondary transform-gpu will-change-transform transition-[transform,background-color] duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <div className="flex items-center gap-3">
                        {isCustom && link.icon ? (
                          <span className="text-lg">{link.icon}</span>
                        ) : (
                          <span style={iconColor ? { color: iconColor } : undefined}>
                            <Icon className="w-5 h-5" />
                          </span>
                        )}
                        <span className="font-medium text-foreground">{link.title}</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="buttons"
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex flex-wrap gap-2 justify-center"
              >
                {links.map((link) => {
                  const { Icon, color, isCustom } = getSocialIcon(link.url, link.icon);
                  const iconColor = link.icon_color || color;
                  const showText = buttonStyle === "with_text";

                  return (
                    <motion.a
                      key={link.title}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      layout
                      transition={{ type: "spring", stiffness: 520, damping: 34, mass: 0.8 }}
                      className={`group inline-flex items-center justify-center rounded-xl bg-secondary/60 hover:bg-secondary/80 shadow-sm hover:shadow-md ring-1 ring-border/30 hover:ring-border/50 transform-gpu will-change-transform transition-[transform,background-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.02] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                        showText ? "gap-2 h-11 px-4" : "h-11 w-11"
                      }`}
                      title={!showText ? link.title : undefined}
                    >
                      {isCustom && link.icon ? (
                        <span className={showText ? "text-base" : "text-xl"}>{link.icon}</span>
                      ) : (
                        <span style={iconColor ? { color: iconColor } : undefined}>
                          <Icon className={showText ? "w-4 h-4" : "w-5 h-5"} />
                        </span>
                      )}

                      <AnimatePresence initial={false} mode="popLayout">
                        {showText && (
                          <motion.span
                            key="label"
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="font-medium text-sm text-foreground overflow-hidden whitespace-nowrap"
                          >
                            {link.title}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.a>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Stats */}
        {showStats && (
          <div className="mt-6 pt-6 border-t border-border/50 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{viewCount.toLocaleString()}</span>{" "}
            visualizações
          </div>
        )}
      </div>
    </motion.div>
  );
}


