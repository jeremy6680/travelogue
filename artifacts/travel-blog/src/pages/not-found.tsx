import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Compass } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="text-muted-foreground/20"
        >
          <Compass className="w-40 h-40" />
        </motion.div>
        
        <div className="space-y-4 max-w-lg">
          <h1 className="text-5xl font-serif font-bold text-foreground">Off the Map</h1>
          <p className="text-xl text-muted-foreground font-serif italic leading-relaxed">
            It seems we've wandered into uncharted territory. The page you're looking for doesn't exist or has been lost to time.
          </p>
        </div>

        <Link href="/" className="inline-flex items-center justify-center px-8 py-3.5 bg-primary text-primary-foreground font-bold uppercase tracking-wider text-sm rounded-lg hover:bg-primary/90 transition-colors shadow-sm mt-8">
          Return to Basecamp
        </Link>
      </div>
    </Layout>
  );
}
