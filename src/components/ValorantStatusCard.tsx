import { motion } from "framer-motion";
import { getRankImageUrl, tierToRankName } from "@/lib/ranks";
import { useValorantData } from "@/hooks/useValorantData";
import { ExternalLink } from "lucide-react";

interface ValorantStatusCardProps {
  valorantName: string | null;
  valorantTag: string | null;
  valorantPuuid?: string | null;
  region?: string;
  platform?: string;
  variant?: 'profile' | 'preview' | 'sidebar';
}

const ValorantStatusCard = ({ valorantName, valorantTag, valorantPuuid, region = "br", platform = "pc", variant = 'profile' }: ValorantStatusCardProps) => {
  const { mmrData, isLoading, error } = useValorantData(valorantName, valorantTag, valorantPuuid || null, region, platform);

  if (!valorantName || !valorantTag) return null;

  const isPreview = variant === 'preview';
  const isSidebar = variant === 'sidebar';
  const currentTier = mmrData?.current?.tier;
  const rankName = currentTier ? tierToRankName(currentTier.id) : null;
  const rankImage = currentTier ? getRankImageUrl(currentTier.id) : null;
  const rankBoxClass = isSidebar ? "w-16 h-16" : (isPreview ? "w-[72px] h-[72px]" : "w-16 h-16");
  const accountLevel = mmrData?.account?.level;
  
  // Gera o link do tracker.gg
  const trackerUrl = `https://tracker.gg/valorant/profile/riot/${encodeURIComponent(valorantName)}%23${encodeURIComponent(valorantTag)}/overview`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={variant === 'preview' || variant === 'sidebar' ? "w-full" : "mb-6 mx-auto"}
      style={{
        width: variant === 'preview' || variant === 'sidebar' ? '100%' : 'fit-content',
        maxWidth: variant === 'preview' || variant === 'sidebar' ? '100%' : '100%',
      }}
    >
      <div className={`bg-secondary/50 backdrop-blur-sm border border-border/50 shadow-sm rounded-xl w-full ${(isPreview || isSidebar) ? 'p-2' : 'p-4'}`}>
        <div className={`flex items-center ${(isPreview || isSidebar) ? 'gap-2.5' : 'gap-4'}`}>
          {/* Rank Image */}
          {isLoading ? (
            <div className={`${rankBoxClass} rounded-lg bg-muted animate-pulse shrink-0`} />
          ) : rankImage ? (
            <div className={`${rankBoxClass} rounded-lg overflow-hidden bg-muted flex items-center justify-center shrink-0`}>
              <img
                src={rankImage}
                alt={rankName || "Rank"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          ) : (
            <div className={`${rankBoxClass} rounded-lg bg-muted flex items-center justify-center shrink-0`}>
              <span className="text-2xl">?</span>
            </div>
          )}

          {/* Player Info */}
          <div className="flex-1 min-w-0 text-left">
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                <div className="h-3 w-24 bg-muted rounded animate-pulse" />
              </div>
            ) : error ? (
              <div className="space-y-1">
                <p className="text-destructive text-xs">{error}</p>
                <p className="text-xs text-muted-foreground">Valorant não disponível</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-foreground truncate">
                    {valorantName}#{valorantTag}
                  </h3>
                </div>
                <div className="space-y-0.5">
                  {accountLevel !== undefined && (
                    <p className="text-xs text-muted-foreground">
                      Nível {accountLevel}
                    </p>
                  )}
                  {rankName && (
                    <p className="text-xs text-muted-foreground">
                      {rankName}
                      {mmrData?.current?.rr !== undefined && ` • ${mmrData.current.rr} RR`}
                    </p>
                  )}
                  {!rankName && currentTier && (
                    <p className="text-xs text-muted-foreground">
                      {currentTier.name}
                      {mmrData?.current?.rr !== undefined && ` • ${mmrData.current.rr} RR`}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Visualizar Perfil Button */}
        {!isLoading && !error && !isPreview && !isSidebar && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <a
              href={trackerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-medium text-foreground bg-primary/10 hover:bg-primary/20 border border-border/50 rounded-lg transition-colors"
            >
              <span>Visualizar Perfil</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ValorantStatusCard;

