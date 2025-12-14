import { 
  Instagram, 
  Twitter, 
  Youtube, 
  Github, 
  Linkedin, 
  Facebook, 
  Link2
} from "lucide-react";

// Custom SVG icons for platforms not available in lucide-react
const DiscordIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const TwitchIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const SpotifyIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.84-.66 0-.36.24-.66.54-.78 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.24 1.021zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

const SnapchatIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.487.535 6.624 0 11.99-5.367 11.99-11.987C23.97 5.39 18.641.026 12.017.026L12.017 0z"/>
  </svg>
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.787z"/>
  </svg>
);

const PinterestIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 0C5.373 0 0 5.372 0 12s5.373 12 12 12c5.302 0 9.917-3.158 11.827-7.68-.09-.7-.404-2.94.085-4.35.2-.75 1.3-8.7 1.3-8.7s-.33-.66-.33-1.64c0-1.54.89-2.69 2-2.69.94 0 1.4.7 1.4 1.55 0 .94-.6 2.35-.9 3.66-.26 1.1.55 2 1.63 2 .96 0 1.7-.6 1.7-1.47 0-.95-.7-1.6-1.7-1.6-1.38 0-2.2 1.04-2.2 2.36 0 .87.3 1.46.3 1.46l-1.2 5.1c-.35 1.5-.05 3.35-.03 3.54 0 .2.26.25.37.1.15-.2 2.1-2.6 2.76-4.5.18-.7 1.03-4.4 1.03-4.4.05-.3.05-.5.05-.7 0-1.5-.87-2.6-2.1-2.6-1.6 0-2.9 1.6-2.9 3.7 0 1.4.5 2.3.5 2.3l-2 8.4c-.15.6-.1 1.3-.1 1.4 0 .2.15.25.2.1.1-.2 1.3-1.6 1.8-3.1.12-.4.7-2.8.7-2.8.35.65 1.4 1.2 2.5 1.2 3.3 0 5.5-3.4 5.5-7.9C22 6.1 17.5 0 12 0z"/>
  </svg>
);

export interface SocialPlatform {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  domains: string[];
}

export const socialPlatforms: SocialPlatform[] = [
  {
    name: "Instagram",
    icon: Instagram,
    color: "#E4405F",
    domains: ["instagram.com", "instagr.am"]
  },
  {
    name: "Twitter",
    icon: Twitter,
    color: "#1DA1F2",
    domains: ["twitter.com", "x.com", "t.co"]
  },
  {
    name: "YouTube",
    icon: Youtube,
    color: "#FF0000",
    domains: ["youtube.com", "youtu.be"]
  },
  {
    name: "Twitch",
    icon: TwitchIcon,
    color: "#9146FF",
    domains: ["twitch.tv"]
  },
  {
    name: "GitHub",
    icon: Github,
    color: "#181717",
    domains: ["github.com"]
  },
  {
    name: "LinkedIn",
    icon: Linkedin,
    color: "#0077B5",
    domains: ["linkedin.com"]
  },
  {
    name: "Facebook",
    icon: Facebook,
    color: "#1877F2",
    domains: ["facebook.com", "fb.com"]
  },
  {
    name: "TikTok",
    icon: TikTokIcon,
    color: "#FFFFFF",
    domains: ["tiktok.com"]
  },
  {
    name: "Spotify",
    icon: SpotifyIcon,
    color: "#1DB954",
    domains: ["spotify.com", "open.spotify.com"]
  },
  {
    name: "Discord",
    icon: DiscordIcon,
    color: "#5865F2",
    domains: ["discord.com", "discord.gg"]
  },
  {
    name: "Snapchat",
    icon: SnapchatIcon,
    color: "#FFFC00",
    domains: ["snapchat.com"]
  },
  {
    name: "Pinterest",
    icon: PinterestIcon,
    color: "#BD081C",
    domains: ["pinterest.com"]
  },
  {
    name: "WhatsApp",
    icon: WhatsAppIcon,
    color: "#25D366",
    domains: ["wa.me", "whatsapp.com"]
  },
  {
    name: "Telegram",
    icon: TelegramIcon,
    color: "#0088CC",
    domains: ["t.me", "telegram.org"]
  }
];

export function detectSocialPlatform(url: string): SocialPlatform | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase().replace('www.', '');
    
    for (const platform of socialPlatforms) {
      if (platform.domains.some(domain => hostname.includes(domain))) {
        return platform;
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

export function getSocialIcon(url: string, customIcon?: string | null): {
  Icon: React.ComponentType<{ className?: string }>;
  color?: string;
  isCustom: boolean;
} {
  if (customIcon) {
    return {
      Icon: () => <span className="text-lg">{customIcon}</span>,
      isCustom: true
    };
  }
  
  const platform = detectSocialPlatform(url);
  
  if (platform) {
    return {
      Icon: platform.icon,
      color: platform.color,
      isCustom: false
    };
  }
  
  return {
    Icon: Link2,
    isCustom: false
  };
}

