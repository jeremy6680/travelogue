import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  Rectangle,
  Scatter,
  ScatterChart,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import {
  ArrowUpDown,
  BarChart3,
  CircleHelp,
  Globe,
  Grid3X3,
  TrendingUp,
  Users,
} from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useJourneysQuery, usePostsQuery, useTripsQuery } from "@/lib/directus";
import { useI18n } from "@/lib/i18n";
import type { Trip } from "@/lib/travel-types";
import {
  CONTINENT_OPTIONS,
  formatAccomodationLabel,
  formatTripContextLabel,
  formatTravelReasonLabel,
  formatTransportLabel,
  getContinentKey,
} from "@/lib/trip-options";
import { getTripAnalyticsPoints } from "@/lib/travel-analytics";
import { getAtlasCountryCode } from "@/lib/travel-countries";

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
const TRANSPORT_EMISSION_FACTORS_KG_PER_KM: Record<string, number> = {
  plane: 0.255,
  "own car": 0.192,
  "rental car": 0.192,
  train: 0.014,
  tram: 0.003,
  metro: 0.004,
  boat: 0.12,
  motorbike: 0.103,
  bicycle: 0,
};
const CITY_MAP_GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const CITY_MAP_COUNTRY_NAME_ALIASES: Record<string, string[]> = {
  DO: ["Dominican Rep."],
  CF: ["Central African Rep."],
  CG: ["Congo"],
  CD: ["Dem. Rep. Congo"],
  CZ: ["Czech Rep."],
  GQ: ["Eq. Guinea"],
  BA: ["Bosnia and Herz."],
  PS: ["Palestine"],
  SB: ["Solomon Is."],
  TL: ["Timor-Leste"],
  US: ["United States of America"],
};
const NORTH_AMERICA_COUNTRY_CODES = new Set([
  "AG", "BB", "BS", "BZ", "CA", "CR", "CU", "DM", "DO", "GD", "GT", "HN",
  "HT", "JM", "KN", "LC", "MX", "NI", "PA", "SV", "TT", "US", "VC",
]);
const SOUTH_AMERICA_COUNTRY_CODES = new Set([
  "AR", "BO", "BR", "CL", "CO", "EC", "GY", "PE", "PY", "SR", "UY", "VE",
]);
const WEST_CENTRAL_ASIA_COUNTRY_CODES = new Set([
  "AE", "AM", "AZ", "BH", "CY", "GE", "IL", "IQ", "IR", "JO", "KW", "LB", "OM",
  "PS", "QA", "SA", "SY", "TR", "YE", "KZ", "KG", "TJ", "TM", "UZ",
]);
const SOUTH_EAST_ASIA_COUNTRY_CODES = new Set([
  "AF", "BD", "BN", "BT", "CN", "HK", "ID", "IN", "JP", "KH", "KP", "KR", "LA",
  "LK", "MM", "MN", "MO", "MV", "MY", "NP", "PH", "PK", "SG", "TH", "TL", "TW",
  "VN",
]);

type CityMapRegionKey =
  | "france"
  | "europe"
  | "northAmerica"
  | "southAmerica"
  | "africa"
  | "westCentralAsia"
  | "southEastAsia"
  | "oceania";

type CityMapPoint = {
  id: string;
  coordinates: [number, number];
  label: string;
  tripName: string;
  countryCode: string;
};

type CityMapRegion = {
  key: CityMapRegionKey;
  label: Record<ReturnType<typeof useI18n>["locale"], string>;
  projectionConfig: {
    center: [number, number];
    scale: number;
  };
  countryCodes: Set<string>;
  countryNames: Set<string>;
  cities: Array<{ key: string; name: string; countryCode: string }>;
  points: CityMapPoint[];
};

const CITY_MAP_REGION_CONFIGS: Array<Omit<CityMapRegion, "countryCodes" | "countryNames" | "cities" | "points">> = [
  {
    key: "france",
    label: { fr: "France", en: "France" },
    projectionConfig: { center: [2.2, 46.5], scale: 1350 },
  },
  {
    key: "europe",
    label: { fr: "Europe", en: "Europe" },
    projectionConfig: { center: [14, 52], scale: 560 },
  },
  {
    key: "northAmerica",
    label: { fr: "Amérique du Nord", en: "North America" },
    projectionConfig: { center: [-98, 45], scale: 360 },
  },
  {
    key: "southAmerica",
    label: { fr: "Amérique du Sud", en: "South America" },
    projectionConfig: { center: [-60, -17], scale: 420 },
  },
  {
    key: "africa",
    label: { fr: "Afrique", en: "Africa" },
    projectionConfig: { center: [20, 2], scale: 430 },
  },
  {
    key: "westCentralAsia",
    label: { fr: "Asie de l'Ouest et centrale", en: "West & Central Asia" },
    projectionConfig: { center: [54, 33], scale: 430 },
  },
  {
    key: "southEastAsia",
    label: { fr: "Asie du Sud, de l'Est et du Sud-Est", en: "South, East & Southeast Asia" },
    projectionConfig: { center: [104, 24], scale: 360 },
  },
  {
    key: "oceania",
    label: { fr: "Océanie", en: "Oceania" },
    projectionConfig: { center: [135, -25], scale: 420 },
  },
];

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

function getDecadeStart(year: number) {
  return Math.floor(year / 10) * 10;
}

function getDecadeLabel(startYear: number, locale: string) {
  return locale === "fr" ? `${startYear}s` : `${startYear}s`;
}

function getVisitedCitiesList(visitedCities: string, locale: string) {
  const uniqueCities = new Map<string, string>();

  for (const rawCity of visitedCities.split(",")) {
    const city = rawCity.trim();
    if (!city) continue;
    const cityKey = city.toLocaleLowerCase(locale);
    if (!uniqueCities.has(cityKey)) {
      uniqueCities.set(cityKey, city);
    }
  }

  return Array.from(uniqueCities.entries()).map(([key, city]) => ({ key, city }));
}

