import { useState, useMemo } from "react";
import { getMediaAssetImageUrl } from "@/lib/cloudinary";
import { useJourneysQuery, usePostsQuery, useTripsQuery } from "@/lib/directus";
import type { Journey, Post, Trip } from "@/lib/travel-types";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { differenceInCalendarDays, format } from "date-fns";
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
  Milestone,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const NICE_COORDINATES = { latitude: 43.7102, longitude: 7.262 };

function getFlagEmoji(countryCode: string) {
  if (!countryCode || countryCode.length !== 2) return "";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

function formatLengthOfStay(visitedAt: string, visitedUntil: string | null) {
  if (!visitedUntil) return null;

  const start = new Date(visitedAt);
  const end = new Date(visitedUntil);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  const days = differenceInCalendarDays(end, start);

  if (days < 0) return null;
  if (days === 0) return "Same day";

  return `${days} day${days > 1 ? "s" : ""}`;
}

function getTripRegion(countryCode: string) {
  return countryCode.toUpperCase() === "FR" ? "france" : "international";
}

interface TravelTimelineProps {
  showFilters?: boolean;
}

type Coordinates = { latitude: number; longitude: number };

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

function formatDistance(distanceKm: number | null) {
  if (distanceKm == null) return null;
  return `${Math.round(distanceKm).toLocaleString("en-US")} km approx.`;
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

  const previousCoordinates =
    tripIndex === 0
      ? getJourneyEndpoint(
          journey.originMode,
          journey.originLatitude,
          journey.originLongitude,
        )
      : getTripCoordinates(orderedTrips[tripIndex - 1]);
  const nextCoordinates =
    tripIndex === orderedTrips.length - 1
      ? getJourneyEndpoint(
          journey.destinationMode,
          journey.destinationLatitude,
          journey.destinationLongitude,
        )
      : getTripCoordinates(orderedTrips[tripIndex + 1]);

  if (!previousCoordinates || !nextCoordinates) return null;

  return (
    haversineKm(previousCoordinates, currentCoordinates) +
    haversineKm(currentCoordinates, nextCoordinates)
  );
}

function renderTripCard(
  trip: Trip,
  tripPosts: Post[],
  distanceKm: number | null,
  metadata?: string,
  summaryLabel = "Estimated Distance",
) {
  const accomodationLabel = trip.accomodation.join(", ");
  const transportationToLabel = trip.transportationTo.join(", ");
  const transportationOnSiteLabel = trip.transportationOnSite.join(", ");
  const lengthOfStay = formatLengthOfStay(
    trip.visitedAt,
    trip.visitedUntil,
  );
  const distanceLabel = formatDistance(distanceKm);

  return (
    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h3 className="font-serif text-3xl font-bold flex items-center gap-3 text-foreground">
            <span className="text-4xl" aria-hidden="true">
              {getFlagEmoji(trip.countryCode)}
            </span>
            {trip.name}
          </h3>
          <p className="text-sm text-muted-foreground font-mono mt-2 uppercase tracking-wider">
            {format(new Date(trip.visitedAt), "MMMM yyyy")}
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
                Cities Visited
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
                The Mission
              </strong>
              <span className="text-muted-foreground leading-relaxed">
                {trip.reasonForVisit}
              </span>
            </div>
          </div>
        )}
        {trip.travelCompanions && (
          <div className="flex items-start gap-2.5">
            <Users className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
            <div>
              <strong className="block text-foreground mb-0.5 font-serif">
                Companions
              </strong>
              <span className="text-muted-foreground leading-relaxed">
                {trip.travelCompanions}
              </span>
            </div>
          </div>
        )}
        {trip.friendsFamilyMet && (
          <div className="flex items-start gap-2.5">
            <Heart className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
            <div>
              <strong className="block text-foreground mb-0.5 font-serif">
                Met Along the Way
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
                Getting There
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
                Getting Around
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
                Accomodation
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
                Length of Stay
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
            Dispatches from {trip.name}
          </h4>
          <div className="grid gap-3">
            {tripPosts.map((post) => (
              <Link
                key={post.id}
                href={`/posts/${post.slug}`}
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
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function TravelTimeline({ showFilters = true }: TravelTimelineProps) {
  const { data: journeys = [] } = useJourneysQuery();
  const { data: trips = [], isLoading } = useTripsQuery();
  const { data: posts = [] } = usePostsQuery();
  const [filterTrip, setFilterTrip] = useState<string>("all");
  const [filterRegion, setFilterRegion] = useState<string>("all");
  const [filterTransport, setFilterTransport] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const transportOptions = useMemo(() => {
    const modes = new Set<string>();
    for (const trip of trips) {
      for (const mode of [...trip.transportationTo, ...trip.transportationOnSite]) {
        modes.add(mode);
      }
    }
    return Array.from(modes).sort();
  }, [trips]);

  const yearOptions = useMemo(() => {
    const years = new Set<string>();
    for (const t of trips) {
      if (t.visitedAt)
        years.add(new Date(t.visitedAt).getFullYear().toString());
    }
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [trips]);

  const filteredSorted = useMemo<TimelineItem[]>(() => {
    let list = [...trips];
    if (filterTrip !== "all") {
      list = list.filter((t) => String(t.id) === filterTrip);
    }
    if (filterRegion !== "all") {
      list = list.filter((t) => getTripRegion(t.countryCode) === filterRegion);
    }
    if (filterTransport !== "all") {
      list = list.filter((t) => {
        const modes = [...t.transportationTo, ...t.transportationOnSite];
        return modes.includes(filterTransport);
      });
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
  }, [trips, journeys, filterTrip, filterRegion, filterTransport, filterYear, sortOrder]);

  if (isLoading) {
    return (
      <div className="py-20 text-center text-muted-foreground animate-pulse font-serif italic">
        Unfolding the map...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {showFilters && (
        <div className="flex flex-wrap gap-3 items-center">
          <Select value={filterTrip} onValueChange={setFilterTrip}>
            <SelectTrigger className="w-48" data-testid="select-filter-trip">
              <SelectValue placeholder="All Trips" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trips</SelectItem>
              {trips.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>
                  {getFlagEmoji(t.countryCode)} {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterRegion} onValueChange={setFilterRegion}>
            <SelectTrigger className="w-44" data-testid="select-filter-region">
              <SelectValue placeholder="All Regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              <SelectItem value="france">France</SelectItem>
              <SelectItem value="international">International</SelectItem>
            </SelectContent>
          </Select>

          {transportOptions.length > 0 && (
            <Select value={filterTransport} onValueChange={setFilterTransport}>
              <SelectTrigger
                className="w-44"
                data-testid="select-filter-transport"
              >
                <SelectValue placeholder="All Transport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transport</SelectItem>
                {transportOptions.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {yearOptions.length > 0 && (
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-32" data-testid="select-filter-year">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setSortOrder((s) => (s === "newest" ? "oldest" : "newest"))
            }
            className="flex items-center gap-2"
            data-testid="button-sort-order"
          >
            <ArrowUpDown className="w-4 h-4" />
            {sortOrder === "newest" ? "Newest First" : "Oldest First"}
          </Button>

          {(filterTrip !== "all" ||
            filterRegion !== "all" ||
            filterTransport !== "all" ||
            filterYear !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterTrip("all");
                setFilterRegion("all");
                setFilterTransport("all");
                setFilterYear("all");
              }}
              className="text-muted-foreground"
              data-testid="button-clear-filters"
            >
              Clear filters
            </Button>
          )}

          <span className="text-sm text-muted-foreground font-mono ml-auto">
            {filteredSorted.length}{" "}
            {filteredSorted.length === 1 ? "entry" : "entries"}
          </span>
        </div>
      )}

      <div className="relative border-l-2 border-primary/20 ml-4 md:ml-8 py-4 space-y-16">
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
                  undefined,
                  "Estimated Trip Distance",
                )
              ) : (
                <div className="space-y-4">
                  <div className="bg-card border rounded-2xl p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <p className="text-xs text-muted-foreground font-mono uppercase tracking-[0.25em]">
                          Multi-country journey
                        </p>
                        <h3 className="font-serif text-3xl font-bold text-foreground mt-2">
                          {item.journey.name}
                        </h3>
                        <p className="text-sm text-muted-foreground font-mono mt-2 uppercase tracking-wider">
                          {format(new Date(item.sortDate), "MMMM yyyy")}
                        </p>
                      </div>
                      {formatDistance(item.distanceKm) && (
                        <div className="rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm">
                          <strong className="block font-serif text-foreground">
                            Estimated Journey Distance
                          </strong>
                          <span className="text-muted-foreground">
                            {formatDistance(item.distanceKm)}
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
                          `Step ${tripIndex + 1} of ${item.trips.length}`,
                          "Estimated Trip Distance",
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
            No entries match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
