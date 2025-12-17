import { motion } from "framer-motion";
import { Play, Pause, Music } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import type { Profile } from "@/hooks/useProfile";
import { isYouTubeUrl, extractYouTubeVideoId } from "@/lib/youtube";
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer";

interface MusicCardProps {
  profile: Profile;
}

const MusicCard = ({ profile }: MusicCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Check if music_url is YouTube
  const isYouTube = profile?.music_url ? isYouTubeUrl(profile.music_url) : false;
  const youtubeVideoId = profile?.music_url ? extractYouTubeVideoId(profile.music_url)?.videoId : null;

  // YouTube player hook
  const youtubePlayer = useYouTubePlayer({
    videoId: youtubeVideoId || '',
    autoplay: true,
    loop: true,
    volume: 50,
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

  // Initialize audio player (only for non-YouTube URLs)
  useEffect(() => {
    if (!profile.music_url || isYouTube) {
      audioRef.current = null;
      return;
    }

    const audio = new Audio(profile.music_url);
    audioRef.current = audio;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      setDuration(audio.duration);
      // Auto-play when metadata is loaded
      audio.play().catch((error) => {
        console.error('Error auto-playing audio:', error);
      });
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const handleCanPlay = () => {
      // Tenta tocar quando o áudio estiver pronto
      audio.play().catch((error) => {
        console.error('Error auto-playing audio:', error);
      });
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("canplay", handleCanPlay);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("canplay", handleCanPlay);
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
    if (isPlaying) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, isYouTube]);

  const togglePlay = () => {
    if (isYouTube && youtubeVideoId) {
      youtubePlayer.togglePlay();
    } else {
      setIsPlaying(!isPlaying);
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
          {profile.music_image_url ? (
            <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden relative">
              <img 
                src={profile.music_image_url} 
                alt={profile.music_title || "Música"}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-20 h-20 flex-shrink-0 rounded-lg bg-gradient-to-br from-accent/20 to-purple-500/20 flex items-center justify-center">
              <Music className="w-8 h-8 text-muted-foreground/50" />
            </div>
          )}
          
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
                <p className="text-xs text-muted-foreground truncate">
                  {profile.music_artist || "Artista desconhecido"}
                </p>
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