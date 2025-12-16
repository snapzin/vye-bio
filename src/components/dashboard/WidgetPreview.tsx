import DiscordStatusCard from "@/components/DiscordStatusCard";
import ValorantStatusCard from "@/components/ValorantStatusCard";
import { type Profile } from "@/hooks/useProfile";

interface WidgetPreviewProps {
  widgetType: 'discord' | 'valorant' | 'roblox';
  profile: Profile | null;
}

export function WidgetPreview({ widgetType, profile }: WidgetPreviewProps) {
  if (!profile) return null;

  return (
    <div className="w-full flex items-center justify-center">
      <div className="flex items-center justify-center">
        {widgetType === 'discord' && profile.discord_user_id && (
          <DiscordStatusCard discordUserId={profile.discord_user_id} variant="preview" />
        )}
        {widgetType === 'valorant' && profile.valorant_name && profile.valorant_tag && (
          <ValorantStatusCard
            valorantName={profile.valorant_name}
            valorantTag={profile.valorant_tag}
            valorantPuuid={profile.valorant_puuid}
            region="br"
            platform="pc"
            variant="preview"
          />
        )}
        {widgetType === 'roblox' && (
          <div className="bg-secondary/50 backdrop-blur-sm border border-border/50 shadow-sm rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                <span className="text-2xl">🎮</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground">Roblox</h3>
                <p className="text-xs text-muted-foreground">Em breve</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

