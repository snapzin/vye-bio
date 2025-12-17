import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ExternalLink, 
  MapPin, 
  Play,
  Pause,
  Music,
  X
} from "lucide-react";
import { useState, useEffect } from "react";
import { useProfile, useUserLinks, useUserBadges, useUserWidgets, type Badge, type Profile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import DiscordStatusCard from "@/components/DiscordStatusCard";
import ValorantStatusCard from "@/components/ValorantStatusCard";
import MusicCard from "@/components/MusicCard";
import { getSocialIcon } from "@/lib/socialIcons";
import { BadgeIcon } from "@/lib/badgeIcons";
import { isYouTubeUrl, extractYouTubeVideoId } from "@/lib/youtube";
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer";

const rarityColors: Record<string, string> = {
  common: "bg-secondary",
  uncommon: "bg-green-500/20 text-green-400",
  rare: "bg-blue-500/20 text-blue-400",
  epic: "bg-purple-500/20 text-purple-400",
  legendary: "bg-yellow-500/20 text-yellow-400",
};

// Floating Music Player Component
function FloatingMusicPlayer({
  profile,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onProgressClick,
  formatTime,
}: {
  profile: Profile;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onProgressClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  formatTime: (seconds: number) => string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary text-primary-foreground shadow-2xl hover:scale-110 transition-transform flex items-center justify-center"
      >
        {profile.music_image_url ? (
          <img 
            src={profile.music_image_url} 
            alt={profile.music_title || "Música"}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <Music className="w-6 h-6" />
        )}
        {isPlaying && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary-foreground/30"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </motion.button>

      {/* Expanded Player Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.5 }}
            className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-80 max-w-sm rounded-2xl bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl overflow-hidden"
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Agora tocando</h3>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="w-6 h-6 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
                >
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>

              {/* Music Info */}
              <div className="flex items-center gap-3 mb-4">
                {profile.music_image_url ? (
                  <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                    <img 
                      src={profile.music_image_url} 
                      alt={profile.music_title || "Música"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-gradient-to-br from-accent/20 to-purple-500/20 flex items-center justify-center">
                    <Music className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {profile.music_title || "Música"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {profile.music_artist || "Artista desconhecido"}
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="space-y-3">
                <button
                  onClick={onTogglePlay}
                  className="w-full h-12 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2 font-medium"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4" />
                      Pausar
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Reproduzir
                    </>
                  )}
                </button>

                {/* Progress Bar */}
                {duration > 0 && (
                  <div className="space-y-1">
                    <div 
                      className="w-full h-1.5 bg-secondary rounded-full cursor-pointer group"
                      onClick={onProgressClick}
                    >
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-150 group-hover:bg-primary/80"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const Profile = () => {
  const { username } = useParams();
  const { profile, loading: profileLoading } = useProfile(username);
  const [userId, setUserId] = useState<string | undefined>();
  const { links } = useUserLinks(userId);
  const { badges } = useUserBadges(userId);
  const { widgets } = useUserWidgets(userId, false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Check if music_url is YouTube
  const isYouTube = profile?.music_url ? isYouTubeUrl(profile.music_url) : false;
  const youtubeVideoId = profile?.music_url ? extractYouTubeVideoId(profile.music_url)?.videoId : null;

  // YouTube player hook
  const youtubePlayer = useYouTubePlayer({
    videoId: youtubeVideoId || '',
    autoplay: true,
    loop: true,
    volume: 50,
    onReady: () => {
      // Player ready
    },
    onStateChange: (state) => {
      // 1 = playing, 2 = paused, 0 = ended
      setIsPlaying(state === 1);
    },
    onTimeUpdate: (time) => {
      setCurrentTime(time);
    },
    onDurationChange: (dur) => {
      setDuration(dur);
    },
    onError: (error) => {
      console.error('YouTube player error:', error);
    },
  });

  useEffect(() => {
    if (profile?.user_id) {
      setUserId(profile.user_id);
    }
  }, [profile?.user_id]);

  // Increment profile views when profile is loaded
  useEffect(() => {
    if (!profile || !username) return;

    // Use sessionStorage to prevent multiple increments in the same session
    const viewKey = `profile_viewed_${username}`;
    const hasViewed = sessionStorage.getItem(viewKey);

    if (!hasViewed) {
      // Mark as viewed in this session
      sessionStorage.setItem(viewKey, 'true');

      // Increment views_count using Supabase RPC function
      supabase
        .rpc('increment_profile_views', { profile_username: username })
        .then(({ error }) => {
          if (error) {
            console.error('Erro ao incrementar visualizações:', error);
          }
        })
        .catch((error) => {
          console.error('Erro ao incrementar visualizações:', error);
        });
    }
  }, [profile, username]);

  // Initialize audio player (only for non-YouTube URLs)
  useEffect(() => {
    if (profile?.music_url && !isYouTube) {
      const audioElement = new Audio(profile.music_url);
      audioElement.loop = true;
      audioElement.volume = 0.5;
      audioElement.preload = 'auto';
      
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleEnded = () => setIsPlaying(false);
      const handleTimeUpdate = () => setCurrentTime(audioElement.currentTime);
      const handleLoadedMetadata = () => {
        setDuration(audioElement.duration);
        // Auto-play when metadata is loaded
        audioElement.play().catch((error) => {
          console.error('Error auto-playing audio:', error);
          // Autoplay pode falhar devido a políticas do navegador - isso é normal
        });
      };
      const handleDurationChange = () => setDuration(audioElement.duration);
      const handleCanPlay = () => {
        // Tenta tocar quando o áudio estiver pronto
        if (!isPlaying) {
          audioElement.play().catch((error) => {
            console.error('Error auto-playing audio:', error);
          });
        }
      };
      
      audioElement.addEventListener('play', handlePlay);
      audioElement.addEventListener('pause', handlePause);
      audioElement.addEventListener('ended', handleEnded);
      audioElement.addEventListener('timeupdate', handleTimeUpdate);
      audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      audioElement.addEventListener('durationchange', handleDurationChange);
      audioElement.addEventListener('canplay', handleCanPlay);
      
      setAudio(audioElement);

      return () => {
        audioElement.pause();
        audioElement.removeEventListener('play', handlePlay);
        audioElement.removeEventListener('pause', handlePause);
        audioElement.removeEventListener('ended', handleEnded);
        audioElement.removeEventListener('timeupdate', handleTimeUpdate);
        audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audioElement.removeEventListener('durationchange', handleDurationChange);
        audioElement.removeEventListener('canplay', handleCanPlay);
      };
    } else {
      setAudio(null);
      if (!isYouTube) {
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
      }
    }
  }, [profile?.music_url, isYouTube]);

  // Handle play/pause
  const togglePlay = () => {
    if (isYouTube && youtubeVideoId) {
      youtubePlayer.togglePlay();
    } else if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play().catch((error) => {
          console.error('Error playing audio:', error);
        });
      }
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isYouTube && youtubeVideoId && youtubePlayer.duration) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      youtubePlayer.seekTo(percentage * youtubePlayer.duration);
    } else if (audio && duration) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      audio.currentTime = percentage * duration;
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Perfil não encontrado</h1>
          <p className="text-muted-foreground">Este nome de usuário está disponível!</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen relative overflow-hidden flex flex-col"
      style={{
        backgroundColor: profile.background_color || '#0a0a0b',
        backgroundImage: profile.background_type === 'image' && profile.background_url 
          ? `url(${profile.background_url})` 
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay for readability */}
      {profile.background_type === 'image' && (
        <div className="absolute inset-0 bg-background/70" />
      )}

      {/* Background gradient glow - only show when no background image */}
      {!profile.background_url && (
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-glow/5 rounded-full blur-[150px]" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 w-full flex items-center justify-center px-4 py-8 sm:py-12 md:py-20 flex-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={`relative isolate overflow-hidden w-full max-w-2xl rounded-2xl transition-all duration-300 ${
            profile.card_direction === 'left' ? 'text-left' : 'text-center'
          } ${
            profile.card_style === 'banner' 
              ? 'pt-0 pb-4 sm:pb-6 md:pb-8 px-4 sm:px-6 md:px-8' 
              : 'p-4 sm:p-6 md:p-8'
          }`}
          style={{
            backdropFilter: profile.card_blur ? `blur(${profile.card_blur}px)` : undefined,
            WebkitBackdropFilter: profile.card_blur ? `blur(${profile.card_blur}px)` : undefined,
          }}
        >
          {(() => {
            const opacityPct = Math.min(100, Math.max(0, profile.card_opacity ?? 100));
            const hasBlur = !!profile.card_blur && profile.card_blur > 0;
            // Backdrop blur só fica visível quando o fundo tem alguma transparência.
            const bgOpacity = hasBlur && opacityPct >= 100 ? 0.98 : opacityPct / 100;
            return (
              <div
                className="absolute inset-0 rounded-2xl z-0"
                style={{ backgroundColor: profile.card_color || '#000000', opacity: bgOpacity }}
              />
            );
          })()}

          <div className="relative z-10">
          {/* Banner Header - Only for banner style */}
          {profile.card_style === 'banner' && (
            <div className="h-24 sm:h-32 md:h-40 rounded-t-2xl mb-4 sm:mb-6 -mx-4 sm:-mx-6 md:-mx-8 -mt-4 sm:-mt-6 md:-mt-8 bg-gradient-to-br from-accent/20 to-purple-500/20" />
          )}
          {/* Avatar */}
          <div className="relative inline-block mb-4 sm:mb-6">
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4 }}
              src={profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.display_name || profile.username}`}
              alt={profile.display_name || profile.username}
              className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-cover ring-4 ring-background shadow-2xl ${
                profile.avatar_shape === 'circle' 
                  ? 'rounded-full' 
                  : profile.avatar_shape === 'square'
                  ? 'rounded-none'
                  : 'rounded-2xl'
              }`}
            />
            {profile.is_online && (
              <span className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full ring-4 ring-background" />
            )}
          </div>

          {/* Name & Username */}
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
            {profile.display_name || profile.username}
          </h1>
          
          {/* Location */}
          {profile.location && (
            <div className="flex items-center justify-center gap-1 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
              <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{profile.location}</span>
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm sm:text-base text-muted-foreground max-w-sm mx-auto mb-4 sm:mb-6 px-2">
              {profile.bio}
            </p>
          )}

          {/* Badges */}
          {badges.length > 0 && (
            <div className="pt-2 sm:pt-3 mb-6 sm:mb-8 w-full grid place-items-center text-center">
              <div className="inline-flex items-center justify-center max-w-full rounded-2xl bg-secondary/40 border border-border/50 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2">
                <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-3">
                  {badges.map((userBadge, index) => (
                    <motion.div
                      key={userBadge.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25, delay: index * 0.05 }}
                      className="group relative"
                    >
                      <span className="cursor-pointer inline-flex items-center justify-center leading-none w-5 h-5 sm:w-6 sm:h-6">
                        <BadgeIcon 
                          badgeName={userBadge.badge?.name} 
                          icon={userBadge.badge?.icon} 
                          className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" 
                          size={20} 
                          offsetY={3}
                        />
                      </span>
                      {/* Custom Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-md bg-popover border border-border text-sm text-popover-foreground shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-[9999] whitespace-nowrap transform translate-y-2 group-hover:translate-y-0">
                        <p className="font-medium">{userBadge.badge?.name}</p>
                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-border"></div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Widgets */}
          {widgets
            .filter(w => w.is_visible)
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((widget) => {
              if (widget.widget_type === 'discord' && profile.discord_user_id) {
                return (
                  <DiscordStatusCard 
                    key={widget.id}
                    discordUserId={profile.discord_user_id} 
                  />
                );
              }
              if (widget.widget_type === 'valorant' && profile.valorant_name && profile.valorant_tag) {
                return (
                  <ValorantStatusCard 
                    key={widget.id}
                    valorantName={profile.valorant_name} 
                    valorantTag={profile.valorant_tag}
                    valorantPuuid={profile.valorant_puuid}
                  />
                );
              }
              return null;
            })}

          {/* Music Card */}
          <MusicCard profile={profile} />

          {/* Links */}
          {links.length > 0 && (
            <motion.div
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: {
                  transition: {
                    staggerChildren: 0.05,
                    delayChildren: 0.15,
                  },
                },
              }}
              className={(profile.link_style || 'cards') === 'buttons' ? "flex flex-wrap gap-2 justify-center" : "space-y-2 sm:space-y-3"}
            >
              {links.filter(l => l.is_visible).map((link, index) => {
                const { Icon, color, isCustom } = getSocialIcon(link.url, link.icon);
                const iconColor = link.icon_color || color;
                const linkStyle = profile.link_style || 'cards';
                
                if (linkStyle === 'buttons') {
                  const buttonStyle = profile.link_button_style || 'with_text';
                  const showText = buttonStyle === 'with_text';
                  
                  return (
                    <motion.a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      variants={{
                        hidden: { opacity: 0, y: 8, scale: 0.98 },
                        show: {
                          opacity: 1,
                          y: 0,
                          scale: 1,
                          transition: { type: "spring", stiffness: 520, damping: 38, mass: 0.6 },
                        },
                      }}
                      className={`group flex items-center justify-center rounded-lg bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-border transition-colors duration-200 ${
                        showText ? 'gap-2 px-3 sm:px-4 py-1.5 sm:py-2' : 'p-2 sm:p-3'
                      }`}
                      title={!showText ? link.title : undefined}
                    >
                      {isCustom && link.icon ? (
                        <span className={showText ? "text-sm sm:text-base" : "text-lg sm:text-xl"}>{link.icon}</span>
                      ) : (
                        <span style={iconColor ? { color: iconColor } : undefined}>
                          <Icon className={showText ? "w-3.5 h-3.5 sm:w-4 sm:h-4" : "w-4 h-4 sm:w-5 sm:h-5"} />
                        </span>
                      )}
                      {showText && (
                        <span className="font-medium text-xs sm:text-sm text-foreground">{link.title}</span>
                      )}
                    </motion.a>
                  );
                }
                
                // Cards style (default)
                return (
                  <motion.a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      show: {
                        opacity: 1,
                        y: 0,
                        transition: { type: "spring", stiffness: 520, damping: 40, mass: 0.65 },
                      },
                    }}
                    className="group flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors duration-200"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      {isCustom && link.icon ? (
                        <span className="text-base sm:text-lg flex-shrink-0">{link.icon}</span>
                      ) : (
                        <span style={iconColor ? { color: iconColor } : undefined} className="flex-shrink-0">
                          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                        </span>
                      )}
                      <span className="font-medium text-sm sm:text-base text-foreground truncate">{link.title}</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
                  </motion.a>
                );
              })}
            </motion.div>
          )}
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      {(() => {
        // Verificar se o premium está ativo
        const isPremiumActive = profile.is_premium && (
          !profile.premium_expires_at || new Date(profile.premium_expires_at) > new Date()
        );
        
        // Só ocultar footer se premium estiver ativo E hide_footer estiver true
        const shouldHideFooter = isPremiumActive && profile.hide_footer;
        
        return !shouldHideFooter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="relative z-10 w-full py-8 text-center mt-auto"
          >
            <a
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <img 
                src="/logo.png" 
                alt="vye.bio" 
                className="w-5 h-5 object-contain"
              />
              vye.bio
            </a>
          </motion.div>
        );
      })()}

      {/* Floating Music Player - Outside main container */}
      {profile.music_url && profile.music_player_style === 'floating' && (
        <FloatingMusicPlayer
          profile={profile}
          isPlaying={isYouTube ? youtubePlayer.isPlaying : isPlaying}
          currentTime={isYouTube ? youtubePlayer.currentTime : currentTime}
          duration={isYouTube ? youtubePlayer.duration : duration}
          onTogglePlay={togglePlay}
          onProgressClick={handleProgressClick}
          formatTime={formatTime}
        />
      )}
    </div>
  );
};

export default Profile;
