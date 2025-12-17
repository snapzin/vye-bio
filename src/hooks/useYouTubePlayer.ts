import { useEffect, useRef, useState, useCallback } from 'react';
import { extractYouTubeVideoId, type YouTubeVideoInfo } from '@/lib/youtube';

// Extend Window interface for YouTube API
declare global {
  interface Window {
    YT: {
      Player: new (elementId: string, config: {
        videoId: string;
        playerVars?: {
          autoplay?: number;
          loop?: number;
          playlist?: string;
          start?: number;
          controls?: number;
          modestbranding?: number;
          rel?: number;
          showinfo?: number;
          enablejsapi?: number;
          origin?: string;
        };
        events?: {
          onReady?: (event: { target: any }) => void;
          onStateChange?: (event: { data: number; target: any }) => void;
          onError?: (event: { data: number }) => void;
        };
      }) => {
        playVideo: () => void;
        pauseVideo: () => void;
        stopVideo: () => void;
        seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
        getCurrentTime: () => number;
        getDuration: () => number;
        getPlayerState: () => number;
        destroy: () => void;
        setVolume: (volume: number) => void;
        mute: () => void;
        unMute: () => void;
        isMuted: () => boolean;
      };
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface UseYouTubePlayerOptions {
  videoId: string;
  autoplay?: boolean;
  loop?: boolean;
  volume?: number;
  onReady?: () => void;
  onStateChange?: (state: number) => void;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onError?: (error: number) => void;
}

interface UseYouTubePlayerReturn {
  player: any | null;
  isReady: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (volume: number) => void;
  error: string | null;
}

/**
 * Hook to manage YouTube IFrame API player
 */
export function useYouTubePlayer(options: UseYouTubePlayerOptions): UseYouTubePlayerReturn {
  const {
    videoId,
    autoplay = false,
    loop = true,
    volume = 50,
    onReady,
    onStateChange,
    onTimeUpdate,
    onDurationChange,
    onError,
  } = options;

  const playerRef = useRef<any | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timeUpdateIntervalRef = useRef<number | null>(null);

  // YouTube Player States
  const YT_STATE = {
    UNSTARTED: -1,
    ENDED: 0,
    PLAYING: 1,
    PAUSED: 2,
    BUFFERING: 3,
    CUED: 5,
  };

  // Wait for YouTube API to load
  const [apiReady, setApiReady] = useState(false);

  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setApiReady(true);
      return;
    }

    // Set up callback for when API loads
    const originalCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      setApiReady(true);
      if (originalCallback) {
        originalCallback();
      }
    };
  }, []);

  // Create player instance
  useEffect(() => {
    if (!videoId || !apiReady || !window.YT || !window.YT.Player) {
      return;
    }

    // Create container if it doesn't exist
    if (!containerRef.current) {
      const container = document.createElement('div');
      container.id = `youtube-player-${videoId}-${Date.now()}`;
      container.style.display = 'none';
      container.style.width = '0';
      container.style.height = '0';
      document.body.appendChild(container);
      containerRef.current = container;
    }

    // Destroy existing player
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (e) {
        // Ignore errors
      }
      playerRef.current = null;
    }

    // Create new player
    try {
      const player = new window.YT.Player(containerRef.current.id, {
        videoId,
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          loop: loop ? 1 : 0,
          playlist: loop ? videoId : undefined,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: { target: any }) => {
            setIsReady(true);
            setError(null);
            
            // Set initial volume
            try {
              event.target.setVolume(volume);
            } catch (e) {
              // Ignore
            }

            // Get duration
            try {
              const dur = event.target.getDuration();
              if (dur && dur > 0) {
                setDuration(dur);
                onDurationChange?.(dur);
              }
            } catch (e) {
              // Ignore
            }

            onReady?.();
          },
          onStateChange: (event: { data: number; target: any }) => {
            const state = event.data;
            
            if (state === YT_STATE.PLAYING) {
              setIsPlaying(true);
            } else if (state === YT_STATE.PAUSED || state === YT_STATE.ENDED) {
              setIsPlaying(false);
            }

            // Update duration when video starts
            if (state === YT_STATE.PLAYING) {
              try {
                const dur = event.target.getDuration();
                if (dur && dur > 0 && duration === 0) {
                  setDuration(dur);
                  onDurationChange?.(dur);
                }
              } catch (e) {
                // Ignore
              }
            }

            onStateChange?.(state);
          },
          onError: (event: { data: number }) => {
            const errorMessages: Record<number, string> = {
              2: 'Invalid video ID',
              5: 'HTML5 player error',
              100: 'Video not found',
              101: 'Video not allowed to be played in embedded players',
              150: 'Video not allowed to be played in embedded players',
            };
            const errorMsg = errorMessages[event.data] || `YouTube error: ${event.data}`;
            setError(errorMsg);
            setIsReady(false);
            onError?.(event.data);
          },
        },
      });

      playerRef.current = player;
    } catch (err) {
      setError('Failed to create YouTube player');
      console.error('YouTube player error:', err);
    }

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // Ignore
        }
        playerRef.current = null;
      }
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
        timeUpdateIntervalRef.current = null;
      }
      if (containerRef.current && containerRef.current.parentNode) {
        containerRef.current.parentNode.removeChild(containerRef.current);
        containerRef.current = null;
      }
    };
  }, [videoId, autoplay, loop, volume, apiReady]);

  // Time update interval
  useEffect(() => {
    if (!isReady || !isPlaying || !playerRef.current) {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
        timeUpdateIntervalRef.current = null;
      }
      return;
    }

    timeUpdateIntervalRef.current = window.setInterval(() => {
      if (playerRef.current) {
        try {
          const time = playerRef.current.getCurrentTime();
          setCurrentTime(time);
          onTimeUpdate?.(time);
        } catch (e) {
          // Ignore
        }
      }
    }, 100);

    return () => {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
        timeUpdateIntervalRef.current = null;
      }
    };
  }, [isReady, isPlaying, onTimeUpdate]);

  const play = useCallback(() => {
    if (playerRef.current && isReady) {
      try {
        playerRef.current.playVideo();
      } catch (e) {
        console.error('Error playing video:', e);
      }
    }
  }, [isReady]);

  const pause = useCallback(() => {
    if (playerRef.current && isReady) {
      try {
        playerRef.current.pauseVideo();
      } catch (e) {
        console.error('Error pausing video:', e);
      }
    }
  }, [isReady]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const seekTo = useCallback((seconds: number) => {
    if (playerRef.current && isReady) {
      try {
        playerRef.current.seekTo(seconds, true);
        setCurrentTime(seconds);
      } catch (e) {
        console.error('Error seeking:', e);
      }
    }
  }, [isReady]);

  const setVolume = useCallback((vol: number) => {
    if (playerRef.current && isReady) {
      try {
        playerRef.current.setVolume(Math.max(0, Math.min(100, vol)));
      } catch (e) {
        console.error('Error setting volume:', e);
      }
    }
  }, [isReady]);

  return {
    player: playerRef.current,
    isReady,
    isPlaying,
    currentTime,
    duration,
    play,
    pause,
    togglePlay,
    seekTo,
    setVolume,
    error,
  };
}

