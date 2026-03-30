import { Layout } from "@/components/layout";
import { WorldMap } from "@/components/world-map";
import { useGetStats } from "@workspace/api-client-react";
import { motion } from "framer-motion";

export default function AtlasPage() {
  const { data: stats } = useGetStats({ query: { queryKey: ["stats"] } });

  return (
    <Layout>
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-foreground tracking-tight">
            The Atlas
          </h1>
          <p className="text-lg text-muted-foreground font-serif italic max-w-2xl">
            Every pin is a story. Click one to read it.
          </p>
        </motion.div>

        {stats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex flex-wrap gap-8"
          >
            {[
              { value: stats.totalCountries, label: "Countries" },
              { value: stats.continents, label: "Continents" },
              { value: stats.totalCities, label: "Cities" },
              { value: stats.totalPosts, label: "Dispatches" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <span className="block text-3xl font-serif font-bold text-primary">{value}</span>
                <span className="text-xs uppercase font-mono tracking-widest text-muted-foreground">{label}</span>
              </div>
            ))}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
        >
          <WorldMap />
        </motion.div>
      </div>
    </Layout>
  );
}
