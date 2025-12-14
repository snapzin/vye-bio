import { motion } from "framer-motion";
import { 
  Palette, 
  Music, 
  Award, 
  Link2, 
  Video, 
  Sparkles,
  Shield,
  Smartphone
} from "lucide-react";

const features = [
  {
    icon: Palette,
    title: "Fundos personalizados",
    description: "Imagens, gradientes ou GIFs. Deixe sua página com a sua cara.",
    gradient: "from-zinc-700 to-zinc-900"
  },
  {
    icon: Music,
    title: "Música no perfil",
    description: "Defina o clima com suas faixas favoritas em loop.",
    gradient: "from-zinc-700 to-zinc-900"
  },
  {
    icon: Award,
    title: "Badges colecionáveis",
    description: "Ganhe conquistas no estilo Discord e mostre na sua página.",
    gradient: "from-zinc-700 to-zinc-900"
  },
  {
    icon: Link2,
    title: "Links ilimitados",
    description: "Todas as suas redes, servidores e conteúdo em um só lugar.",
    gradient: "from-zinc-700 to-zinc-900"
  },
  {
    icon: Video,
    title: "Clipes de vídeo",
    description: "Incorpore seus melhores clipes e montagens.",
    gradient: "from-zinc-700 to-zinc-900"
  },
  {
    icon: Sparkles,
    title: "Animações suaves",
    description: "Efeitos sutis que deixam sua página com cara de premium.",
    gradient: "from-zinc-700 to-zinc-900"
  },
  {
    icon: Shield,
    title: "Controles de privacidade",
    description: "Escolha o que mostrar e quem pode ver.",
    gradient: "from-zinc-700 to-zinc-900"
  },
  {
    icon: Smartphone,
    title: "Perfeito no mobile",
    description: "Fica incrível em qualquer dispositivo, em qualquer tela.",
    gradient: "from-zinc-700 to-zinc-900"
  }
];

export function FeaturesSection() {
  return (
    <section className="py-16 sm:py-24 px-4 relative">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-accent/10 text-accent text-xs sm:text-sm font-medium mb-3 sm:mb-4">
            Recursos
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground mb-3 sm:mb-4">
            Tudo o que você precisa
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-xl mx-auto px-4">
            Todas as ferramentas para criar a bio perfeita para o Discord
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="group p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-card border border-border/50 hover:border-border transition-all duration-300"
            >
              <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-3 sm:mb-4`}>
                <feature.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h3 className="text-sm sm:text-base text-foreground font-semibold mb-1.5 sm:mb-2">
                {feature.title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
