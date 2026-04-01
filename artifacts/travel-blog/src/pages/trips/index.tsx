import { Layout } from "@/components/layout";
import { TravelTimeline } from "@/components/travel-timeline";

export default function TripsPage() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-12">
        <header className="text-center space-y-6 border-b pb-12">
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-foreground tracking-tight">The Passport</h1>
          <p className="text-xl text-muted-foreground font-serif italic max-w-2xl mx-auto leading-relaxed">
            A chronological record of borders crossed, timezones shifted, and familiar strangers met along the way.
          </p>
        </header>

        <TravelTimeline showFilters={true} />
      </div>
    </Layout>
  );
}
