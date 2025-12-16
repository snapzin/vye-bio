import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 sm:py-32 px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[600px] h-[600px] bg-glow/10 rounded-full blur-[150px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="relative z-10 max-w-2xl mx-auto text-center"
      >
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/10 mb-4 sm:mb-6">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-glow" />
          <span className="text-xs sm:text-sm text-muted-foreground">Grátis para sempre</span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 sm:mb-6 px-4">
          Pronto para se destacar?
        </h2>

        <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-lg mx-auto px-4">
          Crie sua página de bio em segundos. Sem cartão de crédito.
        </p>

        <Link to="/register">
          <Button variant="hero" size="xl" className="gap-2 text-sm sm:text-base">
            Criar minha página
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </Link>
      </motion.div>
    </section>
  );
}
