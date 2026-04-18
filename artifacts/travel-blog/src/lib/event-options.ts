import type { Locale } from "@/lib/i18n";
import type { SportEvent } from "@/lib/travel-types";

type OptionLabel = Record<Locale, string>;

const SPORT_LABELS = new Map<string, OptionLabel>([
  ["rugby", { fr: "Rugby", en: "Rugby" }],
  ["basketball", { fr: "Basketball", en: "Basketball" }],
  ["american-football", { fr: "Football américain", en: "American football" }],
  ["ice-hockey", { fr: "Hockey sur glace", en: "Ice hockey" }],
  ["baseball", { fr: "Baseball", en: "Baseball" }],
  ["football", { fr: "Football", en: "Football" }],
  ["indycar", { fr: "IndyCar", en: "IndyCar" }],
  ["cricket", { fr: "Cricket", en: "Cricket" }],
  ["formula-1", { fr: "Formule 1", en: "Formula 1" }],
  ["motorsport", { fr: "Sport auto", en: "Motorsport" }],
  ["cycling", { fr: "Cyclisme", en: "Cycling" }],
  ["tennis", { fr: "Tennis", en: "Tennis" }],
]);

const CONCERT_GENRE_LABELS = new Map<string, OptionLabel>([
  ["rock", { fr: "Rock", en: "Rock" }],
  ["jazz", { fr: "Jazz", en: "Jazz" }],
  ["classical", { fr: "Classique", en: "Classical" }],
  ["electronic", { fr: "Électro", en: "Electronic" }],
  ["world", { fr: "World", en: "World" }],
  ["hip-hop", { fr: "Hip-hop", en: "Hip-hop" }],
  ["reggae", { fr: "Reggae", en: "Reggae" }],
  ["funk-soul", { fr: "Funk & Soul", en: "Funk & Soul" }],
]);

const CONCERT_SUBGENRE_LABELS = new Map<string, OptionLabel>([
  ["alternative", { fr: "Alternative", en: "Alternative" }],
  ["folk", { fr: "Folk", en: "Folk" }],
  ["hardcore", { fr: "Hardcore", en: "Hardcore" }],
  ["metal", { fr: "Metal", en: "Metal" }],
  ["noise", { fr: "Noise", en: "Noise" }],
  ["pop", { fr: "Pop", en: "Pop" }],
  ["punk", { fr: "Punk", en: "Punk" }],
  ["post-hardcore", { fr: "Post-hardcore", en: "Post-hardcore" }],
  ["post-rock", { fr: "Post-rock", en: "Post-rock" }],
]);

function getOptionLabel(
  value: string | null | undefined,
  labels: Map<string, OptionLabel>,
  locale: Locale,
) {
  if (!value) return "";
  const normalizedValue = value.trim().toLowerCase();
  return labels.get(normalizedValue)?.[locale] ?? "";
}

export function formatSportLabel(value: string | null | undefined, locale: Locale) {
  return getOptionLabel(value, SPORT_LABELS, locale);
}

export function formatSportLabelLowercase(value: string | null | undefined, locale: Locale) {
  const label = formatSportLabel(value, locale) || value?.trim() || "";
  return label.toLocaleLowerCase(locale);
}

export function isRacePodiumSport(value: string | null | undefined) {
  const normalizedValue = value?.trim().toLowerCase();
  return normalizedValue === "motorsport" || normalizedValue === "cycling";
}

export function parseCommaSeparatedValues(value: string | null | undefined) {
  const uniqueValues = new Map<string, string>();

  for (const item of value?.split(",") ?? []) {
    const trimmed = item.trim();
    if (!trimmed) continue;

    const normalized = trimmed.toLocaleLowerCase();
    if (!uniqueValues.has(normalized)) {
      uniqueValues.set(normalized, trimmed);
    }
  }

  return Array.from(uniqueValues.values());
}

export function getSportEventMatchup(event: SportEvent) {
  return [event.homeTeam, event.awayTeam].filter(Boolean).join(" vs ");
}

function dedupeValues(values: string[]) {
  const uniqueValues = new Map<string, string>();

  for (const value of values) {
    const normalizedValue = value.trim().toLocaleLowerCase();
    if (!normalizedValue || uniqueValues.has(normalizedValue)) continue;
    uniqueValues.set(normalizedValue, value.trim());
  }

  return Array.from(uniqueValues.values());
}

export function getSportEventStars(event: SportEvent) {
  if (isRacePodiumSport(event.sport)) {
    return parseCommaSeparatedValues(event.eventStars);
  }

  return dedupeValues([
    ...parseCommaSeparatedValues(event.homeTeamStars),
    ...parseCommaSeparatedValues(event.awayTeamStars),
  ]);
}

export function getSportEventName(event: SportEvent, locale: Locale) {
  if (isRacePodiumSport(event.sport)) {
    return event.raceName || event.competition || formatSportLabel(event.sport, locale) || event.sport;
  }

  return getSportEventMatchup(event) || event.competition || formatSportLabel(event.sport, locale) || event.sport;
}

export function getSportEventTitle(event: SportEvent, locale: Locale) {
  const eventName = getSportEventName(event, locale);

  if (event.competition && eventName && event.competition !== eventName) {
    return `${event.competition} — ${eventName}`;
  }

  return eventName;
}

export function getSportEventResultItems(event: SportEvent, locale: Locale) {
  if (isRacePodiumSport(event.sport)) {
    return [
      { label: locale === "fr" ? "Vainqueur" : "Winner", value: event.winnerName },
      { label: locale === "fr" ? "2e place" : "2nd place", value: event.secondPlaceName },
      { label: locale === "fr" ? "3e place" : "3rd place", value: event.thirdPlaceName },
    ].filter((item) => Boolean(item.value));
  }

  if (event.homeScore !== null && event.awayScore !== null) {
    return [{ label: locale === "fr" ? "Score" : "Score", value: `${event.homeScore} - ${event.awayScore}` }];
  }

  return [];
}

export function getSportEventResultSummary(event: SportEvent, locale: Locale) {
  if (isRacePodiumSport(event.sport)) {
    return event.winnerName
      ? `${locale === "fr" ? "1er" : "1st"} : ${event.winnerName}`
      : "";
  }

  if (event.homeScore !== null && event.awayScore !== null) {
    return `${event.homeScore} - ${event.awayScore}`;
  }

  const items = getSportEventResultItems(event, locale);
  if (!items.length) return "";

  return items.map((item) => `${item.label}: ${item.value}`).join(" · ");
}

export function getConcertGenreValue(genre: string | null | undefined, subgenre: string | null | undefined) {
  if (genre === "rock" && subgenre) {
    return subgenre;
  }

  return genre ?? "";
}

export function formatConcertGenreValue(value: string | null | undefined, locale: Locale) {
  const label =
    getOptionLabel(value, CONCERT_SUBGENRE_LABELS, locale) ||
    getOptionLabel(value, CONCERT_GENRE_LABELS, locale) ||
    value?.trim() ||
    "";

  return label.toLocaleLowerCase(locale);
}

export function formatConcertGenreLabel(
  genre: string | null | undefined,
  subgenre: string | null | undefined,
  locale: Locale,
) {
  return formatConcertGenreValue(getConcertGenreValue(genre, subgenre), locale);
}
