import { useEffect, useMemo, useRef, useState } from "react";
import { getMediaAssetImageUrl } from "@/lib/cloudinary";
import { useJourneysQuery, usePostsQuery, useTripsQuery } from "@/lib/directus";
import { getPostHref, isExternalPost } from "@/lib/post-links";
import { blogPostTitleHoverClass } from "@/lib/post-title-hover";
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
import { Button } from "@/components/ui/button";
import { MultiSelectFilter } from "@/components/multi-select-filter";
import { Input } from "@/components/ui/input";
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
import { computeJourneyDistance, computeJourneyTripDistance, getTripAnalyticsPoints } from "@/lib/travel-analytics";
import {
  formatAccomodationLabels,
  formatTravelReasonLabel,
  formatTransportLabel,
  formatTransportLabels,
  getContinentKey,
  sortTransportValues,
} from "@/lib/trip-options";
import { getTripCities, tripMatchesKeyword } from "@/lib/travel-insights";
import { getCountryFlagEmoji } from "@/lib/travel-countries";

function formatLengthOfStay(
  t: ReturnType<typeof useI18n>["t"],
  formatDaysLabel: ReturnType<typeof useI18n>["formatDaysLabel"],
  durationDays: number,
) {
  if (durationDays <= 0) return t("sameDay");
  return formatDaysLabel(durationDays);
}

interface TravelTimelineProps {
  showFilters?: boolean;
}

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
type YearOption = {
  value: string;
  count: number;
};

type TimelineItem =
  | { type: "trip"; sortDate: string; trip: Trip; distanceKm: number | null }
  | { type: "journey"; sortDate: string; journey: Journey; trips: Trip[]; distanceKm: number | null };

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
      label: `${getCountryFlagEmoji(code)} ${countryName(code)} (${count})`,
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


