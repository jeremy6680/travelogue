import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowUpDown, ExternalLink } from "lucide-react";
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
  useSportEventsQuery,
  useWeddingsQuery,
} from "@/lib/directus";
import { getEventDetailHref } from "@/lib/event-links";
import { useI18n } from "@/lib/i18n";
import type { Concert, SportEvent, Wedding } from "@/lib/travel-types";
import { cn } from "@/lib/utils";

type EventView = "all" | "concerts" | "sport-events" | "weddings";
type SortDirection = "asc" | "desc";

type ConcertFilters = {
  year: string;
  city: string;
  country: string;
  artist: string;
  eventName: string;
  genre: string;
  companion: string;
  keyword: string;
  sortBy: "eventDate" | "city" | "country" | "artist" | "eventName" | "genre";
  sortDirection: SortDirection;
};

type SportFilters = {
  year: string;
  city: string;
  country: string;
  sport: string;
  competition: string;
  companion: string;
  keyword: string;
  sortBy: "eventDate" | "city" | "country" | "sport" | "competition";
  sortDirection: SortDirection;
};

type WeddingFilters = {
  year: string;
  city: string;
  country: string;
  companion: string;
  sortBy: "visitedAt" | "city" | "country" | "marriedPeople";
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

const EMPTY_LABEL = "—";

const DEFAULT_CONCERT_FILTERS: ConcertFilters = {
  year: "",
  city: "",
  country: "",
  artist: "",
  eventName: "",
  genre: "",
  companion: "",
  keyword: "",
  sortBy: "eventDate",
  sortDirection: "desc",
};

const DEFAULT_SPORT_FILTERS: SportFilters = {
  year: "",
  city: "",
  country: "",
  sport: "",
  competition: "",
  companion: "",
  keyword: "",
  sortBy: "eventDate",
  sortDirection: "desc",
};

const DEFAULT_WEDDING_FILTERS: WeddingFilters = {
  year: "",
  city: "",
  country: "",
  companion: "",
  sortBy: "visitedAt",
  sortDirection: "desc",
};

function getYear(value: string | null | undefined) {
  return value?.slice(0, 4) ?? "";
}

function normalizeValue(value: string | null | undefined) {
  return value?.trim().toLocaleLowerCase() ?? "";
}

function includesValue(source: string | null | undefined, query: string) {
  if (!query) return true;
  return normalizeValue(source).includes(normalizeValue(query));
}

function getUniqueValues(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => value?.trim()).filter(Boolean) as string[])].toSorted(
    (left, right) => left.localeCompare(right, "fr"),
  );
}

function getConcertCountry(concert: Concert) {
  return concert.countryCode ?? "";
}

function getConcertGenreLabel(concert: Pick<Concert, "genre" | "subgenre">) {
  if (concert.genre === "rock" && concert.subgenre) {
    return concert.subgenre;
  }

  return concert.genre ?? "";
}

function getSportCountry(event: SportEvent) {
  return event.countryCode ?? "";
}

function getWeddingCountry(event: WeddingRow) {
  return event.countryCode;
}

function compareValues(left: string, right: string, direction: SortDirection) {
  const factor = direction === "asc" ? 1 : -1;
  return left.localeCompare(right, "fr", { sensitivity: "base" }) * factor;
}

function compareDates(left: string, right: string, direction: SortDirection) {
  return compareValues(left, right, direction);
}

