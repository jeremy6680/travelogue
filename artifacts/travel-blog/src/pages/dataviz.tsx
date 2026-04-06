import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Scatter,
  ScatterChart,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { BarChart3, Globe, Grid3X3, TrendingUp, Users } from "lucide-react";
import { Layout } from "@/components/layout";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useJourneysQuery, usePostsQuery, useTripsQuery } from "@/lib/directus";
import { useI18n } from "@/lib/i18n";
import {
  CONTINENT_OPTIONS,
  formatAccomodationLabel,
  formatTravelReasonLabel,
  formatTransportLabel,
  getContinentKey,
} from "@/lib/trip-options";
import { getTripAnalyticsPoints } from "@/lib/travel-analytics";

const CHART_COLORS = [
  "#2563eb",
  "#f97316",
  "#0f766e",
  "#7c3aed",
  "#db2777",
  "#65a30d",
  "#dc2626",
  "#0891b2",
];

const MONTHS = Array.from({ length: 12 }, (_, index) => index);

function getHeatmapIntensity(value: number, maxValue: number) {
  if (value <= 0 || maxValue <= 0) {
    return "bg-muted/40 text-muted-foreground";
  }

  const ratio = value / maxValue;
  if (ratio >= 0.8) return "bg-primary text-primary-foreground";
  if (ratio >= 0.55) return "bg-primary/80 text-primary-foreground";
  if (ratio >= 0.3) return "bg-primary/55 text-foreground";
  return "bg-primary/20 text-foreground";
}

