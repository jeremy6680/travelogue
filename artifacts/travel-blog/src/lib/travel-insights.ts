import { differenceInCalendarDays } from "date-fns";
import type { Post, Trip } from "@/lib/travel-types";

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function splitCommaValues(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getTripCities(trip: Trip) {
  return splitCommaValues(trip.visitedCities);
}

export function getTripNightCount(trip: Trip) {
  if (!trip.visitedUntil) return 1;

  const start = new Date(trip.visitedAt);
  const end = new Date(trip.visitedUntil);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 1;
  }

  return Math.max(0, differenceInCalendarDays(end, start));
}

export function getTripNightEntriesByMonth(trip: Trip) {
  const start = new Date(trip.visitedAt);
  const end = trip.visitedUntil ? new Date(trip.visitedUntil) : null;

  if (Number.isNaN(start.getTime())) return [];

  if (!end || Number.isNaN(end.getTime())) {
    return [{ year: start.getFullYear(), month: start.getMonth(), nights: 1 }];
  }

  const totalNights = Math.max(0, differenceInCalendarDays(end, start));
  if (totalNights === 0) {
    return [{ year: start.getFullYear(), month: start.getMonth(), nights: 0 }];
  }

  const counts = new Map<string, { year: number; month: number; nights: number }>();

  for (let offset = 0; offset < totalNights; offset += 1) {
    const nightDate = new Date(start);
    nightDate.setDate(start.getDate() + offset);
    const year = nightDate.getFullYear();
    const month = nightDate.getMonth();
    const key = `${year}-${month}`;
    const current = counts.get(key) ?? { year, month, nights: 0 };
    current.nights += 1;
    counts.set(key, current);
  }

  return Array.from(counts.values());
}

function buildTripSearchText(trip: Trip, relatedPosts: Post[] = []) {
  return normalizeText(
    [
      trip.name,
      trip.countryCode,
      trip.visitedCities,
      trip.reasonForVisit,
      trip.friendsFamilyMet,
      ...trip.travelCompanions,
      ...trip.reasonForTravel,
      ...trip.transportationTo,
      ...trip.transportationOnSite,
      ...trip.accomodation,
      ...relatedPosts.flatMap((post) => [post.title, post.excerpt, post.content, post.location ?? ""]),
    ].join(" "),
  );
}

export function tripMatchesKeyword(trip: Trip, keyword: string, relatedPosts: Post[] = []) {
  const query = normalizeText(keyword);
  if (!query) return true;
  return buildTripSearchText(trip, relatedPosts).includes(query);
}

export function postMatchesKeyword(post: Post, keyword: string, trip?: Trip | null) {
  const query = normalizeText(keyword);
  if (!query) return true;

  const tripText = trip
    ? [
        trip.name,
        trip.countryCode,
        trip.visitedCities,
        trip.reasonForVisit,
        trip.friendsFamilyMet,
        ...trip.travelCompanions,
        ...trip.reasonForTravel,
        ...trip.transportationTo,
        ...trip.transportationOnSite,
        ...trip.accomodation,
      ].join(" ")
    : "";

  return normalizeText(
    [post.title, post.excerpt, post.content, post.location ?? "", tripText].join(" "),
  ).includes(query);
}
