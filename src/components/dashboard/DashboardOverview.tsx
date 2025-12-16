import { useProfile, useUserLinks, useUserBadges } from "@/hooks/useProfile";
import { Eye, Link2, Award, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export function DashboardOverview() {
  const { profile } = useProfile();
  const { links } = useUserLinks();
  const { badges } = useUserBadges();

  const totalClicks = links.reduce((acc, link) => acc + (link.clicks_count || 0), 0);

  const stats = [
    {
      label: "Visualizações do perfil",
      value: profile?.views_count || 0,
      icon: Eye,
      color: "from-zinc-700 to-zinc-900"
    },
    {
      label: "Total de links",
      value: links.length,
      icon: Link2,
      color: "from-zinc-700 to-zinc-900"
    },
    {
      label: "Cliques nos links",
      value: totalClicks,
      icon: TrendingUp,
      color: "from-zinc-700 to-zinc-900"
    },
    {
      label: "Badges conquistados",
      value: badges.length,
      icon: Award,
      color: "from-zinc-700 to-zinc-900"
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">
          Bem-vindo de volta, {profile?.display_name || profile?.username}! 👋
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Veja como seu perfil está indo
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            className="p-4 sm:p-6 md:p-7 rounded-xl sm:rounded-2xl glass border border-white/10 hover:border-white/20 transition-colors shadow-sm hover:shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 sm:mb-4`}>
              <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1 sm:mt-2">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div 
        className="p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl glass border border-white/10 shadow-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="font-semibold text-base sm:text-lg text-foreground mb-4 sm:mb-5">Dicas rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs sm:text-sm">✨</span>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-foreground">Complete seu perfil</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Adicione uma bio e uma foto para destacar sua página</p>
            </div>
          </div>
          <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-secondary/50">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs sm:text-sm">🔗</span>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-foreground">Adicione seus links</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Conecte seu Discord, Twitter e outras redes</p>
            </div>
          </div>
          <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-secondary/50">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs sm:text-sm">🎵</span>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-foreground">Defina sua vibe</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Adicione uma música ao seu perfil para mostrar seu gosto</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
