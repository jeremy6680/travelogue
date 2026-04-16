import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowUpDown, ExternalLink } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { MultiSelectFilter } from "@/components/multi-select-filter";
import { Layout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useConcertsQuery,
  useRunningQuery,
  useSportEventsQuery,
  useTechEventsQuery,
  useWeddingsQuery,
} from "@/lib/directus";
import {
  formatConcertGenreLabel,
  formatConcertGenreValue,
  formatSportLabel,
  formatSportLabelLowercase,
  getConcertGenreValue,
} from "@/lib/event-options";
import { getEventDetailHref } from "@/lib/event-links";
import { useI18n } from "@/lib/i18n";
import type { Concert, RunningEvent, SportEvent, TechEvent, Wedding } from "@/lib/travel-types";
import { cn } from "@/lib/utils";

type EventView =
  | "all"
  | "concerts"
  | "sport-events"
  | "tech-events"
  | "running"
  | "weddings"
  | "stats";
type EventCategoryView = Exclude<EventView, "all" | "stats">;
type SortDirection = "asc" | "desc";

type ConcertFilters = {
  year: string[];
  city: string[];
  country: string[];
  artist: string[];
  eventName: string[];
  genre: string[];
  companion: string[];
  keyword: string;
  sortBy: "eventDate" | "venue" | "city" | "country" | "artist" | "eventName" | "genre";
  sortDirection: SortDirection;
};

type SportFilters = {
  year: string[];
  city: string[];
  country: string[];
  sport: string[];
  competition: string[];
  venue: string[];
  companion: string[];
  keyword: string;
  sortBy: "eventDate" | "venue" | "city" | "country" | "sport" | "competition";
  sortDirection: SortDirection;
};

type WeddingFilters = {
  year: string[];
  city: string[];
  country: string[];
  companion: string[];
  keyword: string;
  sortBy: "visitedAt" | "city" | "country" | "marriedPeople";
  sortDirection: SortDirection;
};

type TechEventFilters = {
  year: string[];
  city: string[];
  country: string[];
  eventName: string[];
  companion: string[];
  keyword: string;
  sortBy: "startDate" | "endDate" | "city" | "country" | "eventName";
  sortDirection: SortDirection;
};

type RunningFilters = {
  year: string[];
  city: string[];
  country: string[];
  eventName: string[];
  companion: string[];
  keyword: string;
  sortBy: "eventDate" | "city" | "country" | "eventName" | "distanceKm" | "duration";
  sortDirection: SortDirection;
};

type OverviewFilters = {
  year: string[];
  city: string[];
  country: string[];
};

type WeddingRow = {
  id: number;
  marriedPeople: string;
  tripName: string;
  tripId: number | null;
  visitedAt: string;
  city: string;
  countryCode: string;
  photosLink: string | null;
  articleLink: string | null;
  attendeesPeople: string[];
};

type TechEventRow = {
  id: number;
  eventName: string;
  startDate: string;
  endDate: string;
  city: string;
  countryCode: string;
  tripName: string;
  tripId: number | null;
  photosLink: string | null;
  articleLink: string | null;
  attendeesPeople: string[];
};

type RunningRow = {
  id: number;
  eventName: string;
  eventDate: string;
  city: string;
  countryCode: string;
  distanceKm: number | null;
  duration: string | null;
  averagePace: string;
  tripName: string;
  tripId: number | null;
  photosLink: string | null;
  articleLink: string | null;
  attendeesPeople: string[];
};

type UnifiedEventRow = {
  id: string;
  kind: EventCategoryView;
  detailHref: string;
  date: string;
  categoryLabel: string;
  categoryClassName: string;
  title: string;
  city: string;
  countryCode: string;
};

const EMPTY_LABEL = "—";
const EVENT_STATS_MONTHS = Array.from({ length: 12 }, (_, index) => index);
const EVENT_CHART_COLORS = {
  concerts: "#e11d48",
  "sport-events": "#2563eb",
  "tech-events": "#7c3aed",
  running: "#d97706",
  weddings: "#059669",
} as const;
const EVENT_VIEWS: EventView[] = [
  "all",
  "concerts",
  "sport-events",
  "tech-events",
  "running",
  "weddings",
  "stats",
];

const DEFAULT_CONCERT_FILTERS: ConcertFilters = {
  year: [],
  city: [],
  country: [],
  artist: [],
  eventName: [],
  genre: [],
  companion: [],
  keyword: "",
  sortBy: "eventDate",
  sortDirection: "desc",
};

const DEFAULT_SPORT_FILTERS: SportFilters = {
  year: [],
  city: [],
  country: [],
  sport: [],
  competition: [],
  venue: [],
  companion: [],
  keyword: "",
  sortBy: "eventDate",
  sortDirection: "desc",
};

const DEFAULT_WEDDING_FILTERS: WeddingFilters = {
  year: [],
  city: [],
  country: [],
  companion: [],
  keyword: "",
  sortBy: "visitedAt",
  sortDirection: "desc",
};

const DEFAULT_TECH_EVENT_FILTERS: TechEventFilters = {
  year: [],
  city: [],
  country: [],
  eventName: [],
  companion: [],
  keyword: "",
  sortBy: "startDate",
  sortDirection: "desc",
};

const DEFAULT_RUNNING_FILTERS: RunningFilters = {
  year: [],
  city: [],
  country: [],
  eventName: [],
  companion: [],
  keyword: "",
  sortBy: "eventDate",
  sortDirection: "desc",
};

const DEFAULT_OVERVIEW_FILTERS: OverviewFilters = {
  year: [],
  city: [],
  country: [],
};

function getYear(value: string | null | undefined) {
  return value?.slice(0, 4) ?? "";
}

function normalizeValue(value: string | null | undefined) {
  return value?.trim().toLocaleLowerCase() ?? "";
}

function includesSelectedValue(source: string | null | undefined, selectedValues: string[]) {
  if (selectedValues.length === 0) return true;
  return selectedValues.some((value) => normalizeValue(source) === normalizeValue(value));
}

type FacetOption = {
  value: string;
  text: string;
  count: number;
};

function getSingleFacetOptions(
  values: Array<string | null | undefined>,
  locale: "fr" | "en",
  formatLabel: (value: string) => string = (value) => value,
) {
  const counts = new Map<string, number>();

  for (const rawValue of values) {
    const value = rawValue?.trim();
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([value, count]) => ({
      value,
      text: formatLabel(value),
      count,
    }))
    .sort((left, right) => {
      if (right.count !== left.count) return right.count - left.count;
      return left.text.localeCompare(right.text, locale);
    });
}

function getMultiFacetOptions(
  groups: Array<string[]>,
  locale: "fr" | "en",
  formatLabel: (value: string) => string = (value) => value,
) {
  const counts = new Map<string, number>();

  for (const group of groups) {
    for (const value of new Set(group.map((item) => item.trim()).filter(Boolean))) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([value, count]) => ({
      value,
      text: formatLabel(value),
      count,
    }))
    .sort((left, right) => {
      if (right.count !== left.count) return right.count - left.count;
      return left.text.localeCompare(right.text, locale);
    });
}

function matchesSelectedPeople(people: string[], selectedValues: string[]) {
  if (selectedValues.length === 0) return true;
  return selectedValues.every((selectedValue) =>
    people.some((person) => normalizeValue(person) === normalizeValue(selectedValue)),
  );
}

function buildFilterLabel(text: string, count: number) {
  return (
    <span className="flex items-center justify-between gap-3">
      <span>{text}</span>
      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-foreground">
        {count}
      </span>
    </span>
  );
}

function matchesKeyword(parts: Array<string | null | undefined>, keyword: string) {
  if (!keyword.trim()) return true;
  return normalizeValue(parts.filter(Boolean).join(" ")).includes(normalizeValue(keyword));
}

function getConcertCountry(concert: Concert) {
  return concert.countryCode ?? "";
}

function getConcertGenreLabel(concert: Pick<Concert, "genre" | "subgenre">) {
  return getConcertGenreValue(concert.genre, concert.subgenre);
}

function getSportCountry(event: SportEvent) {
  return event.countryCode ?? "";
}

function getWeddingCountry(event: WeddingRow) {
  return event.countryCode;
}

function getTechCountry(event: TechEventRow) {
  return event.countryCode;
}

function getRunningCountry(event: RunningRow) {
  return event.countryCode;
}

function formatEventDateRange(
  start: string,
  end: string,
  locale: "fr" | "en",
  formatDate: (value: string | Date, style: "short" | "long" | "monthYear") => string,
) {
  if (!end || start === end) {
    return formatDate(start, "short");
  }

  return locale === "fr"
    ? `${formatDate(start, "short")} au ${formatDate(end, "short")}`
    : `${formatDate(start, "short")} to ${formatDate(end, "short")}`;
}

function parseDurationToSeconds(value: string | null | undefined) {
  if (!value) return null;
  const parts = value.trim().split(":").map((part) => Number.parseInt(part, 10));
  if (parts.some((part) => !Number.isFinite(part))) return null;

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }

  return null;
}

function formatRunningPace(
  distanceKm: number | null | undefined,
  duration: string | null | undefined,
  locale: "fr" | "en",
) {
  if (!distanceKm || distanceKm <= 0) return EMPTY_LABEL;

  const totalSeconds = parseDurationToSeconds(duration);
  if (!totalSeconds) return EMPTY_LABEL;

  const paceSeconds = Math.round(totalSeconds / distanceKm);
  const minutes = Math.floor(paceSeconds / 60);
  const seconds = paceSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")} / km${
    locale === "fr" ? "" : ""
  }`;
}

function isEventView(value: string | null | undefined): value is EventView {
  return EVENT_VIEWS.includes((value ?? "") as EventView);
}

function parseEventView(search: string) {
  const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  const tab = params.get("tab");
  return isEventView(tab) ? tab : "all";
}

function getSportEventTitle(event: SportEvent, locale: "fr" | "en") {
  const matchup = [event.homeTeam, event.awayTeam].filter(Boolean).join(" vs ");

  if (event.competition && matchup) {
    return `${event.competition} — ${matchup}`;
  }

  return matchup || event.competition || formatSportLabel(event.sport, locale);
}

function getCategoryBadgeClassName(kind: Exclude<EventView, "all">) {
  switch (kind) {
    case "concerts":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "sport-events":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "tech-events":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "running":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "weddings":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "stats":
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getStatsHeatmapIntensity(value: number, maxValue: number) {
  if (value <= 0 || maxValue <= 0) {
    return "bg-muted/40 text-muted-foreground";
  }

  const ratio = value / maxValue;
  if (ratio >= 0.8) return "bg-primary text-primary-foreground";
  if (ratio >= 0.55) return "bg-primary/80 text-primary-foreground";
  if (ratio >= 0.3) return "bg-primary/55 text-foreground";
  return "bg-primary/20 text-foreground";
}

function formatDurationFromSeconds(totalSeconds: number | null | undefined) {
  if (!totalSeconds || totalSeconds <= 0) return EMPTY_LABEL;

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatPaceFromSeconds(totalSeconds: number | null | undefined) {
  if (!totalSeconds || totalSeconds <= 0) return EMPTY_LABEL;

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")} / km`;
}

function getRunningDistanceBucketLabel(distanceKm: number | null | undefined, locale: "fr" | "en") {
  if (!distanceKm) return null;
  if (Math.abs(distanceKm - 10) <= 0.4) return locale === "fr" ? "10 km" : "10K";
  if (Math.abs(distanceKm - 21.1) <= 0.6) return locale === "fr" ? "Semi-marathon" : "Half marathon";
  if (Math.abs(distanceKm - 42.2) <= 0.8) return locale === "fr" ? "Marathon" : "Marathon";
  return null;
}

function compareValues(left: string, right: string, direction: SortDirection) {
  const factor = direction === "asc" ? 1 : -1;
  return left.localeCompare(right, "fr", { sensitivity: "base" }) * factor;
}

