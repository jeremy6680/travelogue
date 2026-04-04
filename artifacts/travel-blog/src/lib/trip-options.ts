import type { Locale } from "@/lib/i18n";

type Option = {
  value: string;
  label: Record<Locale, string>;
};

export const TRANSPORT_OPTIONS: Option[] = [
  { value: "plane", label: { fr: "Avion", en: "Plane" } },
  { value: "own car", label: { fr: "Voiture personnelle", en: "Own car" } },
  { value: "rental car", label: { fr: "Voiture de location", en: "Rental car" } },
  { value: "train", label: { fr: "Train", en: "Train" } },
  { value: "tram", label: { fr: "Tram", en: "Tram" } },
  { value: "metro", label: { fr: "Metro", en: "Metro" } },
  { value: "boat", label: { fr: "Bateau", en: "Boat" } },
  { value: "motorbike", label: { fr: "Moto", en: "Motorbike" } },
  { value: "bicycle", label: { fr: "Velo", en: "Bicycle" } },
];

export const ACCOMODATION_OPTIONS: Option[] = [
  { value: "airbnb", label: { fr: "Airbnb", en: "Airbnb" } },
  { value: "hotel", label: { fr: "Hotel", en: "Hotel" } },
  { value: "couchsurfing", label: { fr: "Couchsurfing", en: "Couchsurfing" } },
  {
    value: "apartment-rental",
    label: { fr: "Location d'appartement", en: "Apartment rental" },
  },
  { value: "homestay", label: { fr: "Famille d'accueil", en: "Homestay" } },
  {
    value: "hosted-by-friends-family",
    label: {
      fr: "Heberge (amis/famille)",
      en: "Hosted by friends/family",
    },
  },
  { value: "sonder", label: { fr: "Sonder", en: "Sonder" } },
];

export const COMPANION_OPTIONS = [
  "Hine",
  "Javier",
  "papa",
  "maman",
  "Caro",
  "Fred",
  "Guillaume",
  "Jeff",
  "Eric",
  "Nico K.",
  "Loic",
  "Flo",
  "papy",
  "mamy",
] as const;

const TRANSPORT_LABELS = new Map(
  TRANSPORT_OPTIONS.map((option) => [option.value, option.label]),
);

const ACCOMODATION_LABELS = new Map(
  ACCOMODATION_OPTIONS.map((option) => [option.value, option.label]),
);

function formatOptionLabel(
  value: string,
  labels: Map<string, Record<Locale, string>>,
  locale: Locale,
) {
  return labels.get(value)?.[locale] ?? value;
}

export function formatTransportLabel(value: string, locale: Locale) {
  return formatOptionLabel(value, TRANSPORT_LABELS, locale);
}

export function formatAccomodationLabel(value: string, locale: Locale) {
  return formatOptionLabel(value, ACCOMODATION_LABELS, locale);
}

export function formatTransportLabels(values: string[], locale: Locale) {
  return values.map((value) => formatTransportLabel(value, locale)).join(", ");
}

export function formatAccomodationLabels(values: string[], locale: Locale) {
  return values
    .map((value) => formatAccomodationLabel(value, locale))
    .join(", ");
}

export function sortTransportValues(values: string[], locale: Locale) {
  return [...values].sort((left, right) =>
    formatTransportLabel(left, locale).localeCompare(
      formatTransportLabel(right, locale),
      locale,
    ),
  );
}
