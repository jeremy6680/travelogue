import type { Locale } from "@/lib/i18n";

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
