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
    <section className="py-24 px-4 relative">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Recursos
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Tudo o que você precisa
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Todas as ferramentas para criar a bio perfeita para o Discord
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-border transition-all duration-300"
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}>
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-foreground font-semibold mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
