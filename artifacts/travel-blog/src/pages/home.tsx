import React from "react";
import { Layout } from "@/components/layout";
import { WorldMap } from "@/components/world-map";
import { TravelTimeline } from "@/components/travel-timeline";
import { useGetStats } from "@workspace/api-client-react";
import { motion } from "framer-motion";

export default function Home() {
  const { data: stats } = useGetStats({ query: { queryKey: ["stats"] } });

  return (
    <Layout>
      <div className="space-y-20">
        <section className="space-y-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto space-y-6"
          >
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-foreground tracking-tight leading-tight">
              Mapping the World, <br/>
              <span className="text-secondary italic font-light">One Story at a Time</span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl font-sans leading-relaxed max-w-2xl mx-auto">
              A collection of dispatches from dusty roads, night trains, and unfamiliar shores. 
              Here is everywhere I've been.
            </p>
          </motion.div>

          {stats && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap justify-center gap-12 py-8 border-y border-border/50 bg-card/30 rounded-2xl"
            >
              <div className="text-center">
                <span className="block text-4xl font-serif font-bold text-primary mb-1">{stats.totalCountries}</span>
                <span className="text-xs uppercase font-mono tracking-widest text-muted-foreground">Countries</span>
              </div>
              <div className="text-center hidden md:block">
                <span className="block text-4xl font-serif font-bold text-primary mb-1">{stats.continents}</span>
                <span className="text-xs uppercase font-mono tracking-widest text-muted-foreground">Continents</span>
              </div>
              <div className="text-center">
                <span className="block text-4xl font-serif font-bold text-primary mb-1">{stats.totalPosts}</span>
                <span className="text-xs uppercase font-mono tracking-widest text-muted-foreground">Dispatches</span>
              </div>
            </motion.div>
          )}

          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
          >
            <WorldMap />
          </motion.div>
        </section>

        <section className="max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-serif font-bold text-foreground">The Journey Unfolds</h2>
            <p className="text-lg text-muted-foreground font-serif italic">A chronological record of stamps in the passport.</p>
          </div>
          <TravelTimeline />
        </section>
      </div>
    </Layout>
  );
}
