import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Gamepad2, MessageCircle, Music, Trophy, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileCardDemo } from "@/components/home/ProfileCardDemo";

const discordFeatures = [
  { icon: MessageCircle, label: "OAuth do Discord" },
  { icon: Users, label: "Vincular servidor" },
  { icon: Gamepad2, label: "Estatísticas de jogos" },
  { icon: Music, label: "Integração com Spotify" },
  { icon: Trophy, label: "Badges de conquistas" },
  { icon: Zap, label: "Status em tempo real" },
];

export function AnimatedProfilePreview() {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-gradient-to-r from-white/10 via-white/5 to-transparent blur-[100px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content (moved from DiscordSection) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/50 border border-border/50 text-foreground text-sm font-medium mb-6">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
              </svg>
              Feito para o Discord
            </span>

            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              A página de bio que o seu
              <br />
              <span className="text-foreground">Discord</span> merece
            </h2>

            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Finalmente, uma página de bio que entende a comunidade do Discord. Conecte sua conta, mostre seus cargos no servidor, exiba suas estatísticas de jogos e deixe sua personalidade brilhar.
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              {discordFeatures.map((feature) => (
                <div
                  key={feature.label}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 text-sm text-muted-foreground"
                >
                  <feature.icon className="w-4 h-4" />
                  {feature.label}
                </div>
              ))}
            </div>

            <Link to="/register">
              <Button className="gap-2 bg-primary text-primary-foreground hover:opacity-90">
                Conectar com Discord
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>

          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="max-w-lg mx-auto">
              <ProfileCardDemo className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
