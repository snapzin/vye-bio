import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "O vye.bio é grátis para usar?",
    answer: "Sim! O vye.bio é totalmente gratuito. Você pode criar seu perfil, adicionar links ilimitados, personalizar seu fundo e ganhar badges sem pagar nada."
  },
  {
    question: "Como conecto minha conta do Discord?",
    answer: "Ao se cadastrar, você pode escolher autenticar com o Discord. Isso importa automaticamente seu avatar e nome de exibição, além de habilitar recursos específicos do Discord."
  },
  {
    question: "Posso adicionar música ao meu perfil?",
    answer: "Com certeza! Você pode adicionar qualquer música ao seu perfil. Basta informar o título e o artista e, se quiser, linkar Spotify ou SoundCloud para reprodução."
  },
  {
    question: "Como funcionam os badges?",
    answer: "Badges são conquistas que você ganha ao usar a plataforma. Ganhe visualizações no perfil, adicione links, personalize sua página — cada marco desbloqueia um novo badge para exibir."
  },
  {
    question: "Meus dados estão seguros?",
    answer: "Levamos privacidade a sério. Seus dados são criptografados e nós nunca compartilhamos suas informações pessoais. Você controla o que fica visível no seu perfil público."
  },
  {
    question: "Posso usar um domínio personalizado?",
    answer: "Domínios personalizados chegam em breve! Por enquanto, seu perfil fica disponível em vye.bio/seunome."
  }
];

export function FAQSection() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            FAQ
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Perguntas? Respostas.
          </h2>
          <p className="text-muted-foreground text-lg">
            Tudo o que você precisa saber sobre o vye.bio
          </p>
        </motion.div>

        {/* Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border border-border/50 rounded-xl px-5 bg-card data-[state=open]:border-accent/30 transition-colors"
              >
                <AccordionTrigger className="text-foreground text-left font-medium hover:no-underline py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
