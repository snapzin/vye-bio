import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Crown, 
  CheckCircle2, 
  Sparkles, 
  Shield, 
  Zap, 
  Star,
  ArrowRight,
  X,
  Infinity,
  Gift,
  Heart,
  TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const premiumFeatures = [
  {
    icon: Crown,
    title: "Ocultar Footer",
    description: "Remova o footer 'vye.bio' do final da sua página de perfil para uma experiência totalmente personalizada",
    gradient: "from-yellow-500 to-orange-500"
  },
  {
    icon: Sparkles,
    title: "Badges Exclusivos",
    description: "Acesse badges premium exclusivos e raros para mostrar no seu perfil e destacar-se",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    icon: Zap,
    title: "Personalização Avançada",
    description: "Recursos adicionais de personalização, estilos de card e opções de customização avançadas",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    icon: Shield,
    title: "Suporte Prioritário",
    description: "Receba suporte prioritário da nossa equipe com resposta garantida em até 24 horas",
    gradient: "from-green-500 to-emerald-500"
  },
  {
    icon: Star,
    title: "Recursos Futuros",
    description: "Acesso antecipado a novos recursos e funcionalidades antes de serem lançados publicamente",
    gradient: "from-indigo-500 to-purple-500"
  },
  {
    icon: Gift,
    title: "Benefícios Exclusivos",
    description: "Acesso a eventos exclusivos, sorteios e oportunidades especiais apenas para membros Premium",
    gradient: "from-rose-500 to-pink-500"
  }
];

const comparisonFeatures = [
  { feature: "Links ilimitados", free: true, premium: true },
  { feature: "Música no perfil", free: true, premium: true },
  { feature: "Badges colecionáveis", free: true, premium: true },
  { feature: "Fundos personalizados", free: true, premium: true },
  { feature: "Ocultar footer 'vye.bio'", free: false, premium: true },
  { feature: "Badges exclusivos Premium", free: false, premium: true },
  { feature: "Personalização avançada", free: false, premium: true },
  { feature: "Suporte prioritário", free: false, premium: true },
  { feature: "Acesso antecipado a recursos", free: false, premium: true },
];

export default function Premium() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGetPremium = () => {
    if (user) {
      navigate("/dashboard?tab=premium");
    } else {
      navigate("/register");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-24">
          {/* Background Effects */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-background" />
            {/* Gradient orbs */}
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-yellow-500/20 blur-[150px] rounded-full" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-orange-500/15 blur-[150px] rounded-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-pink-500/10 blur-[120px] rounded-full" />
            {/* Grid pattern */}
            <div 
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
                backgroundSize: '60px 60px'
              }}
            />
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-8"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-sm text-yellow-500 font-medium">
                  <Crown className="w-4 h-4" />
                  Premium
                </span>
              </motion.div>

              {/* Headline */}
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[0.95]">
                <span className="text-foreground">Desbloqueie o</span>
                <br />
                <span className="bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 bg-clip-text text-transparent">
                  Poder Premium
                </span>
              </h1>

              {/* Subheadline */}
              <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed">
                Recursos exclusivos para personalizar ainda mais seu perfil e destacar-se da multidão.
                Transforme sua página em algo verdadeiramente único.
              </p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
              >
                <Button
                  size="lg"
                  onClick={handleGetPremium}
                  className="w-full sm:w-auto h-14 px-8 gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold"
                >
                  <Crown className="w-5 h-5" />
                  {user ? "Gerenciar Premium" : "Começar Agora"}
                  <ArrowRight className="w-5 h-5" />
                </Button>
                {!user && (
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="w-full sm:w-auto h-14 px-8"
                  >
                    <Link to="/login">Já tenho conta</Link>
                  </Button>
                )}
              </motion.div>

              {/* Social Proof */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="flex flex-col items-center gap-4 pt-8"
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                  <span className="text-sm">
                    Mais de <span className="text-foreground font-medium">1.000</span> usuários Premium
                  </span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
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
                Recursos Exclusivos
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                Tudo o que você precisa
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Recursos premium projetados para elevar sua experiência
              </p>
            </motion.div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {premiumFeatures.map((feature, index) => (
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

        {/* Comparison Section */}
        <section className="py-24 px-4 bg-muted/30">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                Compare os planos
              </h2>
              <p className="text-muted-foreground text-lg">
                Veja a diferença entre o plano gratuito e Premium
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="border-border/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left p-4 font-semibold text-foreground">Recurso</th>
                        <th className="text-center p-4 font-semibold text-foreground">Gratuito</th>
                        <th className="text-center p-4 font-semibold text-foreground bg-gradient-to-br from-yellow-500/10 to-orange-500/10">
                          <div className="flex items-center justify-center gap-2">
                            <Crown className="w-4 h-4 text-yellow-500" />
                            Premium
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonFeatures.map((item, index) => (
                        <tr 
                          key={item.feature}
                          className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="p-4 text-foreground">{item.feature}</td>
                          <td className="p-4 text-center">
                            {item.free ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-muted-foreground mx-auto" />
                            )}
                          </td>
                          <td className="p-4 text-center bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
                            {item.premium ? (
                              <CheckCircle2 className="w-5 h-5 text-yellow-500 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-muted-foreground mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-24 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
                Preços
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                Planos Premium
              </h2>
              <p className="text-muted-foreground text-lg">
                Escolha o plano que melhor se adapta a você
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Free Plan */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <Card className="h-full border-border/50">
                  <CardHeader>
                    <CardTitle className="text-2xl text-foreground">Gratuito</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-foreground">R$ 0</span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {comparisonFeatures.filter(f => f.free).map((feature) => (
                        <li key={feature.feature} className="flex items-center gap-3">
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-foreground">{feature.feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant="outline"
                      className="w-full mt-6"
                      asChild
                    >
                      <Link to="/register">Começar Grátis</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Premium Plan */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <Card className="h-full border-2 border-yellow-500/50 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 relative overflow-hidden">
                  {/* Popular Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-500 text-xs font-medium">
                      <Star className="w-3 h-3" />
                      Popular
                    </span>
                  </div>
                  
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="w-5 h-5 text-yellow-500" />
                      <CardTitle className="text-2xl text-foreground">Premium</CardTitle>
                    </div>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-foreground">R$ 5,00</span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {comparisonFeatures.map((feature) => (
                        <li key={feature.feature} className="flex items-center gap-3">
                          <CheckCircle2 className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                          <span className="text-sm text-foreground">{feature.feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={handleGetPremium}
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white mt-6"
                      size="lg"
                    >
                      <Crown className="w-5 h-5 mr-2" />
                      {user ? "Gerenciar Premium" : "Começar Agora"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-4 relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[600px] h-[600px] bg-yellow-500/10 rounded-full blur-[150px]" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative z-10 max-w-2xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 mb-6">
              <TrendingUp className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Aumente sua presença online</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Pronto para se destacar?
            </h2>

            <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
              Junte-se a milhares de usuários que já desbloquearam o Premium e transformaram seus perfis.
            </p>

            <Button
              onClick={handleGetPremium}
              size="xl"
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white gap-2"
            >
              <Crown className="w-5 h-5" />
              {user ? "Gerenciar Premium" : "Começar Agora"}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
