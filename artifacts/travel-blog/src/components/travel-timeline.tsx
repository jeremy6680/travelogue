import { useEffect, useMemo, useRef, useState } from "react";
import { getMediaAssetImageUrl } from "@/lib/cloudinary";
import { useJourneysQuery, usePostsQuery, useTripsQuery } from "@/lib/directus";
import { getPostHref, isExternalPost } from "@/lib/post-links";
import type { Journey, Post, Trip } from "@/lib/travel-types";
import { motion } from "framer-motion";
import { differenceInCalendarDays } from "date-fns";
import {
  BedDouble,
  CalendarRange,
  MapPin,
  Users,
  Heart,
  Navigation,
  ArrowUpDown,
  PlaneTakeoff,
  Car,
  Filter,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  formatAccomodationLabels,
  formatTravelReasonLabel,
  formatTransportLabel,
  formatTransportLabels,
  getContinentKey,
  sortTransportValues,
} from "@/lib/trip-options";

const NICE_COORDINATES = { latitude: 43.7102, longitude: 7.262 };

function getFlagEmoji(countryCode: string) {
  if (!countryCode || countryCode.length !== 2) return "";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

function formatLengthOfStay(
  visitedAt: string,
  visitedUntil: string | null,
  t: ReturnType<typeof useI18n>["t"],
  formatDaysLabel: ReturnType<typeof useI18n>["formatDaysLabel"],
) {
  if (!visitedUntil) return null;

  const start = new Date(visitedAt);
  const end = new Date(visitedUntil);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  const days = differenceInCalendarDays(end, start);

  if (days < 0) return null;
  if (days === 0) return t("sameDay");

  return formatDaysLabel(days);
}

interface TravelTimelineProps {
  showFilters?: boolean;
}

type Coordinates = { latitude: number; longitude: number };
type TripCountryOption = {
  value: string;
  label: string;
  count: number;
};
type RegionOption = {
  value: string;
  label: string;
  count: number;
};
type FacetOption = {
  value: string;
  label: string;
  count: number;
};

type TimelineItem =
  | { type: "trip"; sortDate: string; trip: Trip; distanceKm: number | null }
  | { type: "journey"; sortDate: string; journey: Journey; trips: Trip[]; distanceKm: number | null };

function isCoordinatePair(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): boolean {
  return typeof latitude === "number" && typeof longitude === "number";
}

function getTripCoordinates(trip: Trip): Coordinates | null {
  if (!isCoordinatePair(trip.latitude, trip.longitude)) return null;
  return { latitude: trip.latitude as number, longitude: trip.longitude as number };
}

function formatList(values: string[]) {
  return values.join(", ");
}

function getCountryFilterOptions(
  trips: Trip[],
  countryName: ReturnType<typeof useI18n>["countryName"],
) {
  const counts = new Map<string, number>();

  for (const trip of trips) {
    const code = trip.countryCode.toUpperCase();
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([code, count]) => ({
      value: code,
      label: `${getFlagEmoji(code)} ${countryName(code)} (${count})`,
      count,
    }))
    .sort((left, right) => {
      if (right.count !== left.count) return right.count - left.count;
      return left.label.localeCompare(right.label, "fr");
    });
}

function getRegionFilterOptions(
  trips: Trip[],
  t: ReturnType<typeof useI18n>["t"],
  locale: ReturnType<typeof useI18n>["locale"],
) {
  const counts = new Map<string, number>();

  for (const trip of trips) {
    counts.set("france", trip.countryCode.toUpperCase() === "FR" ? (counts.get("france") ?? 0) + 1 : counts.get("france") ?? 0);
    counts.set(
      "international",
      trip.countryCode.toUpperCase() !== "FR"
        ? (counts.get("international") ?? 0) + 1
        : counts.get("international") ?? 0,
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
        return { value, label: `${t("france")} (${count})`, count };
      }

      if (value === "international") {
        return { value, label: `${t("international")} (${count})`, count };
      }

      const continentKey = value.replace("continent:", "") as ReturnType<typeof getContinentKey>;
      const continentLabel =
        continentKey != null
          ? {
              europe: locale === "fr" ? "Europe" : "Europe",
              america: locale === "fr" ? "Amérique" : "America",
              africa: locale === "fr" ? "Afrique" : "Africa",
              asia: locale === "fr" ? "Asie" : "Asia",
              oceania: locale === "fr" ? "Océanie" : "Oceania",
            }[continentKey]
          : value;

      return {
        value,
        label: `${continentLabel} (${count})`,
        count,
      };
    })
    .sort((left, right) => {
      if (right.count !== left.count) return right.count - left.count;
      return left.label.localeCompare(right.label, locale);
    });
}

