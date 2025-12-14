import { motion } from "framer-motion";

const stats = [
  { value: "50K+", label: "Usuários ativos" },
  { value: "2M+", label: "Visualizações de perfil" },
  { value: "100K+", label: "Links criados" },
  { value: "99.9%", label: "Disponibilidade" },
];

export function StatsSection() {
  return (
    <section className="py-16 px-4 border-y border-border/50">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <p className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