function renderTripCard(
  trip: Trip,
  tripPosts: Post[],
  distanceKm: number | null,
  i18n: ReturnType<typeof useI18n>,
  metadata?: string,
  summaryLabel?: string,
  durationDays?: number,
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
    t,
    formatDaysLabel,
    durationDays ??
      Math.max(
        0,
        differenceInCalendarDays(
          new Date(trip.visitedUntil ?? trip.visitedAt),
          new Date(trip.visitedAt),
        ),
      ),
  );
  const distanceLabel = formatDistanceKm(distanceKm);

  return (
    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h3 className="font-serif text-3xl font-bold flex items-center gap-3 text-foreground">
            <span className="text-4xl" aria-hidden="true">
              {getCountryFlagEmoji(trip.countryCode)}
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
                <div className="pl-2">
                  <h5 className={cn("font-serif font-bold text-base", blogPostTitleHoverClass)}>
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
  filterTrip: string[];
  filterRegion: string[];
  filterTransport: string[];
  filterCompanion: string[];
  filterReason: string[];
  filterYear: string[];
  filterCity: string[];
  searchQuery: string;
  tripCountryOptions: TripCountryOption[];
  regionOptions: RegionOption[];
  transportOptions: string[];
  companionOptions: FacetOption[];
  reasonOptions: FacetOption[];
  yearOptions: YearOption[];
  cityOptions: FacetOption[];
  onTripChange: (value: string[]) => void;
  onRegionChange: (value: string[]) => void;
  onTransportChange: (value: string[]) => void;
  onCompanionChange: (value: string[]) => void;
  onReasonChange: (value: string[]) => void;
  onYearChange: (value: string[]) => void;
  onCityChange: (value: string[]) => void;
  onSearchChange: (value: string) => void;
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
  filterCity,
  searchQuery,
  tripCountryOptions,
  regionOptions,
  transportOptions,
  companionOptions,
  reasonOptions,
  yearOptions,
  cityOptions,
  onTripChange,
  onRegionChange,
  onTransportChange,
  onCompanionChange,
  onReasonChange,
  onYearChange,
  onCityChange,
  onSearchChange,
  onSortToggle,
  onClear,
  formatTransport,
  t,
}: FiltersPanelProps) {
  const hasActiveFilters =
    filterTrip.length > 0 ||
    filterRegion.length > 0 ||
    filterTransport.length > 0 ||
    filterCompanion.length > 0 ||
    filterReason.length > 0 ||
    filterYear.length > 0 ||
    filterCity.length > 0 ||
    searchQuery.trim().length > 0;

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
        <div className="flex flex-col items-end gap-3">
          <div className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-mono text-muted-foreground">
            {countLabel}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onSortToggle}
            className="justify-between"
            data-testid="button-sort-order"
          >
            <span>
              {locale === "fr"
                ? sortOrder === "newest"
                  ? "Plus récents"
                  : "Plus anciens"
                : sortOrder === "newest"
                  ? "Newest"
                  : "Oldest"}
            </span>
            <ArrowUpDown className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
            Zone
          </p>
          <MultiSelectFilter
            label="Zone"
            placeholder={t("allRegions")}
            options={regionOptions.map((option) => ({
              value: option.value,
              label: (
                <span className="flex items-center justify-between gap-3">
                  <span>{option.label.replace(/\s*\(\d+\)\s*$/, "")}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-foreground">
                    {option.count}
                  </span>
                </span>
              ),
              triggerLabel: option.label.replace(/\s*\(\d+\)\s*$/, ""),
            }))}
            selectedValues={filterRegion}
            onChange={onRegionChange}
            className="w-full"
            data-testid="select-filter-region"
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
            Pays
          </p>
          <MultiSelectFilter
            label="Pays"
            placeholder={t("allTrips")}
            options={tripCountryOptions.map((option) => ({
              value: option.value,
              label: (
                <span className="flex items-center justify-between gap-3">
                  <span>{option.label.replace(/\s*\(\d+\)\s*$/, "")}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-foreground">
                    {option.count}
                  </span>
                </span>
              ),
              triggerLabel: option.label.replace(/\s*\(\d+\)\s*$/, ""),
            }))}
            selectedValues={filterTrip}
            onChange={onTripChange}
            className="w-full"
            data-testid="select-filter-trip"
          />
        </div>

        {cityOptions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
              Ville
            </p>
            <MultiSelectFilter
              label="Ville"
              placeholder={locale === "fr" ? "Villes" : "Cities"}
              options={cityOptions.map((option) => ({
                value: option.value,
                label: (
                  <span className="flex items-center justify-between gap-3">
                    <span>{option.label}</span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-foreground">
                      {option.count}
                    </span>
                  </span>
                ),
                triggerLabel: option.label,
              }))}
              selectedValues={filterCity}
              onChange={onCityChange}
              className="w-full"
              data-testid="select-filter-city"
            />
          </div>
        )}

        {yearOptions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
              Année
            </p>
            <MultiSelectFilter
              label={locale === "fr" ? "Année" : "Year"}
              placeholder={t("allYears")}
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
              onChange={onYearChange}
              className="w-full"
              data-testid="select-filter-year"
            />
          </div>
        )}

        {companionOptions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
              {t("companions")}
            </p>
            <MultiSelectFilter
              label={t("companions")}
              placeholder={t("companions")}
              options={companionOptions.map((option) => ({
                value: option.value,
                label: (
                  <span className="flex items-center justify-between gap-3">
                    <span>{option.label}</span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-foreground">
                      {option.count}
                    </span>
                  </span>
                ),
                triggerLabel: option.label,
              }))}
              selectedValues={filterCompanion}
              onChange={onCompanionChange}
              className="w-full"
              data-testid="select-filter-companion"
            />
          </div>
        )}

        {reasonOptions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
              {locale === "fr" ? "Raison" : "Reason"}
            </p>
            <MultiSelectFilter
              label={locale === "fr" ? "Raison" : "Reason"}
              placeholder={locale === "fr" ? "Raison du voyage" : "Reason for travel"}
              options={reasonOptions.map((option) => ({
                value: option.value,
                label: (
                  <span className="flex items-center justify-between gap-3">
                    <span>{option.label.replace(/\s*\(\d+\)\s*$/, "")}</span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-foreground">
                      {option.count}
                    </span>
                  </span>
                ),
                triggerLabel: option.label.replace(/\s*\(\d+\)\s*$/, ""),
              }))}
              selectedValues={filterReason}
              onChange={onReasonChange}
              className="w-full"
              data-testid="select-filter-reason"
            />
          </div>
        )}

        {transportOptions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
              Transport
            </p>
            <MultiSelectFilter
              label="Transport"
              placeholder={t("allTransport")}
              options={transportOptions.map((transport) => ({
                value: transport,
                label: <span>{formatTransport(transport)}</span>,
                triggerLabel: formatTransport(transport),
              }))}
              selectedValues={filterTransport}
              onChange={onTransportChange}
              className="w-full"
              data-testid="select-filter-transport"
            />
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
            {locale === "fr" ? "Recherche" : "Search"}
          </p>
          <Input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={locale === "fr" ? "Mot-clé" : "Keyword"}
            className="w-full"
          />
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-3">
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
  const [filterTrip, setFilterTrip] = useState<string[]>([]);
  const [filterRegion, setFilterRegion] = useState<string[]>([]);
  const [filterTransport, setFilterTransport] = useState<string[]>([]);
  const [filterCompanion, setFilterCompanion] = useState<string[]>([]);
  const [filterReason, setFilterReason] = useState<string[]>([]);
  const [filterYear, setFilterYear] = useState<string[]>([]);
  const [filterCity, setFilterCity] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
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
    const counts = new Map<string, number>();
    for (const t of trips) {
      if (!t.visitedAt) continue;
      const year = new Date(t.visitedAt).getFullYear().toString();
      counts.set(year, (counts.get(year) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((left, right) => Number(right.value) - Number(left.value));
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

  const cityOptions = useMemo(() => {
    const counts = new Map<string, number>();

    for (const trip of trips) {
      for (const city of new Set(getTripCities(trip))) {
        counts.set(city, (counts.get(city) ?? 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((left, right) => {
        if (right.count !== left.count) return right.count - left.count;
        return left.label.localeCompare(right.label, locale);
      });
  }, [locale, trips]);

  const analyticsByTripId = useMemo(
    () =>
      new Map(
        getTripAnalyticsPoints(trips, journeys).map((point) => [point.trip.id, point]),
      ),
    [journeys, trips],
  );

  const filteredSorted = useMemo<TimelineItem[]>(() => {
    let list = [...trips];
    if (filterTrip.length > 0) {
      list = list.filter((trip) => filterTrip.includes(trip.countryCode.toUpperCase()));
    }
    if (filterRegion.length > 0) {
      list = list.filter((trip) => {
        return filterRegion.some((region) => {
          if (region === "france") {
            return trip.countryCode.toUpperCase() === "FR";
          }

          if (region === "international") {
            return trip.countryCode.toUpperCase() !== "FR";
          }

          if (region.startsWith("continent:")) {
            return getContinentKey(trip.countryCode) === region.replace("continent:", "");
          }

          return false;
        });
      });
    }
    if (filterTransport.length > 0) {
      list = list.filter((t) => {
        const modes = [...t.transportationTo, ...t.transportationOnSite];
        return filterTransport.every((transport) => modes.includes(transport));
      });
    }
    if (filterCompanion.length > 0) {
      list = list.filter((trip) =>
        filterCompanion.every((companion) => trip.travelCompanions.includes(companion)),
      );
    }
    if (filterReason.length > 0) {
      list = list.filter((trip) =>
        filterReason.every((reason) => trip.reasonForTravel.includes(reason)),
      );
    }
    if (filterYear.length > 0) {
      list = list.filter(
        (t) =>
          t.visitedAt &&
          filterYear.includes(new Date(t.visitedAt).getFullYear().toString()),
      );
    }
    if (filterCity.length > 0) {
      list = list.filter((trip) => {
        const cities = getTripCities(trip);
        return filterCity.every((city) => cities.includes(city));
      });
    }
    if (searchQuery.trim()) {
      list = list.filter((trip) =>
        tripMatchesKeyword(
          trip,
          searchQuery,
          posts.filter((post) => post.tripId === trip.id),
        ),
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
          distanceKm: analyticsByTripId.get(trip.id)?.distanceKm ?? null,
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
    filterCity,
    searchQuery,
    sortOrder,
    posts,
    analyticsByTripId,
  ]);

  const clearFilters = () => {
    setFilterTrip([]);
    setFilterRegion([]);
    setFilterTransport([]);
    setFilterCompanion([]);
    setFilterReason([]);
    setFilterYear([]);
    setFilterCity([]);
    setSearchQuery("");
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
                  filterCity={filterCity}
                  searchQuery={searchQuery}
                  tripCountryOptions={tripCountryOptions}
                  regionOptions={regionOptions}
                  transportOptions={transportOptions}
                  companionOptions={companionOptions}
                  reasonOptions={reasonOptions}
                  yearOptions={yearOptions}
                  cityOptions={cityOptions}
                  onTripChange={setFilterTrip}
                  onRegionChange={setFilterRegion}
                  onTransportChange={setFilterTransport}
                  onCompanionChange={setFilterCompanion}
                  onReasonChange={setFilterReason}
                  onYearChange={setFilterYear}
                  onCityChange={setFilterCity}
                  onSearchChange={setSearchQuery}
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
              <p className="mt-1 inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm text-foreground">
                {countLabel}
              </p>
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
                filterCity={filterCity}
                searchQuery={searchQuery}
                tripCountryOptions={tripCountryOptions}
                regionOptions={regionOptions}
                transportOptions={transportOptions}
                companionOptions={companionOptions}
                reasonOptions={reasonOptions}
                yearOptions={yearOptions}
                cityOptions={cityOptions}
                onTripChange={setFilterTrip}
                onRegionChange={setFilterRegion}
                onTransportChange={setFilterTransport}
                onCompanionChange={setFilterCompanion}
                onReasonChange={setFilterReason}
                onYearChange={setFilterYear}
                onCityChange={setFilterCity}
                onSearchChange={setSearchQuery}
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
                  analyticsByTripId.get(item.trip.id)?.durationDays,
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
                          analyticsByTripId.get(trip.id)?.durationDays,
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
