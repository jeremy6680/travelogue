import type { Concert, SportEvent } from "@/lib/travel-types";

export type EventRatingKey =
  | "eventAppeal"
  | "performance"
  | "atmosphere"
  | "venue"
  | "stakes";

export type EventRatings = Record<EventRatingKey, number | null>;

export type RatableEvent = Pick<
  Concert | SportEvent,
  | "ratingEventAppeal"
  | "ratingPerformance"
  | "ratingAtmosphere"
  | "ratingVenue"
  | "ratingStakes"
>;

export const EVENT_RATING_KEYS: EventRatingKey[] = [
  "eventAppeal",
  "performance",
  "atmosphere",
  "venue",
  "stakes",
];

export const CONCERT_RATING_KEYS: EventRatingKey[] = [
  "eventAppeal",
  "performance",
  "atmosphere",
  "venue",
  "stakes",
];

export function getEventRatings(event: RatableEvent): EventRatings {
  return {
    eventAppeal: event.ratingEventAppeal,
    performance: event.ratingPerformance,
    atmosphere: event.ratingAtmosphere,
    venue: event.ratingVenue,
    stakes: event.ratingStakes,
  };
}

export function roundEventScore(value: number) {
  return Math.round(value * 2) / 2;
}

export function getEventScore(
  event: RatableEvent,
  ratingKeys: EventRatingKey[] = EVENT_RATING_KEYS,
) {
  const total = getEventScoreTotal(event, ratingKeys);

  return roundEventScore(total / ratingKeys.length);
}

export function getEventScoreTotal(
  event: RatableEvent,
  ratingKeys: EventRatingKey[] = EVENT_RATING_KEYS,
) {
  const ratings = getEventRatings(event);

  return ratingKeys.reduce((total, ratingKey) => total + (ratings[ratingKey] ?? 0), 0);
}

export function formatEventScore(score: number | null, emptyLabel = "-") {
  if (score == null) return emptyLabel;
  return `${Number.isInteger(score) ? score.toFixed(0) : score.toFixed(1)}/5`;
}

export function getRatingLabel(
  key: EventRatingKey,
  locale: "fr" | "en",
  context: "default" | "concert" = "default",
) {
  if (context === "concert" && key === "stakes") {
    return locale === "fr" ? "Exceptionnalité" : "Exceptional quality";
  }

  const labels: Record<EventRatingKey, { fr: string; en: string }> = {
    eventAppeal: { fr: "Affiche", en: "Lineup" },
    performance: { fr: "Performance", en: "Performance" },
    atmosphere: { fr: "Ambiance", en: "Atmosphere" },
    venue: { fr: "Lieu", en: "Venue" },
    stakes: { fr: "Enjeu", en: "Stakes" },
  };

  return labels[key][locale];
}

export function getScoreFilterValue(score: number | null) {
  return score == null ? "" : score.toFixed(1);
}
