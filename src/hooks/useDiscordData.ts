import { useEffect, useState, useRef } from "react";

// Types based on Lanyard API response
interface LanyardResponse {
  success: boolean;
  data: {
    kv: Record<string, any>;
    discord_user: {
      id: string;
      username: string;
      global_name: string | null;
      display_name: string | null;
      discriminator: string;
      bot: boolean;
      avatar: string | null;
      avatar_decoration_data: any;
      collectibles: any;
      display_name_styles: any;
      public_flags: number;
      primary_guild: {
        identity_guild_id: string | null;
        identity_enabled: boolean;
        tag: string | null;
        badge: string | null;
      };
    };
    activities: Array<{
      id: string;
      name: string;
      type: number;
      platform: string | null;
      application_id: string | null;
      created_at: number;
      session_id: string | null;
      details: string | null;
      state: string | null;
      flags: number;
      timestamps: {
        start: number | null;
        end: number | null;
      } | null;
      assets: {
        large_image: string | null;
        large_text: string | null;
        small_image: string | null;
        small_text: string | null;
      } | null;
      buttons: string[] | null;
    }>;
    discord_status: "online" | "idle" | "dnd" | "offline";
    active_on_discord_web: boolean;
    active_on_discord_desktop: boolean;
    active_on_discord_mobile: boolean;
    active_on_discord_embedded: boolean;
    listening_to_spotify: boolean;
    spotify: any;
  };
}

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

function transformLanyardData(lanyardData: LanyardResponse): DiscordUser {
  const { discord_user, activities, discord_status } = lanyardData.data;

  const transformedActivities = activities.map((activity) => ({
    name: activity.name,
    type: activity.type,
    url: null,
    created_at: formatTimestamp(activity.created_at),
    duration: getDuration(
      activity.timestamps?.start || null,
      activity.timestamps?.end || null
    ),
    start_time: activity.timestamps?.start || null,
    end_time: activity.timestamps?.end || null,
    application_id: activity.application_id,
    details: activity.details,
    state: activity.state,
    assets: activity.assets
      ? {
          large_text: activity.assets.large_text,
          large_image: processAssetImage(activity.assets.large_image, activity.application_id),
          small_text: activity.assets.small_text,
          small_image: processAssetImage(activity.assets.small_image, activity.application_id),
        }
      : null,
    buttons: activity.buttons,
  }));

  return {
    user: {
      id: discord_user.id,
      username: discord_user.username,
      global_name: discord_user.global_name || discord_user.display_name || discord_user.username,
      avatar_url: getAvatarUrl(discord_user.id, discord_user.avatar),
    },
    status: discord_status,
    connected_accounts: [],
    badges: [],
    presence: {
      status: discord_status,
      activities: transformedActivities,
    },
  };
}

export const useDiscordData = (discordUserId: string | null) => {
  const [userData, setUserData] = useState<DiscordUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const has404Error = useRef(false); // Track if we got a 404 to stop polling

  // Fetch data from Lanyard API
  useEffect(() => {
    if (!discordUserId) {
      setIsLoading(false);
      setUserData(null);
      setError(null);
      has404Error.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Reset 404 flag when discordUserId changes
    has404Error.current = false;

    const fetchDiscordData = async () => {
      // Don't fetch if we already got a 404
      if (has404Error.current) {
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(
          `https://api.lanyard.rest/v1/users/${discordUserId}`
        );
        
        if (!response.ok) {
          // If 404, stop polling and set error silently
          if (response.status === 404) {
            has404Error.current = true;
            setError(null); // Don't show error for 404
            setUserData(null);
            setIsLoading(false);
            // Clear interval if it exists
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return;
          }
          throw new Error(`Failed to fetch: ${response.status}`);
        }
        
        const data: LanyardResponse = await response.json();
        
        if (!data.success || !data.data) {
          throw new Error("Invalid response from Lanyard API");
        }

        const transformedData = transformLanyardData(data);
        setUserData(transformedData);
        setError(null);
        has404Error.current = false; // Reset on success
      } catch (err) {
        // Only log non-404 errors
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (!errorMessage.includes('404')) {
          setError("Erro ao carregar dados");
        }
        setUserData(null);
        // Don't set has404Error for other errors, allow retry
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchDiscordData();

    // Poll every 10 seconds for updates (only if no 404 error)
    intervalRef.current = setInterval(() => {
      if (!has404Error.current) {
        fetchDiscordData();
      } else {
        // Clear interval if we got 404
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [discordUserId]);

  return { userData, isLoading, error };
};
