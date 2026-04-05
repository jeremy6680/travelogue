import { differenceInCalendarDays } from "date-fns";
import type { Journey, Trip } from "@/lib/travel-types";

const NICE_COORDINATES = { latitude: 43.7102, longitude: 7.262 };

type Coordinates = { latitude: number; longitude: number };

export type TripAnalyticsPoint = {
  trip: Trip;
  distanceKm: number | null;
  durationDays: number;
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

export function getTripDurationDays(trip: Trip) {
  if (!trip.visitedUntil) return 1;

  const start = new Date(trip.visitedAt);
  const end = new Date(trip.visitedUntil);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;

  return Math.max(1, differenceInCalendarDays(end, start) + 1);
}

export function computeStandaloneTripDistance(trip: Trip) {
  const coordinates = getTripCoordinates(trip);
  if (!coordinates) return null;
  return haversineKm(NICE_COORDINATES, coordinates) * 2;
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

  for (const trip of trips) {
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

  return trips.map((trip) => ({
    trip,
    distanceKm: distanceByTripId.get(trip.id) ?? null,
    durationDays: getTripDurationDays(trip),
  }));
}