function compareDates(left: string, right: string, direction: SortDirection) {
  return compareValues(left, right, direction);
}

function EventLink({
  href,
  label,
}: {
  href: string | null | undefined;
  label: string;
}) {
  if (!href) return <>{EMPTY_LABEL}</>;

  const isInternal = href.startsWith("/");
  const linkClassName =
    "inline-flex items-center gap-1 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground";

  if (isInternal) {
    return (
      <Link
        href={href}
        className={linkClassName}
      >
        {label}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={linkClassName}
    >
      {label}
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}

function SectionTitle({
  title,
  count,
  titleClassName,
}: {
  title: string;
  count: number;
  titleClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <CardTitle className={cn("text-2xl font-serif", titleClassName)}>{title}</CardTitle>
      <span className="text-sm text-muted-foreground">{count}</span>
    </div>
  );
}

function SortHeaderButton({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("h-8 px-2", className)}
      onClick={onClick}
    >
      {label}
      <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
    </Button>
  );
}

function TopListCard({
  title,
  rows,
  emptyLabel,
}: {
  title: string;
  rows: Array<{ label: string; count: number }>;
  emptyLabel: string;
}) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="font-serif text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length > 0 ? (
          <div className="space-y-3">
            {rows.map((row, index) => {
              let rank = 1;
              for (let currentIndex = 1; currentIndex <= index; currentIndex += 1) {
                if (rows[currentIndex].count !== rows[currentIndex - 1].count) {
                  rank = currentIndex + 1;
                }
              }

              return (
                <div key={`${row.label}-${index}`} className="flex items-center justify-between gap-4">
                  <div className="min-w-0 text-sm font-medium text-foreground">
                    <p className="truncate">
                      {rank} - {row.label}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-foreground">
                    {row.count}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function EventsPage() {
  const { t, formatDate, countryName, locale } = useI18n();
  const [location, setLocation] = useLocation();
  const concertsQuery = useConcertsQuery();
  const runningQuery = useRunningQuery();
  const sportEventsQuery = useSportEventsQuery();
  const techEventsQuery = useTechEventsQuery();
  const weddingsQuery = useWeddingsQuery();
  const [view, setView] = useState<EventView>("all");
  const [overviewFilters, setOverviewFilters] = useState<OverviewFilters>(DEFAULT_OVERVIEW_FILTERS);
  const [concertFilters, setConcertFilters] = useState<ConcertFilters>(DEFAULT_CONCERT_FILTERS);
  const [runningFilters, setRunningFilters] = useState<RunningFilters>(DEFAULT_RUNNING_FILTERS);
  const [sportFilters, setSportFilters] = useState<SportFilters>(DEFAULT_SPORT_FILTERS);
  const [techEventFilters, setTechEventFilters] = useState<TechEventFilters>(DEFAULT_TECH_EVENT_FILTERS);
  const [weddingFilters, setWeddingFilters] = useState<WeddingFilters>(DEFAULT_WEDDING_FILTERS);

  useEffect(() => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    setView(parseEventView(search));
  }, [location]);

  const handleViewChange = (nextView: string) => {
    if (!isEventView(nextView)) return;

    setView(nextView);

    const search = typeof window !== "undefined" ? window.location.search : "";
    const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);

    if (nextView === "all") {
      params.delete("tab");
    } else {
      params.set("tab", nextView);
    }

    const query = params.toString();
    setLocation(query ? `/events?${query}` : "/events");
  };

  const toggleConcertSort = (sortBy: ConcertFilters["sortBy"]) => {
    setConcertFilters((current) => ({
      ...current,
      sortBy,
      sortDirection:
        current.sortBy === sortBy && current.sortDirection === "desc" ? "asc" : "desc",
    }));
  };

  const toggleSportSort = (sortBy: SportFilters["sortBy"]) => {
    setSportFilters((current) => ({
      ...current,
      sortBy,
      sortDirection:
        current.sortBy === sortBy && current.sortDirection === "desc" ? "asc" : "desc",
    }));
  };

  const toggleTechEventSort = (sortBy: TechEventFilters["sortBy"]) => {
    setTechEventFilters((current) => ({
      ...current,
      sortBy,
      sortDirection:
        current.sortBy === sortBy && current.sortDirection === "desc" ? "asc" : "desc",
    }));
  };

  const toggleRunningSort = (sortBy: RunningFilters["sortBy"]) => {
    setRunningFilters((current) => ({
      ...current,
      sortBy,
      sortDirection:
        current.sortBy === sortBy && current.sortDirection === "desc" ? "asc" : "desc",
    }));
  };

  const toggleWeddingSort = (sortBy: WeddingFilters["sortBy"]) => {
    setWeddingFilters((current) => ({
      ...current,
      sortBy,
      sortDirection:
        current.sortBy === sortBy && current.sortDirection === "desc" ? "asc" : "desc",
    }));
  };

  const weddings = useMemo<WeddingRow[]>(() => {
    return (weddingsQuery.data ?? []).map((wedding: Wedding) => ({
      id: wedding.id,
      marriedPeople:
        [wedding.brideName, wedding.groomName].filter(Boolean).join(" & ") || EMPTY_LABEL,
      tripName: wedding.tripName ?? EMPTY_LABEL,
      tripId: wedding.tripId,
      visitedAt: wedding.weddingDate,
      city: wedding.city ?? "",
      countryCode: wedding.countryCode ?? "",
      photosLink: wedding.photosLink,
      articleLink: wedding.articleLink,
      attendeesPeople: wedding.attendeesPeople,
    }));
  }, [weddingsQuery.data]);

  const techEvents = useMemo<TechEventRow[]>(() => {
    return (techEventsQuery.data ?? []).map((event: TechEvent) => ({
      id: event.id,
      eventName: event.eventName,
      startDate: event.startDate,
      endDate: event.endDate ?? event.startDate,
      city: event.city ?? "",
      countryCode: event.countryCode ?? "",
      tripName: event.tripName ?? EMPTY_LABEL,
      tripId: event.tripId,
      photosLink: event.photosLink,
      articleLink: event.articleLink,
      attendeesPeople: event.attendeesPeople,
    }));
  }, [techEventsQuery.data]);

  const runningEvents = useMemo<RunningRow[]>(() => {
    return (runningQuery.data ?? []).map((event: RunningEvent) => ({
      id: event.id,
      eventName: event.eventName,
      eventDate: event.eventDate,
      city: event.city ?? "",
      countryCode: event.countryCode ?? "",
      distanceKm: event.distanceKm,
      duration: event.duration,
      averagePace: formatRunningPace(event.distanceKm, event.duration, locale),
      tripName: event.tripName ?? EMPTY_LABEL,
      tripId: event.tripId,
      photosLink: event.photosLink,
      articleLink: event.articleLink,
      attendeesPeople: event.attendeesPeople,
    }));
  }, [locale, runningQuery.data]);

  const concertOptions = useMemo(
    () => ({
      years: getSingleFacetOptions(
        (concertsQuery.data ?? []).map((concert) => getYear(concert.eventDate)),
        locale,
      ),
      cities: getSingleFacetOptions((concertsQuery.data ?? []).map((concert) => concert.city), locale),
      countries: getSingleFacetOptions(
        (concertsQuery.data ?? []).map((concert) => concert.countryCode),
        locale,
        (value) => countryName(value),
      ),
      artists: getSingleFacetOptions((concertsQuery.data ?? []).map((concert) => concert.artist), locale),
      eventNames: getSingleFacetOptions(
        (concertsQuery.data ?? []).map((concert) => concert.eventName),
        locale,
      ),
      genres: getSingleFacetOptions(
        (concertsQuery.data ?? []).map((concert) => getConcertGenreLabel(concert)),
        locale,
        (value) => formatConcertGenreValue(value, locale),
      ),
      companions: getMultiFacetOptions(
        (concertsQuery.data ?? []).map((concert) => concert.attendeesPeople),
        locale,
      ),
    }),
    [concertsQuery.data, countryName, locale],
  );

  const sportOptions = useMemo(
    () => ({
      years: getSingleFacetOptions(
        (sportEventsQuery.data ?? []).map((event) => getYear(event.eventDate)),
        locale,
      ),
      cities: getSingleFacetOptions((sportEventsQuery.data ?? []).map((event) => event.city), locale),
      countries: getSingleFacetOptions(
        (sportEventsQuery.data ?? []).map((event) => event.countryCode),
        locale,
        (value) => countryName(value),
      ),
      sports: getSingleFacetOptions(
        (sportEventsQuery.data ?? []).map((event) => event.sport),
        locale,
        (value) => formatSportLabel(value, locale),
      ),
      competitions: getSingleFacetOptions(
        (sportEventsQuery.data ?? []).map((event) => event.competition),
        locale,
      ),
      venues: getSingleFacetOptions(
        (sportEventsQuery.data ?? []).map((event) => event.venue),
        locale,
      ),
      companions: getMultiFacetOptions(
        (sportEventsQuery.data ?? []).map((event) => event.attendeesPeople),
        locale,
      ),
    }),
    [countryName, locale, sportEventsQuery.data],
  );

  const weddingOptions = useMemo(
    () => ({
      years: getSingleFacetOptions(weddings.map((event) => getYear(event.visitedAt)), locale),
      cities: getSingleFacetOptions(weddings.map((event) => event.city), locale),
      countries: getSingleFacetOptions(weddings.map((event) => event.countryCode), locale, (value) =>
        countryName(value),
      ),
      companions: getMultiFacetOptions(
        weddings.map((event) => event.attendeesPeople),
        locale,
      ),
    }),
    [countryName, locale, weddings],
  );

  const techEventOptions = useMemo(
    () => ({
      years: getSingleFacetOptions(techEvents.map((event) => getYear(event.startDate)), locale),
      cities: getSingleFacetOptions(techEvents.map((event) => event.city), locale),
      countries: getSingleFacetOptions(techEvents.map((event) => event.countryCode), locale, (value) =>
        countryName(value),
      ),
      eventNames: getSingleFacetOptions(techEvents.map((event) => event.eventName), locale),
      companions: getMultiFacetOptions(
        techEvents.map((event) => event.attendeesPeople),
        locale,
      ),
    }),
    [countryName, locale, techEvents],
  );

  const runningOptions = useMemo(
    () => ({
      years: getSingleFacetOptions(runningEvents.map((event) => getYear(event.eventDate)), locale),
      cities: getSingleFacetOptions(runningEvents.map((event) => event.city), locale),
      countries: getSingleFacetOptions(
        runningEvents.map((event) => event.countryCode),
        locale,
        (value) => countryName(value),
      ),
      eventNames: getSingleFacetOptions(runningEvents.map((event) => event.eventName), locale),
      companions: getMultiFacetOptions(
        runningEvents.map((event) => event.attendeesPeople),
        locale,
      ),
    }),
    [countryName, locale, runningEvents],
  );

  const overviewRows = useMemo<UnifiedEventRow[]>(() => {
    const concerts = (concertsQuery.data ?? []).map((concert) => ({
      id: `concerts-${concert.id}`,
      kind: "concerts" as const,
      detailHref: getEventDetailHref("concerts", concert.id),
      date: concert.eventDate,
      categoryLabel: locale === "fr" ? "Concert" : "Concert",
      categoryClassName: getCategoryBadgeClassName("concerts"),
      title: [concert.artist, concert.eventName].filter(Boolean).join(" — ") || concert.artist,
      city: concert.city ?? "",
      countryCode: concert.countryCode ?? "",
    }));

    const sportEvents = (sportEventsQuery.data ?? []).map((event) => ({
      id: `sport-events-${event.id}`,
      kind: "sport-events" as const,
      detailHref: getEventDetailHref("sport-events", event.id),
      date: event.eventDate,
      categoryLabel: locale === "fr" ? "Sport" : "Sport",
      categoryClassName: getCategoryBadgeClassName("sport-events"),
      title: getSportEventTitle(event, locale),
      city: event.city ?? "",
      countryCode: event.countryCode ?? "",
    }));

    const tech = techEvents.map((event) => ({
      id: `tech-events-${event.id}`,
      kind: "tech-events" as const,
      detailHref: getEventDetailHref("tech-events", event.id),
      date: event.startDate,
      categoryLabel: locale === "fr" ? "Tech" : "Tech",
      categoryClassName: getCategoryBadgeClassName("tech-events"),
      title: event.eventName,
      city: event.city,
      countryCode: event.countryCode,
    }));

    const running = runningEvents.map((event) => ({
      id: `running-${event.id}`,
      kind: "running" as const,
      detailHref: getEventDetailHref("running", event.id),
      date: event.eventDate,
      categoryLabel: locale === "fr" ? "Running" : "Running",
      categoryClassName: getCategoryBadgeClassName("running"),
      title: event.eventName,
      city: event.city,
      countryCode: event.countryCode,
    }));

    const weddingsOverview = weddings.map((event) => ({
      id: `weddings-${event.id}`,
      kind: "weddings" as const,
      detailHref: getEventDetailHref("weddings", event.id),
      date: event.visitedAt,
      categoryLabel: locale === "fr" ? "Mariage" : "Wedding",
      categoryClassName: getCategoryBadgeClassName("weddings"),
      title: event.marriedPeople,
      city: event.city,
      countryCode: event.countryCode,
    }));

    return [...concerts, ...sportEvents, ...tech, ...running, ...weddingsOverview].toSorted(
      (left, right) => compareDates(left.date, right.date, "desc"),
    );
  }, [concertsQuery.data, locale, runningEvents, sportEventsQuery.data, techEvents, weddings]);

  const overviewOptions = useMemo(
    () => ({
      years: getSingleFacetOptions(overviewRows.map((event) => getYear(event.date)), locale).toSorted(
        (left, right) => Number.parseInt(right.value, 10) - Number.parseInt(left.value, 10),
      ),
      cities: getSingleFacetOptions(overviewRows.map((event) => event.city), locale),
      countries: getSingleFacetOptions(
        overviewRows.map((event) => event.countryCode),
        locale,
        (value) => countryName(value),
      ),
    }),
    [countryName, locale, overviewRows],
  );

  const filteredOverviewRows = useMemo(() => {
    return overviewRows.filter((event) => {
      if (!includesSelectedValue(getYear(event.date), overviewFilters.year)) return false;
      if (!includesSelectedValue(event.city, overviewFilters.city)) return false;
      if (!includesSelectedValue(event.countryCode, overviewFilters.country)) return false;
      return true;
    });
  }, [overviewFilters, overviewRows]);

  const filteredConcerts = useMemo(() => {
    const rows = (concertsQuery.data ?? []).filter((concert) => {
      if (!includesSelectedValue(getYear(concert.eventDate), concertFilters.year)) return false;
      if (!includesSelectedValue(concert.city, concertFilters.city)) return false;
      if (!includesSelectedValue(getConcertCountry(concert), concertFilters.country)) return false;
      if (!includesSelectedValue(concert.artist, concertFilters.artist)) return false;
      if (!includesSelectedValue(concert.eventName, concertFilters.eventName)) return false;
      if (!includesSelectedValue(getConcertGenreLabel(concert), concertFilters.genre)) return false;
      if (!matchesSelectedPeople(concert.attendeesPeople, concertFilters.companion)) return false;
      if (
        !matchesKeyword(
          [
            concert.artist,
            concert.eventName,
            formatConcertGenreLabel(concert.genre, concert.subgenre, locale),
            concert.venue,
            concert.city,
            countryName(concert.countryCode ?? ""),
            ...concert.attendeesPeople,
          ],
          concertFilters.keyword,
        )
      ) {
        return false;
      }
      return true;
    });

    return rows.toSorted((left, right) => {
      switch (concertFilters.sortBy) {
        case "artist":
          return compareValues(left.artist, right.artist, concertFilters.sortDirection);
        case "city":
          return compareValues(left.city ?? "", right.city ?? "", concertFilters.sortDirection);
        case "venue":
          return compareValues(left.venue ?? "", right.venue ?? "", concertFilters.sortDirection);
        case "country":
          return compareValues(
            countryName(left.countryCode ?? ""),
            countryName(right.countryCode ?? ""),
            concertFilters.sortDirection,
          );
        case "eventName":
          return compareValues(left.eventName ?? "", right.eventName ?? "", concertFilters.sortDirection);
        case "genre":
          return compareValues(
            formatConcertGenreLabel(left.genre, left.subgenre, locale),
            formatConcertGenreLabel(right.genre, right.subgenre, locale),
            concertFilters.sortDirection,
          );
        case "eventDate":
        default:
          return compareDates(left.eventDate, right.eventDate, concertFilters.sortDirection);
      }
    });
  }, [concertFilters, concertsQuery.data, countryName, locale]);

  const filteredSportEvents = useMemo(() => {
    const rows = (sportEventsQuery.data ?? []).filter((event) => {
      if (!includesSelectedValue(getYear(event.eventDate), sportFilters.year)) return false;
      if (!includesSelectedValue(event.city, sportFilters.city)) return false;
      if (!includesSelectedValue(getSportCountry(event), sportFilters.country)) return false;
      if (!includesSelectedValue(event.sport, sportFilters.sport)) return false;
      if (!includesSelectedValue(event.competition, sportFilters.competition)) return false;
      if (!includesSelectedValue(event.venue, sportFilters.venue)) return false;
      if (!matchesSelectedPeople(event.attendeesPeople, sportFilters.companion)) return false;
      if (
        !matchesKeyword(
          [
            formatSportLabelLowercase(event.sport, locale),
            event.competition,
            event.venue,
            event.homeTeam,
            event.awayTeam,
            event.city,
            countryName(event.countryCode ?? ""),
            ...event.attendeesPeople,
          ],
          sportFilters.keyword,
        )
      ) {
        return false;
      }
      return true;
    });

    return rows.toSorted((left, right) => {
      switch (sportFilters.sortBy) {
        case "city":
          return compareValues(left.city ?? "", right.city ?? "", sportFilters.sortDirection);
        case "venue":
          return compareValues(left.venue ?? "", right.venue ?? "", sportFilters.sortDirection);
        case "country":
          return compareValues(
            countryName(left.countryCode ?? ""),
            countryName(right.countryCode ?? ""),
            sportFilters.sortDirection,
          );
        case "sport":
          return compareValues(
            formatSportLabel(left.sport, locale),
            formatSportLabel(right.sport, locale),
            sportFilters.sortDirection,
          );
        case "competition":
          return compareValues(left.competition ?? "", right.competition ?? "", sportFilters.sortDirection);
        case "eventDate":
        default:
          return compareDates(left.eventDate, right.eventDate, sportFilters.sortDirection);
      }
    });
  }, [countryName, locale, sportEventsQuery.data, sportFilters]);

  const filteredWeddings = useMemo(() => {
    const rows = weddings.filter((event) => {
      if (!includesSelectedValue(getYear(event.visitedAt), weddingFilters.year)) return false;
      if (!includesSelectedValue(event.city, weddingFilters.city)) return false;
      if (!includesSelectedValue(getWeddingCountry(event), weddingFilters.country)) return false;
      if (!matchesSelectedPeople(event.attendeesPeople, weddingFilters.companion)) return false;
      if (
        !matchesKeyword(
          [
            event.marriedPeople,
            event.city,
            countryName(event.countryCode),
            event.tripName,
            ...event.attendeesPeople,
          ],
          weddingFilters.keyword,
        )
      ) {
        return false;
      }
      return true;
    });

    return rows.toSorted((left, right) => {
      switch (weddingFilters.sortBy) {
        case "city":
          return compareValues(left.city, right.city, weddingFilters.sortDirection);
        case "country":
          return compareValues(
            countryName(left.countryCode),
            countryName(right.countryCode),
            weddingFilters.sortDirection,
          );
        case "marriedPeople":
          return compareValues(
            left.marriedPeople,
            right.marriedPeople,
            weddingFilters.sortDirection,
          );
        case "visitedAt":
        default:
          return compareDates(left.visitedAt, right.visitedAt, weddingFilters.sortDirection);
      }
    });
  }, [countryName, weddingFilters, weddings]);

  const filteredTechEvents = useMemo(() => {
    const rows = techEvents.filter((event) => {
      if (!includesSelectedValue(getYear(event.startDate), techEventFilters.year)) return false;
      if (!includesSelectedValue(event.city, techEventFilters.city)) return false;
      if (!includesSelectedValue(getTechCountry(event), techEventFilters.country)) return false;
      if (!includesSelectedValue(event.eventName, techEventFilters.eventName)) return false;
      if (!matchesSelectedPeople(event.attendeesPeople, techEventFilters.companion)) return false;
      if (
        !matchesKeyword(
          [
            event.eventName,
            event.city,
            countryName(event.countryCode),
            event.tripName,
            ...event.attendeesPeople,
          ],
          techEventFilters.keyword,
        )
      ) {
        return false;
      }
      return true;
    });

    return rows.toSorted((left, right) => {
      switch (techEventFilters.sortBy) {
        case "city":
          return compareValues(left.city, right.city, techEventFilters.sortDirection);
        case "country":
          return compareValues(
            countryName(left.countryCode),
            countryName(right.countryCode),
            techEventFilters.sortDirection,
          );
        case "eventName":
          return compareValues(left.eventName, right.eventName, techEventFilters.sortDirection);
        case "endDate":
          return compareDates(left.endDate, right.endDate, techEventFilters.sortDirection);
        case "startDate":
        default:
          return compareDates(left.startDate, right.startDate, techEventFilters.sortDirection);
      }
    });
  }, [countryName, techEventFilters, techEvents]);

  const filteredRunning = useMemo(() => {
    const rows = runningEvents.filter((event) => {
      if (!includesSelectedValue(getYear(event.eventDate), runningFilters.year)) return false;
      if (!includesSelectedValue(event.city, runningFilters.city)) return false;
      if (!includesSelectedValue(getRunningCountry(event), runningFilters.country)) return false;
      if (!includesSelectedValue(event.eventName, runningFilters.eventName)) return false;
      if (!matchesSelectedPeople(event.attendeesPeople, runningFilters.companion)) return false;
      if (
        !matchesKeyword(
          [
            event.eventName,
            event.city,
            countryName(event.countryCode),
            event.duration,
            event.tripName,
            ...event.attendeesPeople,
          ],
          runningFilters.keyword,
        )
      ) {
        return false;
      }
      return true;
    });

    return rows.toSorted((left, right) => {
      switch (runningFilters.sortBy) {
        case "city":
          return compareValues(left.city, right.city, runningFilters.sortDirection);
        case "country":
          return compareValues(
            countryName(left.countryCode),
            countryName(right.countryCode),
            runningFilters.sortDirection,
          );
        case "eventName":
          return compareValues(left.eventName, right.eventName, runningFilters.sortDirection);
        case "distanceKm":
          return ((left.distanceKm ?? 0) - (right.distanceKm ?? 0)) *
            (runningFilters.sortDirection === "asc" ? 1 : -1);
        case "duration":
          return (
            (parseDurationToSeconds(left.duration) ?? 0) -
            (parseDurationToSeconds(right.duration) ?? 0)
          ) * (runningFilters.sortDirection === "asc" ? 1 : -1);
        case "eventDate":
        default:
          return compareDates(left.eventDate, right.eventDate, runningFilters.sortDirection);
      }
    });
  }, [countryName, runningEvents, runningFilters]);

  const viewLabels: Record<EventView, string> = {
    all: locale === "fr" ? "Tout" : "All",
    concerts: locale === "fr" ? "Concerts" : "Concerts",
    "sport-events": locale === "fr" ? "Evènements sportifs" : "Sport events",
    "tech-events": locale === "fr" ? "Evènements tech" : "Tech events",
    running: locale === "fr" ? "Running" : "Running",
    weddings: locale === "fr" ? "Mariages" : "Weddings",
    stats: locale === "fr" ? "Stats" : "Stats",
  };

  const eventStats = useMemo(() => {
    const distinctConcertsByDate = new Map<string, Concert>();
    for (const concert of concertsQuery.data ?? []) {
      if (!distinctConcertsByDate.has(concert.eventDate)) {
        distinctConcertsByDate.set(concert.eventDate, concert);
      }
    }

    const statsEventRows: Array<{
      id: string;
      kind: EventCategoryView;
      date: string;
      countryCode: string;
      city: string;
    }> = [
      ...Array.from(distinctConcertsByDate.values()).map((concert) => ({
        id: `concert-${concert.eventDate}`,
        kind: "concerts" as const,
        date: concert.eventDate,
        countryCode: concert.countryCode ?? "",
        city: concert.city ?? "",
      })),
      ...(sportEventsQuery.data ?? []).map((event) => ({
        id: `sport-${event.id}`,
        kind: "sport-events" as const,
        date: event.eventDate,
        countryCode: event.countryCode ?? "",
        city: event.city ?? "",
      })),
      ...techEvents.map((event) => ({
        id: `tech-${event.id}`,
        kind: "tech-events" as const,
        date: event.startDate,
        countryCode: event.countryCode,
        city: event.city,
      })),
      ...runningEvents.map((event) => ({
        id: `running-${event.id}`,
        kind: "running" as const,
        date: event.eventDate,
        countryCode: event.countryCode,
        city: event.city,
      })),
      ...weddings.map((event) => ({
        id: `wedding-${event.id}`,
        kind: "weddings" as const,
        date: event.visitedAt,
        countryCode: event.countryCode,
        city: event.city,
      })),
    ];

    const totalEvents = statsEventRows.length;
    const distinctCountries = new Set(statsEventRows.map((event) => event.countryCode).filter(Boolean)).size;
    const distinctCities = new Set(statsEventRows.map((event) => normalizeValue(event.city)).filter(Boolean)).size;
    const years = statsEventRows
      .map((event) => Number.parseInt(event.date.slice(0, 4), 10))
      .filter((value) => Number.isFinite(value));
    const firstYear = years.length ? Math.min(...years) : null;
    const lastYear = years.length ? Math.max(...years) : null;

    const countsByCategory = new Map<EventCategoryView, number>();
    for (const row of statsEventRows) {
      countsByCategory.set(row.kind, (countsByCategory.get(row.kind) ?? 0) + 1);
    }

    const categoryRows = (Object.entries(viewLabels) as Array<[EventView, string]>)
      .filter(([key]) => key !== "all" && key !== "stats")
      .map(([key, label]) => ({
        key: key as EventCategoryView,
        label,
        count: countsByCategory.get(key as EventCategoryView) ?? 0,
        fill: EVENT_CHART_COLORS[key as EventCategoryView],
      }))
      .filter((row) => row.count > 0);

    const countryCounts = new Map<string, number>();
    for (const row of statsEventRows) {
      if (!row.countryCode) continue;
      countryCounts.set(row.countryCode, (countryCounts.get(row.countryCode) ?? 0) + 1);
    }

    const countryRows = Array.from(countryCounts.entries())
      .map(([countryCode, count]) => ({
        countryCode,
        country: countryName(countryCode),
        count,
      }))
      .sort((left, right) => {
        if (right.count !== left.count) return right.count - left.count;
        return left.country.localeCompare(right.country, locale);
      })
      .slice(0, 8);

    const cityCounts = new Map<string, { city: string; count: number }>();
    for (const row of statsEventRows) {
      if (!row.city) continue;
      const key = normalizeValue(row.city);
      const current = cityCounts.get(key) ?? { city: row.city, count: 0 };
      current.count += 1;
      cityCounts.set(key, current);
    }

    const yearCounts = new Map<string, number>();
    for (const row of statsEventRows) {
      const year = row.date.slice(0, 4);
      if (!year) continue;
      yearCounts.set(year, (yearCounts.get(year) ?? 0) + 1);
    }

    const heatmap = new Map<string, number>();
    for (const row of statsEventRows) {
      const year = Number.parseInt(row.date.slice(0, 4), 10);
      const month = Number.parseInt(row.date.slice(5, 7), 10) - 1;
      if (!Number.isFinite(year) || !Number.isFinite(month) || month < 0 || month > 11) continue;
      const key = `${year}-${month}`;
      heatmap.set(key, (heatmap.get(key) ?? 0) + 1);
    }

    const heatmapRows =
      firstYear && lastYear
        ? Array.from({ length: lastYear - firstYear + 1 }, (_, index) => {
            const year = lastYear - index;
            return {
              year,
              months: EVENT_STATS_MONTHS.map((month) => ({
                month,
                label: formatDate(new Date(Date.UTC(year, month, 1)), "monthYear").slice(0, 3),
                count: heatmap.get(`${year}-${month}`) ?? 0,
              })),
            };
          })
        : [];

    const maxHeatmapCount = Math.max(
      0,
      ...heatmapRows.flatMap((row) => row.months.map((month) => month.count)),
    );

    const kindCountryDistribution = categoryRows.map((category) => {
      const rows = statsEventRows.filter((event) => event.kind === category.key);
      const distribution = new Map<string, number>();

      for (const row of rows) {
        if (!row.countryCode) continue;
        distribution.set(row.countryCode, (distribution.get(row.countryCode) ?? 0) + 1);
      }

      return {
        key: category.key,
        label: category.label,
        total: rows.length,
        rows: Array.from(distribution.entries())
          .map(([countryCode, count]) => ({
            countryCode,
            country: countryName(countryCode),
            count,
            share: rows.length > 0 ? count / rows.length : 0,
          }))
          .sort((left, right) => {
            if (right.count !== left.count) return right.count - left.count;
            return left.country.localeCompare(right.country, locale);
          }),
      };
    });

    const topConcertVenues = Array.from(
      (concertsQuery.data ?? []).reduce((accumulator, concert) => {
        if (!concert.venue) return accumulator;
        const label = concert.city ? `${concert.venue} (${concert.city})` : concert.venue;
        const key = `${normalizeValue(concert.venue)}::${normalizeValue(concert.city)}::${concert.eventDate}`;
        accumulator.set(key, label);
        return accumulator;
      }, new Map<string, string>()).values(),
    ).reduce((accumulator, venue) => {
      accumulator.set(venue, (accumulator.get(venue) ?? 0) + 1);
      return accumulator;
    }, new Map<string, number>());

    const topSportVenues = (sportEventsQuery.data ?? []).reduce((accumulator, event) => {
      if (!event.venue) return accumulator;
      const label = event.city ? `${event.venue} (${event.city})` : event.venue;
      accumulator.set(label, (accumulator.get(label) ?? 0) + 1);
      return accumulator;
    }, new Map<string, number>());

    const topArtists = (concertsQuery.data ?? []).reduce((accumulator, concert) => {
      accumulator.set(concert.artist, (accumulator.get(concert.artist) ?? 0) + 1);
      return accumulator;
    }, new Map<string, number>());

    const topGenres = (concertsQuery.data ?? []).reduce((accumulator, concert) => {
      const label = formatConcertGenreLabel(concert.genre, concert.subgenre, locale);
      if (!label) return accumulator;
      accumulator.set(label, (accumulator.get(label) ?? 0) + 1);
      return accumulator;
    }, new Map<string, number>());

    const topTeams = (sportEventsQuery.data ?? []).reduce((accumulator, event) => {
      const sportLabel = formatSportLabel(event.sport, locale) || event.sport;
      for (const team of [event.homeTeam, event.awayTeam]) {
        if (!team) continue;
        const label = `${team} (${sportLabel})`;
        accumulator.set(label, (accumulator.get(label) ?? 0) + 1);
      }
      return accumulator;
    }, new Map<string, number>());

    const buildTopRows = (counts: Map<string, number>) =>
      Array.from(counts.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((left, right) => {
          if (right.count !== left.count) return right.count - left.count;
          return left.label.localeCompare(right.label, locale);
        })
        .slice(0, 5);

    const companionCounts = new Map<string, number>();
    const companionByKind = categoryRows.map((category) => {
      const distribution = new Map<string, number>();
      const sourceGroups =
        category.key === "concerts"
          ? (concertsQuery.data ?? []).map((item) => item.attendeesPeople)
          : category.key === "sport-events"
            ? (sportEventsQuery.data ?? []).map((item) => item.attendeesPeople)
            : category.key === "tech-events"
              ? techEvents.map((item) => item.attendeesPeople)
              : category.key === "running"
                ? runningEvents.map((item) => item.attendeesPeople)
                : weddings.map((item) => item.attendeesPeople);

      for (const people of sourceGroups) {
        for (const person of new Set(people.filter(Boolean))) {
          distribution.set(person, (distribution.get(person) ?? 0) + 1);
          companionCounts.set(person, (companionCounts.get(person) ?? 0) + 1);
        }
      }

      const total = Array.from(distribution.values()).reduce((sum, count) => sum + count, 0);

      return {
        key: category.key,
        label: category.label,
        rows: Array.from(distribution.entries())
          .map(([person, count]) => ({
            person,
            count,
            share: total > 0 ? count / total : 0,
          }))
          .sort((left, right) => {
            if (right.count !== left.count) return right.count - left.count;
            return left.person.localeCompare(right.person, locale);
          }),
      };
    });

    const runningProgressPoints = runningEvents
      .filter((event) => event.distanceKm && event.duration)
      .map((event) => {
        const totalSeconds = parseDurationToSeconds(event.duration);
        if (!totalSeconds) return null;
        if (!event.distanceKm || event.distanceKm <= 0) return null;
        const distanceLabel = getRunningDistanceBucketLabel(event.distanceKm, locale);
        if (!distanceLabel) return null;
        const paceSeconds = Math.round(totalSeconds / event.distanceKm);

        return {
          id: event.id,
          eventDate: event.eventDate,
          eventName: event.eventName,
          distanceKm: event.distanceKm,
          distanceLabel,
          paceSeconds,
          averagePace: formatPaceFromSeconds(paceSeconds),
        };
      })
      .filter((event): event is NonNullable<typeof event> => Boolean(event))
      .toSorted((left, right) => compareDates(left.eventDate, right.eventDate, "asc"));

    const runningProgressRows = runningProgressPoints.map((point) => ({
      eventDate: point.eventDate,
      eventName: point.eventName,
      distanceKm: point.distanceKm,
      paceLabel: point.averagePace,
      tenKm: point.distanceLabel === (locale === "fr" ? "10 km" : "10K") ? point.paceSeconds : null,
      semiMarathon:
        point.distanceLabel === (locale === "fr" ? "Semi-marathon" : "Half marathon")
          ? point.paceSeconds
          : null,
      marathon: point.distanceLabel === "Marathon" ? point.paceSeconds : null,
    }));

    return {
      totalEvents,
      distinctCountries,
      distinctCities,
      firstYear,
      lastYear,
      categoryRows,
      countryRows,
      cityRows: buildTopRows(
        new Map(Array.from(cityCounts.values()).map((entry) => [entry.city, entry.count])),
      ),
      yearRows: buildTopRows(yearCounts),
      heatmapRows,
      maxHeatmapCount,
      kindCountryDistribution,
      companionByKind,
      topConcertVenues: buildTopRows(topConcertVenues),
      topSportVenues: buildTopRows(topSportVenues),
      topArtists: buildTopRows(topArtists),
      topGenres: buildTopRows(topGenres),
      topTeams: buildTopRows(topTeams),
      topCompanions: buildTopRows(companionCounts),
      topCountries: buildTopRows(
        new Map(
          Array.from(countryCounts.entries()).map(([countryCode, count]) => [
            countryName(countryCode),
            count,
          ]),
        ),
      ),
      runningProgressRows,
    };
  }, [
    concertsQuery.data,
    countryName,
    formatDate,
    locale,
    runningEvents,
    sportEventsQuery.data,
    techEvents,
    weddings,
    viewLabels,
  ]);

  const eventCategoryChartConfig = useMemo(
    () =>
      Object.fromEntries(
        eventStats.categoryRows.map((row) => [
          row.key,
          { label: row.label, color: row.fill },
        ]),
      ),
    [eventStats.categoryRows],
  );

  const eventCountryChartConfig = {
    events: {
      label: locale === "fr" ? "Evènements" : "Events",
      color: "#0f766e",
    },
  };

  const runningProgressChartConfig = {
    tenKm: { label: locale === "fr" ? "10 km" : "10K", color: "#2563eb" },
    semiMarathon: { label: locale === "fr" ? "Semi-marathon" : "Half marathon", color: "#d97706" },
    marathon: { label: locale === "fr" ? "Marathon" : "Marathon", color: "#059669" },
  };

  const isLoading =
    concertsQuery.isLoading ||
    runningQuery.isLoading ||
    sportEventsQuery.isLoading ||
    techEventsQuery.isLoading ||
    weddingsQuery.isLoading;

  const hasError =
    concertsQuery.error ||
    runningQuery.error ||
    sportEventsQuery.error ||
    techEventsQuery.error ||
    weddingsQuery.error;

  return (
    <Layout>
      <div className="space-y-8">
        <header className="space-y-4 pb-8">
          <div className="space-y-6 text-center border-b pb-12">
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-foreground tracking-tight">
              {locale === "fr" ? "Evènements" : "Events"}
            </h1>
            <p className="text-xl text-muted-foreground font-serif italic max-w-2xl mx-auto leading-relaxed">
              {locale === "fr"
                ? "Concerts, évènements sportifs, conférences tech, courses et mariages réunis dans une même page pour parcourir les souvenirs au fil des dates, des villes et des pays."
                : "Concerts, sport events, tech conferences, races, and weddings gathered in one place to browse memories through dates, cities, and countries."}
            </p>
          </div>
          <Tabs value={view} onValueChange={handleViewChange}>
            <TabsList className="h-auto flex-wrap justify-start rounded-2xl bg-muted/70 p-1">
              {EVENT_VIEWS.map((option) => (
                <TabsTrigger
                  key={option}
                  value={option}
                  className="rounded-xl px-4 py-2"
                >
                  {viewLabels[option]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </header>

        {isLoading ? (
          <Card>
            <CardContent className="py-10 text-sm text-muted-foreground">
              {locale === "fr" ? "Chargement des évènements..." : "Loading events..."}
            </CardContent>
          </Card>
        ) : null}

        {hasError ? (
          <Card>
            <CardContent className="py-10 text-sm text-destructive">
              {locale === "fr"
                ? "Impossible de charger les évènements pour le moment."
                : "Unable to load events right now."}
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !hasError && view === "all" ? (
          <Card>
            <CardHeader className="space-y-6">
              <SectionTitle
                title={locale === "fr" ? "Vue d’ensemble" : "Overview"}
                count={filteredOverviewRows.length}
              />
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <MultiSelectFilter
                  label={locale === "fr" ? "Années" : "Years"}
                  placeholder={locale === "fr" ? "Années" : "Years"}
                  options={overviewOptions.years.map((option) => ({
                    value: option.value,
                    label: buildFilterLabel(option.text, option.count),
                    triggerLabel: option.text,
                  }))}
                  selectedValues={overviewFilters.year}
                  onChange={(year) => setOverviewFilters((current) => ({ ...current, year }))}
                  className="w-full"
                />
                <MultiSelectFilter
                  label={locale === "fr" ? "Villes" : "Cities"}
                  placeholder={locale === "fr" ? "Villes" : "Cities"}
                  options={overviewOptions.cities.map((option) => ({
                    value: option.value,
                    label: buildFilterLabel(option.text, option.count),
                    triggerLabel: option.text,
                  }))}
                  selectedValues={overviewFilters.city}
                  onChange={(city) => setOverviewFilters((current) => ({ ...current, city }))}
                  className="w-full"
                />
                <MultiSelectFilter
                  label={locale === "fr" ? "Pays" : "Countries"}
                  placeholder={locale === "fr" ? "Tous les pays" : "All countries"}
                  options={overviewOptions.countries.map((option) => ({
                    value: option.value,
                    label: buildFilterLabel(option.text, option.count),
                    triggerLabel: option.text,
                  }))}
                  selectedValues={overviewFilters.country}
                  onChange={(country) =>
                    setOverviewFilters((current) => ({ ...current, country }))
                  }
                  className="w-full"
                />
              </div>
              <div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOverviewFilters(DEFAULT_OVERVIEW_FILTERS)}
                >
                  {t("clearFilters")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{locale === "fr" ? "Date" : "Date"}</TableHead>
                    <TableHead>{locale === "fr" ? "Catégorie" : "Category"}</TableHead>
                    <TableHead>{locale === "fr" ? "Titre / nom" : "Title / name"}</TableHead>
                    <TableHead>{locale === "fr" ? "Ville" : "City"}</TableHead>
                    <TableHead>{locale === "fr" ? "Pays" : "Country"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOverviewRows.length ? (
                    filteredOverviewRows.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>{formatDate(event.date, "short")}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={event.categoryClassName}>
                            {event.categoryLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          <Link
                            href={event.detailHref}
                            className="underline decoration-[rgba(20,70,90,0.22)] underline-offset-4 transition-colors hover:text-primary"
                          >
                            {event.title || EMPTY_LABEL}
                          </Link>
                        </TableCell>
                        <TableCell>{event.city || EMPTY_LABEL}</TableCell>
                        <TableCell>
                          {event.countryCode ? countryName(event.countryCode) : EMPTY_LABEL}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        {t("noEntries")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !hasError && view === "stats" ? (
          <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card className="border-border/60">
                <CardHeader className="pb-2">
                  <p className="text-xs font-mono uppercase tracking-[0.24em] text-muted-foreground">
                    {locale === "fr" ? "Évènements" : "Events"}
                  </p>
                  <CardTitle className="text-3xl font-serif">{eventStats.totalEvents}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {locale === "fr" ? "Entrées totales dans le journal d’évènements." : "Total entries across the event journal."}
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="pb-2">
                  <p className="text-xs font-mono uppercase tracking-[0.24em] text-muted-foreground">
                    {locale === "fr" ? "Pays" : "Countries"}
                  </p>
                  <CardTitle className="text-3xl font-serif">{eventStats.distinctCountries}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {locale === "fr" ? "Pays différents couverts par des évènements." : "Distinct countries covered by events."}
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="pb-2">
                  <p className="text-xs font-mono uppercase tracking-[0.24em] text-muted-foreground">
                    {locale === "fr" ? "Villes" : "Cities"}
                  </p>
                  <CardTitle className="text-3xl font-serif">{eventStats.distinctCities}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {locale === "fr" ? "Villes distinctes dans les souvenirs d’évènements." : "Distinct cities represented in event memories."}
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="pb-2">
                  <p className="text-xs font-mono uppercase tracking-[0.24em] text-muted-foreground">
                    {locale === "fr" ? "Période" : "Timespan"}
                  </p>
                  <CardTitle className="text-3xl font-serif">
                    {eventStats.firstYear && eventStats.lastYear
                      ? `${eventStats.firstYear}–${eventStats.lastYear}`
                      : EMPTY_LABEL}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {locale === "fr" ? "Amplitude temporelle couverte par la collection." : "Temporal span covered by the collection."}
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="font-serif text-2xl">
                    {locale === "fr" ? "Densité des évènements dans le temps" : "Event density over time"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {eventStats.heatmapRows.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-[auto_repeat(12,minmax(0,1fr))_minmax(2.75rem,max-content)] gap-2 text-xs">
                        <div />
                        {EVENT_STATS_MONTHS.map((month) => (
                          <div key={month} className="text-center text-muted-foreground">
                            {formatDate(new Date(Date.UTC(2024, month, 1)), "monthYear").slice(0, 3)}
                          </div>
                        ))}
                        <div className="text-center text-muted-foreground">
                          {locale === "fr" ? "Total" : "Total"}
                        </div>

                        {eventStats.heatmapRows.map((row) => (
                          <div key={row.year} className="contents">
                            <div className="pr-2 text-sm font-medium text-foreground">{row.year}</div>
                            {row.months.map((month) => (
                              <div
                                key={`${row.year}-${month.month}`}
                                className={`flex aspect-square items-center justify-center rounded-md text-xs font-semibold transition-colors ${getStatsHeatmapIntensity(
                                  month.count,
                                  eventStats.maxHeatmapCount,
                                )}`}
                                title={`${row.year} · ${month.label} · ${month.count} ${locale === "fr" ? "évènements" : "events"}`}
                              >
                                {month.count > 0 ? month.count : ""}
                              </div>
                            ))}
                            <div className="flex items-center justify-center rounded-md bg-primary/10 px-2 text-xs font-semibold text-foreground">
                              {row.months.reduce((sum, month) => sum + month.count, 0)}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {locale === "fr"
                          ? "Plus la case est dense, plus le mois a concentré d’évènements."
                          : "Darker cells indicate months with more events."}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("noEntries")}</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="font-serif text-2xl">
                    {locale === "fr" ? "Répartition par catégorie" : "Category split"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {eventStats.categoryRows.length > 0 ? (
                    <ChartContainer
                      config={eventCategoryChartConfig}
                      className="h-[320px] w-full aspect-auto"
                    >
                      <BarChart
                        data={eventStats.categoryRows}
                        layout="vertical"
                        margin={{ left: 12, right: 12 }}
                      >
                        <CartesianGrid horizontal={false} />
                        <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                        <YAxis
                          type="category"
                          dataKey="label"
                          tickLine={false}
                          axisLine={false}
                          width={92}
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              hideLabel
                              formatter={(value) => (
                                <>
                                  <span className="text-muted-foreground">
                                    {locale === "fr" ? "Total :" : "Total:"}
                                  </span>
                                  <span className="font-mono font-medium tabular-nums text-foreground">
                                    {Number(value)} {locale === "fr" ? "évènements" : "events"}
                                  </span>
                                </>
                              )}
                            />
                          }
                        />
                        <Bar dataKey="count" radius={8}>
                          {eventStats.categoryRows.map((row) => (
                            <Cell key={row.key} fill={row.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("noEntries")}</p>
                  )}
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="font-serif text-2xl">
                    {locale === "fr" ? "Pays les plus présents" : "Top countries"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {eventStats.countryRows.length > 0 ? (
                    <ChartContainer
                      config={eventCountryChartConfig}
                      className="h-[340px] w-full aspect-auto"
                    >
                      <BarChart
                        data={eventStats.countryRows}
                        layout="vertical"
                        margin={{ left: 12, right: 12 }}
                      >
                        <CartesianGrid horizontal={false} />
                        <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                        <YAxis
                          type="category"
                          dataKey="country"
                          tickLine={false}
                          axisLine={false}
                          width={118}
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              hideLabel
                              formatter={(value, name, item) => (
                                <>
                                  <span className="text-muted-foreground">
                                    {item.payload.country}:
                                  </span>
                                  <span className="font-mono font-medium tabular-nums text-foreground">
                                    {Number(value)} {locale === "fr" ? "évènements" : "events"}
                                  </span>
                                </>
                              )}
                            />
                          }
                        />
                        <Bar dataKey="count" fill="var(--color-events)" radius={8} />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("noEntries")}</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="font-serif text-2xl">
                    {locale === "fr" ? "Progression running" : "Running progression"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {eventStats.runningProgressRows.length > 1 ? (
                    <ChartContainer
                      config={runningProgressChartConfig}
                      className="h-[340px] w-full aspect-auto"
                    >
                      <LineChart
                        data={eventStats.runningProgressRows}
                        margin={{ top: 12, right: 16, bottom: 12, left: 8 }}
                      >
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="eventDate"
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => String(value).slice(0, 4)}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          domain={[240, 480]}
                          tickFormatter={(value) => formatPaceFromSeconds(Number(value))}
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              labelFormatter={(_, payload) =>
                                payload?.[0]?.payload?.eventName ?? EMPTY_LABEL
                              }
                              formatter={(value, _, item) => (
                                <>
                                  <div className="space-y-1">
                                    <div className="text-muted-foreground">
                                      {formatDate(item.payload.eventDate, "short")}
                                    </div>
                                    <div className="text-muted-foreground">
                                      {(item.payload.distanceKm as number).toLocaleString(locale, {
                                        maximumFractionDigits: 1,
                                      })}{" "}
                                      km
                                    </div>
                                    <div className="text-muted-foreground">
                                      {item.payload.paceLabel}
                                    </div>
                                  </div>
                                  <span className="font-mono font-medium tabular-nums text-foreground">
                                    {formatPaceFromSeconds(Number(value))}
                                  </span>
                                </>
                              )}
                            />
                          }
                        />
                        <Line
                          type="monotone"
                          dataKey="tenKm"
                          name={locale === "fr" ? "10 km" : "10K"}
                          stroke="var(--color-tenKm)"
                          strokeWidth={2.5}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                          connectNulls
                        />
                        <Line
                          type="monotone"
                          dataKey="semiMarathon"
                          name={locale === "fr" ? "Semi-marathon" : "Half marathon"}
                          stroke="var(--color-semiMarathon)"
                          strokeWidth={2.5}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                          connectNulls
                        />
                        <Line
                          type="monotone"
                          dataKey="marathon"
                          name={locale === "fr" ? "Marathon" : "Marathon"}
                          stroke="var(--color-marathon)"
                          strokeWidth={2.5}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                          connectNulls
                        />
                      </LineChart>
                    </ChartContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {locale === "fr"
                        ? "Ajoute au moins deux courses chronométrées pour voir une progression."
                        : "Add at least two timed races to display a progression."}
                    </p>
                  )}
                </CardContent>
              </Card>
            </section>

            <section className="space-y-4">
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground">
                  {locale === "fr"
                    ? "Répartition des pays par type d’évènement"
                    : "Country share by event type"}
                </h2>
              </div>
              <div className="grid gap-6 xl:grid-cols-2">
                {eventStats.kindCountryDistribution.map((group) => (
                  <Card key={group.key} className="border-border/60">
                    <CardHeader>
                      <CardTitle className="font-serif text-xl">{group.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {group.rows.length > 0 ? (
                        <div className="space-y-3">
                          {group.rows.map((row) => (
                            <div key={`${group.key}-${row.countryCode}`} className="space-y-1">
                              <div className="flex items-center justify-between gap-4 text-sm">
                                <span className="font-medium text-foreground">{row.country}</span>
                                <span className="text-muted-foreground">
                                  {Math.round(row.share * 100)}% · {row.count}
                                </span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${row.share * 100}%`,
                                    backgroundColor: EVENT_CHART_COLORS[group.key],
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">{t("noEntries")}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground">
                  {locale === "fr"
                    ? "Répartition des compagnons par type d’évènement"
                    : "Companion share by event type"}
                </h2>
              </div>
              <div className="grid gap-6 xl:grid-cols-2">
                {eventStats.companionByKind.map((group) => (
                  <Card key={group.key} className="border-border/60">
                    <CardHeader>
                      <CardTitle className="font-serif text-xl">{group.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {group.rows.length > 0 ? (
                        <div className="space-y-3">
                          {group.rows.map((row) => (
                            <div key={`${group.key}-${row.person}`} className="space-y-1">
                              <div className="flex items-center justify-between gap-4 text-sm">
                                <span className="font-medium text-foreground">{row.person}</span>
                                <span className="text-muted-foreground">
                                  {Math.round(row.share * 100)}% · {row.count}
                                </span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${row.share * 100}%`,
                                    backgroundColor: EVENT_CHART_COLORS[group.key],
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">{t("noEntries")}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground">Top 5</h2>
              </div>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                <TopListCard
                  title={locale === "fr" ? "Salles de concerts les plus fréquentées" : "Most visited concert venues"}
                  rows={eventStats.topConcertVenues}
                  emptyLabel={t("noEntries")}
                />
                <TopListCard
                  title={locale === "fr" ? "Stades les plus fréquentés" : "Most visited stadiums"}
                  rows={eventStats.topSportVenues}
                  emptyLabel={t("noEntries")}
                />
                <TopListCard
                  title={locale === "fr" ? "Groupes les plus vus" : "Most seen artists"}
                  rows={eventStats.topArtists}
                  emptyLabel={t("noEntries")}
                />
                <TopListCard
                  title={locale === "fr" ? "Genres les plus vus en concert" : "Most seen music genres"}
                  rows={eventStats.topGenres}
                  emptyLabel={t("noEntries")}
                />
                <TopListCard
                  title={locale === "fr" ? "Équipes les plus vues" : "Most seen teams"}
                  rows={eventStats.topTeams}
                  emptyLabel={t("noEntries")}
                />
                <TopListCard
                  title={locale === "fr" ? "Années avec le plus d’évènements distincts" : "Years with the most distinct events"}
                  rows={eventStats.yearRows}
                  emptyLabel={t("noEntries")}
                />
                <TopListCard
                  title={locale === "fr" ? "Pays où tu as vu le plus d’évènements" : "Countries with the most events"}
                  rows={eventStats.topCountries}
                  emptyLabel={t("noEntries")}
                />
                <TopListCard
                  title={locale === "fr" ? "Villes où tu as vu le plus d’évènements" : "Cities with the most events"}
                  rows={eventStats.cityRows}
                  emptyLabel={t("noEntries")}
                />
                <TopListCard
                  title={locale === "fr" ? "Personnes qui ont fait le plus d’évènements avec toi" : "People who attended the most events with you"}
                  rows={eventStats.topCompanions}
                  emptyLabel={t("noEntries")}
                />
              </div>
            </section>
          </div>
        ) : null}

        {!isLoading && !hasError && view === "concerts" ? (
          <Card>
            <CardHeader className="space-y-6">
              <SectionTitle
                title={locale === "fr" ? "Concerts" : "Concerts"}
                count={filteredConcerts.length}
                titleClassName="text-rose-700"
              />
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <MultiSelectFilter
                  label={locale === "fr" ? "Années" : "Years"}
                  placeholder={locale === "fr" ? "Années" : "Years"}
                  options={concertOptions.years.map((option) => ({
                    value: option.value,
                    label: buildFilterLabel(option.text, option.count),
                    triggerLabel: option.text,
                  }))}
                  selectedValues={concertFilters.year}
                  onChange={(year) => setConcertFilters((current) => ({ ...current, year }))}
                  className="w-full"
                />
                <MultiSelectFilter
                  label={locale === "fr" ? "Villes" : "Cities"}
                  placeholder={locale === "fr" ? "Villes" : "Cities"}
                  options={concertOptions.cities.map((option) => ({
                    value: option.value,
                    label: buildFilterLabel(option.text, option.count),
                    triggerLabel: option.text,
                  }))}
                  selectedValues={concertFilters.city}
                  onChange={(city) => setConcertFilters((current) => ({ ...current, city }))}
                  className="w-full"
                />
                <MultiSelectFilter
                  label={locale === "fr" ? "Pays" : "Countries"}
                  placeholder={locale === "fr" ? "Tous les pays" : "All countries"}
                  options={concertOptions.countries.map((option) => ({
                    value: option.value,
                    label: buildFilterLabel(option.text, option.count),
                    triggerLabel: option.text,
                  }))}
                  selectedValues={concertFilters.country}
                  onChange={(country) => setConcertFilters((current) => ({ ...current, country }))}
                  className="w-full"
                />
                <MultiSelectFilter
                  label={locale === "fr" ? "Compagnons" : "Companions"}
                  placeholder={locale === "fr" ? "Tous les compagnons" : "All companions"}
                  options={concertOptions.companions.map((option) => ({
                    value: option.value,
                    label: buildFilterLabel(option.text, option.count),
                    triggerLabel: option.text,
                  }))}
                  selectedValues={concertFilters.companion}
                  onChange={(companion) =>
                    setConcertFilters((current) => ({ ...current, companion }))
                  }
                  className="w-full"
                />
                <MultiSelectFilter
                  label={locale === "fr" ? "Groupes" : "Artists"}
                  placeholder={locale === "fr" ? "Groupes" : "Artists"}
                  options={concertOptions.artists.map((option) => ({
                    value: option.value,
                    label: buildFilterLabel(option.text, option.count),
                    triggerLabel: option.text,
                  }))}
                  selectedValues={concertFilters.artist}
                  onChange={(artist) => setConcertFilters((current) => ({ ...current, artist }))}
                  className="w-full"
                />
                <MultiSelectFilter
                  label={locale === "fr" ? "Evènements" : "Events"}
                  placeholder={locale === "fr" ? "Evènements" : "Events"}
                  options={concertOptions.eventNames.map((option) => ({
                    value: option.value,
                    label: buildFilterLabel(option.text, option.count),
                    triggerLabel: option.text,
                  }))}
                  selectedValues={concertFilters.eventName}
                  onChange={(eventName) =>
                    setConcertFilters((current) => ({ ...current, eventName }))
                  }
                  className="w-full"
                />
                <MultiSelectFilter
                  label={locale === "fr" ? "Genres" : "Genres"}
                  placeholder={locale === "fr" ? "Tous les genres" : "All genres"}
                  options={concertOptions.genres.map((option) => ({
                    value: option.value,
                    label: buildFilterLabel(option.text, option.count),
                    triggerLabel: option.text,
                  }))}
                  selectedValues={concertFilters.genre}
                  onChange={(genre) => setConcertFilters((current) => ({ ...current, genre }))}
                  className="w-full"
                />
                <Input
                  value={concertFilters.keyword}
                  onChange={(event) =>
                    setConcertFilters((current) => ({ ...current, keyword: event.target.value }))
                  }
                  className="h-10"
                  placeholder={locale === "fr" ? "Recherche libre" : "Keyword search"}
                />
              </div>
              <div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setConcertFilters(DEFAULT_CONCERT_FILTERS)}
                >
                  {t("clearFilters")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <SortHeaderButton
                        label={locale === "fr" ? "Date" : "Date"}
                        onClick={() => toggleConcertSort("eventDate")}
                      />
                    </TableHead>
                    <TableHead>
                      <SortHeaderButton
                        label={locale === "fr" ? "Groupe" : "Artist"}
                        onClick={() => toggleConcertSort("artist")}
                      />
                    </TableHead>
                    <TableHead className="w-[180px]">
                      <SortHeaderButton
                        label={locale === "fr" ? "Evènement" : "Event"}
                        onClick={() => toggleConcertSort("eventName")}
                      />
                    </TableHead>
                    <TableHead>
                      <SortHeaderButton
                        label={locale === "fr" ? "Genre" : "Genre"}
                        onClick={() => toggleConcertSort("genre")}
                      />
                    </TableHead>
                    <TableHead>
                      <SortHeaderButton
                        label={locale === "fr" ? "Lieu / salle" : "Venue"}
                        onClick={() => toggleConcertSort("venue")}
                      />
                    </TableHead>
                    <TableHead>
                      <SortHeaderButton
                        label={locale === "fr" ? "Ville" : "City"}
                        onClick={() => toggleConcertSort("city")}
                      />
                    </TableHead>
                    <TableHead>
                      <SortHeaderButton
                        label={locale === "fr" ? "Pays" : "Country"}
                        onClick={() => toggleConcertSort("country")}
                      />
                    </TableHead>
                    <TableHead>{locale === "fr" ? "Détails" : "Details"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConcerts.length ? (
                    filteredConcerts.map((concert) => (
                      <TableRow key={concert.id}>
                        <TableCell>{formatDate(concert.eventDate, "short")}</TableCell>
                        <TableCell className="font-medium">
                          <Link
                            href={getEventDetailHref("concerts", concert.id)}
                            className="underline decoration-[rgba(20,70,90,0.22)] underline-offset-4 transition-colors hover:text-primary"
                          >
                            {concert.artist}
                          </Link>
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate">
                          {concert.eventName || EMPTY_LABEL}
                        </TableCell>
                        <TableCell>
                          {formatConcertGenreLabel(concert.genre, concert.subgenre, locale) || EMPTY_LABEL}
                        </TableCell>
                        <TableCell>{concert.venue || EMPTY_LABEL}</TableCell>
                        <TableCell>{concert.city || EMPTY_LABEL}</TableCell>
                        <TableCell>
                          {concert.countryCode ? countryName(concert.countryCode) : EMPTY_LABEL}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={getEventDetailHref("concerts", concert.id)}
                            className="inline-flex items-center gap-1 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                          >
                            {locale === "fr" ? "Voir la fiche" : "View details"}
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                        {t("noEntries")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !hasError && view === "sport-events" ? (
          <Card>
            <CardHeader className="space-y-6">
              <SectionTitle
                title={locale === "fr" ? "Evènements sportifs" : "Sport events"}
                count={filteredSportEvents.length}
                titleClassName="text-blue-700"
              />
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <MultiSelectFilter
                  label={locale === "fr" ? "Années" : "Years"}
                  placeholder={locale === "fr" ? "Années" : "Years"}
                  options={sportOptions.years.map((option) => ({
                    value: option.value,
                    label: buildFilterLabel(option.text, option.count),
                    triggerLabel: option.text,
                  }))}
                  selectedValues={sportFilters.year}
                  onChange={(year) => setSportFilters((current) => ({ ...current, year }))}
                  className="w-full"
                />
                <MultiSelectFilter
                  label={locale === "fr" ? "Villes" : "Cities"}
                  placeholder={locale === "fr" ? "Villes" : "Cities"}
                  options={sportOptions.cities.map((option) => ({
                    value: option.value,
                    label: buildFilterLabel(option.text, option.count),
                    triggerLabel: option.text,
                  }))}
                  selectedValues={sportFilters.city}
                  onChange={(city) => setSportFilters((current) => ({ ...current, city }))}
                  className="w-full"
                />
                <MultiSelectFilter
                  label={locale === "fr" ? "Pays" : "Countries"}
                  placeholder={locale === "fr" ? "Tous les pays" : "All countries"}
                  options={sportOptions.countries.map((option) => ({
                    value: option.value,
                    label: buildFilterLabel(option.text, option.count),
                    triggerLabel: option.text,
                  }))}
                  selectedValues={sportFilters.country}
                  onChange={(country) => setSportFilters((current) => ({ ...current, country }))}
                  className="w-full"
                />
                <MultiSelectFilter
                  label={locale === "fr" ? "Compagnons" : "Companions"}
                  placeholder={locale === "fr" ? "Tous les compagnons" : "All companions"}
                  options={sportOptions.companions.map((option) => ({
                    value: option.value,
                    label: buildFilterLabel(option.text, option.count),
                    triggerLabel: option.text,
                  }))}
                  selectedValues={sportFilters.companion}
                  onChange={(companion) => setSportFilters((current) => ({ ...current, companion }))}
                  className="w-full"
                />
                <MultiSelectFilter
                  label={locale === "fr" ? "Sports" : "Sports"}
                  placeholder={locale === "fr" ? "Tous les sports" : "All sports"}
                  options={sportOptions.sports.map((option) => ({
                    value: option.value,
                    label: buildFilterLabel(option.text, option.count),
                    triggerLabel: option.text,
                  }))}
                  selectedValues={sportFilters.sport}
                  onChange={(sport) => setSportFilters((current) => ({ ...current, sport }))}
                  className="w-full"
                />
                <MultiSelectFilter
                  label={locale === "fr" ? "Compétitions" : "Competitions"}
                  placeholder={locale === "fr" ? "Compétitions" : "Competitions"}
                  options={sportOptions.competitions.map((option) => ({
                    value: option.value,
                    label: buildFilterLabel(option.text, option.count),
                    triggerLabel: option.text,
                  }))}
                  selectedValues={sportFilters.competition}
                  onChange={(competition) =>
                    setSportFilters((current) => ({ ...current, competition }))
                  }
                  className="w-full"
                />
                <MultiSelectFilter
                  label={locale === "fr" ? "Stades" : "Venues"}
                  placeholder={locale === "fr" ? "Stades" : "Venues"}
                  options={sportOptions.venues.map((option) => ({
                    value: option.value,
                    label: buildFilterLabel(option.text, option.count),
                    triggerLabel: option.text,
                  }))}
                  selectedValues={sportFilters.venue}
                  onChange={(venue) => setSportFilters((current) => ({ ...current, venue }))}
                  className="w-full"
                />
                <Input
                  value={sportFilters.keyword}
                  onChange={(event) =>
                    setSportFilters((current) => ({ ...current, keyword: event.target.value }))
                  }
                  className="h-10"
                  placeholder={locale === "fr" ? "Recherche libre" : "Keyword search"}
                />
              </div>
              <div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSportFilters(DEFAULT_SPORT_FILTERS)}
                >
                  {t("clearFilters")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <SortHeaderButton
                        label={locale === "fr" ? "Date" : "Date"}
                        onClick={() => toggleSportSort("eventDate")}
                      />
                    </TableHead>
                    <TableHead>
                      <SortHeaderButton
                        label={locale === "fr" ? "Sport" : "Sport"}
                        onClick={() => toggleSportSort("sport")}
                      />
                    </TableHead>
                    <TableHead>
                      <SortHeaderButton
                        label={locale === "fr" ? "Compétition" : "Competition"}
                        onClick={() => toggleSportSort("competition")}
                      />
                    </TableHead>
                    <TableHead>{locale === "fr" ? "Affiche" : "Matchup"}</TableHead>
                    <TableHead>
                      <SortHeaderButton
                        label={locale === "fr" ? "Stade" : "Venue"}
                        onClick={() => toggleSportSort("venue")}
                      />
                    </TableHead>
                    <TableHead>
                      <SortHeaderButton
                        label={locale === "fr" ? "Ville" : "City"}
                        onClick={() => toggleSportSort("city")}
                      />
                    </TableHead>
                    <TableHead>
                      <SortHeaderButton
                        label={locale === "fr" ? "Pays" : "Country"}
                        onClick={() => toggleSportSort("country")}
                      />
                    </TableHead>
                    <TableHead>{locale === "fr" ? "Détails" : "Details"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSportEvents.length ? (
                    filteredSportEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>{formatDate(event.eventDate, "short")}</TableCell>
                        <TableCell className="font-medium">
                          <Link
                            href={getEventDetailHref("sport-events", event.id)}
                            className="underline decoration-[rgba(20,70,90,0.22)] underline-offset-4 transition-colors hover:text-primary"
                          >
                            {formatSportLabelLowercase(event.sport, locale)}
                          </Link>
                        </TableCell>
                        <TableCell>{event.competition || EMPTY_LABEL}</TableCell>
                        <TableCell>
                          {[event.homeTeam, event.awayTeam].filter(Boolean).join(" vs ") || EMPTY_LABEL}
                        </TableCell>
                        <TableCell>{event.venue || EMPTY_LABEL}</TableCell>
                        <TableCell>{event.city || EMPTY_LABEL}</TableCell>
                        <TableCell>
                          {event.countryCode ? countryName(event.countryCode) : EMPTY_LABEL}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={getEventDetailHref("sport-events", event.id)}
                            className="inline-flex items-center gap-1 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                          >
                            {locale === "fr" ? "Voir la fiche" : "View details"}
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                        {t("noEntries")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !hasError && view === "tech-events" ? (
          <Card>
            <CardHeader className="space-y-6">
              <SectionTitle
                title={locale === "fr" ? "Evènements tech" : "Tech events"}
                count={filteredTechEvents.length}
                titleClassName="text-violet-700"
              />
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <MultiSelectFilter
                  label={locale === "fr" ? "Années" : "Years"}
                  placeholder={locale === "fr" ? "Années" : "Years"}
                  options={techEventOptions.years.map((option) => ({
                    value: option.value,
                    label: buildFilterLabel(option.text, option.count),
                    triggerLabel: option.text,
                  }))}
                  selectedValues={techEventFilters.year}
                  onChange={(year) => setTechEventFilters((current) => ({ ...current, year }))}
                  className="w-full"
                />
                <MultiSelectFilter
                  label={locale === "fr" ? "Villes" : "Cities"}
                  placeholder={locale === "fr" ? "Villes" : "Cities"}
                  options={techEventOptions.cities.map((option) => ({
                    value: option.value,
                    label: buildFilterLabel(option.text, option.count),
                    triggerLabel: option.text,
                  }))}
                  selectedValues={techEventFilters.city}
                  onChange={(city) => setTechEventFilters((current) => ({ ...current, city }))}
                  className="w-full"
                />
                <MultiSelectFilter
                  label={locale === "fr" ? "Pays" : "Countries"}
                  placeholder={locale === "fr" ? "Tous les pays" : "All countries"}
                  options={techEventOptions.countries.map((option) => ({
                    value: option.value,
                    label: buildFilterLabel(option.text, option.count),
                    triggerLabel: option.text,
                  }))}
                  selectedValues={techEventFilters.country}
                  onChange={(country) => setTechEventFilters((current) => ({ ...current, country }))}
                  className="w-full"
                />
                <MultiSelectFilter
                  label={locale === "fr" ? "Compagnons" : "Companions"}
                  placeholder={locale === "fr" ? "Tous les compagnons" : "All companions"}
                  options={techEventOptions.companions.map((option) => ({
                    value: option.value,
                    label: buildFilterLabel(option.text, option.count),
                    triggerLabel: option.text,
                  }))}
                  selectedValues={techEventFilters.companion}
                  onChange={(companion) => setTechEventFilters((current) => ({ ...current, companion }))}
                  className="w-full"
                />
                <MultiSelectFilter
                  label={locale === "fr" ? "Evènements" : "Events"}
                  placeholder={locale === "fr" ? "Evènements" : "Events"}
                  options={techEventOptions.eventNames.map((option) => ({
                    value: option.value,
                    label: buildFilterLabel(option.text, option.count),
                    triggerLabel: option.text,
                  }))}
                  selectedValues={techEventFilters.eventName}
                  onChange={(eventName) => setTechEventFilters((current) => ({ ...current, eventName }))}
                  className="w-full"
                />
                <Input
                  value={techEventFilters.keyword}
                  onChange={(event) =>
                    setTechEventFilters((current) => ({ ...current, keyword: event.target.value }))
                  }
                  className="h-10"
                  placeholder={locale === "fr" ? "Recherche libre" : "Keyword search"}
                />
              </div>
              <div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setTechEventFilters(DEFAULT_TECH_EVENT_FILTERS)}
                >
                  {t("clearFilters")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <SortHeaderButton
                        label={locale === "fr" ? "Début" : "Start"}
                        onClick={() => toggleTechEventSort("startDate")}
                      />
                    </TableHead>
                    <TableHead>
                      <SortHeaderButton
                        label={locale === "fr" ? "Fin" : "End"}
                        onClick={() => toggleTechEventSort("endDate")}
                      />
                    </TableHead>
                    <TableHead>
                      <SortHeaderButton
                        label={locale === "fr" ? "Evènement" : "Event"}
                        onClick={() => toggleTechEventSort("eventName")}
                      />
                    </TableHead>
                    <TableHead>
                      <SortHeaderButton
                        label={locale === "fr" ? "Ville" : "City"}
                        onClick={() => toggleTechEventSort("city")}
                      />
                    </TableHead>
                    <TableHead>
                      <SortHeaderButton
                        label={locale === "fr" ? "Pays" : "Country"}
                        onClick={() => toggleTechEventSort("country")}
                      />
                    </TableHead>
                    <TableHead>{locale === "fr" ? "Détails" : "Details"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTechEvents.length ? (
                    filteredTechEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>{formatDate(event.startDate, "short")}</TableCell>
                        <TableCell>{formatDate(event.endDate, "short")}</TableCell>
                        <TableCell className="font-medium">
                          <Link
                            href={getEventDetailHref("tech-events", event.id)}
                            className="underline decoration-[rgba(20,70,90,0.22)] underline-offset-4 transition-colors hover:text-primary"
                          >
                            {event.eventName}
                          </Link>
                        </TableCell>
                        <TableCell>{event.city || EMPTY_LABEL}</TableCell>
                        <TableCell>{event.countryCode ? countryName(event.countryCode) : EMPTY_LABEL}</TableCell>
                        <TableCell>
                          <Link
                            href={getEventDetailHref("tech-events", event.id)}
                            className="inline-flex items-center gap-1 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                          >
                            {locale === "fr" ? "Voir la fiche" : "View details"}
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        {t("noEntries")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !hasError && view === "running" ? (
          <Card>
            <CardHeader className="space-y-6">
              <SectionTitle
                title={locale === "fr" ? "Running" : "Running"}
                count={filteredRunning.length}
                titleClassName="text-amber-700"
              />
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <MultiSelectFilter
                  label={locale === "fr" ? "Années" : "Years"}
                  placeholder={locale === "fr" ? "Années" : "Years"}
                  options={runningOptions.years.map((option) => ({
                    value: option.value,
                    label: buildFilterLabel(option.text, option.count),
                    triggerLabel: option.text,
                  }))}
                  selectedValues={runningFilters.year}
                  onChange={(year) => setRunningFilters((current) => ({ ...current, year }))}
                  className="w-full"
                />
                <MultiSelectFilter
                  label={locale === "fr" ? "Villes" : "Cities"}
                  placeholder={locale === "fr" ? "Villes" : "Cities"}
                  options={runningOptions.cities.map((option) => ({
                    value: option.value,
                    label: buildFilterLabel(option.text, option.count),
                    triggerLabel: option.text,
                  }))}
                  selectedValues={runningFilters.city}
                  onChange={(city) => setRunningFilters((current) => ({ ...current, city }))}
                  className="w-full"
                />
                <MultiSelectFilter
                  label={locale === "fr" ? "Pays" : "Countries"}
                  placeholder={locale === "fr" ? "Tous les pays" : "All countries"}
                  options={runningOptions.countries.map((option) => ({
                    value: option.value,
                    label: buildFilterLabel(option.text, option.count),
                    triggerLabel: option.text,
                  }))}
                  selectedValues={runningFilters.country}
                  onChange={(country) => setRunningFilters((current) => ({ ...current, country }))}
                  className="w-full"
                />
                <MultiSelectFilter
                  label={locale === "fr" ? "Compagnons" : "Companions"}
                  placeholder={locale === "fr" ? "Tous les compagnons" : "All companions"}
                  options={runningOptions.companions.map((option) => ({
                    value: option.value,
                    label: buildFilterLabel(option.text, option.count),
                    triggerLabel: option.text,
                  }))}
                  selectedValues={runningFilters.companion}
                  onChange={(companion) => setRunningFilters((current) => ({ ...current, companion }))}
                  className="w-full"
                />
                <MultiSelectFilter
                  label={locale === "fr" ? "Epreuves" : "Races"}
                  placeholder={locale === "fr" ? "Epreuves" : "Races"}
                  options={runningOptions.eventNames.map((option) => ({
                    value: option.value,
                    label: buildFilterLabel(option.text, option.count),
                    triggerLabel: option.text,
                  }))}
                  selectedValues={runningFilters.eventName}
                  onChange={(eventName) => setRunningFilters((current) => ({ ...current, eventName }))}
                  className="w-full"
                />
                <Input
                  value={runningFilters.keyword}
                  onChange={(event) =>
                    setRunningFilters((current) => ({ ...current, keyword: event.target.value }))
                  }
                  className="h-10"
                  placeholder={locale === "fr" ? "Recherche libre" : "Keyword search"}
                />
              </div>
              <div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setRunningFilters(DEFAULT_RUNNING_FILTERS)}
                >
                  {t("clearFilters")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <SortHeaderButton
                        label={locale === "fr" ? "Date" : "Date"}
                        onClick={() => toggleRunningSort("eventDate")}
                      />
                    </TableHead>
                    <TableHead>
                      <SortHeaderButton
                        label={locale === "fr" ? "Epreuve" : "Race"}
                        onClick={() => toggleRunningSort("eventName")}
                      />
                    </TableHead>
                    <TableHead>
                      <SortHeaderButton
                        label={locale === "fr" ? "Distance" : "Distance"}
                        onClick={() => toggleRunningSort("distanceKm")}
                      />
                    </TableHead>
                    <TableHead>
                      <SortHeaderButton
                        label={locale === "fr" ? "Temps" : "Time"}
                        onClick={() => toggleRunningSort("duration")}
                      />
                    </TableHead>
                    <TableHead>{locale === "fr" ? "Moyenne" : "Pace"}</TableHead>
                    <TableHead>
                      <SortHeaderButton
                        label={locale === "fr" ? "Ville" : "City"}
                        onClick={() => toggleRunningSort("city")}
                      />
                    </TableHead>
                    <TableHead>
                      <SortHeaderButton
                        label={locale === "fr" ? "Pays" : "Country"}
                        onClick={() => toggleRunningSort("country")}
                      />
                    </TableHead>
                    <TableHead>{locale === "fr" ? "Détails" : "Details"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRunning.length ? (
                    filteredRunning.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>{formatDate(event.eventDate, "short")}</TableCell>
                        <TableCell className="font-medium">
                          <Link
                            href={getEventDetailHref("running", event.id)}
                            className="underline decoration-[rgba(20,70,90,0.22)] underline-offset-4 transition-colors hover:text-primary"
                          >
                            {event.eventName}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {event.distanceKm != null ? `${event.distanceKm} km` : EMPTY_LABEL}
                        </TableCell>
                        <TableCell>{event.duration || EMPTY_LABEL}</TableCell>
                        <TableCell>{event.averagePace}</TableCell>
                        <TableCell>{event.city || EMPTY_LABEL}</TableCell>
                        <TableCell>{event.countryCode ? countryName(event.countryCode) : EMPTY_LABEL}</TableCell>
                        <TableCell>
                          <Link
                            href={getEventDetailHref("running", event.id)}
                            className="inline-flex items-center gap-1 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                          >
                            {locale === "fr" ? "Voir la fiche" : "View details"}
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                        {t("noEntries")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !hasError && view === "weddings" ? (
          <Card>
            <CardHeader className="space-y-6">
              <SectionTitle
                title={locale === "fr" ? "Mariages" : "Weddings"}
                count={filteredWeddings.length}
                titleClassName="text-emerald-700"
              />
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <MultiSelectFilter
                  label={locale === "fr" ? "Années" : "Years"}
                  placeholder={locale === "fr" ? "Années" : "Years"}
                  options={weddingOptions.years.map((option) => ({
                    value: option.value,
                    label: buildFilterLabel(option.text, option.count),
                    triggerLabel: option.text,
                  }))}
                  selectedValues={weddingFilters.year}
                  onChange={(year) => setWeddingFilters((current) => ({ ...current, year }))}
                  className="w-full"
                />
                <MultiSelectFilter
                  label={locale === "fr" ? "Villes" : "Cities"}
                  placeholder={locale === "fr" ? "Villes" : "Cities"}
                  options={weddingOptions.cities.map((option) => ({
                    value: option.value,
                    label: buildFilterLabel(option.text, option.count),
                    triggerLabel: option.text,
                  }))}
                  selectedValues={weddingFilters.city}
                  onChange={(city) => setWeddingFilters((current) => ({ ...current, city }))}
                  className="w-full"
                />
                <MultiSelectFilter
                  label={locale === "fr" ? "Pays" : "Countries"}
                  placeholder={locale === "fr" ? "Tous les pays" : "All countries"}
                  options={weddingOptions.countries.map((option) => ({
                    value: option.value,
                    label: buildFilterLabel(option.text, option.count),
                    triggerLabel: option.text,
                  }))}
                  selectedValues={weddingFilters.country}
                  onChange={(country) => setWeddingFilters((current) => ({ ...current, country }))}
                  className="w-full"
                />
                <MultiSelectFilter
                  label={locale === "fr" ? "Compagnons" : "Companions"}
                  placeholder={locale === "fr" ? "Tous les compagnons" : "All companions"}
                  options={weddingOptions.companions.map((option) => ({
                    value: option.value,
                    label: buildFilterLabel(option.text, option.count),
                    triggerLabel: option.text,
                  }))}
                  selectedValues={weddingFilters.companion}
                  onChange={(companion) => setWeddingFilters((current) => ({ ...current, companion }))}
                  className="w-full"
                />
                <Input
                  value={weddingFilters.keyword}
                  onChange={(event) =>
                    setWeddingFilters((current) => ({ ...current, keyword: event.target.value }))
                  }
                  className="h-10"
                  placeholder={locale === "fr" ? "Recherche libre" : "Keyword search"}
                />
              </div>
              <div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setWeddingFilters(DEFAULT_WEDDING_FILTERS)}
                >
                  {t("clearFilters")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <SortHeaderButton
                        label={locale === "fr" ? "Date" : "Date"}
                        onClick={() => toggleWeddingSort("visitedAt")}
                      />
                    </TableHead>
                    <TableHead>
                      <SortHeaderButton
                        label={locale === "fr" ? "Mariés" : "Married people"}
                        onClick={() => toggleWeddingSort("marriedPeople")}
                      />
                    </TableHead>
                    <TableHead>
                      <SortHeaderButton
                        label={locale === "fr" ? "Ville" : "City"}
                        onClick={() => toggleWeddingSort("city")}
                      />
                    </TableHead>
                    <TableHead>
                      <SortHeaderButton
                        label={locale === "fr" ? "Pays" : "Country"}
                        onClick={() => toggleWeddingSort("country")}
                      />
                    </TableHead>
                    <TableHead>{locale === "fr" ? "Détails" : "Details"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWeddings.length ? (
                    filteredWeddings.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>{formatDate(event.visitedAt, "short")}</TableCell>
                        <TableCell className="font-medium">
                          <Link
                            href={getEventDetailHref("weddings", event.id)}
                            className="underline decoration-[rgba(20,70,90,0.22)] underline-offset-4 transition-colors hover:text-primary"
                          >
                            {event.marriedPeople}
                          </Link>
                        </TableCell>
                        <TableCell>{event.city || EMPTY_LABEL}</TableCell>
                        <TableCell>{countryName(event.countryCode)}</TableCell>
                        <TableCell>
                          <Link
                            href={getEventDetailHref("weddings", event.id)}
                            className="inline-flex items-center gap-1 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                          >
                            {locale === "fr" ? "Voir la fiche" : "View details"}
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        {t("noEntries")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </Layout>
  );
}