function matchesKeyword(parts: Array<string | null | undefined>, keyword: string) {
  if (!keyword) return true;
  return normalizeValue(parts.filter(Boolean).join(" ")).includes(normalizeValue(keyword));
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

function FilterSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      {children}
    </select>
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
  const sportEventsQuery = useSportEventsQuery();
  const weddingsQuery = useWeddingsQuery();
  const [view, setView] = useState<EventView>("all");
  const [concertFilters, setConcertFilters] = useState<ConcertFilters>(DEFAULT_CONCERT_FILTERS);
  const [sportFilters, setSportFilters] = useState<SportFilters>(DEFAULT_SPORT_FILTERS);
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

  const concertOptions = useMemo(
    () => ({
      years: getUniqueValues((concertsQuery.data ?? []).map((concert) => getYear(concert.eventDate))),
      cities: getUniqueValues((concertsQuery.data ?? []).map((concert) => concert.city)),
      countries: getUniqueValues((concertsQuery.data ?? []).map((concert) => concert.countryCode)),
      artists: getUniqueValues((concertsQuery.data ?? []).map((concert) => concert.artist)),
      eventNames: getUniqueValues((concertsQuery.data ?? []).map((concert) => concert.eventName)),
      genres: getUniqueValues((concertsQuery.data ?? []).map((concert) => getConcertGenreLabel(concert))),
      companions: getUniqueValues((concertsQuery.data ?? []).flatMap((concert) => concert.attendeesPeople)),
    }),
    [concertsQuery.data],
  );

  const sportOptions = useMemo(
    () => ({
      years: getUniqueValues((sportEventsQuery.data ?? []).map((event) => getYear(event.eventDate))),
      cities: getUniqueValues((sportEventsQuery.data ?? []).map((event) => event.city)),
      countries: getUniqueValues((sportEventsQuery.data ?? []).map((event) => event.countryCode)),
      sports: getUniqueValues((sportEventsQuery.data ?? []).map((event) => event.sport)),
      competitions: getUniqueValues((sportEventsQuery.data ?? []).map((event) => event.competition)),
      companions: getUniqueValues((sportEventsQuery.data ?? []).flatMap((event) => event.attendeesPeople)),
    }),
    [sportEventsQuery.data],
  );

  const weddingOptions = useMemo(
    () => ({
      years: getUniqueValues(weddings.map((event) => getYear(event.visitedAt))),
      cities: getUniqueValues(weddings.map((event) => event.city)),
      countries: getUniqueValues(weddings.map((event) => event.countryCode)),
      companions: getUniqueValues(weddings.flatMap((event) => event.attendeesPeople)),
    }),
    [weddings],
  );

  const filteredConcerts = useMemo(() => {
    const rows = (concertsQuery.data ?? []).filter((concert) => {
      if (concertFilters.year && getYear(concert.eventDate) !== concertFilters.year) return false;
      if (!includesValue(concert.city, concertFilters.city)) return false;
      if (concertFilters.country && getConcertCountry(concert) !== concertFilters.country) return false;
      if (!includesValue(concert.artist, concertFilters.artist)) return false;
      if (!includesValue(concert.eventName, concertFilters.eventName)) return false;
      if (!includesValue(getConcertGenreLabel(concert), concertFilters.genre)) return false;
      if (
        !matchesKeyword(
          [
            concert.artist,
            concert.eventName,
            getConcertGenreLabel(concert),
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
      if (
        concertFilters.companion &&
        !concert.attendeesPeople.some((person) => includesValue(person, concertFilters.companion))
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
            getConcertGenreLabel(left),
            getConcertGenreLabel(right),
            concertFilters.sortDirection,
          );
        case "eventDate":
        default:
          return compareDates(left.eventDate, right.eventDate, concertFilters.sortDirection);
      }
    });
  }, [concertFilters, concertsQuery.data, countryName]);

  const filteredSportEvents = useMemo(() => {
    const rows = (sportEventsQuery.data ?? []).filter((event) => {
      if (sportFilters.year && getYear(event.eventDate) !== sportFilters.year) return false;
      if (!includesValue(event.city, sportFilters.city)) return false;
      if (sportFilters.country && getSportCountry(event) !== sportFilters.country) return false;
      if (!includesValue(event.sport, sportFilters.sport)) return false;
      if (!includesValue(event.competition, sportFilters.competition)) return false;
      if (
        !matchesKeyword(
          [
            event.sport,
            event.competition,
            event.homeTeam,
            event.awayTeam,
            event.venue,
            event.city,
            countryName(event.countryCode ?? ""),
            ...event.attendeesPeople,
          ],
          sportFilters.keyword,
        )
      ) {
        return false;
      }
      if (
        sportFilters.companion &&
        !event.attendeesPeople.some((person) => includesValue(person, sportFilters.companion))
      ) {
        return false;
      }
      return true;
    });

    return rows.toSorted((left, right) => {
      switch (sportFilters.sortBy) {
        case "city":
          return compareValues(left.city ?? "", right.city ?? "", sportFilters.sortDirection);
        case "country":
          return compareValues(
            countryName(left.countryCode ?? ""),
            countryName(right.countryCode ?? ""),
            sportFilters.sortDirection,
          );
        case "sport":
          return compareValues(left.sport, right.sport, sportFilters.sortDirection);
        case "competition":
          return compareValues(left.competition ?? "", right.competition ?? "", sportFilters.sortDirection);
        case "eventDate":
        default:
          return compareDates(left.eventDate, right.eventDate, sportFilters.sortDirection);
      }
    });
  }, [countryName, sportEventsQuery.data, sportFilters]);

  const filteredWeddings = useMemo(() => {
    const rows = weddings.filter((event) => {
      if (weddingFilters.year && getYear(event.visitedAt) !== weddingFilters.year) return false;
      if (!includesValue(event.city, weddingFilters.city)) return false;
      if (weddingFilters.country && getWeddingCountry(event) !== weddingFilters.country) return false;
      if (
        weddingFilters.companion &&
        !event.attendeesPeople.some((person) => includesValue(person, weddingFilters.companion))
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

  const viewLabels: Record<EventView, string> = {
    all: locale === "fr" ? "Tous" : "All",
    concerts: locale === "fr" ? "Concerts" : "Concerts",
    "sport-events": locale === "fr" ? "Evènements sportifs" : "Sport events",
    weddings: locale === "fr" ? "Mariages" : "Weddings",
  };

  const isLoading =
    concertsQuery.isLoading ||
    sportEventsQuery.isLoading ||
    weddingsQuery.isLoading;

  const hasError = concertsQuery.error || sportEventsQuery.error || weddingsQuery.error;

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
                ? "Concerts, évènements sportifs et mariages réunis dans une même page pour parcourir les souvenirs au fil des dates, des villes et des pays."
                : "Concerts, sport events, and weddings gathered in one place to browse memories through dates, cities, and countries."}
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
                <FilterSelect
                  value={concertFilters.year}
                  onChange={(year) => setConcertFilters((current) => ({ ...current, year }))}
                >
                  <option value="">{t("allYears")}</option>
                  {concertOptions.years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </FilterSelect>
                <Input
                  value={concertFilters.city}
                  onChange={(event) =>
                    setConcertFilters((current) => ({ ...current, city: event.target.value }))
                  }
                  className="h-10"
                  placeholder={locale === "fr" ? "Filtrer par ville" : "Filter by city"}
                />
                <FilterSelect
                  value={concertFilters.country}
                  onChange={(country) => setConcertFilters((current) => ({ ...current, country }))}
                >
                  <option value="">{locale === "fr" ? "Tous les pays" : "All countries"}</option>
                  {concertOptions.countries.map((country) => (
                    <option key={country} value={country}>
                      {countryName(country)}
                    </option>
                  ))}
                </FilterSelect>
                <Input
                  value={concertFilters.artist}
                  onChange={(event) =>
                    setConcertFilters((current) => ({ ...current, artist: event.target.value }))
                  }
                  className="h-10"
                  placeholder={locale === "fr" ? "Filtrer par groupe" : "Filter by artist"}
                />
                <Input
                  value={concertFilters.eventName}
                  onChange={(event) =>
                    setConcertFilters((current) => ({ ...current, eventName: event.target.value }))
                  }
                  className="h-10"
                  placeholder={locale === "fr" ? "Filtrer par évènement" : "Filter by event name"}
                />
                <FilterSelect
                  value={concertFilters.genre}
                  onChange={(genre) => setConcertFilters((current) => ({ ...current, genre }))}
                >
                  <option value="">{locale === "fr" ? "Tous les genres" : "All genres"}</option>
                  {concertOptions.genres.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </FilterSelect>
                <Input
                  value={concertFilters.keyword}
                  onChange={(event) =>
                    setConcertFilters((current) => ({ ...current, keyword: event.target.value }))
                  }
                  className="h-10"
                  placeholder={locale === "fr" ? "Recherche libre" : "Keyword search"}
                />
                <FilterSelect
                  value={concertFilters.companion}
                  onChange={(companion) =>
                    setConcertFilters((current) => ({ ...current, companion }))
                  }
                >
                  <option value="">{locale === "fr" ? "Tous les compagnons" : "All companions"}</option>
                  {concertOptions.companions.map((companion) => (
                    <option key={companion} value={companion}>
                      {companion}
                    </option>
                  ))}
                </FilterSelect>
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
                    <TableHead>{locale === "fr" ? "Photos" : "Photos"}</TableHead>
                    <TableHead>{locale === "fr" ? "Article" : "Article"}</TableHead>
                    <TableHead>{locale === "fr" ? "Voyage" : "Trip"}</TableHead>
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
                        <TableCell>{getConcertGenreLabel(concert) || EMPTY_LABEL}</TableCell>
                        <TableCell>{concert.city || EMPTY_LABEL}</TableCell>
                        <TableCell>
                          {concert.countryCode ? countryName(concert.countryCode) : EMPTY_LABEL}
                        </TableCell>
                        <TableCell>
                          <EventLink
                            href={concert.photosLink}
                            label={locale === "fr" ? "Voir" : "View"}
                          />
                        </TableCell>
                        <TableCell>
                          <EventLink
                            href={concert.articleLink}
                            label={locale === "fr" ? "Lire" : "Read"}
                          />
                        </TableCell>
                        <TableCell>
                          {concert.tripId ? (
                            <Link
                              href={`/trips#trip-${concert.tripId}`}
                              className="inline-flex items-center gap-1 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                            >
                              {locale === "fr" ? "En savoir +" : "Learn more"}
                            </Link>
                          ) : (
                            EMPTY_LABEL
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
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
                <FilterSelect
                  value={sportFilters.year}
                  onChange={(year) => setSportFilters((current) => ({ ...current, year }))}
                >
                  <option value="">{t("allYears")}</option>
                  {sportOptions.years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </FilterSelect>
                <Input
                  value={sportFilters.city}
                  onChange={(event) =>
                    setSportFilters((current) => ({ ...current, city: event.target.value }))
                  }
                  className="h-10"
                  placeholder={locale === "fr" ? "Filtrer par ville" : "Filter by city"}
                />
                <FilterSelect
                  value={sportFilters.country}
                  onChange={(country) => setSportFilters((current) => ({ ...current, country }))}
                >
                  <option value="">{locale === "fr" ? "Tous les pays" : "All countries"}</option>
                  {sportOptions.countries.map((country) => (
                    <option key={country} value={country}>
                      {countryName(country)}
                    </option>
                  ))}
                </FilterSelect>
                <FilterSelect
                  value={sportFilters.sport}
                  onChange={(sport) => setSportFilters((current) => ({ ...current, sport }))}
                >
                  <option value="">{locale === "fr" ? "Tous les sports" : "All sports"}</option>
                  {sportOptions.sports.map((sport) => (
                    <option key={sport} value={sport}>
                      {sport}
                    </option>
                  ))}
                </FilterSelect>
                <Input
                  value={sportFilters.competition}
                  onChange={(event) =>
                    setSportFilters((current) => ({ ...current, competition: event.target.value }))
                  }
                  className="h-10"
                  placeholder={locale === "fr" ? "Filtrer par compétition" : "Filter by competition"}
                />
                <Input
                  value={sportFilters.keyword}
                  onChange={(event) =>
                    setSportFilters((current) => ({ ...current, keyword: event.target.value }))
                  }
                  className="h-10"
                  placeholder={locale === "fr" ? "Recherche libre" : "Keyword search"}
                />
                <FilterSelect
                  value={sportFilters.companion}
                  onChange={(companion) =>
                    setSportFilters((current) => ({ ...current, companion }))
                  }
                >
                  <option value="">{locale === "fr" ? "Tous les compagnons" : "All companions"}</option>
                  {sportOptions.companions.map((companion) => (
                    <option key={companion} value={companion}>
                      {companion}
                    </option>
                  ))}
                </FilterSelect>
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
                    <TableHead>{locale === "fr" ? "Score" : "Score"}</TableHead>
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
                    <TableHead>{locale === "fr" ? "Photos" : "Photos"}</TableHead>
                    <TableHead>{locale === "fr" ? "Article" : "Article"}</TableHead>
                    <TableHead>{locale === "fr" ? "Voyage" : "Trip"}</TableHead>
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
                            {event.sport}
                          </Link>
                        </TableCell>
                        <TableCell>{event.competition || EMPTY_LABEL}</TableCell>
                        <TableCell>
                          {[event.homeTeam, event.awayTeam].filter(Boolean).join(" vs ") || EMPTY_LABEL}
                        </TableCell>
                        <TableCell>
                          {event.homeScore !== null && event.awayScore !== null
                            ? `${event.homeScore} - ${event.awayScore}`
                            : EMPTY_LABEL}
                        </TableCell>
                        <TableCell>{event.city || EMPTY_LABEL}</TableCell>
                        <TableCell>
                          {event.countryCode ? countryName(event.countryCode) : EMPTY_LABEL}
                        </TableCell>
                        <TableCell>
                          <EventLink
                            href={event.photosLink}
                            label={locale === "fr" ? "Voir" : "View"}
                          />
                        </TableCell>
                        <TableCell>
                          <EventLink
                            href={event.articleLink}
                            label={locale === "fr" ? "Lire" : "Read"}
                          />
                        </TableCell>
                        <TableCell>
                          {event.tripId ? (
                            <Link
                              href={`/trips#trip-${event.tripId}`}
                              className="inline-flex items-center gap-1 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                            >
                              {locale === "fr" ? "En savoir +" : "Learn more"}
                            </Link>
                          ) : (
                            EMPTY_LABEL
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
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
                <FilterSelect
                  value={weddingFilters.year}
                  onChange={(year) => setWeddingFilters((current) => ({ ...current, year }))}
                >
                  <option value="">{t("allYears")}</option>
                  {weddingOptions.years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </FilterSelect>
                <Input
                  value={weddingFilters.city}
                  onChange={(event) =>
                    setWeddingFilters((current) => ({ ...current, city: event.target.value }))
                  }
                  className="h-10"
                  placeholder={locale === "fr" ? "Filtrer par ville" : "Filter by city"}
                />
                <FilterSelect
                  value={weddingFilters.country}
                  onChange={(country) => setWeddingFilters((current) => ({ ...current, country }))}
                >
                  <option value="">{locale === "fr" ? "Tous les pays" : "All countries"}</option>
                  {weddingOptions.countries.map((country) => (
                    <option key={country} value={country}>
                      {countryName(country)}
                    </option>
                  ))}
                </FilterSelect>
                <FilterSelect
                  value={weddingFilters.companion}
                  onChange={(companion) =>
                    setWeddingFilters((current) => ({ ...current, companion }))
                  }
                >
                  <option value="">{locale === "fr" ? "Tous les compagnons" : "All companions"}</option>
                  {weddingOptions.companions.map((companion) => (
                    <option key={companion} value={companion}>
                      {companion}
                    </option>
                  ))}
                </FilterSelect>
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
                    <TableHead>{locale === "fr" ? "Photos" : "Photos"}</TableHead>
                    <TableHead>{locale === "fr" ? "Article" : "Article"}</TableHead>
                    <TableHead>{locale === "fr" ? "Voyage" : "Trip"}</TableHead>
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
                          <EventLink
                            href={event.photosLink}
                            label={locale === "fr" ? "Voir" : "View"}
                          />
                        </TableCell>
                        <TableCell>
                          <EventLink
                            href={event.articleLink}
                            label={locale === "fr" ? "Lire" : "Read"}
                          />
                        </TableCell>
                        <TableCell>
                          {event.tripId ? (
                            <Link
                              href={`/trips#trip-${event.tripId}`}
                              className="inline-flex items-center gap-1 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                            >
                              {locale === "fr" ? "En savoir +" : "Learn more"}
                            </Link>
                          ) : (
                            EMPTY_LABEL
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
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