function getFacetOptions(values: string[][], locale: string) {
  const counts = new Map<string, number>();

  for (const tripValues of values) {
    for (const value of new Set(tripValues.map((item) => item.trim()).filter(Boolean))) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, label: value, count }))
    .sort((left, right) => {
      if (right.count !== left.count) return right.count - left.count;
      return left.label.localeCompare(right.label, locale);
    });
}

function getJourneyEndpoint(
  mode: Journey["originMode"] | Journey["destinationMode"],
  latitude: number | null,
  longitude: number | null,
): Coordinates | null {
  if (mode === "default_nice") return NICE_COORDINATES;
  if (!isCoordinatePair(latitude, longitude)) return null;
  return { latitude: latitude as number, longitude: longitude as number };
}

function haversineKm(from: Coordinates, to: Coordinates) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
}

function computeStandaloneTripDistance(trip: Trip) {
  const coordinates = getTripCoordinates(trip);
  if (!coordinates) return null;
  return haversineKm(NICE_COORDINATES, coordinates) * 2;
}

function computeJourneyDistance(journey: Journey, orderedTrips: Trip[]) {
  if (orderedTrips.length === 0) return null;

  const points: Coordinates[] = [];
  const origin = getJourneyEndpoint(
    journey.originMode,
    journey.originLatitude,
    journey.originLongitude,
  );
  const destination = getJourneyEndpoint(
    journey.destinationMode,
    journey.destinationLatitude,
    journey.destinationLongitude,
  );

  if (origin) points.push(origin);

  for (const trip of orderedTrips) {
    const coordinates = getTripCoordinates(trip);
    if (!coordinates) return null;
    points.push(coordinates);
  }

  if (destination) points.push(destination);

  if (points.length < 2) return null;

  let totalDistance = 0;
  for (let index = 1; index < points.length; index += 1) {
    totalDistance += haversineKm(points[index - 1], points[index]);
  }

  return totalDistance;
}

function computeJourneyTripDistance(
  journey: Journey,
  orderedTrips: Trip[],
  tripIndex: number,
) {
  const currentCoordinates = getTripCoordinates(orderedTrips[tripIndex]);
  if (!currentCoordinates) return null;

  const arrivalCoordinates =
    tripIndex === 0
      ? getJourneyEndpoint(
          journey.originMode,
          journey.originLatitude,
          journey.originLongitude,
        )
      : getTripCoordinates(orderedTrips[tripIndex - 1]);
  if (!arrivalCoordinates) return null;

  let totalDistance = haversineKm(arrivalCoordinates, currentCoordinates);

  if (tripIndex === orderedTrips.length - 1) {
    const destinationCoordinates = getJourneyEndpoint(
      journey.destinationMode,
      journey.destinationLatitude,
      journey.destinationLongitude,
    );
    if (!destinationCoordinates) return null;
    totalDistance += haversineKm(currentCoordinates, destinationCoordinates);
  }

  return totalDistance;
}

