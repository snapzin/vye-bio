import { useEffect, useState, useRef } from "react";

// Types based on Victims API response
// The API can return different formats, so we handle both
interface VictimsResponseSimple {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  banner: string | null;
  bio: string | null;
}

interface VictimsResponseComplex {
  id: string;
  user: {
    id: string;
    username: string;
    global_name?: string | null;
    display_name?: string | null;
    discriminator?: string;
    avatar?: string | null;
    avatar_url?: string | null;
  };
  badges?: Array<any>;
  connected_accounts?: Array<any>;
  premium_guild_since?: string | null;
  [key: string]: any;
}

type VictimsResponse = VictimsResponseSimple | VictimsResponseComplex;

export interface DiscordUser {
  user: {
    id: string;
    username: string;
    global_name: string;
    avatar_url: string;
    banner_color?: string;
  };
  status?: "online" | "idle" | "dnd" | "offline";
  connected_accounts: Array<{
    type: string;
    id: string;
    name: string;
    verified: boolean;
  }>;
  badges: Array<{
    id: string;
    description: string;
    icon: string;
  }>;
  activities?: Array<{
    name: string;
    type: number;
    state?: string;
    details?: string;
    assets?: {
      large_image?: string;
      large_text?: string;
      small_image?: string;
      small_text?: string;
    };
    timestamps?: {
      start?: number;
      end?: number;
    };
  }>;
  presence?: {
    status: "online" | "idle" | "dnd" | "offline";
    activities: Array<{
      name: string;
      type: number;
      url?: string | null;
      created_at?: string | null;
      duration?: string | null;
      start_time?: number;
      end_time?: number;
      application_id?: string | null;
      details?: string | null;
      state?: string | null;
      assets?: {
        large_text?: string | null;
        large_image?: string | null;
        small_text?: string | null;
        small_image?: string | null;
      } | null;
      buttons?: string[] | null;
    }>;
  };
}

function formatTimestamp(timestamp: number | null | undefined): string | null {
  if (!timestamp) return null;
  return new Date(timestamp).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getDuration(
  startTimestamp: number | null | undefined,
  endTimestamp: number | null | undefined
): string | null {
  if (!startTimestamp) return null;

  const start = new Date(startTimestamp);
  const end = endTimestamp ? new Date(endTimestamp) : new Date();
  const duration = end.getTime() - start.getTime();

  const hours = Math.floor(duration / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

  let timeString = "";
  if (hours > 0) {
    timeString = `${hours}h`;
    if (minutes > 0) {
      timeString += ` ${minutes}min`;
    }
  } else if (minutes > 0) {
    timeString = `${minutes}min`;
  }
  if (!timeString) timeString = "agora";
  timeString += " atrás";

  return timeString;
}

function getAvatarUrl(userId: string, avatar: string | null): string {
  if (!avatar) {
    return `https://cdn.discordapp.com/embed/avatars/${parseInt(userId) % 5}.png`;
  }
  return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png`;
}

function processAssetImage(imageKey: string | null, applicationId: string | null): string | null {
  if (!imageKey) return null;
  
  // Handle mp:external/ format (external images)
  // Format: mp:external/HASH/https/domain.com/path/to/image.png
  if (imageKey.startsWith("mp:external/")) {
    const withoutPrefix = imageKey.replace("mp:external/", "");
    const parts = withoutPrefix.split("/");
    if (parts.length >= 2) {
      // First part is the hash, rest is the URL path
      const hash = parts[0];
      const urlPath = parts.slice(1).join("/");
      return `https://media.discordapp.net/external/${hash}/${urlPath}`;
    }
  }
  
  // Handle spotify: format
  if (imageKey.startsWith("spotify:")) {
    return `https://i.scdn.co/image/${imageKey.replace("spotify:", "")}`;
  }
  
  // Handle regular Discord CDN images (application assets)
  if (applicationId) {
    // Remove .png extension if present, Discord CDN adds it automatically
    const cleanKey = imageKey.replace(/\.(png|jpg|jpeg|gif|webp)$/i, "");
    return `https://cdn.discordapp.com/app-assets/${applicationId}/${cleanKey}.png`;
  }
  
  // Fallback: try as direct URL or Discord CDN
  if (imageKey.startsWith("http")) {
    return imageKey;
  }
  
  // If it's just a key without application ID, try Discord's rich presence CDN
  return `https://cdn.discordapp.com/app-assets/${imageKey}.png`;
}

