import { Layout } from "@/components/layout";
import { TravelTimeline } from "@/components/travel-timeline";
import { useI18n } from "@/lib/i18n";

export default function TripsPage() {
  const { t } = useI18n();
  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="text-center space-y-6 border-b pb-12">
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-foreground tracking-tight">{t("passportTitle")}</h1>
          <p className="text-xl text-muted-foreground font-serif italic max-w-2xl mx-auto leading-relaxed">
            {t("passportSubtitle")}
          </p>
        </header>

        <TravelTimeline showFilters={true} />
      </div>
    </Layout>
  );
}
