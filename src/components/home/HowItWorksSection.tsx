import { motion } from "framer-motion";
import { UserPlus, Palette, Share2, Sparkles } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: UserPlus,
    title: "Crie sua conta",
    description: "Cadastre-se em segundos com e-mail ou Discord. Garanta seu nome de usuário único.",
    color: "from-zinc-700 to-zinc-900"
  },
  {
    step: "02", 
    icon: Palette,
    title: "Personalize tudo",
    description: "Adicione avatar, fundo, música, links e badges. Deixe com a sua cara.",
    color: "from-zinc-700 to-zinc-900"
  },
  {
    step: "03",
    icon: Share2,
    title: "Compartilhe seu link",
    description: "Coloque seu vye.bio na bio do Discord, apresentações do servidor e onde você estiver.",
    color: "from-zinc-700 to-zinc-900"
  },
  {
    step: "04",
    icon: Sparkles,
    title: "Destaque-se",
    description: "Veja suas visualizações crescerem. Ganhe badges. Construa sua presença.",
    color: "from-zinc-700 to-zinc-900"
  }
];

export function HowItWorksSection() {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-accent/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Como funciona
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Pronto em minutos
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Sem configuração complicada. É só criar, personalizar e compartilhar.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-px bg-gradient-to-r from-border to-transparent z-0" />
              )}

              <div className="p-6 rounded-2xl bg-card border border-border/50 hover:border-border transition-all duration-300 relative z-10">
                {/* Step number */}
                <span className="text-xs font-bold text-muted-foreground/50 tracking-wider">
                  ETAPA {item.step}
                </span>

                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mt-3 mb-4`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