function transformVictimsData(victimsData: VictimsResponse): DiscordUser {
  // Check if it's the complex format (with user object)
  if ('user' in victimsData && victimsData.user) {
    const user = victimsData.user;
    let avatarUrl: string;
    
    if (user.avatar_url) {
      // Already a full URL
      avatarUrl = user.avatar_url;
    } else if (user.avatar) {
      if (user.avatar.startsWith('http')) {
        avatarUrl = user.avatar;
      } else {
        avatarUrl = getAvatarUrl(user.id, user.avatar);
      }
    } else {
      avatarUrl = getAvatarUrl(user.id, null);
    }

    return {
      user: {
        id: user.id,
        username: user.username,
        global_name: user.global_name || user.display_name || user.username,
        avatar_url: avatarUrl,
      },
      status: 'offline',
      connected_accounts: victimsData.connected_accounts || [],
      badges: victimsData.badges || [],
      presence: {
        status: 'offline',
        activities: [],
      },
    };
  }
  
  // Simple format (direct fields)
  let avatarUrl: string;
  if (victimsData.avatar) {
    if (victimsData.avatar.startsWith('http')) {
      avatarUrl = victimsData.avatar;
    } else {
      avatarUrl = getAvatarUrl(victimsData.id, victimsData.avatar);
    }
  } else {
    avatarUrl = getAvatarUrl(victimsData.id, null);
  }

  return {
    user: {
      id: victimsData.id,
      username: victimsData.username,
      global_name: victimsData.username,
      avatar_url: avatarUrl,
    },
    status: 'offline',
    connected_accounts: [],
    badges: [],
    presence: {
      status: 'offline',
      activities: [],
    },
  };
}

// Create basic Discord user data when Victims API doesn't have the user
function createBasicDiscordUser(discordUserId: string): DiscordUser {
  // Use default avatar from Discord CDN
  const avatarUrl = getAvatarUrl(discordUserId, null);

  return {
    user: {
      id: discordUserId,
      username: `ID: ${discordUserId.slice(0, 8)}...`,
      global_name: 'Usuário Discord',
      avatar_url: avatarUrl,
    },
    status: 'offline',
    connected_accounts: [],
    badges: [],
    presence: {
      status: 'offline',
      activities: [],
    },
  };
}

export const useDiscordData = (discordUserId: string | null) => {
  const [userData, setUserData] = useState<DiscordUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const has404Error = useRef(false); // Track if we got a 404 to stop polling
  const useFallback = useRef(false); // Track if we're using Discord API fallback

  // Fetch data from Victims API
  useEffect(() => {
    if (!discordUserId) {
      setIsLoading(false);
      setUserData(null);
      setError(null);
      has404Error.current = false;
      useFallback.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Reset flags when discordUserId changes
    has404Error.current = false;
    useFallback.current = false;

    const fetchDiscordData = async (): Promise<boolean> => {
      // Don't fetch if we're already using fallback
      if (useFallback.current) {
        return false;
      }

      try {
        setIsLoading(true);

        const response = await fetch(
          `https://api.victims.bio/discord/user/${discordUserId}`,
          {
            headers: {
              'Accept': 'application/json',
            },
          }
        );
        
        if (!response.ok) {
          // If 404, immediately use fallback (no more API calls)
          if (response.status === 404) {
            has404Error.current = true;
            useFallback.current = true;
            
            // Clear interval immediately
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            
            // Use basic fallback immediately (no more API calls)
            const fallbackData = createBasicDiscordUser(discordUserId);
            setUserData(fallbackData);
            setError(null);
            setIsLoading(false);
            return false; // Don't start polling
          }
          
          // Try to get error message from response
          let errorMessage = `Erro ${response.status}`;
          try {
            const errorData = await response.json();
            if (errorData.message || errorData.error) {
              errorMessage = errorData.message || errorData.error;
            }
          } catch {
            // Ignore JSON parse errors
          }
          
          throw new Error(errorMessage);
        }
        
        const data: VictimsResponse = await response.json();
        
        // Validate response structure - check both formats
        const isValid = data && (
          // Simple format
          (data.id && 'username' in data && data.username) ||
          // Complex format
          (data.id && 'user' in data && data.user && data.user.id && data.user.username)
        );
        
        if (!isValid) {
          console.error('Invalid Victims API response:', data);
          throw new Error("Resposta inválida da API Victims");
        }

        const transformedData = transformVictimsData(data);
        setUserData(transformedData);
        setError(null);
        has404Error.current = false;
        useFallback.current = false;
        setIsLoading(false);
        return true; // Success, can start polling
      } catch (err) {
        console.error('Error fetching Discord data from Victims API:', err);
        // If error and not using fallback yet, use basic fallback immediately
        if (!useFallback.current) {
          useFallback.current = true;
          has404Error.current = true;
          
          // Clear interval immediately
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          
          // Use basic fallback immediately (no more API calls)
          const fallbackData = createBasicDiscordUser(discordUserId);
          setUserData(fallbackData);
          setError(null);
          setIsLoading(false);
          return false; // Don't start polling
        } else {
          const errorMessage = err instanceof Error ? err.message : "Erro ao carregar dados do Discord";
          setError(errorMessage);
          // Still show fallback data even on error
          const fallbackData = createBasicDiscordUser(discordUserId);
          setUserData(fallbackData);
          setIsLoading(false);
          return false;
        }
      }
    };

    // Initial fetch - start polling only after first successful fetch
    fetchDiscordData().then((shouldPoll) => {
      // Only start polling if fetch was successful (not 404, not fallback)
      if (shouldPoll && !intervalRef.current) {
        intervalRef.current = setInterval(() => {
          if (!has404Error.current && !useFallback.current) {
            fetchDiscordData();
          } else {
            // Clear interval if we got 404 or using fallback
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }
        }, 10000);
      }
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [discordUserId]);

  return { userData, isLoading, error };
};