function getFacetOptions(values: string[][], locale: string) {
  const counts = new Map<string, number>();

  for (const group of values) {
    for (const value of new Set(group.map((item) => item.trim()).filter(Boolean))) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((left, right) => {
      if (right.count !== left.count) return right.count - left.count;
      return left.value.localeCompare(right.value, locale);
    });
}

export default function DataVizPage() {
  const { locale, numberLocale, t, formatDate, countryName } = useI18n();
  const { data: trips = [] } = useTripsQuery();
  const { data: journeys = [] } = useJourneysQuery();
  const { data: posts = [] } = usePostsQuery();
  const [filterZone, setFilterZone] = useState("all");
  const [filterCountry, setFilterCountry] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [filterCompanion, setFilterCompanion] = useState("all");
  const [filterReason, setFilterReason] = useState("all");
  const [filterTransport, setFilterTransport] = useState("all");

  const zoneOptions = useMemo(() => {
    const counts = new Map<string, number>();

    for (const trip of trips) {
      const countryCode = trip.countryCode.toUpperCase();
      counts.set("france", countryCode === "FR" ? (counts.get("france") ?? 0) + 1 : counts.get("france") ?? 0);
      counts.set(
        "international",
        countryCode !== "FR"
          ? (counts.get("international") ?? 0) + 1
          : (counts.get("international") ?? 0),
      );

      const continentKey = getContinentKey(trip.countryCode);
      if (continentKey) {
        const value = `continent:${continentKey}`;
        counts.set(value, (counts.get(value) ?? 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .filter(([, count]) => count > 0)
      .map(([value, count]) => {
        if (value === "france") {
          return { value, label: `${t("france")} (${count})` };
        }
        if (value === "international") {
          return { value, label: `${t("international")} (${count})` };
        }
        const continentKey = value.replace("continent:", "") as keyof typeof CONTINENT_OPTIONS;
        return {
          value,
          label: `${CONTINENT_OPTIONS[continentKey].label[locale]} (${count})`,
        };
      });
  }, [locale, t, trips]);

  const countryOptions = useMemo(() => {
    const counts = new Map<string, number>();

    for (const trip of trips) {
      const code = trip.countryCode.toUpperCase();
      counts.set(code, (counts.get(code) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([code, count]) => ({
        value: code,
        label: `${countryName(code)} (${count})`,
      }))
      .sort((left, right) => left.label.localeCompare(right.label, locale));
  }, [countryName, locale, trips]);

  const yearOptions = useMemo(() => {
    const years = new Set<string>();
    for (const trip of trips) {
      years.add(new Date(trip.visitedAt).getFullYear().toString());
    }
    return Array.from(years).sort((left, right) => Number(right) - Number(left));
  }, [trips]);

  const companionOptions = useMemo(
    () => getFacetOptions(trips.map((trip) => trip.travelCompanions), locale),
    [locale, trips],
  );

  const reasonOptions = useMemo(
    () => getFacetOptions(trips.map((trip) => trip.reasonForTravel), locale),
    [locale, trips],
  );

  const transportOptions = useMemo(
    () =>
      getFacetOptions(
        trips.map((trip) => [...trip.transportationTo, ...trip.transportationOnSite]),
        locale,
      ),
    [locale, trips],
  );

  const filteredTrips = useMemo(
    () =>
      trips.filter((trip) => {
        if (filterZone !== "all") {
          const countryCode = trip.countryCode.toUpperCase();
          if (filterZone === "france" && countryCode !== "FR") return false;
          if (filterZone === "international" && countryCode === "FR") return false;
          if (
            filterZone.startsWith("continent:") &&
            getContinentKey(trip.countryCode) !== filterZone.replace("continent:", "")
          ) {
            return false;
          }
        }

        if (filterCountry !== "all" && trip.countryCode.toUpperCase() !== filterCountry) {
          return false;
        }

        if (
          filterYear !== "all" &&
          new Date(trip.visitedAt).getFullYear().toString() !== filterYear
        ) {
          return false;
        }

        if (
          filterCompanion !== "all" &&
          !trip.travelCompanions.includes(filterCompanion)
        ) {
          return false;
        }

        if (filterReason !== "all" && !trip.reasonForTravel.includes(filterReason)) {
          return false;
        }

        if (
          filterTransport !== "all" &&
          ![...trip.transportationTo, ...trip.transportationOnSite].includes(filterTransport)
        ) {
          return false;
        }

        return true;
      }),
    [
      filterCompanion,
      filterCountry,
      filterReason,
      filterTransport,
      filterYear,
      filterZone,
      trips,
    ],
  );

  const analytics = useMemo(() => {
    const tripPoints = getTripAnalyticsPoints(filteredTrips, journeys);
    const filteredTripIds = new Set(filteredTrips.map((trip) => trip.id));
    const postsByTripId = new Map<number, number>();

    for (const post of posts) {
      if (post.tripId == null) continue;
      if (!filteredTripIds.has(post.tripId)) continue;
      postsByTripId.set(post.tripId, (postsByTripId.get(post.tripId) ?? 0) + 1);
    }

    const transportDistance = new Map<
      string,
      { mode: string; distanceKm: number; trips: number }
    >();
    const companionCounts = new Map<string, number>();
    const continentStats = new Map<
      string,
      { continent: string; trips: number; distanceKm: number }
    >();
    const accommodationByYear = new Map<
      number,
      { year: number; total: number; counts: Map<string, number> }
    >();
    const reasonStats = new Map<
      string,
      { reason: string; trips: number; totalDistanceKm: number; totalDurationDays: number }
    >();
    const yearlyDistance = new Map<
      number,
      { year: number; distanceKm: number; trips: number; posts: number }
    >();
    const heatmap = new Map<string, { year: number; month: number; count: number }>();
    const scatterByContinent = new Map<
      string,
      Array<{
        name: string;
        distanceKm: number;
        durationDays: number;
        posts: number;
      }>
    >();

    let totalEstimatedKm = 0;

    for (const point of tripPoints) {
      const { trip, distanceKm, durationDays } = point;
      const year = new Date(trip.visitedAt).getFullYear();
      const month = new Date(trip.visitedAt).getMonth();
      const postsCount = postsByTripId.get(trip.id) ?? 0;
      const continentKey = getContinentKey(trip.countryCode) ?? "other";

      const yearEntry = yearlyDistance.get(year) ?? {
        year,
        distanceKm: 0,
        trips: 0,
        posts: 0,
      };
      yearEntry.trips += 1;
      yearEntry.posts += postsCount;
      if (distanceKm != null) {
        yearEntry.distanceKm += distanceKm;
        totalEstimatedKm += distanceKm;
      }
      yearlyDistance.set(year, yearEntry);

      const heatmapKey = `${year}-${month}`;
      const heatmapEntry = heatmap.get(heatmapKey) ?? { year, month, count: 0 };
      heatmapEntry.count += 1;
      heatmap.set(heatmapKey, heatmapEntry);

      if (trip.countryCode.toUpperCase() !== "FR") {
        const continentEntry = continentStats.get(continentKey) ?? {
          continent: continentKey,
          trips: 0,
          distanceKm: 0,
        };
        continentEntry.trips += 1;
        if (distanceKm != null) {
          continentEntry.distanceKm += distanceKm;
        }
        continentStats.set(continentKey, continentEntry);
      }

      for (const companion of new Set(trip.travelCompanions)) {
        companionCounts.set(companion, (companionCounts.get(companion) ?? 0) + 1);
      }

      const uniqueAccomodations = [...new Set(trip.accomodation.filter(Boolean))];
      if (uniqueAccomodations.length > 0) {
        const yearEntry = accommodationByYear.get(year) ?? {
          year,
          total: 0,
          counts: new Map<string, number>(),
        };
        yearEntry.total += 1;
        for (const accomodation of uniqueAccomodations) {
          yearEntry.counts.set(
            accomodation,
            (yearEntry.counts.get(accomodation) ?? 0) + 1,
          );
        }
        accommodationByYear.set(year, yearEntry);
      }

      const uniqueReasons = [...new Set(trip.reasonForTravel.filter(Boolean))];
      for (const reason of uniqueReasons) {
        const reasonEntry = reasonStats.get(reason) ?? {
          reason,
          trips: 0,
          totalDistanceKm: 0,
          totalDurationDays: 0,
        };
        reasonEntry.trips += 1;
        reasonEntry.totalDurationDays += durationDays;
        if (distanceKm != null) {
          reasonEntry.totalDistanceKm += distanceKm;
        }
        reasonStats.set(reason, reasonEntry);
      }

      const travelModes = [...new Set(trip.transportationTo.filter(Boolean))];
      if (distanceKm != null && travelModes.length > 0) {
        const share = distanceKm / travelModes.length;
        for (const mode of travelModes) {
          const modeEntry = transportDistance.get(mode) ?? {
            mode,
            distanceKm: 0,
            trips: 0,
          };
          modeEntry.distanceKm += share;
          modeEntry.trips += 1;
          transportDistance.set(mode, modeEntry);
        }
      }

      if (distanceKm != null) {
        const scatterEntry = scatterByContinent.get(continentKey) ?? [];
        scatterEntry.push({
          name: trip.name,
          distanceKm,
          durationDays,
          posts: postsCount,
        });
        scatterByContinent.set(continentKey, scatterEntry);
      }
    }

    const monthFormatter = new Intl.DateTimeFormat(numberLocale, { month: "short" });

    const yearlyDistanceRows = Array.from(yearlyDistance.values()).sort(
      (left, right) => left.year - right.year,
    );
    const transportDistanceRows = Array.from(transportDistance.values())
      .sort((left, right) => right.distanceKm - left.distanceKm)
      .slice(0, 8)
      .map((row) => ({
        ...row,
        label: formatTransportLabel(row.mode, locale),
      }));
    const companionRows = Array.from(companionCounts.entries())
      .map(([name, tripsCount]) => ({ name, tripsCount }))
      .sort((left, right) => right.tripsCount - left.tripsCount)
      .slice(0, 8);
    const accommodationKeys = Array.from(
      new Set(
        Array.from(accommodationByYear.values()).flatMap((entry) =>
          Array.from(entry.counts.keys()),
        ),
      ),
    ).sort((left, right) =>
      formatAccomodationLabel(left, locale).localeCompare(
        formatAccomodationLabel(right, locale),
        locale,
      ),
    );
    const accommodationRows = Array.from(accommodationByYear.values())
      .sort((left, right) => left.year - right.year)
      .map((entry) => {
        const row: Record<string, number | string> = {
          year: entry.year,
        };
        for (const key of accommodationKeys) {
          const count = entry.counts.get(key) ?? 0;
          row[key] = entry.total > 0 ? Number(((count / entry.total) * 100).toFixed(1)) : 0;
        }
        return row;
      });
    const continentRows = Array.from(continentStats.values())
      .sort((left, right) => right.trips - left.trips)
      .map((row) => ({
        ...row,
        label:
          row.continent === "other"
            ? locale === "fr"
              ? "Autres"
              : "Other"
            : CONTINENT_OPTIONS[row.continent as keyof typeof CONTINENT_OPTIONS].label[
                locale
              ],
      }));
    const reasonRows = Array.from(reasonStats.values())
      .map((row) => ({
        ...row,
        label: formatTravelReasonLabel(row.reason, locale),
        averageDistanceKm: row.trips > 0 ? row.totalDistanceKm / row.trips : 0,
        averageDurationDays: row.trips > 0 ? row.totalDurationDays / row.trips : 0,
      }))
      .sort((left, right) => right.averageDistanceKm - left.averageDistanceKm);
    const scatterRows = Array.from(scatterByContinent.entries()).map(
      ([continent, values]) => ({
        continent,
        label:
          continent === "other"
            ? locale === "fr"
              ? "Autres"
              : "Other"
            : CONTINENT_OPTIONS[continent as keyof typeof CONTINENT_OPTIONS].label[
                locale
              ],
        values,
      }),
    );

    const years = Array.from(new Set(yearlyDistanceRows.map((entry) => entry.year))).sort(
      (left, right) => right - left,
    );
    const heatmapRows = years.map((year) => ({
      year,
      months: MONTHS.map((month) => {
        const count = heatmap.get(`${year}-${month}`)?.count ?? 0;
        return {
          month,
          label: monthFormatter.format(new Date(Date.UTC(year, month, 1))),
          count,
        };
      }),
    }));
    const maxHeatmapCount = Math.max(
      0,
      ...heatmapRows.flatMap((row) => row.months.map((month) => month.count)),
    );

    return {
      totalEstimatedKm,
      analyzableTrips: tripPoints.filter((point) => point.distanceKm != null).length,
      companionCount: companionCounts.size,
      transportModes: transportDistance.size,
      yearlyDistanceRows,
      transportDistanceRows,
      companionRows,
      accommodationKeys,
      accommodationRows,
      continentRows,
      reasonRows,
      scatterRows,
      heatmapRows,
      maxHeatmapCount,
    };
  }, [filteredTrips, journeys, locale, numberLocale, posts]);

  const transportConfig = Object.fromEntries(
    analytics.transportDistanceRows.map((row, index) => [
      row.mode,
      { label: row.label, color: CHART_COLORS[index % CHART_COLORS.length] },
    ]),
  );

  const continentConfig = Object.fromEntries(
    analytics.continentRows.map((row, index) => [
      row.continent,
      { label: row.label, color: CHART_COLORS[index % CHART_COLORS.length] },
    ]),
  );

  const accommodationConfig = Object.fromEntries(
    analytics.accommodationKeys.map((key, index) => [
      key,
      {
        label: formatAccomodationLabel(key, locale),
        color: CHART_COLORS[index % CHART_COLORS.length],
      },
    ]),
  );

  const reasonConfig = {
    averageDistanceKm: {
      label: t("datavizDistanceAverage"),
      color: "#2563eb",
    },
    averageDurationDays: {
      label: t("datavizDurationAverage"),
      color: "#f97316",
    },
  };

  const scatterConfig = Object.fromEntries(
    analytics.scatterRows.map((row, index) => [
      row.continent,
      { label: row.label, color: CHART_COLORS[index % CHART_COLORS.length] },
    ]),
  );

  const formatDistanceWithDots = (value: number) =>
    `${Math.round(value)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".")} km`;

  const formatRoundedKm = (value: number) =>
    formatDistanceWithDots(value);

  const surfaceCards = [
    {
      title: t("datavizTotalDistance"),
      value: formatRoundedKm(analytics.totalEstimatedKm),
      icon: TrendingUp,
    },
    {
      title: t("datavizTripsAnalyzed"),
      value: analytics.analyzableTrips.toLocaleString(numberLocale),
      icon: BarChart3,
    },
    {
      title: t("datavizCompanionsCount"),
      value: analytics.companionCount.toLocaleString(numberLocale),
      icon: Users,
    },
    {
      title: t("datavizContinentsCount"),
      value: analytics.continentRows.length.toLocaleString(numberLocale),
      icon: Globe,
    },
  ];

  return (
    <Layout>
      <div className="space-y-10">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 border-b pb-12"
        >
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-foreground tracking-tight">
            {t("datavizTitle")}
          </h1>
          <p className="text-xl text-muted-foreground font-serif italic max-w-3xl mx-auto leading-relaxed">
            {t("datavizSubtitle")}
          </p>
        </motion.header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {surfaceCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 * index }}
            >
              <Card className="border-border/60 bg-card/90">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <card.icon className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-serif font-bold text-foreground">
                    {card.value}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </section>

        <section className="flex flex-wrap items-center gap-3">
          <Select value={filterZone} onValueChange={setFilterZone}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder={locale === "fr" ? "Zones" : "Regions"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{locale === "fr" ? "Zones" : "Regions"}</SelectItem>
              {zoneOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterCountry} onValueChange={setFilterCountry}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder={locale === "fr" ? "Voyages" : "Trips"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{locale === "fr" ? "Voyages" : "Trips"}</SelectItem>
              {countryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder={locale === "fr" ? "Années" : "Years"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{locale === "fr" ? "Années" : "Years"}</SelectItem>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterCompanion} onValueChange={setFilterCompanion}>
            <SelectTrigger className="w-44">
              <SelectValue
                placeholder={
                  locale === "fr" ? "Compagnons de route" : "Companions"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {locale === "fr" ? "Compagnons de route" : "Companions"}
              </SelectItem>
              {companionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.value} ({option.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterReason} onValueChange={setFilterReason}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder={locale === "fr" ? "Raisons" : "Reasons"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{locale === "fr" ? "Raisons" : "Reasons"}</SelectItem>
              {reasonOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {formatTravelReasonLabel(option.value, locale)} ({option.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterTransport} onValueChange={setFilterTransport}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder={locale === "fr" ? "Transports" : "Transport"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {locale === "fr" ? "Transports" : "Transport"}
              </SelectItem>
              {transportOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {formatTransportLabel(option.value, locale)} ({option.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(filterZone !== "all" ||
            filterCountry !== "all" ||
            filterYear !== "all" ||
            filterCompanion !== "all" ||
            filterReason !== "all" ||
            filterTransport !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterZone("all");
                setFilterCountry("all");
                setFilterYear("all");
                setFilterCompanion("all");
                setFilterReason("all");
                setFilterTransport("all");
              }}
            >
              {t("clearFilters")}
            </Button>
          )}

          <span className="ml-auto text-sm text-muted-foreground font-mono">
            {filteredTrips.length.toLocaleString(numberLocale)} {t("statTrips").toLowerCase()}
          </span>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>{t("datavizTransportDistance")}</CardTitle>
              <CardDescription>{t("datavizTransportDistanceDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.transportDistanceRows.length > 0 ? (
                <ChartContainer
                  config={transportConfig}
                  className="h-[340px] w-full aspect-auto"
                >
                  <BarChart
                    data={analytics.transportDistanceRows}
                    layout="vertical"
                    margin={{ left: 12, right: 16 }}
                  >
                    <CartesianGrid horizontal={false} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      width={100}
                    />
                    <XAxis type="number" tickLine={false} axisLine={false} />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          hideLabel
                          formatter={(value) => (
                            <>
                              <span className="text-muted-foreground">
                                {t("datavizDistanceSeries")} :
                              </span>
                              <span className="font-mono font-medium tabular-nums text-foreground">
                                {formatRoundedKm(Number(value))}
                              </span>
                            </>
                          )}
                        />
                      }
                    />
                    <Bar dataKey="distanceKm" radius={8}>
                      {analytics.transportDistanceRows.map((row, index) => (
                        <Cell
                          key={row.mode}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              ) : (
                <p className="text-sm text-muted-foreground">{t("datavizNoData")}</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>{t("datavizYearlyDistance")}</CardTitle>
              <CardDescription>{t("datavizYearlyDistanceDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.yearlyDistanceRows.length > 0 ? (
                <ChartContainer
                  config={{ distanceKm: { label: t("datavizDistanceSeries"), color: "#2563eb" } }}
                  className="h-[340px] w-full aspect-auto"
                >
                  <AreaChart data={analytics.yearlyDistanceRows} margin={{ left: 12, right: 12 }}>
                    <defs>
                      <linearGradient id="yearly-distance-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="year" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => (
                            <>
                              <span className="text-muted-foreground">
                                {t("datavizDistanceSeries")} :
                              </span>
                              <span className="font-mono font-medium tabular-nums text-foreground">
                                {formatDistanceWithDots(Number(value))}
                              </span>
                            </>
                          )}
                        />
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="distanceKm"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      fill="url(#yearly-distance-fill)"
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <p className="text-sm text-muted-foreground">{t("datavizNoData")}</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>{t("datavizCompanions")}</CardTitle>
              <CardDescription>{t("datavizCompanionsDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.companionRows.length > 0 ? (
                <ChartContainer
                  config={{ tripsCount: { label: t("statTrips"), color: "#0f766e" } }}
                  className="h-[340px] w-full aspect-auto"
                >
                  <BarChart
                    data={analytics.companionRows}
                    layout="vertical"
                    margin={{ left: 12, right: 16 }}
                  >
                    <CartesianGrid horizontal={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      width={80}
                    />
                    <XAxis type="number" tickLine={false} axisLine={false} />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Bar dataKey="tripsCount" fill="#0f766e" radius={8} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <p className="text-sm text-muted-foreground">{t("datavizNoData")}</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>{t("datavizContinentsNoFrance")}</CardTitle>
              <CardDescription>{t("datavizContinentsDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.continentRows.length > 0 ? (
                <ChartContainer
                  config={continentConfig}
                  className="h-[340px] w-full aspect-auto"
                >
                  <PieChart>
                    <Pie
                      data={analytics.continentRows}
                      dataKey="trips"
                      nameKey="continent"
                      innerRadius={72}
                      outerRadius={108}
                      paddingAngle={3}
                    >
                      {analytics.continentRows.map((row, index) => (
                        <Cell
                          key={row.continent}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent nameKey="continent" />} />
                    <ChartLegend content={<ChartLegendContent nameKey="continent" />} />
                  </PieChart>
                </ChartContainer>
              ) : (
                <p className="text-sm text-muted-foreground">{t("datavizNoData")}</p>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>{t("datavizAccommodationShare")}</CardTitle>
              <CardDescription>{t("datavizAccommodationShareDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.accommodationRows.length > 0 ? (
                <ChartContainer
                  config={accommodationConfig}
                  className="h-[360px] w-full aspect-auto"
                >
                  <AreaChart
                    data={analytics.accommodationRows}
                    stackOffset="expand"
                    margin={{ left: 12, right: 12 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="year" tickLine={false} axisLine={false} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${Math.round(Number(value))}%`}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => (
                            <>
                              <span className="text-muted-foreground">
                                {formatAccomodationLabel(String(name), locale)} :
                              </span>
                              <span className="font-mono font-medium tabular-nums text-foreground">
                                {Number(value).toLocaleString(numberLocale, {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 1,
                                })}
                                %
                              </span>
                            </>
                          )}
                        />
                      }
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    {analytics.accommodationKeys.map((key, index) => (
                      <Area
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stackId="accommodation"
                        stroke={CHART_COLORS[index % CHART_COLORS.length]}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                        fillOpacity={0.45}
                      />
                    ))}
                  </AreaChart>
                </ChartContainer>
              ) : (
                <p className="text-sm text-muted-foreground">{t("datavizNoData")}</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>{t("datavizReasons")}</CardTitle>
              <CardDescription>{t("datavizReasonsDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.reasonRows.length > 0 ? (
                <ChartContainer
                  config={reasonConfig}
                  className="h-[360px] w-full aspect-auto"
                >
                  <BarChart data={analytics.reasonRows} margin={{ left: 12, right: 12 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      angle={-18}
                      textAnchor="end"
                      height={64}
                    />
                    <YAxis yAxisId="distance" tickLine={false} axisLine={false} />
                    <YAxis
                      yAxisId="duration"
                      orientation="right"
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => {
                            if (String(name) === "averageDistanceKm") {
                              return (
                                <>
                                  <span className="text-muted-foreground">
                                    {t("datavizDistanceAverage")} :
                                  </span>
                                  <span className="font-mono font-medium tabular-nums text-foreground">
                                    {formatDistanceWithDots(Number(value))}
                                  </span>
                                </>
                              );
                            }

                            return (
                              <>
                                <span className="text-muted-foreground">
                                  {t("datavizDurationAverage")} :
                                </span>
                                <span className="font-mono font-medium tabular-nums text-foreground">
                                  {Number(value).toLocaleString(numberLocale, {
                                    minimumFractionDigits: 1,
                                    maximumFractionDigits: 1,
                                  })}{" "}
                                  {t("datavizDaysLabel")}
                                </span>
                              </>
                            );
                          }}
                        />
                      }
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar
                      yAxisId="distance"
                      dataKey="averageDistanceKm"
                      fill="#2563eb"
                      radius={6}
                    />
                    <Bar
                      yAxisId="duration"
                      dataKey="averageDurationDays"
                      fill="#f97316"
                      radius={6}
                    />
                  </BarChart>
                </ChartContainer>
              ) : (
                <p className="text-sm text-muted-foreground">{t("datavizNoData")}</p>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>{t("datavizScatter")}</CardTitle>
              <CardDescription>{t("datavizScatterDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.scatterRows.length > 0 ? (
                <ChartContainer
                  config={scatterConfig}
                  className="h-[380px] w-full aspect-auto"
                >
                  <ScatterChart margin={{ top: 12, right: 16, bottom: 8, left: 8 }}>
                    <CartesianGrid />
                    <XAxis
                      type="number"
                      dataKey="distanceKm"
                      tickLine={false}
                      axisLine={false}
                      name={t("datavizDistanceSeries")}
                    />
                    <YAxis
                      type="number"
                      dataKey="durationDays"
                      tickLine={false}
                      axisLine={false}
                      name={t("datavizDurationSeries")}
                    />
                    <ZAxis type="number" dataKey="posts" range={[80, 320]} />
                    <RechartsTooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const point = payload[0]?.payload as {
                          name: string;
                          distanceKm: number;
                          durationDays: number;
                          posts: number;
                        };
                        return (
                          <div className="rounded-lg border border-border/60 bg-background px-3 py-2 text-xs shadow-xl">
                            <p className="font-medium text-foreground">{point.name}</p>
                            <p className="text-muted-foreground">
                              {formatRoundedKm(point.distanceKm)}
                            </p>
                            <p className="text-muted-foreground">
                              {point.durationDays.toLocaleString(numberLocale)}{" "}
                              {t("datavizDaysLabel")}
                            </p>
                            <p className="text-muted-foreground">
                              {point.posts.toLocaleString(numberLocale)} {t("statDispatches").toLowerCase()}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <ChartLegend content={<ChartLegendContent nameKey="continent" />} />
                    {analytics.scatterRows.map((series, index) => (
                      <Scatter
                        key={series.continent}
                        name={series.continent}
                        data={series.values}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </ScatterChart>
                </ChartContainer>
              ) : (
                <p className="text-sm text-muted-foreground">{t("datavizNoData")}</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="h-4 w-4 text-primary" />
                {t("datavizHeatmap")}
              </CardTitle>
              <CardDescription>{t("datavizHeatmapDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.heatmapRows.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-[auto_repeat(12,minmax(0,1fr))] gap-2 text-xs">
                    <div />
                    {MONTHS.map((month) => (
                      <div key={month} className="text-center text-muted-foreground">
                        {formatDate(new Date(Date.UTC(2024, month, 1)), "monthYear").slice(0, 3)}
                      </div>
                    ))}
                    {analytics.heatmapRows.map((row) => (
                      <div key={row.year} className="contents">
                        <div className="pr-2 text-sm font-medium text-foreground">
                          {row.year}
                        </div>
                        {row.months.map((month) => (
                          <div
                            key={`${row.year}-${month.month}`}
                            className={`flex aspect-square items-center justify-center rounded-md text-xs font-semibold transition-colors ${getHeatmapIntensity(
                              month.count,
                              analytics.maxHeatmapCount,
                            )}`}
                            title={`${row.year} · ${month.label} · ${month.count.toLocaleString(
                              numberLocale,
                            )} ${t("statTrips").toLowerCase()}`}
                          >
                            {month.count > 0 ? month.count : ""}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("datavizHeatmapLegend")}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t("datavizNoData")}</p>
              )}
            </CardContent>
          </Card>
        </section>

        <footer className="border-t border-border/60 pt-6">
          <p className="text-sm text-muted-foreground max-w-3xl">
            {t("datavizEstimatedNote")}
          </p>
        </footer>
      </div>
    </Layout>
  );
}