function getCityMapRegionKey(countryCode: string): CityMapRegionKey | null {
  const normalizedCode = countryCode.toUpperCase();
  if (normalizedCode === "FR") return "france";
  if (NORTH_AMERICA_COUNTRY_CODES.has(normalizedCode)) return "northAmerica";
  if (SOUTH_AMERICA_COUNTRY_CODES.has(normalizedCode)) return "southAmerica";
  if (WEST_CENTRAL_ASIA_COUNTRY_CODES.has(normalizedCode)) return "westCentralAsia";
  if (SOUTH_EAST_ASIA_COUNTRY_CODES.has(normalizedCode)) return "southEastAsia";

  const continent = getContinentKey(normalizedCode);
  if (continent === "europe") return "europe";
  if (continent === "africa") return "africa";
  if (continent === "asia") return "southEastAsia";
  if (continent === "oceania") return "oceania";

  return null;
}

function buildCityMapRegions(trips: Trip[], locale: ReturnType<typeof useI18n>["locale"]) {
  const cityMaps: Record<
    CityMapRegionKey,
    {
      countryCodes: Set<string>;
      countryNames: Set<string>;
      cities: Map<string, { name: string; countryCode: string }>;
      points: CityMapPoint[];
    }
  > = {
    france: { countryCodes: new Set(), countryNames: new Set(), cities: new Map(), points: [] },
    europe: { countryCodes: new Set(), countryNames: new Set(), cities: new Map(), points: [] },
    northAmerica: { countryCodes: new Set(), countryNames: new Set(), cities: new Map(), points: [] },
    southAmerica: { countryCodes: new Set(), countryNames: new Set(), cities: new Map(), points: [] },
    africa: { countryCodes: new Set(), countryNames: new Set(), cities: new Map(), points: [] },
    westCentralAsia: { countryCodes: new Set(), countryNames: new Set(), cities: new Map(), points: [] },
    southEastAsia: { countryCodes: new Set(), countryNames: new Set(), cities: new Map(), points: [] },
    oceania: { countryCodes: new Set(), countryNames: new Set(), cities: new Map(), points: [] },
  };
  const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

  for (const trip of trips) {
    const countryCode = trip.countryCode.toUpperCase();
    const atlasCountryCode = getAtlasCountryCode(countryCode);
    const regionKey = getCityMapRegionKey(countryCode);
    if (!regionKey) continue;

    const region = cityMaps[regionKey];
    const cities = getVisitedCitiesList(trip.visitedCities, locale);
    region.countryCodes.add(countryCode);
    region.countryCodes.add(atlasCountryCode);
    for (const name of [
      regionNames.of(atlasCountryCode),
      ...(CITY_MAP_COUNTRY_NAME_ALIASES[atlasCountryCode] ?? []),
    ]) {
      if (name) region.countryNames.add(name.toLowerCase());
    }

    for (const { key, city } of cities) {
      const cityKey = `${countryCode}:${key}`;
      if (!region.cities.has(cityKey)) {
        region.cities.set(cityKey, { name: city, countryCode });
      }
    }

    if (
      typeof trip.longitude === "number" &&
      typeof trip.latitude === "number" &&
      cities.length > 0
    ) {
      region.points.push({
        id: `${trip.id}-${region.points.length}`,
        coordinates: [trip.longitude, trip.latitude],
        label: cities.map(({ city }) => city).join(", "),
        tripName: trip.name,
        countryCode,
      });
    }
  }

  return CITY_MAP_REGION_CONFIGS.map((config) => {
    const region = cityMaps[config.key];
    return {
      ...config,
      countryCodes: region.countryCodes,
      countryNames: region.countryNames,
      points: region.points,
      cities: Array.from(region.cities.entries())
        .map(([key, value]) => ({ key, ...value }))
        .sort((left, right) => {
          const cityDiff = left.name.localeCompare(right.name, locale);
          if (cityDiff !== 0) return cityDiff;
          return left.countryCode.localeCompare(right.countryCode, locale);
        }),
    };
  });
}

type CountrySortKey = "nights" | "trips";
type SortDirection = "asc" | "desc";

