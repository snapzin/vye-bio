import { motion } from "framer-motion";
import { Play, Pause, Music } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import type { Profile } from "@/hooks/useProfile";

interface MusicCardProps {
  profile: Profile;
}

const MusicCard = ({ profile }: MusicCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!profile.music_url) return;

    const audio = new Audio(profile.music_url);
    audioRef.current = audio;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
      audio.src = "";
    };
  }, [profile.music_url]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const newTime = percent * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
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
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity flex-shrink-0"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
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
            {duration > 0 && (
              <div className="space-y-1">
                <div 
                  className="w-full h-1 bg-secondary rounded-full cursor-pointer group"
                  onClick={handleProgressClick}
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
      </div>
    </motion.div>
  );
};

export default MusicCard;