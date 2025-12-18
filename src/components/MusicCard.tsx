import { motion } from "framer-motion";
import { Play, Pause, Music } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import type { Profile } from "@/hooks/useProfile";
import { isYouTubeUrl, extractYouTubeVideoId, getYouTubeThumbnail } from "@/lib/youtube";
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer";

interface MusicCardProps {
  profile: Profile;
}

const MusicCard = ({ profile }: MusicCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const userPausedRef = useRef(false);

  // Check if music_url is YouTube
  const isYouTube = profile?.music_url ? isYouTubeUrl(profile.music_url) : false;
  const youtubeVideoId = profile?.music_url ? extractYouTubeVideoId(profile.music_url)?.videoId : null;
  
  // Only initialize YouTube player if not using floating style
  const shouldInitYouTube = profile?.music_player_style !== 'floating' && youtubeVideoId;

  // YouTube player hook - only initialize if not floating
  const youtubePlayer = useYouTubePlayer({
    videoId: shouldInitYouTube ? youtubeVideoId : '',
    autoplay: shouldInitYouTube ? true : false,
    loop: true,
    volume: 50,
    onStateChange: (state) => {
      if (profile?.music_player_style !== 'floating') {
        setIsPlaying(state === 1);
      }
    },
    onTimeUpdate: (time) => {
      if (profile?.music_player_style !== 'floating') {
        setCurrentTime(time);
      }
    },
    onDurationChange: (dur) => {
      if (profile?.music_player_style !== 'floating') {
        setDuration(dur);
      }
    },
  });

  // Initialize audio player (only for non-YouTube URLs)
  useEffect(() => {
    // Don't initialize if using floating player style
    if (!profile.music_url || profile.music_player_style === 'floating' || isYouTube) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      return;
    }

    const audio = new Audio(profile.music_url);
    audio.loop = true;
    audio.volume = 0.5;
    audio.preload = 'auto';
    audioRef.current = audio;

    let hasTriedAutoplay = false;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      setDuration(audio.duration);
      // Auto-play when metadata is loaded
      if (!hasTriedAutoplay) {
        hasTriedAutoplay = true;
        audio.play().catch(() => {
          // Tentaremos novamente no canplay
        });
      }
    };
    const handlePlay = () => {
      setIsPlaying(true);
      userPausedRef.current = false;
    };
    const handlePause = () => {
      setIsPlaying(false);
      userPausedRef.current = true;
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      // Only restart if user hasn't manually paused
      if (!userPausedRef.current && audio.loop) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
    };
    const handleCanPlay = () => {
      // Tenta tocar quando o áudio estiver pronto
      if (!isPlaying && !hasTriedAutoplay) {
        hasTriedAutoplay = true;
        audio.play().catch(() => {});
      }
    };
    const handleLoadedData = () => {
      // Última tentativa de autoplay
      if (!isPlaying && !hasTriedAutoplay) {
        hasTriedAutoplay = true;
        audio.play().catch(() => {});
      }
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("loadeddata", handleLoadedData);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("loadeddata", handleLoadedData);
      audio.pause();
      audio.src = "";
    };
  }, [profile.music_url, isYouTube]);

  useEffect(() => {
    if (isYouTube) {
      // YouTube player is handled by the hook
      return;
    }
    if (!audioRef.current) return;
    
    // Ensure audio state matches isPlaying state
    if (isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // If play fails, update state to reflect that
          setIsPlaying(false);
        });
      }
    } else {
      // Force pause when isPlaying is false
      audioRef.current.pause();
    }
  }, [isPlaying, isYouTube]);

  const togglePlay = () => {
    if (isYouTube && youtubeVideoId) {
      youtubePlayer.togglePlay();
    } else {
      if (isPlaying) {
        userPausedRef.current = true;
        setIsPlaying(false);
      } else {
        userPausedRef.current = false;
        setIsPlaying(true);
      }
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isYouTube && youtubeVideoId && youtubePlayer.duration) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = x / rect.width;
      const newTime = percent * youtubePlayer.duration;
      youtubePlayer.seekTo(newTime);
    } else if (!audioRef.current || duration === 0) {
      return;
    } else {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const newTime = percent * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    }
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!profile.music_url || profile.music_player_style === 'floating') {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mb-8"
      style={{ 
        width: '32rem',
        maxWidth: '42rem',
        marginLeft: 'auto',
        marginRight: 'auto',
        display: 'block',
        textAlign: 'left'
      }}
    >
      <div className="rounded-2xl bg-secondary/50 backdrop-blur-sm border border-border/50 overflow-hidden w-full">
        <div className="flex gap-4 p-4">
          {/* Image - lado esquerdo */}
          {(() => {
            // Se for YouTube, usar thumbnail do vídeo
            if (isYouTube && youtubeVideoId) {
              return (
                <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden relative">
                  <img 
                    src={getYouTubeThumbnail(youtubeVideoId, 'maxresdefault')}
                    alt={profile.music_title || "Música"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback para hqdefault se maxresdefault não existir
                      const target = e.target as HTMLImageElement;
                      if (target.src.includes('maxresdefault')) {
                        target.src = getYouTubeThumbnail(youtubeVideoId, 'hqdefault');
                      }
                    }}
                  />
                </div>
              );
            }
            // Se tiver imagem customizada, usar ela
            if (profile.music_image_url) {
              return (
            <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden relative">
              <img 
                src={profile.music_image_url} 
                alt={profile.music_title || "Música"}
                className="w-full h-full object-cover"
              />
            </div>
              );
            }
            // Fallback para ícone padrão
            return (
            <div className="w-20 h-20 flex-shrink-0 rounded-lg bg-gradient-to-br from-accent/20 to-purple-500/20 flex items-center justify-center">
              <Music className="w-8 h-8 text-muted-foreground/50" />
            </div>
            );
          })()}
          
          {/* Player Controls - lado direito */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={togglePlay}
                disabled={isYouTube && !youtubePlayer.isReady}
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity flex-shrink-0 disabled:opacity-50"
              >
                {(isYouTube ? youtubePlayer.isPlaying : isPlaying) ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {profile.music_title || "Música"}
                </p>
                {isYouTube && youtubeVideoId ? (
                  <a
                    href={`https://www.youtube.com/watch?v=${youtubeVideoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-accent truncate block transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {profile.music_artist || "Artista desconhecido"}
                  </a>
                ) : (
                <p className="text-xs text-muted-foreground truncate">
                  {profile.music_artist || "Artista desconhecido"}
                </p>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {((isYouTube ? youtubePlayer.duration : duration) > 0) && (
              <div className="space-y-1">
                <div 
                  className="w-full h-1 bg-secondary rounded-full cursor-pointer group"
                  onClick={handleProgressClick}
                >
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-150 group-hover:bg-primary/80"
                    style={{ 
                      width: `${((isYouTube ? youtubePlayer.currentTime : currentTime) / (isYouTube ? youtubePlayer.duration : duration)) * 100}%` 
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatTime(isYouTube ? youtubePlayer.currentTime : currentTime)}</span>
                  <span>{formatTime(isYouTube ? youtubePlayer.duration : duration)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MusicCard;