export default function DataVizPage() {
  const { locale, numberLocale, t, formatDate, countryName } = useI18n();
  const { data: trips = [] } = useTripsQuery();
  const { data: journeys = [] } = useJourneysQuery();
  const { data: posts = [] } = usePostsQuery();
  const [filterZone, setFilterZone] = useState<string[]>([]);
  const [filterCountry, setFilterCountry] = useState<string[]>([]);
  const [filterYear, setFilterYear] = useState<string[]>([]);
  const [filterCompanion, setFilterCompanion] = useState<string[]>([]);
  const [filterTripContext, setFilterTripContext] = useState<string[]>([]);
  const [filterReason, setFilterReason] = useState<string[]>([]);
  const [filterTransport, setFilterTransport] = useState<string[]>([]);
  const [countrySort, setCountrySort] = useState<{
    key: CountrySortKey;
    direction: SortDirection;
  }>({ key: "nights", direction: "desc" });

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
        text: countryName(code),
        count,
      }))
      .sort((left, right) => {
        if (right.count !== left.count) return right.count - left.count;
        return left.text.localeCompare(right.text, locale);
      });
  }, [countryName, locale, trips]);

  const yearOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const trip of trips) {
      const year = new Date(trip.visitedAt).getFullYear().toString();
      counts.set(year, (counts.get(year) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((left, right) => Number(right.value) - Number(left.value));
  }, [trips]);

  const companionOptions = useMemo(
    () => getFacetOptions(trips.map((trip) => trip.travelCompanions), locale),
    [locale, trips],
  );

  const tripContextOptions = useMemo(
    () => getFacetOptions(trips.map((trip) => trip.tripContext), locale),
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
          filterTripContext.length > 0 &&
          !filterTripContext.some((context) => trip.tripContext.includes(context))
        ) {
          return false;
        }

        if (
          filterReason.length > 0 &&
          !filterReason.some((reason) => trip.reasonForTravel.includes(reason))
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
      filterTripContext,
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
    const yearlyCarbonByMode = new Map<
      number,
      { year: number; totalKg: number; modes: Map<string, number> }
    >();
    const companionCounts = new Map<string, number>();
    const companionDistance = new Map<string, { name: string; distanceKm: number; trips: number }>();
    const tripContextCounts = new Map<string, number>();
    const reasonContextStats = new Map<
      string,
      { reason: string; total: number; counts: Map<string, number> }
    >();
    const continentStats = new Map<
      string,
      { continent: string; trips: number; distanceKm: number }
    >();
    const accommodationByPeriod = new Map<
      number,
      { periodStart: number; label: string; total: number; counts: Map<string, number> }
    >();
    const reasonStats = new Map<
      string,
      {
        reason: string;
        trips: number;
        totalDistanceKm: number;
        totalDurationDays: number;
        totalCarbonKg: number;
      }
    >();
    const nightsByZone = new Map<
      number,
      { year: number; franceNights: number; europeNights: number; worldNights: number }
    >();
    const continentNightStats = new Map<
      string,
      { continent: string; nights: number }
    >();
    const nightsByCountry = new Map<
      string,
      { countryCode: string; nights: number; trips: number }
    >();
    const topCountriesByPeriod = new Map<
      number,
      { periodStart: number; label: string; counts: Map<string, number> }
    >();
    const cityVisitsByPeriod = new Map<
      number,
      { periodStart: number; label: string; counts: Map<string, number> }
    >();
    const cityTotalVisits = new Map<string, number>();
    const cityLabels = new Map<string, string>();
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
      const nights = point.nightCount;
      const countryCode = trip.countryCode.toUpperCase();
      const periodStart = getDecadeStart(year);

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

      for (const entry of point.nightEntriesByMonth) {
        const heatmapKey = `${entry.year}-${entry.month}`;
        const heatmapEntry = heatmap.get(heatmapKey) ?? {
          year: entry.year,
          month: entry.month,
          nights: 0,
        };
        heatmapEntry.nights += entry.nights;
        heatmap.set(heatmapKey, heatmapEntry);
      }

      const zoneEntry = nightsByZone.get(year) ?? {
        year,
        franceNights: 0,
        europeNights: 0,
        worldNights: 0,
      };
      if (trip.countryCode.toUpperCase() === "FR") {
        zoneEntry.franceNights += nights;
      } else if (continentKey === "europe") {
        zoneEntry.europeNights += nights;
      } else {
        zoneEntry.worldNights += nights;
      }
      nightsByZone.set(year, zoneEntry);

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
        const companionEntry = companionDistance.get(companion) ?? {
          name: companion,
          distanceKm: 0,
          trips: 0,
        };
        companionEntry.trips += 1;
        if (distanceKm != null) {
          companionEntry.distanceKm += distanceKm;
        }
        companionDistance.set(companion, companionEntry);
      }

      const countryNightEntry = nightsByCountry.get(countryCode) ?? {
        countryCode,
        nights: 0,
        trips: 0,
      };
      countryNightEntry.nights += nights;
      countryNightEntry.trips += 1;
      nightsByCountry.set(countryCode, countryNightEntry);

      const uniqueAccomodations = [...new Set(trip.accomodation.filter(Boolean))];
      if (uniqueAccomodations.length > 0) {
        const periodEntry = accommodationByPeriod.get(periodStart) ?? {
          periodStart,
          label: getDecadeLabel(periodStart, locale),
          total: 0,
          counts: new Map<string, number>(),
        };
        periodEntry.total += 1;
        for (const accomodation of uniqueAccomodations) {
          periodEntry.counts.set(
            accomodation,
            (periodEntry.counts.get(accomodation) ?? 0) + 1,
          );
        }
        accommodationByPeriod.set(periodStart, periodEntry);
      }

      const travelModes = [...new Set(trip.transportationTo.filter(Boolean))];
      const uniqueVisitedCities = getVisitedCitiesList(trip.visitedCities, locale);
      if (countryCode !== "FR") {
        const periodCountryEntry = topCountriesByPeriod.get(periodStart) ?? {
          periodStart,
          label: getDecadeLabel(periodStart, locale),
          counts: new Map<string, number>(),
        };
        periodCountryEntry.counts.set(
          countryCode,
          (periodCountryEntry.counts.get(countryCode) ?? 0) + 1,
        );
        topCountriesByPeriod.set(periodStart, periodCountryEntry);
      }

      if (uniqueVisitedCities.length > 0) {
        const periodCityEntry = cityVisitsByPeriod.get(periodStart) ?? {
          periodStart,
          label: getDecadeLabel(periodStart, locale),
          counts: new Map<string, number>(),
        };

        for (const { key, city } of uniqueVisitedCities) {
          cityLabels.set(key, cityLabels.get(key) ?? city);
          cityTotalVisits.set(key, (cityTotalVisits.get(key) ?? 0) + 1);
          periodCityEntry.counts.set(key, (periodCityEntry.counts.get(key) ?? 0) + 1);
        }

        cityVisitsByPeriod.set(periodStart, periodCityEntry);
      }

      let tripCarbonKg = 0;
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

          const emissionFactor = TRANSPORT_EMISSION_FACTORS_KG_PER_KM[mode] ?? 0;
          const carbonEntry = yearlyCarbonByMode.get(year) ?? {
            year,
            totalKg: 0,
            modes: new Map<string, number>(),
          };
          const modeKg = share * emissionFactor;
          tripCarbonKg += modeKg;
          carbonEntry.totalKg += modeKg;
          carbonEntry.modes.set(mode, (carbonEntry.modes.get(mode) ?? 0) + modeKg);
          yearlyCarbonByMode.set(year, carbonEntry);
        }
      }

      const uniqueReasons = [...new Set(trip.reasonForTravel.filter(Boolean))];
      const uniqueTripContexts = [...new Set(trip.tripContext.filter(Boolean))];
      for (const context of uniqueTripContexts) {
        tripContextCounts.set(context, (tripContextCounts.get(context) ?? 0) + 1);
      }

      if (uniqueReasons.length > 0 && uniqueTripContexts.length > 0) {
        for (const reason of uniqueReasons) {
          const reasonContextEntry = reasonContextStats.get(reason) ?? {
            reason,
            total: 0,
            counts: new Map<string, number>(),
          };
          for (const context of uniqueTripContexts) {
            reasonContextEntry.total += 1;
            reasonContextEntry.counts.set(
              context,
              (reasonContextEntry.counts.get(context) ?? 0) + 1,
            );
          }
          reasonContextStats.set(reason, reasonContextEntry);
        }
      }

      for (const reason of uniqueReasons) {
        const reasonEntry = reasonStats.get(reason) ?? {
          reason,
          trips: 0,
          totalDistanceKm: 0,
          totalDurationDays: 0,
          totalCarbonKg: 0,
        };
        reasonEntry.trips += 1;
        reasonEntry.totalDurationDays += durationDays;
        if (distanceKm != null) {
          reasonEntry.totalDistanceKm += distanceKm;
        }
        reasonEntry.totalCarbonKg += tripCarbonKg;
        reasonStats.set(reason, reasonEntry);
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
    const nightsByZoneRows = Array.from(nightsByZone.values()).sort(
      (left, right) => right.year - left.year,
    );
    const transportDistanceRows = Array.from(transportDistance.values())
      .sort((left, right) => right.distanceKm - left.distanceKm)
      .slice(0, 8)
      .map((row) => ({
        ...row,
        label: formatTransportLabel(row.mode, locale),
      }));
    const carbonModes = Array.from(
      new Set(
        Array.from(yearlyCarbonByMode.values()).flatMap((entry) =>
          Array.from(entry.modes.keys()),
        ),
      ),
    ).sort((left, right) =>
      formatTransportLabel(left, locale).localeCompare(
        formatTransportLabel(right, locale),
        locale,
      ),
    );
    const carbonRows = Array.from(yearlyCarbonByMode.values())
      .sort((left, right) => left.year - right.year)
      .map((entry) => {
        const row: Record<string, number | string> = {
          year: entry.year,
          totalKg: entry.totalKg,
        };

        for (const mode of carbonModes) {
          row[mode] = Number((entry.modes.get(mode) ?? 0).toFixed(1));
        }

        return row;
      });
    const companionRows = Array.from(companionCounts.entries())
      .map(([name, tripsCount]) => ({ name, tripsCount }))
      .sort((left, right) => right.tripsCount - left.tripsCount)
      .slice(0, 10);
    const companionDistanceRows = Array.from(companionDistance.values())
      .sort((left, right) => right.distanceKm - left.distanceKm)
      .slice(0, 10);
    const tripContextTotal = Array.from(tripContextCounts.values()).reduce(
      (sum, count) => sum + count,
      0,
    );
    const tripContextRows = Array.from(tripContextCounts.entries())
      .map(([context, tripsCount]) => ({
        context,
        label: formatTripContextLabel(context, locale),
        tripsCount,
        share: tripContextTotal > 0 ? (tripsCount / tripContextTotal) * 100 : 0,
      }))
      .sort((left, right) => {
        if (right.tripsCount !== left.tripsCount) {
          return right.tripsCount - left.tripsCount;
        }

        return left.label.localeCompare(right.label, locale);
      });
    const tripContextKeys = Array.from(
      new Set(
        [
          ...Array.from(tripContextCounts.keys()),
          ...Array.from(reasonContextStats.values()).flatMap((entry) =>
            Array.from(entry.counts.keys()),
          ),
        ],
      ),
    ).sort((left, right) =>
      formatTripContextLabel(left, locale).localeCompare(
        formatTripContextLabel(right, locale),
        locale,
      ),
    );
    const reasonContextRows = Array.from(reasonContextStats.values())
      .map((entry) => {
        const row: Record<string, number | string> = {
          reason: entry.reason,
          label: formatTravelReasonLabel(entry.reason, locale),
          total: entry.total,
        };

        for (const context of tripContextKeys) {
          const count = entry.counts.get(context) ?? 0;
          row[context] =
            entry.total > 0 ? Number(((count / entry.total) * 100).toFixed(1)) : 0;
        }

        return row;
      })
      .sort((left, right) => {
        const totalDiff = Number(right.total) - Number(left.total);
        if (totalDiff !== 0) return totalDiff;
        return String(left.label).localeCompare(String(right.label), locale);
      });
    const accommodationKeys = Array.from(
      new Set(
        Array.from(accommodationByPeriod.values()).flatMap((entry) =>
          Array.from(entry.counts.keys()),
        ),
      ),
    ).sort((left, right) =>
      formatAccomodationLabel(left, locale).localeCompare(
        formatAccomodationLabel(right, locale),
        locale,
      ),
    );
    const accommodationRows = Array.from(accommodationByPeriod.values())
      .sort((left, right) => left.periodStart - right.periodStart)
      .map((entry) => {
        const row: Record<string, number | string> = {
          period: entry.label,
          tripCount: entry.total,
        };
        for (const key of accommodationKeys) {
          const count = entry.counts.get(key) ?? 0;
          row[key] = entry.total > 0 ? Number(((count / entry.total) * 100).toFixed(1)) : 0;
        }
        return row;
      });
    const nightsByCountryRows = Array.from(nightsByCountry.values())
      .map((row) => ({
        ...row,
        country: countryName(row.countryCode),
      }));
    const topCountriesByPeriodRows = Array.from(topCountriesByPeriod.values())
      .sort((left, right) => left.periodStart - right.periodStart)
      .map((entry) => ({
        period: entry.label,
        countries: Array.from(entry.counts.entries())
          .map(([countryCode, trips]) => ({
            countryCode,
            country: countryName(countryCode),
            trips,
          }))
          .sort((left, right) => {
            if (right.trips !== left.trips) return right.trips - left.trips;
            return left.country.localeCompare(right.country, locale);
          })
          .slice(0, 5),
      }));
    const cityCumulativeSeries = Array.from(cityTotalVisits.entries())
      .map(([cityKey, visits]) => ({
        cityKey,
        city: cityLabels.get(cityKey) ?? cityKey,
        visits,
      }))
      .sort((left, right) => {
        if (right.visits !== left.visits) return right.visits - left.visits;
        return left.city.localeCompare(right.city, locale);
      })
      .slice(0, 10)
      .map((entry, index) => ({
        ...entry,
        dataKey: `city_${index + 1}`,
      }));
    const cityCumulativeRows = Array.from(cityVisitsByPeriod.values())
      .sort((left, right) => left.periodStart - right.periodStart)
      .reduce<Array<Record<string, number | string>>>((rows, period) => {
        const previousRow = rows.at(-1);
        const row: Record<string, number | string> = {
          period: period.label,
        };

        for (const series of cityCumulativeSeries) {
          const previousValue = Number(previousRow?.[series.dataKey] ?? 0);
          row[series.dataKey] = previousValue + (period.counts.get(series.cityKey) ?? 0);
        }

        rows.push(row);
        return rows;
      }, []);
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
        averageCarbonKg: row.trips > 0 ? row.totalCarbonKg / row.trips : 0,
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
    const cityMapRegions = buildCityMapRegions(filteredTrips, locale);

    return {
      totalEstimatedKm,
      analyzableTrips: tripPoints.filter((point) => point.distanceKm != null).length,
      companionCount: companionCounts.size,
      transportModes: transportDistance.size,
      yearlyDistanceRows,
      nightsByZoneRows,
      transportDistanceRows,
      carbonModes,
      carbonRows,
      companionRows,
      companionDistanceRows,
      tripContextRows,
      tripContextKeys,
      reasonContextRows,
      accommodationKeys,
      accommodationRows,
      nightsByCountryRows,
      topCountriesByPeriodRows,
      cityCumulativeSeries,
      cityCumulativeRows,
      continentRows,
      continentNightRows,
      reasonRows,
      scatterRows,
      heatmapRows,
      maxHeatmapCount,
      cityMapRegions,
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

  const nightsByZoneConfig = {
    franceNights: {
      label: locale === "fr" ? "France" : "France",
      color: "#2563eb",
    },
    europeNights: {
      label: locale === "fr" ? "Europe" : "Europe",
      color: "#f97316",
    },
    worldNights: {
      label: locale === "fr" ? "Monde" : "World",
      color: "#0f766e",
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

  const tripContextConfig = Object.fromEntries(
    analytics.tripContextKeys.map((key, index) => [
      key,
      {
        label: formatTripContextLabel(key, locale),
        color: CHART_COLORS[index % CHART_COLORS.length],
      },
    ]),
  );

  const reasonContextConfig = Object.fromEntries(
    analytics.tripContextKeys.map((key, index) => [
      key,
      {
        label: formatTripContextLabel(key, locale),
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

  const carbonReasonConfig = {
    averageCarbonKg: {
      label: locale === "fr" ? "Empreinte moyenne" : "Average footprint",
      color: "#0f766e",
    },
  };

  const scatterConfig = Object.fromEntries(
    analytics.scatterRows.map((row, index) => [
      row.continent,
      { label: row.label, color: CHART_COLORS[index % CHART_COLORS.length] },
    ]),
  );

  const cityCumulativeConfig = Object.fromEntries(
    analytics.cityCumulativeSeries.map((series, index) => [
      series.dataKey,
      {
        label: series.city,
        color: CHART_COLORS[index % CHART_COLORS.length],
      },
    ]),
  );

  const formatDistanceWithDots = (value: number) =>
    `${Math.round(value)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".")} km`;

  const carbonConfig = Object.fromEntries(
    analytics.carbonModes.map((mode, index) => [
      mode,
      {
        label: formatTransportLabel(mode, locale),
        color: CHART_COLORS[index % CHART_COLORS.length],
      },
    ]),
  );

  const formatRoundedKm = (value: number) =>
    formatDistanceWithDots(value);

  const sortedNightsByCountryRows = useMemo(() => {
    const direction = countrySort.direction === "asc" ? 1 : -1;

    return [...analytics.nightsByCountryRows]
      .sort((left, right) => {
        const valueDiff =
          countrySort.key === "nights" ? left.nights - right.nights : left.trips - right.trips;
        if (valueDiff !== 0) return valueDiff * direction;
        return left.country.localeCompare(right.country, locale);
      })
      .map((row, index) => ({
        ...row,
        rank: index + 1,
      }));
  }, [analytics.nightsByCountryRows, countrySort, locale]);

  const formatPercent = (value: number) =>
    `${Number(value).toLocaleString(numberLocale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    })}%`;

  const formatCarbonLabel = (valueKg: number) => {
    if (valueKg >= 1000) {
      return `${(valueKg / 1000).toLocaleString(numberLocale, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })} tCO2e`;
    }

    return `${Math.round(valueKg).toLocaleString(numberLocale)} kgCO2e`;
  };

  const toggleCountrySort = (key: CountrySortKey) => {
    setCountrySort((current) => {
      if (current.key === key) {
        return {
          key,
          direction: current.direction === "desc" ? "asc" : "desc",
        };
      }

      return {
        key,
        direction: "desc",
      };
    });
  };

  const getSortLabel = (key: CountrySortKey) => {
    if (countrySort.key !== key) {
      return locale === "fr" ? "Trier" : "Sort";
    }

    if (countrySort.direction === "desc") {
      return locale === "fr" ? "Tri décroissant" : "Descending sort";
    }

    return locale === "fr" ? "Tri croissant" : "Ascending sort";
  };

  const getStackedNightRadius = (
    row: { franceNights: number; europeNights: number; worldNights: number },
    key: "franceNights" | "europeNights" | "worldNights",
  ) => {
    const orderedKeys: Array<"franceNights" | "europeNights" | "worldNights"> = [
      "franceNights",
      "europeNights",
      "worldNights",
    ];
    const visibleKeys = orderedKeys.filter((currentKey) => Number(row[currentKey]) > 0);
    const firstKey = visibleKeys[0];
    const lastKey = visibleKeys[visibleKeys.length - 1];

    if (!firstKey || !lastKey || row[key] <= 0) {
      return 0;
    }

    if (firstKey === key && lastKey === key) {
      return [6, 6, 6, 6] as const;
    }

    if (firstKey === key) {
      return [6, 0, 0, 6] as const;
    }

    if (lastKey === key) {
      return [0, 6, 6, 0] as const;
    }

    return 0;
  };

  const getAccommodationSegmentRadius = (
    row: Record<string, number | string>,
    key: string,
  ) => {
    const visibleKeys = analytics.accommodationKeys.filter(
      (currentKey) => Number(row[currentKey] ?? 0) > 0,
    );
    const lastKey = visibleKeys[visibleKeys.length - 1];

    if (!lastKey || Number(row[key] ?? 0) <= 0) {
      return 0;
    }

    return lastKey === key ? ([0, 6, 6, 0] as const) : 0;
  };

  const getTripContextSegmentRadius = (
    row: Record<string, number | string>,
    key: string,
  ) => {
    const visibleKeys = analytics.tripContextKeys.filter(
      (currentKey) => Number(row[currentKey] ?? 0) > 0,
    );
    const lastKey = visibleKeys[visibleKeys.length - 1];

    if (!lastKey || Number(row[key] ?? 0) <= 0) {
      return 0;
    }

    return lastKey === key ? ([0, 6, 6, 0] as const) : 0;
  };

  const renderNightSegment =
    (key: "franceNights" | "europeNights" | "worldNights") =>
    (props: {
      payload: { franceNights: number; europeNights: number; worldNights: number };
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      fill?: string;
    }) => (
      <Rectangle
        {...props}
        radius={getStackedNightRadius(props.payload, key) as
          | number
          | [number, number, number, number]}
      />
    );

  const renderAccommodationSegment =
    (key: string) =>
    (props: {
      payload: Record<string, number | string>;
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      fill?: string;
    }) => (
      <Rectangle
        {...props}
        radius={getAccommodationSegmentRadius(props.payload, key) as
          | number
          | [number, number, number, number]}
      />
    );

  const renderTripContextSegment =
    (key: string) =>
    (props: {
      payload: Record<string, number | string>;
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      fill?: string;
    }) => (
      <Rectangle
        {...props}
        radius={getTripContextSegmentRadius(props.payload, key) as
          | number
          | [number, number, number, number]}
      />
    );

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

        <section className="space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
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
              className="w-32 shrink-0"
            />

            <MultiSelectFilter
              label={locale === "fr" ? "Voyages" : "Trips"}
              placeholder={locale === "fr" ? "Voyages" : "Trips"}
              options={countryOptions.map((option) => ({
                value: option.value,
                label: (
                  <span className="flex items-center justify-between gap-3">
                    <span>{option.text}</span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-foreground">
                      {option.count}
                    </span>
                  </span>
                ),
                triggerLabel: option.text,
              }))}
              selectedValues={filterCountry}
              onChange={setFilterCountry}
              className="w-32 shrink-0"
            />

            <MultiSelectFilter
              label={locale === "fr" ? "Années" : "Years"}
              placeholder={locale === "fr" ? "Années" : "Years"}
              options={yearOptions.map((option) => ({
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
              selectedValues={filterYear}
              onChange={setFilterYear}
              className="w-28 shrink-0"
            />

            <MultiSelectFilter
              label={locale === "fr" ? "Contexte" : "Context"}
              placeholder={locale === "fr" ? "Contexte" : "Context"}
              options={tripContextOptions.map((option) => ({
                value: option.value,
                label: (
                  <span className="flex items-center justify-between gap-3">
                    <span>{formatTripContextLabel(option.value, locale)}</span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-foreground">
                      {option.count}
                    </span>
                  </span>
                ),
                triggerLabel: formatTripContextLabel(option.value, locale),
              }))}
              selectedValues={filterTripContext}
              onChange={setFilterTripContext}
              className="w-36 shrink-0"
            />

            <MultiSelectFilter
              label={locale === "fr" ? "Compagnons de route" : "Companions"}
              placeholder={locale === "fr" ? "Compagnons" : "Companions"}
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
              className="w-40 shrink-0"
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
              className="w-32 shrink-0"
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
              className="w-32 shrink-0"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(filterZone.length > 0 ||
              filterCountry.length > 0 ||
              filterYear.length > 0 ||
              filterCompanion.length > 0 ||
              filterTripContext.length > 0 ||
              filterReason.length > 0 ||
              filterTransport.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterZone([]);
                  setFilterCountry([]);
                  setFilterYear([]);
                  setFilterTripContext([]);
                  setFilterCompanion([]);
                  setFilterReason([]);
                  setFilterTransport([]);
                }}
              >
                {t("clearFilters")}
              </Button>
            )}

            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    aria-label={
                      locale === "fr"
                        ? "Afficher la logique des filtres"
                        : "Show filter logic"
                    }
                  >
                    <CircleHelp className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  align="end"
                  className="max-w-[320px] space-y-2 px-4 py-3 text-left leading-relaxed"
                >
                  <p className="font-semibold">
                    {locale === "fr" ? "Logique des filtres" : "Filter logic"}
                  </p>
                  <p>
                    {locale === "fr"
                      ? "Filtres en OU : Zones, Voyages, Années, Contextes, Raisons."
                      : "OR filters: Regions, Trips, Years, Contexts, Reasons."}
                  </p>
                  <p>
                    {locale === "fr"
                      ? "Filtres en ET : Compagnons de route, Transports."
                      : "AND filters: Companions, Transport."}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm text-foreground font-mono">
              {filteredTrips.length.toLocaleString(numberLocale)} {t("statTrips").toLowerCase()}
            </span>
          </div>
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
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>
                {locale === "fr" ? "Empreinte carbone estimée" : "Estimated carbon footprint"}
              </CardTitle>
              <CardDescription>
                {locale === "fr"
                  ? "Estimation annuelle des émissions liées aux trajets, répartie par mode de transport."
                  : "Yearly estimate of travel emissions, broken down by transport mode."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.carbonRows.length > 0 ? (
                <ChartContainer
                  config={carbonConfig}
                  className="h-[340px] w-full aspect-auto"
                >
                  <BarChart data={analytics.carbonRows} margin={{ left: 12, right: 12 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="year" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => (
                            <>
                              <span className="text-muted-foreground">
                                {formatTransportLabel(String(name), locale)} :
                              </span>
                              <span className="font-mono font-medium tabular-nums text-foreground">
                                {formatCarbonLabel(Number(value))}
                              </span>
                            </>
                          )}
                        />
                      }
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    {analytics.carbonModes.map((mode, index) => (
                      <Bar
                        key={mode}
                        dataKey={mode}
                        stackId="carbon"
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                        radius={index === analytics.carbonModes.length - 1 ? [6, 6, 0, 0] : 0}
                      />
                    ))}
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
                  ? "Empreinte carbone selon la raison du voyage"
                  : "Carbon footprint by reason for travel"}
              </CardTitle>
              <CardDescription>
                {locale === "fr"
                  ? "Comparaison de l'empreinte carbone moyenne par voyage selon la raison du déplacement."
                  : "Comparison of average carbon footprint per trip by travel reason."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.reasonRows.length > 0 ? (
                <ChartContainer
                  config={carbonReasonConfig}
                  className="h-[340px] w-full aspect-auto"
                >
                  <BarChart
                    data={analytics.reasonRows}
                    layout="vertical"
                    margin={{ left: 12, right: 16 }}
                  >
                    <CartesianGrid horizontal={false} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      width={128}
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
                                {locale === "fr" ? "Empreinte moyenne :" : "Average footprint:"}
                              </span>
                              <span className="font-mono font-medium tabular-nums text-foreground">
                                {formatCarbonLabel(Number(value))}
                              </span>
                            </>
                          )}
                        />
                      }
                    />
                    <Bar dataKey="averageCarbonKg" fill="#0f766e" radius={8} />
                  </BarChart>
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
                {locale === "fr" ? "Contextes de voyage" : "Trip contexts"}
              </CardTitle>
              <CardDescription>
                {locale === "fr"
                  ? "Répartition des contextes renseignés sur les voyages de la sélection."
                  : "Distribution of contexts set on trips in the current selection."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.tripContextRows.length > 0 ? (
                <ChartContainer
                  config={tripContextConfig}
                  className="h-[340px] w-full aspect-auto"
                >
                  <PieChart>
                    <Pie
                      data={analytics.tripContextRows}
                      dataKey="tripsCount"
                      nameKey="context"
                      innerRadius={72}
                      outerRadius={108}
                      paddingAngle={3}
                    >
                      {analytics.tripContextRows.map((row) => (
                        <Cell
                          key={row.context}
                          fill={
                            CHART_COLORS[
                              analytics.tripContextKeys.indexOf(row.context) %
                                CHART_COLORS.length
                            ]
                          }
                        />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          nameKey="context"
                          formatter={(value, name, item) => (
                            <>
                              <span className="text-muted-foreground">
                                {formatTripContextLabel(String(name), locale)} :
                              </span>
                              <span className="font-mono font-medium tabular-nums text-foreground">
                                {formatPercent(Number(item.payload?.share ?? 0))} ·{" "}
                                {Number(value).toLocaleString(numberLocale)}
                              </span>
                            </>
                          )}
                        />
                      }
                    />
                    <ChartLegend content={<ChartLegendContent nameKey="context" />} />
                  </PieChart>
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
                  ? "Contextes par raison de voyage"
                  : "Contexts by travel reason"}
              </CardTitle>
              <CardDescription>
                {locale === "fr"
                  ? "Part de chaque contexte dans les voyages associés à chaque raison."
                  : "Share of each context among trips associated with each travel reason."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.reasonContextRows.length > 0 ? (
                <ChartContainer
                  config={reasonContextConfig}
                  className="h-[360px] w-full aspect-auto"
                >
                  <BarChart
                    data={analytics.reasonContextRows}
                    layout="vertical"
                    margin={{ left: 12, right: 16 }}
                  >
                    <CartesianGrid horizontal={false} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      width={128}
                    />
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 100]}
                      tickFormatter={(value) => `${Math.round(Number(value))}%`}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => (
                            <>
                              <span className="text-muted-foreground">
                                {formatTripContextLabel(String(name), locale)} :
                              </span>
                              <span className="font-mono font-medium tabular-nums text-foreground">
                                {formatPercent(Number(value))}
                              </span>
                            </>
                          )}
                        />
                      }
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    {analytics.tripContextKeys.map((key, index) => (
                      <Bar
                        key={key}
                        dataKey={key}
                        stackId="trip-context"
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                        shape={renderTripContextSegment(key)}
                      />
                    ))}
                  </BarChart>
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
              <CardTitle>
                {locale === "fr"
                  ? "Kilomètres parcourus avec chaque compagnon"
                  : "Kilometers traveled with each companion"}
              </CardTitle>
              <CardDescription>
                {locale === "fr"
                  ? "Distance cumulée des voyages partagés avec chaque compagnon."
                  : "Cumulative distance of trips shared with each travel companion."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.companionDistanceRows.length > 0 ? (
                <ChartContainer
                  config={{ distanceKm: { label: t("datavizDistanceSeries"), color: "#7c3aed" } }}
                  className="h-[360px] w-full aspect-auto"
                >
                  <BarChart
                    data={analytics.companionDistanceRows}
                    layout="vertical"
                    margin={{ left: 12, right: 16 }}
                  >
                    <CartesianGrid horizontal={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      width={90}
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
                    <Bar dataKey="distanceKm" fill="#7c3aed" radius={8} />
                  </BarChart>
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

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>
                {locale === "fr" ? "Nuits par pays" : "Nights by country"}
              </CardTitle>
              <CardDescription>
                {locale === "fr"
                  ? "Classement complet des nuits passées dans chaque pays, sur la sélection en cours."
                  : "Full ranking of nights spent in each country for the current selection."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.nightsByCountryRows.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>{locale === "fr" ? "Pays" : "Country"}</TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto h-8 px-2 text-right"
                          onClick={() => toggleCountrySort("nights")}
                          aria-label={`${locale === "fr" ? "Trier par nuits" : "Sort by nights"} · ${getSortLabel("nights")}`}
                        >
                          {locale === "fr" ? "Nuits" : "Nights"}
                          <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto h-8 px-2 text-right"
                          onClick={() => toggleCountrySort("trips")}
                          aria-label={`${locale === "fr" ? "Trier par voyages" : "Sort by trips"} · ${getSortLabel("trips")}`}
                        >
                          {locale === "fr" ? "Voyages" : "Trips"}
                          <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
                        </Button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedNightsByCountryRows.map((row) => (
                      <TableRow key={row.countryCode}>
                        <TableCell className="text-muted-foreground">{row.rank}</TableCell>
                        <TableCell className="font-medium text-foreground">
                          {row.country}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {row.nights.toLocaleString(numberLocale)}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {row.trips.toLocaleString(numberLocale)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                  <div className="grid grid-cols-[auto_repeat(12,minmax(0,1fr))_minmax(2.75rem,max-content)] gap-2 text-xs">
                    <div />
                    {MONTHS.map((month) => (
                      <div key={month} className="text-center text-muted-foreground">
                        {formatDate(new Date(Date.UTC(2024, month, 1)), "monthYear").slice(0, 3)}
                      </div>
                    ))}
                    <div className="text-center text-muted-foreground">
                      {locale === "fr" ? "Total" : "Total"}
                    </div>
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
                        <div className="flex items-center justify-center rounded-md bg-primary/10 px-2 text-xs font-semibold text-foreground">
                          {row.months
                            .reduce((sum, month) => sum + month.count, 0)
                            .toLocaleString(numberLocale)}
                        </div>
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
                  <BarChart
                    data={analytics.accommodationRows}
                    layout="vertical"
                    margin={{ left: 12, right: 16 }}
                  >
                    <CartesianGrid horizontal={false} />
                    <YAxis
                      type="category"
                      dataKey="period"
                      tickLine={false}
                      axisLine={false}
                      width={68}
                    />
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 100]}
                      tickFormatter={(value) => `${Math.round(Number(value))}%`}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => (
                            <>
                              <span className="text-muted-foreground">
                                {formatAccomodationLabel(String(name), locale)} :
                              </span>
                              <span className="font-mono font-medium tabular-nums text-foreground">
                                {formatPercent(Number(value))}
                              </span>
                            </>
                          )}
                        />
                      }
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    {analytics.accommodationKeys.map((key, index) => (
                      <Bar
                        key={key}
                        dataKey={key}
                        stackId="accommodation"
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                        shape={renderAccommodationSegment(key)}
                      />
                    ))}
                  </BarChart>
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

        <section className="grid gap-6">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>
                {locale === "fr"
                  ? "Cumul des 10 villes les plus visitées"
                  : "Cumulative top 10 most visited cities"}
              </CardTitle>
              <CardDescription>
                {locale === "fr"
                  ? "Évolution cumulative par décennie des 10 villes les plus visitées sur la sélection en cours."
                  : "Cumulative decade-by-decade growth for the 10 most visited cities in the current selection."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.cityCumulativeRows.length > 0 ? (
                <ChartContainer
                  config={cityCumulativeConfig}
                  className="h-[380px] w-full aspect-auto"
                >
                  <LineChart
                    data={analytics.cityCumulativeRows}
                    margin={{ top: 12, right: 20, bottom: 8, left: 8 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="period" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => (
                            <>
                              <span className="text-muted-foreground">
                                {cityCumulativeConfig[String(name)]?.label} :
                              </span>
                              <span className="font-mono font-medium tabular-nums text-foreground">
                                {Number(value).toLocaleString(numberLocale)}{" "}
                                {locale === "fr" ? "visites" : "visits"}
                              </span>
                            </>
                          )}
                        />
                      }
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    {analytics.cityCumulativeSeries.map((series, index) => (
                      <Line
                        key={series.dataKey}
                        type="monotone"
                        dataKey={series.dataKey}
                        stroke={CHART_COLORS[index % CHART_COLORS.length]}
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ChartContainer>
              ) : (
                <p className="text-sm text-muted-foreground">{t("datavizNoData")}</p>
              )}
            </CardContent>
          </Card>

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
        </section>

        <section className="grid gap-6">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>
                {locale === "fr"
                  ? "Pays les plus visités par décennie hors France"
                  : "Most visited countries by decade"}
              </CardTitle>
              <CardDescription>
                {locale === "fr"
                  ? "Top 5 des pays les plus visités pour chaque décennie de la sélection en cours, hors France."
                  : "Top 5 most visited countries for each decade in the current selection, excluding France."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.topCountriesByPeriodRows.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {analytics.topCountriesByPeriodRows.map((period) => (
                    <div
                      key={period.period}
                      className="rounded-xl border border-border/60 bg-muted/20 p-4"
                    >
                      <div className="mb-3 text-sm font-semibold text-foreground">
                        {period.period}
                      </div>
                      <div className="space-y-2">
                        {period.countries.map((country, index) => (
                          <div
                            key={`${period.period}-${country.countryCode}`}
                            className="flex items-center justify-between gap-4 rounded-md bg-background/70 px-3 py-2"
                          >
                            <div className="min-w-0">
                              <div className="text-xs text-muted-foreground">
                                #{index + 1}
                              </div>
                              <div className="truncate font-medium text-foreground">
                                {country.country}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono text-sm tabular-nums text-foreground">
                                {country.trips.toLocaleString(numberLocale)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {locale === "fr" ? "voyages" : "trips"}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t("datavizNoData")}</p>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.24em] text-muted-foreground">
              {locale === "fr" ? "Villes visitées" : "Visited cities"}
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-foreground">
              {locale === "fr" ? "Cartes des villes" : "City maps"}
            </h2>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            {analytics.cityMapRegions.map((region) => (
              <div
                key={region.key}
                className="overflow-hidden rounded-xl border border-border/60 bg-background"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
                  <h3 className="font-serif text-2xl font-bold text-foreground">
                    {region.label[locale]}
                  </h3>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-mono text-foreground">
                    {region.cities.length.toLocaleString(numberLocale)}{" "}
                    {locale === "fr" ? "villes" : "cities"}
                  </span>
                </div>

                <div className="h-[320px] w-full bg-[#f3f6f1]">
                  <ComposableMap
                    width={640}
                    height={360}
                    projection="geoMercator"
                    projectionConfig={region.projectionConfig}
                    className="h-full w-full"
                  >
                    <Geographies geography={CITY_MAP_GEO_URL}>
                      {({ geographies }) =>
                        geographies.map((geo) => {
                          const countryCode = String(geo.properties.ISO_A2 ?? "");
                          const geographyName = String(geo.properties.name ?? "").toLowerCase();
                          const isVisited =
                            region.countryCodes.has(countryCode) ||
                            region.countryCodes.has(String(geo.properties.ISO_A3 ?? "")) ||
                            region.countryCodes.has(String(geo.id ?? "")) ||
                            region.countryNames.has(geographyName);

                          return (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              fill={isVisited ? "#d48643" : "#d9ded3"}
                              stroke="#f8faf5"
                              strokeWidth={0.5}
                              style={{
                                default: { outline: "none" },
                                hover: {
                                  fill: isVisited ? "#bf6f32" : "#c9d0c4",
                                  outline: "none",
                                },
                                pressed: { outline: "none" },
                              }}
                            />
                          );
                        })
                      }
                    </Geographies>

                    {region.points.map((point) => (
                      <Marker key={point.id} coordinates={point.coordinates}>
                        <g>
                          <title>{`${point.label} - ${point.tripName}`}</title>
                          <circle
                            r={5}
                            fill="#0f766e"
                            stroke="#ffffff"
                            strokeWidth={1.8}
                          />
                          <text
                            x={8}
                            y={4}
                            className="text-[11px] font-semibold fill-foreground"
                            style={{
                              paintOrder: "stroke",
                              stroke: "#ffffff",
                              strokeWidth: 3,
                              strokeLinecap: "round",
                              strokeLinejoin: "round",
                            }}
                          >
                            {point.label.length > 24
                              ? `${point.label.slice(0, 22)}...`
                              : point.label}
                          </text>
                        </g>
                      </Marker>
                    ))}
                  </ComposableMap>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-border/60 bg-muted/20 px-5 py-4">
                  {region.cities.length > 0 ? (
                    region.cities.map((city) => (
                      <span
                        key={city.key}
                        className="rounded-full border border-border/70 bg-background px-3 py-1 text-sm text-foreground"
                      >
                        {city.name} · {countryName(city.countryCode)}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {locale === "fr"
                        ? "Aucune ville dans la sélection en cours."
                        : "No city in the current selection."}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
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
