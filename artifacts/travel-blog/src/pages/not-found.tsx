import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Compass } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";

export default function NotFound() {
  const { t } = useI18n();
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
          <h1 className="text-5xl font-serif font-bold text-foreground">{t("notFoundTitle")}</h1>
          <p className="text-xl text-muted-foreground font-serif italic leading-relaxed">
            {t("notFoundBody")}
          </p>
        </div>

        <Link href="/" className="inline-flex items-center justify-center px-8 py-3.5 bg-primary text-primary-foreground font-bold uppercase tracking-wider text-sm rounded-lg hover:bg-primary/90 transition-colors shadow-sm mt-8">
          {t("returnBasecamp")}
        </Link>
      </div>
    </Layout>
  );
}
