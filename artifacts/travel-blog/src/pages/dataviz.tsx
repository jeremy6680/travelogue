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
import { MultiSelectFilter } from "@/components/multi-select-filter";
import { Input } from "@/components/ui/input";
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
import {
  getTripNightCount,
  getTripNightEntriesByMonth,
} from "@/lib/travel-insights";

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
  const [filterZone, setFilterZone] = useState<string[]>([]);
  const [filterCountry, setFilterCountry] = useState<string[]>([]);
  const [filterYear, setFilterYear] = useState<string[]>([]);
  const [filterCompanion, setFilterCompanion] = useState<string[]>([]);
  const [filterReason, setFilterReason] = useState<string[]>([]);
  const [filterTransport, setFilterTransport] = useState<string[]>([]);

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
        if (filterZone.length > 0) {
          const countryCode = trip.countryCode.toUpperCase();
          const matchesZone = filterZone.some((zone) => {
            if (zone === "france") return countryCode === "FR";
            if (zone === "international") return countryCode !== "FR";
            if (zone.startsWith("continent:")) {
              return getContinentKey(trip.countryCode) === zone.replace("continent:", "");
            }
            return false;
          });
          if (!matchesZone) {
            return false;
          }
        }

        if (
          filterCountry.length > 0 &&
          !filterCountry.includes(trip.countryCode.toUpperCase())
        ) {
          return false;
        }

        if (
          filterYear.length > 0 &&
          !filterYear.includes(new Date(trip.visitedAt).getFullYear().toString())
        ) {
          return false;
        }

        if (
          filterCompanion.length > 0 &&
          !filterCompanion.every((companion) => trip.travelCompanions.includes(companion))
        ) {
          return false;
        }

        if (
          filterReason.length > 0 &&
          !filterReason.every((reason) => trip.reasonForTravel.includes(reason))
        ) {
          return false;
        }

        if (
          filterTransport.length > 0 &&
          !filterTransport.every((transport) =>
            [...trip.transportationTo, ...trip.transportationOnSite].includes(transport),
          )
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
    const franceVsAbroadKm = new Map<
      number,
      { year: number; franceKm: number; internationalKm: number }
    >();
    const continentNightStats = new Map<
      string,
      { continent: string; nights: number }
    >();
    const yearlyDistance = new Map<
      number,
      { year: number; distanceKm: number; trips: number; posts: number }
    >();
    const heatmap = new Map<string, { year: number; month: number; nights: number }>();
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
      const postsCount = postsByTripId.get(trip.id) ?? 0;
      const continentKey = getContinentKey(trip.countryCode) ?? "other";
      const nights = getTripNightCount(trip);

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

      for (const entry of getTripNightEntriesByMonth(trip)) {
        const heatmapKey = `${entry.year}-${entry.month}`;
        const heatmapEntry = heatmap.get(heatmapKey) ?? {
          year: entry.year,
          month: entry.month,
          nights: 0,
        };
        heatmapEntry.nights += entry.nights;
        heatmap.set(heatmapKey, heatmapEntry);
      }

      const kmEntry = franceVsAbroadKm.get(year) ?? {
        year,
        franceKm: 0,
        internationalKm: 0,
      };
      if (distanceKm != null) {
        if (trip.countryCode.toUpperCase() === "FR") {
          kmEntry.franceKm += distanceKm;
        } else {
          kmEntry.internationalKm += distanceKm;
        }
      }
      franceVsAbroadKm.set(year, kmEntry);

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

        const nightEntry = continentNightStats.get(continentKey) ?? {
          continent: continentKey,
          nights: 0,
        };
        nightEntry.nights += nights;
        continentNightStats.set(continentKey, nightEntry);
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
    const franceVsAbroadRows = Array.from(franceVsAbroadKm.values()).sort(
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
    const continentNightRows = Array.from(continentNightStats.values())
      .sort((left, right) => right.nights - left.nights)
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
        const count = heatmap.get(`${year}-${month}`)?.nights ?? 0;
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
      franceVsAbroadRows,
      transportDistanceRows,
      companionRows,
      accommodationKeys,
      accommodationRows,
      continentRows,
      continentNightRows,
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

  const continentNightConfig = Object.fromEntries(
    analytics.continentNightRows.map((row, index) => [
      row.continent,
      { label: row.label, color: CHART_COLORS[index % CHART_COLORS.length] },
    ]),
  );

  const franceVsAbroadConfig = {
    franceKm: {
      label: locale === "fr" ? "France" : "France",
      color: "#2563eb",
    },
    internationalKm: {
      label: locale === "fr" ? "Étranger" : "Abroad",
      color: "#f97316",
    },
  };

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
          <MultiSelectFilter
            label={locale === "fr" ? "Zones" : "Regions"}
            placeholder={locale === "fr" ? "Zones" : "Regions"}
            options={zoneOptions.map((option) => {
              const countMatch = option.label.match(/\((\d+)\)\s*$/);
              const count = countMatch?.[1] ?? "";
              const text = option.label.replace(/\s*\(\d+\)\s*$/, "");
              return {
                value: option.value,
                label: (
                  <span className="flex items-center justify-between gap-3">
                    <span>{text}</span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-foreground">
                      {count}
                    </span>
                  </span>
                ),
                triggerLabel: text,
              };
            })}
            selectedValues={filterZone}
            onChange={setFilterZone}
            className="w-36"
          />

          <MultiSelectFilter
            label={locale === "fr" ? "Voyages" : "Trips"}
            placeholder={locale === "fr" ? "Voyages" : "Trips"}
            options={countryOptions.map((option) => {
              const countMatch = option.label.match(/\((\d+)\)\s*$/);
              const count = countMatch?.[1] ?? "";
              const text = option.label.replace(/\s*\(\d+\)\s*$/, "");
              return {
                value: option.value,
                label: (
                  <span className="flex items-center justify-between gap-3">
                    <span>{text}</span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-foreground">
                      {count}
                    </span>
                  </span>
                ),
                triggerLabel: text,
              };
            })}
            selectedValues={filterCountry}
            onChange={setFilterCountry}
            className="w-36"
          />

          <MultiSelectFilter
            label={locale === "fr" ? "Années" : "Years"}
            placeholder={locale === "fr" ? "Années" : "Years"}
            options={yearOptions.map((year) => ({ value: year, label: year }))}
            selectedValues={filterYear}
            onChange={setFilterYear}
            className="w-32"
          />

          <MultiSelectFilter
            label={locale === "fr" ? "Compagnons de route" : "Companions"}
            placeholder={locale === "fr" ? "Compagnons de route" : "Companions"}
            options={companionOptions.map((option) => ({
              value: option.value,
              label: (
                <span className="flex items-center justify-between gap-3">
                  <span>{option.value}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-foreground">
                    {option.count}
                  </span>
                </span>
              ),
              triggerLabel: option.value,
            }))}
            selectedValues={filterCompanion}
            onChange={setFilterCompanion}
            className="w-44"
          />

          <MultiSelectFilter
            label={locale === "fr" ? "Raisons" : "Reasons"}
            placeholder={locale === "fr" ? "Raisons" : "Reasons"}
            options={reasonOptions.map((option) => ({
              value: option.value,
              label: (
                <span className="flex items-center justify-between gap-3">
                  <span>{formatTravelReasonLabel(option.value, locale)}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-foreground">
                    {option.count}
                  </span>
                </span>
              ),
              triggerLabel: formatTravelReasonLabel(option.value, locale),
            }))}
            selectedValues={filterReason}
            onChange={setFilterReason}
            className="w-36"
          />

          <MultiSelectFilter
            label={locale === "fr" ? "Transports" : "Transport"}
            placeholder={locale === "fr" ? "Transports" : "Transport"}
            options={transportOptions.map((option) => ({
              value: option.value,
              label: (
                <span className="flex items-center justify-between gap-3">
                  <span>{formatTransportLabel(option.value, locale)}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-foreground">
                    {option.count}
                  </span>
                </span>
              ),
              triggerLabel: formatTransportLabel(option.value, locale),
            }))}
            selectedValues={filterTransport}
            onChange={setFilterTransport}
            className="w-36"
          />

          {(filterZone.length > 0 ||
            filterCountry.length > 0 ||
            filterYear.length > 0 ||
            filterCompanion.length > 0 ||
            filterReason.length > 0 ||
            filterTransport.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterZone([]);
                setFilterCountry([]);
                setFilterYear([]);
                setFilterCompanion([]);
                setFilterReason([]);
                setFilterTransport([]);
              }}
            >
              {t("clearFilters")}
            </Button>
          )}

          <span className="ml-auto inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm text-foreground font-mono">
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
              <CardTitle>
                {locale === "fr"
                  ? "Kilomètres France vs étranger"
                  : "France vs abroad kilometers"}
              </CardTitle>
              <CardDescription>
                {locale === "fr"
                  ? "Comparaison année après année des kilomètres estimés parcourus en France et à l'étranger."
                  : "Year-by-year comparison of estimated kilometers traveled in France and abroad."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.franceVsAbroadRows.length > 0 ? (
                <ChartContainer
                  config={franceVsAbroadConfig}
                  className="h-[360px] w-full aspect-auto"
                >
                  <BarChart data={analytics.franceVsAbroadRows} margin={{ left: 12, right: 12 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="year" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => (
                            <>
                              <span className="text-muted-foreground">
                                {String(name) === "franceKm"
                                  ? locale === "fr"
                                    ? "France :"
                                    : "France:"
                                  : locale === "fr"
                                    ? "Étranger :"
                                    : "Abroad:"}
                              </span>
                              <span className="font-mono font-medium tabular-nums text-foreground">
                                {formatDistanceWithDots(Number(value))}
                              </span>
                            </>
                          )}
                        />
                      }
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="franceKm" fill="#2563eb" radius={6} />
                    <Bar dataKey="internationalKm" fill="#f97316" radius={6} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <p className="text-sm text-muted-foreground">{t("datavizNoData")}</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>
                {locale === "fr"
                  ? "Nuits par continent hors France"
                  : "Nights by continent outside France"}
              </CardTitle>
              <CardDescription>
                {locale === "fr"
                  ? "Répartition des nuits passées en déplacement, agrégées par continent et hors France."
                  : "Distribution of travel nights aggregated by continent, excluding France."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.continentNightRows.length > 0 ? (
                <ChartContainer
                  config={continentNightConfig}
                  className="h-[360px] w-full aspect-auto"
                >
                  <PieChart>
                    <Pie
                      data={analytics.continentNightRows}
                      dataKey="nights"
                      nameKey="continent"
                      innerRadius={72}
                      outerRadius={108}
                      paddingAngle={3}
                    >
                      {analytics.continentNightRows.map((row, index) => (
                        <Cell
                          key={row.continent}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          nameKey="continent"
                          formatter={(value) => (
                            <>
                              <span className="text-muted-foreground">
                                {locale === "fr" ? "Nuits :" : "Nights:"}
                              </span>
                              <span className="font-mono font-medium tabular-nums text-foreground">
                                {Math.round(Number(value)).toLocaleString(numberLocale)}
                              </span>
                            </>
                          )}
                        />
                      }
                    />
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
              <CardDescription>
                {locale === "fr"
                  ? "Nombre de nuits en déplacement par mois et par année, avec répartition sur les mois traversés."
                  : "Number of travel nights by month and year, split across the months actually crossed."}
              </CardDescription>
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
                            )} ${locale === "fr" ? "nuits" : "nights"}`}
                          >
                            {month.count > 0 ? month.count : ""}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {locale === "fr"
                      ? "Plus la case est dense, plus le mois concentre de nuits en déplacement."
                      : "Darker cells indicate months with more travel nights."}
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
