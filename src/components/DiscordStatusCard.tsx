import { useDiscordData } from "@/hooks/useDiscordData";
import { motion } from "framer-motion";

interface DiscordStatusCardProps {
  discordUserId: string | null;
  variant?: 'profile' | 'preview';
}

const DiscordStatusCard = ({ discordUserId, variant = 'profile' }: DiscordStatusCardProps) => {
  const { userData, isLoading, error } = useDiscordData(discordUserId);

  if (!discordUserId) return null;

  const activities = userData?.presence?.activities || [];
  const primaryActivity = activities[0];

  const getBadgeIcon = (badge: { id: string; icon: string }) => {
    return `https://cdn.discordapp.com/badge-icons/${badge.icon}.png`;
  };

  const getStatusColor = () => {
    const status = userData?.presence?.status || userData?.status || "offline";
    switch (status) {
      case "online":
        return "bg-green-500";
      case "dnd":
        return "bg-red-500";
      case "idle":
        return "bg-yellow-500";
      case "offline":
      default:
        return "bg-gray-500";
    }
  };

  const getActivityType = (type: number): string => {
    switch (type) {
      case 0:
        return "Jogando";
      case 1:
        return "Transmitindo";
      case 2:
        return "Ouvindo";
      case 3:
        return "Assistindo";
      case 4:
        return ""; // Custom status, no prefix
      case 5:
        return "Competindo";
      default:
        return "Atividade";
    }
  };

  const isPreview = variant === 'preview';
  const avatarSizeClass = isPreview ? 'w-14 h-14' : (activities.length === 0 ? 'w-12 h-12' : 'w-16 h-16');
  const hasActivityImage = primaryActivity?.assets?.large_image;
  const paddingClass = isPreview 
    ? (hasActivityImage ? 'pl-2 pr-0 py-1.5' : 'p-2 py-1.5')
    : (activities.length === 0 ? 'p-2' : 'p-3');
  const gapClass = isPreview ? 'gap-2' : (activities.length === 0 ? 'gap-2' : 'gap-3');
  const activityImageSizeClass = isPreview ? 'w-14 h-14' : (activities.length === 0 ? 'w-12 h-12' : 'w-16 h-16');

  return (
    <div
      className={variant === 'preview' ? "w-full" : "mb-6 mx-auto"}
      style={{
        width: variant === 'preview' ? '100%' : 'fit-content',
        maxWidth: variant === 'preview' ? '100%' : (activities.length === 0 ? '24rem' : '100%'),
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`bg-secondary/50 backdrop-blur-sm border border-border/50 shadow-sm rounded-xl w-full overflow-hidden ${isPreview ? 'flex items-center' : ''}`}
      >
        <div className={`${paddingClass} ${isPreview && hasActivityImage ? 'w-full' : ''}`}>
          {/* Avatar and User Info - Horizontal Layout */}
          <div className={`flex items-center ${isPreview ? 'justify-start' : 'justify-center'} ${gapClass} ${isPreview && hasActivityImage ? 'w-full' : ''}`}>
            <div className="relative flex-shrink-0">
              <div className={`${avatarSizeClass} rounded-lg border-2 border-card overflow-hidden bg-muted`}>
                {isLoading ? (
                  <div className="w-full h-full animate-pulse bg-muted" />
                ) : (
                  <img
                    src={userData?.user?.avatar_url || "/placeholder.svg"}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              {/* Inset to avoid bleeding outside the card due to border thickness */}
              <span className={`absolute bottom-0.5 left-0.5 w-3 h-3 ${getStatusColor()} rounded-full border-2 border-card`} />
            </div>
            
            <div className={isPreview ? 'text-left flex-1 min-w-0 pr-0' : 'text-center'}>
              {isLoading ? (
                <div className="space-y-1.5">
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                </div>
              ) : error ? (
                <div className="space-y-1">
                  <p className="text-destructive text-xs">{error}</p>
                  <p className="text-xs text-muted-foreground">Discord não disponível</p>
                </div>
              ) : userData ? (
                <>
                  <div className="flex items-center gap-1.5 mb-1">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {userData.user?.global_name || userData.user?.username || "Usuário Discord"}
                    </h3>
                    {/* Badges - Beside name when has presence */}
                    {userData.badges && userData.badges.length > 0 && activities.length > 0 && (
                      <div className="flex gap-1 flex-shrink-0">
                        {userData.badges.slice(0, 5).map((badge) => (
                          <img
                            key={badge.id}
                            src={getBadgeIcon(badge)}
                            alt={badge.description}
                            title={badge.description}
                            className="w-4 h-4"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Badges - Below name when no presence */}
                  {userData.badges && userData.badges.length > 0 && activities.length === 0 && (
                    <div className="flex gap-1 mb-1">
                      {userData.badges.slice(0, 5).map((badge) => (
                        <img
                          key={badge.id}
                          src={getBadgeIcon(badge)}
                          alt={badge.description}
                          title={badge.description}
                          className="w-4 h-4"
                        />
                      ))}
                    </div>
                  )}
                  {/* Rich Presence Activity */}
                  {primaryActivity && (
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground break-words">
                        {primaryActivity.type === 4 ? (
                          <span className="font-semibold text-foreground">{primaryActivity.details || primaryActivity.name}</span>
                        ) : (
                          <>
                            {getActivityType(primaryActivity.type)}{' '}
                            {primaryActivity.details ? (
                              <span className="font-semibold text-foreground">{primaryActivity.details}</span>
                            ) : (
                              primaryActivity.name
                            )}
                          </>
                        )}
                      </p>
                      {primaryActivity.state && (
                        <p className="text-xs text-muted-foreground break-words">
                          {primaryActivity.state}
                        </p>
                      )}
                    </div>
                  )}
                  {/* Show status when no activities */}
                  {activities.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      {userData.presence?.status === 'online' ? 'Online' :
                       userData.presence?.status === 'idle' ? 'Ausente' :
                       userData.presence?.status === 'dnd' ? 'Ocupado' :
                       'Offline'}
                    </p>
                  )}
                </>
              ) : null}
            </div>
            
            {/* Activity Image - Right side */}
            {primaryActivity?.assets?.large_image && (
              <div className={`${activityImageSizeClass} shrink-0 rounded-lg overflow-hidden bg-muted border border-card ${isPreview ? 'ml-0 mr-2' : ''}`}>
                <img
                  src={primaryActivity.assets.large_image}
                  alt={primaryActivity.assets.large_text ?? "Activity"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DiscordStatusCard;