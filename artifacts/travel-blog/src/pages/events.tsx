import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowUpDown, ExternalLink } from "lucide-react";
import { MultiSelectFilter } from "@/components/multi-select-filter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  | "weddings";
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

const EMPTY_LABEL = "—";

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
}: {
  title: string;
  count: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <CardTitle className="text-2xl font-serif">{title}</CardTitle>
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

function ViewSwitcher({
  value,
  onChange,
  labels,
}: {
  value: EventView;
  onChange: (value: EventView) => void;
  labels: Record<EventView, string>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(labels) as EventView[]).map((option) => (
        <Button
          key={option}
          type="button"
          variant={value === option ? "default" : "outline"}
          onClick={() => onChange(option)}
          className={cn("rounded-full", value === option && "shadow-sm")}
        >
          {labels[option]}
        </Button>
      ))}
    </div>
  );
}

export default function EventsPage() {
  const { t, formatDate, countryName, locale } = useI18n();
  const concertsQuery = useConcertsQuery();
  const runningQuery = useRunningQuery();
  const sportEventsQuery = useSportEventsQuery();
  const techEventsQuery = useTechEventsQuery();
  const weddingsQuery = useWeddingsQuery();
  const [view, setView] = useState<EventView>("all");
  const [concertFilters, setConcertFilters] = useState<ConcertFilters>(DEFAULT_CONCERT_FILTERS);
  const [runningFilters, setRunningFilters] = useState<RunningFilters>(DEFAULT_RUNNING_FILTERS);
  const [sportFilters, setSportFilters] = useState<SportFilters>(DEFAULT_SPORT_FILTERS);
  const [techEventFilters, setTechEventFilters] = useState<TechEventFilters>(DEFAULT_TECH_EVENT_FILTERS);
  const [weddingFilters, setWeddingFilters] = useState<WeddingFilters>(DEFAULT_WEDDING_FILTERS);

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
    all: locale === "fr" ? "Tous" : "All",
    concerts: locale === "fr" ? "Concerts" : "Concerts",
    "sport-events": locale === "fr" ? "Evènements sportifs" : "Sport events",
    "tech-events": locale === "fr" ? "Evènements tech" : "Tech events",
    running: locale === "fr" ? "Running" : "Running",
    weddings: locale === "fr" ? "Mariages" : "Weddings",
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
          <ViewSwitcher value={view} onChange={setView} labels={viewLabels} />
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

        {!isLoading && !hasError && (view === "all" || view === "concerts") ? (
          <Card>
            <CardHeader className="space-y-6">
              <SectionTitle
                title={locale === "fr" ? "Concerts" : "Concerts"}
                count={filteredConcerts.length}
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

        {!isLoading && !hasError && (view === "all" || view === "sport-events") ? (
          <Card>
            <CardHeader className="space-y-6">
              <SectionTitle
                title={locale === "fr" ? "Evènements sportifs" : "Sport events"}
                count={filteredSportEvents.length}
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

        {!isLoading && !hasError && (view === "all" || view === "tech-events") ? (
          <Card>
            <CardHeader className="space-y-6">
              <SectionTitle
                title={locale === "fr" ? "Evènements tech" : "Tech events"}
                count={filteredTechEvents.length}
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

        {!isLoading && !hasError && (view === "all" || view === "running") ? (
          <Card>
            <CardHeader className="space-y-6">
              <SectionTitle
                title={locale === "fr" ? "Running" : "Running"}
                count={filteredRunning.length}
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

        {!isLoading && !hasError && (view === "all" || view === "weddings") ? (
          <Card>
            <CardHeader className="space-y-6">
              <SectionTitle
                title={locale === "fr" ? "Mariages" : "Weddings"}
                count={filteredWeddings.length}
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