function renderTripCard(
  trip: Trip,
  tripPosts: Post[],
  distanceKm: number | null,
  i18n: ReturnType<typeof useI18n>,
  metadata?: string,
  summaryLabel?: string,
) {
  const {
    countryName,
    formatDate,
    formatDistanceKm,
    formatDaysLabel,
    locale,
    t,
  } = i18n;
  const accomodationLabel = formatAccomodationLabels(trip.accomodation, locale);
  const transportationToLabel = formatTransportLabels(
    trip.transportationTo,
    locale,
  );
  const transportationOnSiteLabel = formatTransportLabels(
    trip.transportationOnSite,
    locale,
  );
  const lengthOfStay = formatLengthOfStay(
    trip.visitedAt,
    trip.visitedUntil,
    t,
    formatDaysLabel,
  );
  const distanceLabel = formatDistanceKm(distanceKm);

  return (
    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h3 className="font-serif text-3xl font-bold flex items-center gap-3 text-foreground">
            <span className="text-4xl" aria-hidden="true">
              {getFlagEmoji(trip.countryCode)}
            </span>
            {countryName(trip.countryCode)}
          </h3>
          <p className="text-sm text-muted-foreground font-mono mt-2 uppercase tracking-wider">
            {formatDate(trip.visitedAt, "monthYear")}
          </p>
          {metadata && (
            <p className="text-xs text-muted-foreground font-mono mt-1 uppercase tracking-[0.2em]">
              {metadata}
            </p>
          )}
        </div>
        {distanceLabel && (
          <div className="rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm">
            <strong className="block font-serif text-foreground">
              {summaryLabel}
            </strong>
            <span className="text-muted-foreground">
              {distanceLabel}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm bg-background/50 p-4 rounded-xl border border-border/50">
        {trip.visitedCities && (
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
            <div>
              <strong className="block text-foreground mb-0.5 font-serif">
                {t("citiesVisited")}
              </strong>
              <span className="text-muted-foreground leading-relaxed">
                {trip.visitedCities}
              </span>
            </div>
          </div>
        )}
        {trip.reasonForVisit && (
          <div className="flex items-start gap-2.5">
            <Navigation className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
            <div>
              <strong className="block text-foreground mb-0.5 font-serif">
                {t("mission")}
              </strong>
              <span className="text-muted-foreground leading-relaxed">
                {trip.reasonForVisit}
              </span>
            </div>
          </div>
        )}
        {trip.travelCompanions.length > 0 && (
          <div className="flex items-start gap-2.5">
            <Users className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
            <div>
              <strong className="block text-foreground mb-0.5 font-serif">
                {t("companions")}
              </strong>
              <span className="text-muted-foreground leading-relaxed">
                {formatList(trip.travelCompanions)}
              </span>
            </div>
          </div>
        )}
        {trip.friendsFamilyMet && (
          <div className="flex items-start gap-2.5">
            <Heart className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
            <div>
              <strong className="block text-foreground mb-0.5 font-serif">
                {t("metAlongTheWay")}
              </strong>
              <span className="text-muted-foreground leading-relaxed">
                {trip.friendsFamilyMet}
              </span>
            </div>
          </div>
        )}
        {transportationToLabel && (
          <div className="flex items-start gap-2.5">
            <PlaneTakeoff className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
            <div>
              <strong className="block text-foreground mb-0.5 font-serif">
                {t("gettingThere")}
              </strong>
              <span className="text-muted-foreground leading-relaxed">
                {transportationToLabel}
              </span>
            </div>
          </div>
        )}
        {transportationOnSiteLabel && (
          <div className="flex items-start gap-2.5">
            <Car className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
            <div>
              <strong className="block text-foreground mb-0.5 font-serif">
                {t("gettingAround")}
              </strong>
              <span className="text-muted-foreground leading-relaxed">
                {transportationOnSiteLabel}
              </span>
            </div>
          </div>
        )}
        {accomodationLabel && (
          <div className="flex items-start gap-2.5">
            <BedDouble className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
            <div>
              <strong className="block text-foreground mb-0.5 font-serif">
                {t("accommodation")}
              </strong>
              <span className="text-muted-foreground leading-relaxed">
                {accomodationLabel}
              </span>
            </div>
          </div>
        )}
        {lengthOfStay && (
          <div className="flex items-start gap-2.5">
            <CalendarRange className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
            <div>
              <strong className="block text-foreground mb-0.5 font-serif">
                {t("lengthOfStay")}
              </strong>
              <span className="text-muted-foreground leading-relaxed">
                {lengthOfStay}
              </span>
            </div>
          </div>
        )}
      </div>

      {tripPosts.length > 0 && (
        <div className="mt-6 pt-6 border-t border-border/60">
          <h4 className="font-serif font-medium mb-4 text-foreground/80 flex items-center gap-2">
            <span className="w-8 h-px bg-border inline-block" />
            {t("dispatchesFrom")} {countryName(trip.countryCode)}
          </h4>
          <div className="grid gap-3">
            {tripPosts.map((post) => (
              <a
                key={post.id}
                href={getPostHref(post)}
                target={isExternalPost(post) ? "_blank" : undefined}
                rel={isExternalPost(post) ? "noreferrer" : undefined}
                className="group flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50"
                data-testid={`link-post-${post.id}`}
              >
                {(post.coverImage || post.coverImageUrl) ? (
                  <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden shrink-0 shadow-sm">
                    <img
                      src={getMediaAssetImageUrl(post.coverImage, { width: 128, height: 128, crop: "fill" }) ?? post.coverImageUrl ?? ""}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
                    <MapPin className="w-6 h-6 text-primary/40" />
                  </div>
                )}
                <div>
                  <h5 className="font-serif font-bold text-base group-hover:text-secondary transition-colors text-foreground">
                    {post.title}
                  </h5>
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                    {post.excerpt}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface FiltersPanelProps {
  className?: string;
  countLabel: string;
  locale: ReturnType<typeof useI18n>["locale"];
  sortOrder: "newest" | "oldest";
  filterTrip: string;
  filterRegion: string;
  filterTransport: string;
  filterCompanion: string;
  filterReason: string;
  filterYear: string;
  tripCountryOptions: TripCountryOption[];
  regionOptions: RegionOption[];
  transportOptions: string[];
  companionOptions: FacetOption[];
  reasonOptions: FacetOption[];
  yearOptions: string[];
  onTripChange: (value: string) => void;
  onRegionChange: (value: string) => void;
  onTransportChange: (value: string) => void;
  onCompanionChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onSortToggle: () => void;
  onClear: () => void;
  formatTransport: (value: string) => string;
  t: ReturnType<typeof useI18n>["t"];
}

function FiltersPanel({
  className,
  countLabel,
  locale,
  sortOrder,
  filterTrip,
  filterRegion,
  filterTransport,
  filterCompanion,
  filterReason,
  filterYear,
  tripCountryOptions,
  regionOptions,
  transportOptions,
  companionOptions,
  reasonOptions,
  yearOptions,
  onTripChange,
  onRegionChange,
  onTransportChange,
  onCompanionChange,
  onReasonChange,
  onYearChange,
  onSortToggle,
  onClear,
  formatTransport,
  t,
}: FiltersPanelProps) {
  const hasActiveFilters =
    filterTrip !== "all" ||
    filterRegion !== "all" ||
    filterTransport !== "all" ||
    filterCompanion !== "all" ||
    filterReason !== "all" ||
    filterYear !== "all";

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card/90 p-5 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.24em] text-muted-foreground">
            {t("passportTitle")}
          </p>
          <h2 className="mt-2 font-serif text-2xl font-bold text-foreground">
            Filtres
          </h2>
        </div>
        <div className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-mono text-muted-foreground">
          {countLabel}
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
            Zone
          </p>
          <Select value={filterRegion} onValueChange={onRegionChange}>
            <SelectTrigger className="w-full" data-testid="select-filter-region">
              <SelectValue placeholder={t("allRegions")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allRegions")}</SelectItem>
              {regionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
            Pays
          </p>
          <Select value={filterTrip} onValueChange={onTripChange}>
            <SelectTrigger className="w-full" data-testid="select-filter-trip">
              <SelectValue placeholder={t("allTrips")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allTrips")}</SelectItem>
              {tripCountryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {yearOptions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
              Année
            </p>
            <Select value={filterYear} onValueChange={onYearChange}>
              <SelectTrigger className="w-full" data-testid="select-filter-year">
                <SelectValue placeholder={t("allYears")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allYears")}</SelectItem>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {companionOptions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
              {t("companions")}
            </p>
            <Select value={filterCompanion} onValueChange={onCompanionChange}>
              <SelectTrigger className="w-full" data-testid="select-filter-companion">
                <SelectValue placeholder={t("companions")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("companions")}</SelectItem>
                {companionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label} ({option.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {reasonOptions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
              {locale === "fr" ? "Raison" : "Reason"}
            </p>
            <Select value={filterReason} onValueChange={onReasonChange}>
              <SelectTrigger className="w-full" data-testid="select-filter-reason">
                <SelectValue placeholder={locale === "fr" ? "Raison du voyage" : "Reason for travel"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {locale === "fr" ? "Raison du voyage" : "Reason for travel"}
                </SelectItem>
                {reasonOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {transportOptions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
              Transport
            </p>
            <Select value={filterTransport} onValueChange={onTransportChange}>
              <SelectTrigger className="w-full" data-testid="select-filter-transport">
                <SelectValue placeholder={t("allTransport")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allTransport")}</SelectItem>
                {transportOptions.map((transport) => (
                  <SelectItem key={transport} value={transport}>
                    {formatTransport(transport)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onSortToggle}
          className="w-full justify-between"
          data-testid="button-sort-order"
        >
          <span>{sortOrder === "newest" ? t("newestFirst") : t("oldestFirst")}</span>
          <ArrowUpDown className="w-4 h-4" />
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="w-full"
            data-testid="button-clear-filters"
          >
            {t("clearFilters")}
          </Button>
        )}
      </div>
    </div>
  );
}

export function TravelTimeline({ showFilters = true }: TravelTimelineProps) {
  const DESKTOP_BREAKPOINT = 1024;
  const SIDEBAR_TOP_OFFSET = 96;
  const i18n = useI18n();
  const { countryName, formatCountLabel, formatDate, formatDistanceKm, locale, t } = i18n;
  const { data: journeys = [] } = useJourneysQuery();
  const { data: trips = [], isLoading } = useTripsQuery();
  const { data: posts = [] } = usePostsQuery();
  const [filterTrip, setFilterTrip] = useState<string>("all");
  const [filterRegion, setFilterRegion] = useState<string>("all");
  const [filterTransport, setFilterTransport] = useState<string>("all");
  const [filterCompanion, setFilterCompanion] = useState<string>("all");
  const [filterReason, setFilterReason] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [desktopSidebarMode, setDesktopSidebarMode] = useState<"static" | "fixed" | "bottom">("static");
  const [desktopSidebarWidth, setDesktopSidebarWidth] = useState<number>(280);
  const [desktopSidebarHeight, setDesktopSidebarHeight] = useState<number>(0);
  const desktopSidebarSlotRef = useRef<HTMLElement | null>(null);
  const desktopSidebarPanelRef = useRef<HTMLDivElement | null>(null);
  const timelineListRef = useRef<HTMLDivElement | null>(null);

  const transportOptions = useMemo(() => {
    const modes = new Set<string>();
    for (const trip of trips) {
      for (const mode of [...trip.transportationTo, ...trip.transportationOnSite]) {
        modes.add(mode);
      }
    }
    return sortTransportValues(Array.from(modes), i18n.locale);
  }, [i18n.locale, trips]);

  const yearOptions = useMemo(() => {
    const years = new Set<string>();
    for (const t of trips) {
      if (t.visitedAt)
        years.add(new Date(t.visitedAt).getFullYear().toString());
    }
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [trips]);

  const tripCountryOptions = useMemo(
    () => getCountryFilterOptions(trips, countryName),
    [countryName, trips],
  );

  const regionOptions = useMemo(
    () => getRegionFilterOptions(trips, t, locale),
    [locale, t, trips],
  );

  const companionOptions = useMemo(
    () => getFacetOptions(trips.map((trip) => trip.travelCompanions), locale),
    [locale, trips],
  );

  const reasonOptions = useMemo(
    () =>
      getFacetOptions(trips.map((trip) => trip.reasonForTravel), locale).map(
        (option) => ({
          ...option,
          label: `${formatTravelReasonLabel(option.value, i18n.locale)} (${option.count})`,
        }),
      ),
    [i18n.locale, locale, trips],
  );

  const filteredSorted = useMemo<TimelineItem[]>(() => {
    let list = [...trips];
    if (filterTrip !== "all") {
      list = list.filter((trip) => trip.countryCode.toUpperCase() === filterTrip);
    }
    if (filterRegion !== "all") {
      list = list.filter((trip) => {
        if (filterRegion === "france") {
          return trip.countryCode.toUpperCase() === "FR";
        }

        if (filterRegion === "international") {
          return trip.countryCode.toUpperCase() !== "FR";
        }

        if (filterRegion.startsWith("continent:")) {
          return getContinentKey(trip.countryCode) === filterRegion.replace("continent:", "");
        }

        return true;
      });
    }
    if (filterTransport !== "all") {
      list = list.filter((t) => {
        const modes = [...t.transportationTo, ...t.transportationOnSite];
        return modes.includes(filterTransport);
      });
    }
    if (filterCompanion !== "all") {
      list = list.filter((trip) => trip.travelCompanions.includes(filterCompanion));
    }
    if (filterReason !== "all") {
      list = list.filter((trip) => trip.reasonForTravel.includes(filterReason));
    }
    if (filterYear !== "all") {
      list = list.filter(
        (t) =>
          t.visitedAt &&
          new Date(t.visitedAt).getFullYear().toString() === filterYear,
      );
    }
    list.sort((a, b) => {
      const diff =
        new Date(a.visitedAt).getTime() - new Date(b.visitedAt).getTime();
      return sortOrder === "newest" ? -diff : diff;
    });
    const tripsByJourneyId = new Map<number, Trip[]>();
    const standaloneTrips: TimelineItem[] = [];

    for (const trip of list) {
      if (trip.journeyId == null) {
        standaloneTrips.push({
          type: "trip",
          sortDate: trip.visitedAt,
          trip,
          distanceKm: computeStandaloneTripDistance(trip),
        });
        continue;
      }

      const groupedTrips = tripsByJourneyId.get(trip.journeyId) ?? [];
      groupedTrips.push(trip);
      tripsByJourneyId.set(trip.journeyId, groupedTrips);
    }

    const journeyItems: TimelineItem[] = journeys
      .filter((journey) => tripsByJourneyId.has(journey.id))
      .map((journey) => {
        const orderedTrips = [...(tripsByJourneyId.get(journey.id) ?? [])].sort((a, b) => {
          const orderA = a.journeyOrder ?? Number.MAX_SAFE_INTEGER;
          const orderB = b.journeyOrder ?? Number.MAX_SAFE_INTEGER;
          if (orderA !== orderB) return orderA - orderB;
          return new Date(a.visitedAt).getTime() - new Date(b.visitedAt).getTime();
        });

        return {
          type: "journey",
          sortDate: orderedTrips[0]?.visitedAt ?? journey.startDate ?? journey.createdAt,
          journey,
          trips: orderedTrips,
          distanceKm: computeJourneyDistance(journey, orderedTrips),
        };
      });

    const timelineItems = [...standaloneTrips, ...journeyItems];
    timelineItems.sort((a, b) => {
      const diff = new Date(a.sortDate).getTime() - new Date(b.sortDate).getTime();
      return sortOrder === "newest" ? -diff : diff;
    });

    return timelineItems;
  }, [
    trips,
    journeys,
    filterTrip,
    filterRegion,
    filterTransport,
    filterCompanion,
    filterReason,
    filterYear,
    sortOrder,
  ]);

  const clearFilters = () => {
    setFilterTrip("all");
    setFilterRegion("all");
    setFilterTransport("all");
    setFilterCompanion("all");
    setFilterReason("all");
    setFilterYear("all");
  };

  const countLabel = formatCountLabel(filteredSorted.length);

  useEffect(() => {
    if (!showFilters) return;

    const updateDesktopSidebar = () => {
      const slot = desktopSidebarSlotRef.current;
      const panel = desktopSidebarPanelRef.current;
      const timeline = timelineListRef.current;

      if (!slot || !panel || !timeline || window.innerWidth < DESKTOP_BREAKPOINT) {
        setDesktopSidebarMode("static");
        return;
      }

      const slotRect = slot.getBoundingClientRect();
      const timelineRect = timeline.getBoundingClientRect();
      const panelHeight = panel.offsetHeight;
      const slotTop = window.scrollY + slotRect.top;
      const timelineTop = window.scrollY + timelineRect.top;
      const timelineBottom = window.scrollY + timelineRect.bottom;
      const pinStart = timelineTop - SIDEBAR_TOP_OFFSET;
      const pinEnd = timelineBottom - SIDEBAR_TOP_OFFSET - panelHeight;

      setDesktopSidebarWidth(Math.round(slotRect.width));
      setDesktopSidebarHeight(panelHeight);

      if (window.scrollY < pinStart) {
        setDesktopSidebarMode("static");
        return;
      }

      if (window.scrollY >= pinEnd) {
        setDesktopSidebarMode("bottom");
        return;
      }

      setDesktopSidebarMode("fixed");
    };

    updateDesktopSidebar();
    window.addEventListener("scroll", updateDesktopSidebar, { passive: true });
    window.addEventListener("resize", updateDesktopSidebar);

    return () => {
      window.removeEventListener("scroll", updateDesktopSidebar);
      window.removeEventListener("resize", updateDesktopSidebar);
    };
  }, [filteredSorted.length, showFilters]);

  if (isLoading) {
    return (
        <div className="py-20 text-center text-muted-foreground animate-pulse font-serif italic">
        {t("loadingMap")}
        </div>
    );
  }

  return (
    <div className={cn("space-y-8", showFilters && "lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:gap-10 lg:space-y-0")}>
      {showFilters && (
        <>
          <div className="flex items-center justify-between gap-3 lg:hidden">
            <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filtres
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[90vw] max-w-sm overflow-y-auto border-r border-border/60">
                <SheetHeader className="mb-5 pr-8">
                  <SheetTitle>Filtres du passeport</SheetTitle>
                  <SheetDescription>
                    Ajuste les critères pour tester une lecture différente de la timeline.
                  </SheetDescription>
                </SheetHeader>
                <FiltersPanel
                  countLabel={countLabel}
                  locale={locale}
                  sortOrder={sortOrder}
                  filterTrip={filterTrip}
                  filterRegion={filterRegion}
                  filterTransport={filterTransport}
                  filterCompanion={filterCompanion}
                  filterReason={filterReason}
                  filterYear={filterYear}
                  tripCountryOptions={tripCountryOptions}
                  regionOptions={regionOptions}
                  transportOptions={transportOptions}
                  companionOptions={companionOptions}
                  reasonOptions={reasonOptions}
                  yearOptions={yearOptions}
                  onTripChange={setFilterTrip}
                  onRegionChange={setFilterRegion}
                  onTransportChange={setFilterTransport}
                  onCompanionChange={setFilterCompanion}
                  onReasonChange={setFilterReason}
                  onYearChange={setFilterYear}
                  onSortToggle={() =>
                    setSortOrder((current) => (current === "newest" ? "oldest" : "newest"))
                  }
                  onClear={clearFilters}
                  formatTransport={(value) => formatTransportLabel(value, i18n.locale)}
                  t={t}
                  className="border-none bg-transparent p-0 shadow-none"
                />
              </SheetContent>
            </Sheet>

            <div className="text-right">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
                Résultat
              </p>
              <p className="text-sm text-foreground">{countLabel}</p>
            </div>
          </div>

          <aside
            ref={desktopSidebarSlotRef}
            className="hidden lg:block self-start relative"
            style={desktopSidebarHeight ? { minHeight: desktopSidebarHeight } : undefined}
          >
            <div
              ref={desktopSidebarPanelRef}
              className={cn(
                desktopSidebarMode === "fixed" && "fixed z-30",
                desktopSidebarMode === "bottom" && "absolute bottom-0 left-0 right-0",
              )}
              style={
                desktopSidebarMode === "fixed"
                  ? { top: SIDEBAR_TOP_OFFSET, width: desktopSidebarWidth }
                  : undefined
              }
            >
              <FiltersPanel
                countLabel={countLabel}
                locale={locale}
                sortOrder={sortOrder}
                filterTrip={filterTrip}
                filterRegion={filterRegion}
                filterTransport={filterTransport}
                filterCompanion={filterCompanion}
                filterReason={filterReason}
                filterYear={filterYear}
                tripCountryOptions={tripCountryOptions}
                regionOptions={regionOptions}
                transportOptions={transportOptions}
                companionOptions={companionOptions}
                reasonOptions={reasonOptions}
                yearOptions={yearOptions}
                onTripChange={setFilterTrip}
                onRegionChange={setFilterRegion}
                onTransportChange={setFilterTransport}
                onCompanionChange={setFilterCompanion}
                onReasonChange={setFilterReason}
                onYearChange={setFilterYear}
                onSortToggle={() =>
                  setSortOrder((current) => (current === "newest" ? "oldest" : "newest"))
                }
                onClear={clearFilters}
                formatTransport={(value) => formatTransportLabel(value, i18n.locale)}
                t={t}
              />
            </div>
          </aside>
        </>
      )}

      <div
        ref={timelineListRef}
        className="relative border-l-2 border-primary/20 ml-4 md:ml-8 py-4 space-y-16 min-w-0"
      >
        {filteredSorted.map((item, idx) => {
          return (
            <motion.div
              key={item.type === "trip" ? `trip-${item.trip.id}` : `journey-${item.journey.id}`}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="relative pl-8 md:pl-12"
            >
              <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-accent border-4 border-background shadow-sm" />

              {item.type === "trip" ? (
                renderTripCard(
                  item.trip,
                  posts.filter((post) => post.tripId === item.trip.id),
                  item.distanceKm,
                  i18n,
                  undefined,
                  t("estimatedTripDistance"),
                )
              ) : (
                <div className="space-y-4">
                  <div className="bg-card border rounded-2xl p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <p className="text-xs text-muted-foreground font-mono uppercase tracking-[0.25em]">
                          {t("multiCountryJourney")}
                        </p>
                        <h3 className="font-serif text-3xl font-bold text-foreground mt-2">
                          {item.journey.name}
                        </h3>
                        <p className="text-sm text-muted-foreground font-mono mt-2 uppercase tracking-wider">
                          {formatDate(item.sortDate, "monthYear")}
                        </p>
                      </div>
                      {formatDistanceKm(item.distanceKm) && (
                        <div className="rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm">
                          <strong className="block font-serif text-foreground">
                            {t("estimatedJourneyDistance")}
                          </strong>
                          <span className="text-muted-foreground">
                            {formatDistanceKm(item.distanceKm)}
                          </span>
                        </div>
                      )}
                    </div>
                    {item.journey.notes && (
                      <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                        {item.journey.notes}
                      </p>
                    )}
                  </div>
                  <div className="space-y-6">
                    {item.trips.map((trip, tripIndex) => (
                      <div key={trip.id}>
                        {renderTripCard(
                          trip,
                          posts.filter((post) => post.tripId === trip.id),
                          computeJourneyTripDistance(item.journey, item.trips, tripIndex),
                          i18n,
                          `${t("stepOf")} ${tripIndex + 1} / ${item.trips.length}`,
                          t("estimatedLegDistance"),
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}

        {filteredSorted.length === 0 && (
          <div className="text-center py-10 text-muted-foreground font-serif italic">
            {t("noEntries")}
          </div>
        )}
      </div>
    </div>
  );
}
