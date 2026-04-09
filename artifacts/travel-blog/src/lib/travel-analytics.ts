import { differenceInCalendarDays } from "date-fns";
import type { Journey, Trip } from "@/lib/travel-types";

const NICE_COORDINATES = { latitude: 43.7102, longitude: 7.262 };

type Coordinates = { latitude: number; longitude: number };

export type TripAnalyticsPoint = {
  trip: Trip;
  distanceKm: number | null;
  durationDays: number;
  nightCount: number;
  nightEntriesByMonth: { year: number; month: number; nights: number }[];
};

function isCoordinatePair(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): boolean {
  return typeof latitude === "number" && typeof longitude === "number";
}

function getTripCoordinates(trip: Trip): Coordinates | null {
  if (!isCoordinatePair(trip.latitude, trip.longitude)) return null;
  return {
    latitude: trip.latitude as number,
    longitude: trip.longitude as number,
  };
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

function getTripStartDate(trip: Trip) {
  const date = new Date(trip.visitedAt);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getTripEndDateExclusive(trip: Trip) {
  const start = getTripStartDate(trip);
  if (!start) return null;

  if (!trip.visitedUntil) {
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return end;
  }

  const end = new Date(trip.visitedUntil);
  if (Number.isNaN(end.getTime())) return null;
  return end;
}

function getRawTripNightCount(trip: Trip) {
  if (!trip.visitedUntil) return 1;

  const start = new Date(trip.visitedAt);
  const end = new Date(trip.visitedUntil);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;

  return Math.max(0, differenceInCalendarDays(end, start));
}

function getTripParentMap(trips: Trip[]) {
  const parentByTripId = new Map<number, number | null>();

  for (const trip of trips) {
    const tripStart = getTripStartDate(trip);
    const tripEnd = getTripEndDateExclusive(trip);
    if (!tripStart || !tripEnd) {
      parentByTripId.set(trip.id, null);
      continue;
    }

    const parent = trips
      .filter((candidate) => candidate.id !== trip.id)
      .filter((candidate) => {
        const candidateStart = getTripStartDate(candidate);
        const candidateEnd = getTripEndDateExclusive(candidate);
        if (!candidateStart || !candidateEnd) return false;

        return (
          candidateStart.getTime() <= tripStart.getTime() &&
          candidateEnd.getTime() >= tripEnd.getTime()
        );
      })
      .sort((left, right) => {
        const leftSpan =
          (getTripEndDateExclusive(left)?.getTime() ?? Number.MAX_SAFE_INTEGER) -
          (getTripStartDate(left)?.getTime() ?? 0);
        const rightSpan =
          (getTripEndDateExclusive(right)?.getTime() ?? Number.MAX_SAFE_INTEGER) -
          (getTripStartDate(right)?.getTime() ?? 0);
        if (leftSpan !== rightSpan) return leftSpan - rightSpan;
        return left.id - right.id;
      })[0];

    parentByTripId.set(trip.id, parent?.id ?? null);
  }

  return parentByTripId;
}

function buildCoveredNightSet(tripById: Map<number, Trip>, childIds: number[]) {
  const coveredNights = new Set<number>();

  for (const childId of childIds) {
    const child = tripById.get(childId);
    const start = child ? getTripStartDate(child) : null;
    const endExclusive = child ? getTripEndDateExclusive(child) : null;
    if (!start || !endExclusive) continue;

    for (
      let current = new Date(start);
      current.getTime() < endExclusive.getTime();
      current.setDate(current.getDate() + 1)
    ) {
      coveredNights.add(current.getTime());
    }
  }

  return coveredNights;
}

function getAdjustedTripNightEntriesByMonth(
  trip: Trip,
  tripById: Map<number, Trip>,
  childIdsByTripId: Map<number, number[]>,
) {
  const start = getTripStartDate(trip);
  const endExclusive = getTripEndDateExclusive(trip);

  if (!start || !endExclusive) return [];

  const coveredNights = buildCoveredNightSet(tripById, childIdsByTripId.get(trip.id) ?? []);
  const counts = new Map<string, { year: number; month: number; nights: number }>();

  for (
    let current = new Date(start);
    current.getTime() < endExclusive.getTime();
    current.setDate(current.getDate() + 1)
  ) {
    if (coveredNights.has(current.getTime())) continue;

    const year = current.getFullYear();
    const month = current.getMonth();
    const key = `${year}-${month}`;
    const entry = counts.get(key) ?? { year, month, nights: 0 };
    entry.nights += 1;
    counts.set(key, entry);
  }

  return Array.from(counts.values());
}

export function getTripDurationDays(trip: Trip, nightCount?: number) {
  return Math.max(1, nightCount ?? getRawTripNightCount(trip));
}

export function computeStandaloneTripDistance(trip: Trip) {
  const coordinates = getTripCoordinates(trip);
  if (!coordinates) return null;
  return haversineKm(NICE_COORDINATES, coordinates) * 2;
}

function computeNestedTripDistance(trip: Trip, parentTrip: Trip) {
  const origin = getTripCoordinates(parentTrip);
  const destination = getTripCoordinates(trip);
  if (!origin || !destination) return null;
  return haversineKm(origin, destination) * 2;
}

export function computeJourneyDistance(journey: Journey, orderedTrips: Trip[]) {
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

export function computeJourneyTripDistance(
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

export function getTripAnalyticsPoints(
  trips: Trip[],
  journeys: Journey[],
): TripAnalyticsPoint[] {
  const distanceByTripId = new Map<number, number | null>();
  const groupedTrips = new Map<number, Trip[]>();
  const journeyById = new Map(journeys.map((journey) => [journey.id, journey]));
  const tripById = new Map(trips.map((trip) => [trip.id, trip]));
  const parentByTripId = getTripParentMap(trips);
  const childIdsByTripId = new Map<number, number[]>();

  for (const trip of trips) {
    const parentTripId = parentByTripId.get(trip.id);
    if (parentTripId == null) continue;
    const childIds = childIdsByTripId.get(parentTripId) ?? [];
    childIds.push(trip.id);
    childIdsByTripId.set(parentTripId, childIds);
  }

  for (const trip of trips) {
    const parentTripId = parentByTripId.get(trip.id);
    if (parentTripId != null) {
      const parentTrip = tripById.get(parentTripId);
      distanceByTripId.set(
        trip.id,
        parentTrip ? computeNestedTripDistance(trip, parentTrip) : null,
      );
      continue;
    }

    if (trip.journeyId == null) {
      distanceByTripId.set(trip.id, computeStandaloneTripDistance(trip));
      continue;
    }

    const group = groupedTrips.get(trip.journeyId) ?? [];
    group.push(trip);
    groupedTrips.set(trip.journeyId, group);
  }

  for (const [journeyId, group] of groupedTrips.entries()) {
    const journey = journeyById.get(journeyId);
    const orderedTrips = [...group].sort((left, right) => {
      const orderLeft = left.journeyOrder ?? Number.MAX_SAFE_INTEGER;
      const orderRight = right.journeyOrder ?? Number.MAX_SAFE_INTEGER;
      if (orderLeft !== orderRight) return orderLeft - orderRight;
      return new Date(left.visitedAt).getTime() - new Date(right.visitedAt).getTime();
    });

    if (!journey) {
      for (const trip of orderedTrips) {
        distanceByTripId.set(trip.id, computeStandaloneTripDistance(trip));
      }
      continue;
    }

    orderedTrips.forEach((trip, index) => {
      distanceByTripId.set(
        trip.id,
        computeJourneyTripDistance(journey, orderedTrips, index),
      );
    });
  }

  return trips.map((trip) => {
    const nightEntriesByMonth = getAdjustedTripNightEntriesByMonth(
      trip,
      tripById,
      childIdsByTripId,
    );
    const nightCount = nightEntriesByMonth.reduce(
      (sum, entry) => sum + entry.nights,
      0,
    );

    return {
      trip,
      distanceKm: distanceByTripId.get(trip.id) ?? null,
      nightCount,
      nightEntriesByMonth,
      durationDays: getTripDurationDays(trip, nightCount),
    };
  });
}
