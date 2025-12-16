import { 
  Star, 
  CheckCircle2, 
  Gem, 
  Video, 
  Link2, 
  Flame, 
  Crown, 
  Gamepad2, 
  Music, 
  Palette 
} from "lucide-react";

export interface BadgeIconProps {
  className?: string;
  size?: number;
}

// SVGs próprios (mais consistentes/centralizados) para badges principais
function StaffBadge({ className, size = 20 }: BadgeIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`${className ?? ""} block`}
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2.2 19 6v6.2c0 5.2-3.2 9.1-7 10.6-3.8-1.5-7-5.4-7-10.6V6l7-3.8Z"
        fill="currentColor"
        fillOpacity="0.9"
      />
      <path
        d="M12 7.2 13.35 10.0l3.1.45-2.25 2.2.53 3.1L12 14.35 9.27 15.75l.53-3.1-2.25-2.2 3.1-.45L12 7.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function DeveloperBadge({ className, size = 20 }: BadgeIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`${className ?? ""} block`}
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9.2 8.3 5 12l4.2 3.7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.8 8.3 19 12l-4.2 3.7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.2 7.6 10.8 16.4"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BugHunterBadge({ className, size = 20 }: BadgeIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`${className ?? ""} block`}
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9.2 8.2c.8-1.2 1.8-1.9 2.8-1.9s2 .7 2.8 1.9"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path
        d="M8.6 10.2c-.9 1-1.4 2.3-1.4 3.7 0 3.2 2.3 5.9 4.8 5.9s4.8-2.7 4.8-5.9c0-1.4-.5-2.7-1.4-3.7"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path
        d="M12 11.2v8"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path
        d="M7 13.2H4.6M19.4 13.2H17"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path
        d="M7.8 16.8 5.9 18.3M18.1 18.3 16.2 16.8"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Mapeamento de nomes de badges para componentes de ícones
export const badgeIcons: Record<string, React.ComponentType<BadgeIconProps>> = {
  'Early Adopter': Star,
  'Verified': CheckCircle2,
  'Pro': Gem,
  'Creator': Video,
  'Networker': Link2,
  'Popular': Flame,
  'OG': Crown,
  'Gamer': Gamepad2,
  'Music Lover': Music,
  'Customizer': Palette,
  'Staff': StaffBadge,
  'Developer': DeveloperBadge,
  'Caçador de Bugs': BugHunterBadge,
  'Bug Hunter': BugHunterBadge, // Alias em inglês
};

// Função para obter o componente de ícone baseado no nome da badge
export function getBadgeIcon(badgeName: string | null | undefined): React.ComponentType<BadgeIconProps> | null {
  if (!badgeName) return null;
  return badgeIcons[badgeName] || null;
}

// Componente genérico para renderizar ícone de badge
export function BadgeIcon({ 
  icon, 
  badgeName,
  className = "w-5 h-5",
  size = 20,
  offsetY = 0
}: { 
  icon?: string | null | undefined;
  badgeName?: string | null | undefined;
  className?: string;
  size?: number;
  offsetY?: number;
}) {
  // Prioriza o nome da badge para encontrar o ícone SVG
  const nameToCheck = badgeName || icon;
  if (!nameToCheck) return <span className={className} style={{ fontSize: size }}>?</span>;

  const IconComponent = getBadgeIcon(nameToCheck);
  
  // Always wrap to force perfect centering (avoids SVG baseline/optical offsets)
  const wrapperClass = `inline-flex items-center justify-center align-middle leading-none ${className}`;
  const wrapperStyle: React.CSSProperties = {
    width: size,
    height: size,
    lineHeight: 0,
    transform: offsetY ? `translateY(${offsetY}px)` : undefined,
  };

  if (IconComponent) {
    return (
      <span className={wrapperClass} style={wrapperStyle}>
        <IconComponent className="block" size={size} />
      </span>
    );
  }

  // Fallback para emojis antigos (quando icon é um emoji)
  if (icon) {
    return (
      <span
        className={wrapperClass}
        style={{ ...wrapperStyle, fontSize: size }}
      >
        {icon}
      </span>
    );
  }

  return (
    <span className={wrapperClass} style={{ ...wrapperStyle, fontSize: size }}>
      ?
    </span>
  );
}

