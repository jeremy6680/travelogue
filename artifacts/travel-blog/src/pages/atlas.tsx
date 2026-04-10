import { Layout } from "@/components/layout";
import { WorldMap } from "@/components/world-map";
import { useStatsQuery } from "@/lib/directus";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";

export default function AtlasPage() {
  const { t } = useI18n();
  const { data: stats } = useStatsQuery();

  return (
    <Layout>
      <div className="space-y-8">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 border-b pb-12"
        >
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-foreground tracking-tight">{t("atlasTitle")}</h1>
          <p className="text-xl text-muted-foreground font-serif italic max-w-2xl mx-auto leading-relaxed">
            {t("atlasSubtitle")}
          </p>
        </motion.header>

        {stats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex flex-wrap gap-8 justify-center"
          >
            {[
              { value: stats.totalTrips, label: t("statTrips") },
              { value: stats.continents, label: t("statContinents") },
              { value: stats.totalCountries, label: t("statCountries") },
              { value: stats.totalCities, label: t("statCities") },
              { value: stats.totalPosts, label: t("statDispatches") },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <span className="block text-3xl font-serif font-bold text-primary">
                  {value}
                </span>
                <span className="text-xs uppercase font-mono tracking-widest text-muted-foreground">
                  {label}
                </span>
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
