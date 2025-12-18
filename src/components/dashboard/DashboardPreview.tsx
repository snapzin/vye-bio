import { useState, useEffect, useRef } from "react";
import { useProfile, useUserLinks, useUserBadges, useUserWidgets } from "@/hooks/useProfile";
import { usePreview } from "@/contexts/PreviewContext";
import { motion } from "framer-motion";
import { Play, Pause, Music, MapPin, ExternalLink } from "lucide-react";
import DiscordStatusCard from "@/components/DiscordStatusCard";
import ValorantStatusCard from "@/components/ValorantStatusCard";
import { getSocialIcon } from "@/lib/socialIcons";
import { BadgeIcon } from "@/lib/badgeIcons";
import { isYouTubeUrl, extractYouTubeVideoId } from "@/lib/youtube";
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function DashboardPreview() {
  const { previewUserId, previewData, refreshKey } = usePreview();
  const { profile, loading } = useProfile(undefined, previewUserId || undefined, refreshKey);
  const { links, loading: linksLoading } = useUserLinks(previewUserId || undefined, refreshKey);
  const { badges, loading: badgesLoading } = useUserBadges(previewUserId || undefined, false, refreshKey);
  const { widgets, loading: widgetsLoading } = useUserWidgets(previewUserId || undefined, false, refreshKey);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Keep previous profile data to avoid flickering during updates
  const [cachedProfile, setCachedProfile] = useState<typeof profile>(null);
  const [cachedLinks, setCachedLinks] = useState<typeof links>([]);
  const [cachedBadges, setCachedBadges] = useState<typeof badges>([]);
  const [cachedWidgets, setCachedWidgets] = useState<typeof widgets>([]);

  // Update cache when data is available - always update to latest
  // This ensures that when profile is updated locally (e.g., link_style change),
  // it's immediately available even during refresh
  useEffect(() => {
    if (profile) {
      setCachedProfile(profile);
    }
  }, [profile, refreshKey]); // Update cache when refreshKey changes too

  useEffect(() => {
    // Important: allow caching an empty list (e.g. user hid/deleted everything).
    if (!linksLoading) setCachedLinks(links);
  }, [links, linksLoading]);

  useEffect(() => {
    if (!badgesLoading) setCachedBadges(badges);
  }, [badges, badgesLoading]);

  useEffect(() => {
    if (!widgetsLoading) setCachedWidgets(widgets);
  }, [widgets, widgetsLoading]);

  // Merge preview data with profile data (preview data takes precedence)
  // Always prefer fresh data over cache, only use cache when fresh data is not available
  const activeProfile = profile || cachedProfile;
  const activeLinks = linksLoading ? cachedLinks : links;
  const activeBadges = badgesLoading ? cachedBadges : badges;
  const activeWidgets = widgetsLoading ? cachedWidgets : widgets;
  
  // For displayProfile, merge previewData (takes precedence) with profile
  // This ensures link_style updates from setPreviewData are immediately reflected
  // Always use fresh profile data (profile || cache) as base
  const effectiveProfile = profile || cachedProfile;
  const displayProfile = effectiveProfile
    ? { ...effectiveProfile, ...(previewData || {}) }
    : null;

  // Check if music_url is YouTube (from displayProfile) - MUST be after displayProfile is defined
  const musicUrl = displayProfile?.music_url;
  const isYouTube = musicUrl ? isYouTubeUrl(musicUrl) : false;
  const youtubeVideoId = musicUrl ? extractYouTubeVideoId(musicUrl)?.videoId : null;

  // YouTube player hook - only initialize if we have a valid video ID
  // No autoplay in dashboard preview - user controls manually
  const youtubePlayer = useYouTubePlayer({
    videoId: youtubeVideoId || '',
    autoplay: false,
    loop: true,
    volume: 30,
    onStateChange: (state) => {
      setIsPlaying(state === 1);
    },
    onTimeUpdate: (time) => {
      setCurrentTime(time);
    },
    onDurationChange: (dur) => {
      setDuration(dur);
    },
  });

  // Initialize audio player when music_url changes (only for non-YouTube URLs)
  // IMPORTANT: All hooks must be called before any conditional returns
  useEffect(() => {
    if (!displayProfile?.music_url || isYouTube) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (!isYouTube) {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      }
      return;
    }

    let cancelled = false;
    const audioElement = new Audio(displayProfile.music_url);
    audioElement.loop = true;
    audioElement.volume = 0.3;
    audioElement.preload = 'auto';
    
    const handlePlay = () => {
      if (!cancelled) setIsPlaying(true);
    };
    const handlePause = () => {
      if (!cancelled) setIsPlaying(false);
    };
    const handleTimeUpdate = () => {
      if (!cancelled) setCurrentTime(audioElement.currentTime);
    };
    const handleLoadedMetadata = () => {
      if (!cancelled) {
        setDuration(audioElement.duration);
        // No autoplay in dashboard preview - user controls manually
      }
    };
    const handleCanPlay = () => {
      // No autoplay in dashboard preview - user controls manually
    };
    const handleLoadedData = () => {
      // No autoplay in dashboard preview - user controls manually
    };
    const handleEnded = () => {
      if (!cancelled) {
        setIsPlaying(false);
        // Restart if loop is enabled
        if (audioElement.loop) {
          audioElement.currentTime = 0;
          audioElement.play().catch(() => {});
        }
      }
    };
    
    audioElement.addEventListener('play', handlePlay);
    audioElement.addEventListener('pause', handlePause);
    audioElement.addEventListener('ended', handleEnded);
    audioElement.addEventListener('timeupdate', handleTimeUpdate);
    audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioElement.addEventListener('canplay', handleCanPlay);
    audioElement.addEventListener('loadeddata', handleLoadedData);
    
    audioRef.current = audioElement;

    return () => {
      cancelled = true;
      audioElement.pause();
      audioElement.removeEventListener('play', handlePlay);
      audioElement.removeEventListener('pause', handlePause);
      audioElement.removeEventListener('ended', handleEnded);
      audioElement.removeEventListener('timeupdate', handleTimeUpdate);
      audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioElement.removeEventListener('canplay', handleCanPlay);
      audioElement.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [displayProfile?.music_url, isYouTube]);

  const togglePlay = () => {
    if (isYouTube && youtubeVideoId) {
      youtubePlayer.togglePlay();
    } else if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((error) => {
          console.error('Error playing audio:', error);
        });
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Only return null if we don't have any cached data (initial load)
  // This prevents the preview from closing and reopening during updates
  // During reload, keep showing cached profile until new data arrives
  if (!cachedProfile && (loading || !profile)) return null;

  const visibleLinks = activeLinks.filter(l => l.is_visible).slice(0, 3);
  // Se includeHidden é false, badges já vem filtrado, mas garantimos que apenas is_displayed apareça
  const displayedBadges = activeBadges.filter(b => b.is_displayed !== false).slice(0, 4);

  return (
    <div className="w-96 flex-shrink-0 h-screen sticky top-0 border-l border-border/50 bg-card/30 p-6 hidden xl:flex flex-col overflow-x-hidden">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
        Preview ao Vivo
      </div>

      {/* Mini Profile Preview */}
      <div 
        className="flex-1 flex flex-col items-center relative"
      >
        {/* Background Preview */}
        <div 
          className="w-full h-24 rounded-2xl mb-[-40px] relative overflow-hidden"
          style={{
            backgroundColor: displayProfile.background_color || '#0a0a0b',
            backgroundImage:
              displayProfile.background_type === 'image' && displayProfile.background_url
              ? `url(${displayProfile.background_url})` 
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
        </div>

        {/* Card container (aplica card_color / card_opacity / card_blur do dashboard) */}
        <div
          className={`relative isolate overflow-hidden w-full rounded-2xl border border-border/50 px-4 pb-4 pt-14 transition-all ${
            (displayProfile.card_direction || 'center') === 'left' ? 'text-left' : 'text-center'
          }`}
          style={{
            backdropFilter: displayProfile.card_blur ? `blur(${displayProfile.card_blur}px)` : undefined,
            WebkitBackdropFilter: displayProfile.card_blur ? `blur(${displayProfile.card_blur}px)` : undefined,
          }}
        >
          {(() => {
            const opacityPct = clamp(displayProfile.card_opacity ?? 100, 0, 100);
            const hasBlur = !!displayProfile.card_blur && displayProfile.card_blur > 0;
            const bgOpacity = hasBlur && opacityPct >= 100 ? 0.98 : opacityPct / 100;
            return (
              <div
                className="absolute inset-0 rounded-2xl z-0"
                style={{
                  backgroundColor: displayProfile.card_color || '#000000',
                  opacity: bgOpacity,
                }}
              />
            );
          })()}

          <div className="relative z-10">
            {/* Banner Preview (inside card, abaixo do topo) */}
        {displayProfile.banner_url && (
          <div 
            className="w-full h-16 rounded-xl mb-4 relative overflow-hidden"
            style={{
              backgroundImage: `url(${displayProfile.banner_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-card/50 to-transparent" />
          </div>
        )}

        {/* Avatar */}
            <div className="relative z-10 -mt-10 flex justify-center">
          <img
            src={displayProfile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${displayProfile.display_name || displayProfile.username}`}
            alt={displayProfile.display_name || displayProfile.username}
            className={`w-20 h-20 object-cover border-4 border-card shadow-lg ${
              displayProfile.avatar_shape === 'circle' 
                ? 'rounded-full' 
                : displayProfile.avatar_shape === 'square'
                ? 'rounded-none'
                : 'rounded-2xl'
            }`}
          />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-card" />
        </div>

        {/* Name */}
        <h3 className="mt-4 text-lg font-bold text-foreground">
          {displayProfile.display_name || displayProfile.username}
        </h3>

        {/* Location */}
        {displayProfile.location && (
              <div
                className={`flex items-center gap-1.5 mt-2 text-sm text-muted-foreground ${
                  (displayProfile.card_direction || 'center') === 'left' ? 'justify-start' : 'justify-center'
                }`}
              >
            <MapPin className="w-3.5 h-3.5" />
            <span>{displayProfile.location}</span>
          </div>
        )}

        {/* Badges */}
        {displayedBadges.length > 0 && (
          <div className="mt-3">
                <div
                  className={`w-fit max-w-full rounded-2xl bg-secondary/40 border border-border/50 backdrop-blur-sm px-3 py-1.5 ${
                    (displayProfile.card_direction || 'center') === 'left' ? '' : 'mx-auto'
                  }`}
                >
              <div className="flex items-center justify-center flex-wrap gap-2">
                {displayedBadges.map((badge) => (
                  <span
                    key={badge.id}
                    className="inline-flex items-center justify-center leading-none w-5 h-5"
                    title={badge.badge?.name}
                  >
                    <BadgeIcon badgeName={badge.badge?.name} icon={badge.badge?.icon} className="w-5 h-5" size={20} />
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bio */}
        {displayProfile.bio && (
              <p
                className={`text-sm text-muted-foreground mt-3 line-clamp-2 ${
                  (displayProfile.card_direction || 'center') === 'left' ? 'text-left' : 'text-center px-4'
                }`}
              >
            {displayProfile.bio}
          </p>
        )}

        {/* Widgets */}
        {activeWidgets.filter(w => w.is_visible).length > 0 && (
          <div className="w-full mt-3 space-y-2">
            {activeWidgets
              .filter(w => w.is_visible)
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((widget) => {
                if (widget.widget_type === 'discord' && displayProfile.discord_user_id) {
                  return (
                    <div key={widget.id} className="w-full flex justify-center">
                      <div className="w-full max-w-[340px]">
                        <DiscordStatusCard discordUserId={displayProfile.discord_user_id} variant="preview" />
                      </div>
                    </div>
                  );
                }
                if (widget.widget_type === 'valorant' && displayProfile.valorant_name && displayProfile.valorant_tag) {
                  return (
                    <div key={widget.id} className="w-full flex justify-center">
                      <div className="w-full max-w-[340px]">
                        <ValorantStatusCard 
                        valorantName={displayProfile.valorant_name} 
                        valorantTag={displayProfile.valorant_tag}
                        valorantPuuid={displayProfile.valorant_puuid}
                        region="br"
                        platform="pc"
                        variant="sidebar"
                        />
                      </div>
                    </div>
                  );
                }
                return null;
              })}
          </div>
        )}

        {/* Music Player (card) - same order as Profile.tsx: after widgets, before links */}
        {displayProfile.music_url && (displayProfile.music_player_style || 'card') !== 'floating' && (
          <div className="w-full mt-3">
            <div className="rounded-xl bg-secondary/50 border border-border/50 overflow-hidden">
              <div className="flex gap-3 p-3">
                {/* Image - lado esquerdo */}
                {displayProfile.music_image_url ? (
                  <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                    <img 
                      src={displayProfile.music_image_url} 
                      alt={displayProfile.music_title || "Música"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-secondary/50 border border-border/50 flex items-center justify-center">
                    <Music className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                )}
                
                {/* Player Controls - lado direito */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1.5">
                    <button
                      onClick={togglePlay}
                      className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity flex-shrink-0"
                    >
                      {(isYouTube ? youtubePlayer.isPlaying : isPlaying) ? (
                        <Pause className="w-3 h-3" />
                      ) : (
                        <Play className="w-3 h-3 ml-0.5" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {displayProfile.music_title || "Música"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {displayProfile.music_artist || "Artista"}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {((isYouTube ? youtubePlayer.duration : duration) > 0) && (
                    <div className="space-y-0.5">
                      <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ 
                            width: `${((isYouTube ? youtubePlayer.currentTime : currentTime) / (isYouTube ? youtubePlayer.duration : duration)) * 100}%` 
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>{formatTime(isYouTube ? youtubePlayer.currentTime : currentTime)}</span>
                        <span>{formatTime(isYouTube ? youtubePlayer.duration : duration)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mini Links */}
            <div
              className={`w-full mt-6 ${
                (displayProfile?.link_style || 'cards') === 'buttons'
                  ? 'flex flex-wrap gap-2 justify-center'
                  : 'space-y-3'
              }`}
            >
          {visibleLinks.map((link) => {
            const { Icon, color, isCustom } = getSocialIcon(link.url, link.icon);
            const iconColor = link.icon_color || color;
            const linkStyle = displayProfile?.link_style || 'cards';
            
            if (linkStyle === 'buttons') {
              const buttonStyle = displayProfile?.link_button_style || 'with_text';
              const showText = buttonStyle === 'with_text';
              
              return (
                <div 
                  key={link.id}
                  className={`group rounded-lg bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-border transform-gpu will-change-transform transition-[transform,background-color,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.02] active:translate-y-0 active:scale-[0.99] flex items-center justify-center ${
                    showText ? 'gap-2 px-4 py-2' : 'p-3'
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
                  {showText && (
                    <span className="font-medium text-sm text-foreground">{link.title}</span>
                  )}
                </div>
              );
            }
            
            // Cards style (default) - matching Profile.tsx exactly
            return (
              <div 
                key={link.id}
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
              </div>
            );
          })}
          {visibleLinks.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">
              Nenhum link adicionado ainda
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-auto pt-6 w-full">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Visualizações</span>
            <span className="font-semibold text-foreground">{displayProfile.views_count || 0}</span>
          </div>
            </div>
          </div>
        </div>

        {/* Floating Music Button (only when profile uses floating player style) */}
        {displayProfile.music_url && (displayProfile.music_player_style || 'card') === 'floating' && (
          <button
            onClick={togglePlay}
            className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center overflow-hidden"
            title={(isYouTube ? youtubePlayer.isPlaying : isPlaying) ? "Pausar" : "Reproduzir"}
          >
            {displayProfile.music_image_url ? (
              <img
                src={displayProfile.music_image_url}
                alt={displayProfile.music_title || "Música"}
                className="w-full h-full object-cover"
              />
            ) : (
              <Music className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
