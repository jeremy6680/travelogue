import { useMemo, useState } from "react";
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
import { useConcertsQuery, useSportEventsQuery, useWeddingsQuery } from "@/lib/directus";
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
  subgenre: string;
  sortBy: "eventDate" | "city" | "country" | "artist" | "eventName" | "genre" | "subgenre";
  sortDirection: SortDirection;
};

type SportFilters = {
  year: string;
  city: string;
  country: string;
  sport: string;
  competition: string;
  sortBy: "eventDate" | "city" | "country" | "sport" | "competition";
  sortDirection: SortDirection;
};

type WeddingFilters = {
  year: string;
  city: string;
  country: string;
  sortBy: "visitedAt" | "city" | "country" | "marriedPeople";
  sortDirection: SortDirection;
};

type WeddingRow = {
  id: number;
  marriedPeople: string;
  tripName: string;
  visitedAt: string;
  city: string;
  countryCode: string;
};

const EMPTY_LABEL = "—";

const DEFAULT_CONCERT_FILTERS: ConcertFilters = {
  year: "",
  city: "",
  country: "",
  artist: "",
  eventName: "",
  genre: "",
  subgenre: "",
  sortBy: "eventDate",
  sortDirection: "desc",
};

const DEFAULT_SPORT_FILTERS: SportFilters = {
  year: "",
  city: "",
  country: "",
  sport: "",
  competition: "",
  sortBy: "eventDate",
  sortDirection: "desc",
};

const DEFAULT_WEDDING_FILTERS: WeddingFilters = {
  year: "",
  city: "",
  country: "",
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

  const weddings = useMemo<WeddingRow[]>(() => {
    return (weddingsQuery.data ?? []).map((wedding: Wedding) => ({
      id: wedding.id,
      marriedPeople:
        [wedding.groomName, wedding.brideName].filter(Boolean).join(" & ") || EMPTY_LABEL,
      tripName: wedding.tripName ?? EMPTY_LABEL,
      visitedAt: wedding.weddingDate,
      city: wedding.city ?? "",
      countryCode: wedding.countryCode ?? "",
    }));
  }, [weddingsQuery.data]);

  const concertOptions = useMemo(
    () => ({
      years: getUniqueValues((concertsQuery.data ?? []).map((concert) => getYear(concert.eventDate))),
      cities: getUniqueValues((concertsQuery.data ?? []).map((concert) => concert.city)),
      countries: getUniqueValues((concertsQuery.data ?? []).map((concert) => concert.countryCode)),
      artists: getUniqueValues((concertsQuery.data ?? []).map((concert) => concert.artist)),
      eventNames: getUniqueValues((concertsQuery.data ?? []).map((concert) => concert.eventName)),
      genres: getUniqueValues((concertsQuery.data ?? []).map((concert) => concert.genre)),
      subgenres: getUniqueValues((concertsQuery.data ?? []).map((concert) => concert.subgenre)),
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
    }),
    [sportEventsQuery.data],
  );

  const weddingOptions = useMemo(
    () => ({
      years: getUniqueValues(weddings.map((event) => getYear(event.visitedAt))),
      cities: getUniqueValues(weddings.map((event) => event.city)),
      countries: getUniqueValues(weddings.map((event) => event.countryCode)),
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
      if (!includesValue(concert.genre, concertFilters.genre)) return false;
      if (!includesValue(concert.subgenre, concertFilters.subgenre)) return false;
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
          return compareValues(left.genre ?? "", right.genre ?? "", concertFilters.sortDirection);
        case "subgenre":
          return compareValues(left.subgenre ?? "", right.subgenre ?? "", concertFilters.sortDirection);
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
    concertsQuery.isLoading || sportEventsQuery.isLoading || weddingsQuery.isLoading;

  const hasError = concertsQuery.error || sportEventsQuery.error || weddingsQuery.error;

  return (
    <Layout>
      <div className="space-y-8">
        <header className="space-y-4 border-b pb-8">
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
                  placeholder={locale === "fr" ? "Filtrer par groupe" : "Filter by artist"}
                />
                <Input
                  value={concertFilters.eventName}
                  onChange={(event) =>
                    setConcertFilters((current) => ({ ...current, eventName: event.target.value }))
                  }
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
                <FilterSelect
                  value={concertFilters.subgenre}
                  onChange={(subgenre) => setConcertFilters((current) => ({ ...current, subgenre }))}
                >
                  <option value="">
                    {locale === "fr" ? "Tous les sous-genres" : "All subgenres"}
                  </option>
                  {concertOptions.subgenres.map((subgenre) => (
                    <option key={subgenre} value={subgenre}>
                      {subgenre}
                    </option>
                  ))}
                </FilterSelect>
                <div className="grid grid-cols-2 gap-3">
                  <FilterSelect
                    value={concertFilters.sortBy}
                    onChange={(sortBy) =>
                      setConcertFilters((current) => ({
                        ...current,
                        sortBy: sortBy as ConcertFilters["sortBy"],
                      }))
                    }
                  >
                    <option value="eventDate">{locale === "fr" ? "Trier par date" : "Sort by date"}</option>
                    <option value="city">{locale === "fr" ? "Trier par ville" : "Sort by city"}</option>
                    <option value="country">{locale === "fr" ? "Trier par pays" : "Sort by country"}</option>
                    <option value="artist">{locale === "fr" ? "Trier par groupe" : "Sort by artist"}</option>
                    <option value="eventName">
                      {locale === "fr" ? "Trier par évènement" : "Sort by event"}
                    </option>
                    <option value="genre">{locale === "fr" ? "Trier par genre" : "Sort by genre"}</option>
                    <option value="subgenre">
                      {locale === "fr" ? "Trier par sous-genre" : "Sort by subgenre"}
                    </option>
                  </FilterSelect>
                  <FilterSelect
                    value={concertFilters.sortDirection}
                    onChange={(sortDirection) =>
                      setConcertFilters((current) => ({
                        ...current,
                        sortDirection: sortDirection as SortDirection,
                      }))
                    }
                  >
                    <option value="desc">DESC</option>
                    <option value="asc">ASC</option>
                  </FilterSelect>
                </div>
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
                    <TableHead>{locale === "fr" ? "Date" : "Date"}</TableHead>
                    <TableHead>{locale === "fr" ? "Groupe" : "Artist"}</TableHead>
                    <TableHead>{locale === "fr" ? "Evènement" : "Event"}</TableHead>
                    <TableHead>{locale === "fr" ? "Genre" : "Genre"}</TableHead>
                    <TableHead>{locale === "fr" ? "Sous-genre" : "Subgenre"}</TableHead>
                    <TableHead>{locale === "fr" ? "Ville" : "City"}</TableHead>
                    <TableHead>{locale === "fr" ? "Pays" : "Country"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConcerts.length ? (
                    filteredConcerts.map((concert) => (
                      <TableRow key={concert.id}>
                        <TableCell>{formatDate(concert.eventDate, "short")}</TableCell>
                        <TableCell className="font-medium">{concert.artist}</TableCell>
                        <TableCell>{concert.eventName || EMPTY_LABEL}</TableCell>
                        <TableCell>{concert.genre || EMPTY_LABEL}</TableCell>
                        <TableCell>{concert.subgenre || EMPTY_LABEL}</TableCell>
                        <TableCell>{concert.city || EMPTY_LABEL}</TableCell>
                        <TableCell>
                          {concert.countryCode ? countryName(concert.countryCode) : EMPTY_LABEL}
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
                  placeholder={locale === "fr" ? "Filtrer par compétition" : "Filter by competition"}
                />
                <div className="grid grid-cols-2 gap-3 md:col-span-2 xl:col-span-1">
                  <FilterSelect
                    value={sportFilters.sortBy}
                    onChange={(sortBy) =>
                      setSportFilters((current) => ({
                        ...current,
                        sortBy: sortBy as SportFilters["sortBy"],
                      }))
                    }
                  >
                    <option value="eventDate">{locale === "fr" ? "Trier par date" : "Sort by date"}</option>
                    <option value="city">{locale === "fr" ? "Trier par ville" : "Sort by city"}</option>
                    <option value="country">{locale === "fr" ? "Trier par pays" : "Sort by country"}</option>
                    <option value="sport">{locale === "fr" ? "Trier par sport" : "Sort by sport"}</option>
                    <option value="competition">
                      {locale === "fr" ? "Trier par compétition" : "Sort by competition"}
                    </option>
                  </FilterSelect>
                  <FilterSelect
                    value={sportFilters.sortDirection}
                    onChange={(sortDirection) =>
                      setSportFilters((current) => ({
                        ...current,
                        sortDirection: sortDirection as SortDirection,
                      }))
                    }
                  >
                    <option value="desc">DESC</option>
                    <option value="asc">ASC</option>
                  </FilterSelect>
                </div>
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
                    <TableHead>{locale === "fr" ? "Date" : "Date"}</TableHead>
                    <TableHead>{locale === "fr" ? "Sport" : "Sport"}</TableHead>
                    <TableHead>{locale === "fr" ? "Compétition" : "Competition"}</TableHead>
                    <TableHead>{locale === "fr" ? "Affiche" : "Matchup"}</TableHead>
                    <TableHead>{locale === "fr" ? "Score" : "Score"}</TableHead>
                    <TableHead>{locale === "fr" ? "Ville" : "City"}</TableHead>
                    <TableHead>{locale === "fr" ? "Pays" : "Country"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSportEvents.length ? (
                    filteredSportEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>{formatDate(event.eventDate, "short")}</TableCell>
                        <TableCell className="font-medium">{event.sport}</TableCell>
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
                <div className="grid grid-cols-2 gap-3">
                  <FilterSelect
                    value={weddingFilters.sortBy}
                    onChange={(sortBy) =>
                      setWeddingFilters((current) => ({
                        ...current,
                        sortBy: sortBy as WeddingFilters["sortBy"],
                      }))
                    }
                  >
                    <option value="visitedAt">{locale === "fr" ? "Trier par date" : "Sort by date"}</option>
                    <option value="city">{locale === "fr" ? "Trier par ville" : "Sort by city"}</option>
                    <option value="country">{locale === "fr" ? "Trier par pays" : "Sort by country"}</option>
                    <option value="marriedPeople">
                      {locale === "fr" ? "Trier par mariés" : "Sort by married people"}
                    </option>
                  </FilterSelect>
                  <FilterSelect
                    value={weddingFilters.sortDirection}
                    onChange={(sortDirection) =>
                      setWeddingFilters((current) => ({
                        ...current,
                        sortDirection: sortDirection as SortDirection,
                      }))
                    }
                  >
                    <option value="desc">DESC</option>
                    <option value="asc">ASC</option>
                  </FilterSelect>
                </div>
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
                    <TableHead>{locale === "fr" ? "Date" : "Date"}</TableHead>
                    <TableHead>{locale === "fr" ? "Mariés" : "Married people"}</TableHead>
                    <TableHead>{locale === "fr" ? "Voyage" : "Trip"}</TableHead>
                    <TableHead>{locale === "fr" ? "Ville" : "City"}</TableHead>
                    <TableHead>{locale === "fr" ? "Pays" : "Country"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWeddings.length ? (
                    filteredWeddings.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>{formatDate(event.visitedAt, "short")}</TableCell>
                        <TableCell className="font-medium">{event.marriedPeople}</TableCell>
                        <TableCell>{event.tripName}</TableCell>
                        <TableCell>{event.city || EMPTY_LABEL}</TableCell>
                        <TableCell>{countryName(event.countryCode)}</TableCell>
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
