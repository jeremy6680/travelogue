import type { Locale } from "@/lib/i18n";

type Option = {
  value: string;
  label: Record<Locale, string>;
};

export const TRANSPORT_OPTIONS: Option[] = [
  { value: "plane", label: { fr: "Avion", en: "Plane" } },
  { value: "own car", label: { fr: "Voiture personnelle", en: "Own car" } },
  {
    value: "rental car",
    label: { fr: "Voiture de location", en: "Rental car" },
  },
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
      fr: "Hébergé (amis/famille)",
      en: "Hosted by friends/family",
    },
  },
  { value: "sonder", label: { fr: "Sonder", en: "Sonder" } },
];

export const COMPANION_OPTIONS = [
  "Hine",
  "Javier",
  "North",
  "maman",
  "papa",
  "Caro",
  "Fred",
  "Guillaume",
  "Eric",
  "Jeff",
  "papy",
  "mamy",
] as const;

export const TRAVEL_REASON_OPTIONS: Option[] = [
  { value: "vacances", label: { fr: "Vacances", en: "Vacation" } },
  { value: "week-end", label: { fr: "Week-end", en: "Weekend" } },
  { value: "travail", label: { fr: "Travail", en: "Work" } },
  { value: "etudes", label: { fr: "Etudes", en: "Studies" } },
  { value: "stage", label: { fr: "Stage", en: "Internship" } },
  {
    value: "visa vacances travail (vvt)",
    label: {
      fr: "Visa vacances travail (VVT)",
      en: "Working holiday visa (WHV)",
    },
  },
] as const;

export const TRIP_CONTEXT_OPTIONS: Option[] = [
  { value: "solo", label: { fr: "👤 Solo", en: "👤 Solo" } },
  { value: "couple", label: { fr: "❤️ En couple", en: "❤️ Couple" } },
  { value: "family", label: { fr: "👨‍👩‍👧‍👦 En famille", en: "👨‍👩‍👧‍👦 Family" } },
  { value: "friends", label: { fr: "🍻 Entre amis", en: "🍻 Friends" } },
  {
    value: "work-colleagues",
    label: {
      fr: "💼 Professionnel / collègues",
      en: "💼 Work / colleagues",
    },
  },
  {
    value: "organized-group",
    label: { fr: "👥 Groupe organisé", en: "👥 Organized group" },
  },
] as const;

export const CONTINENT_OPTIONS: Record<
  "europe" | "america" | "africa" | "asia" | "oceania",
  { label: Record<Locale, string>; countryCodes: string[] }
> = {
  europe: {
    label: { fr: "Europe", en: "Europe" },
    countryCodes: [
      "AD", "AL", "AT", "BA", "BE", "BG", "BY", "CH", "CY", "CZ", "DE", "DK",
      "EE", "ES", "FI", "GB", "GE", "GR", "HR", "HU", "IE", "IS", "IT", "LI",
      "LT", "LU", "LV", "MC", "MD", "ME", "MK", "MT", "NL", "NO", "PL", "PT",
      "RO", "RS", "SE", "SI", "SK", "SM", "UA", "VA", "XE", "XS", "XW",
    ],
  },
  america: {
    label: { fr: "Amérique", en: "America" },
    countryCodes: [
      "AG", "AR", "BB", "BO", "BR", "BS", "BZ", "CA", "CL", "CO", "CR", "CU",
      "DM", "DO", "EC", "GD", "GT", "GY", "HN", "HT", "JM", "KN", "LC", "MX",
      "NI", "PA", "PE", "PY", "SV", "SR", "TT", "US", "UY", "VC", "VE",
    ],
  },
  africa: {
    label: { fr: "Afrique", en: "Africa" },
    countryCodes: [
      "AO", "BF", "BI", "BJ", "BW", "CD", "CF", "CG", "CI", "CM", "CV", "DJ",
      "DZ", "EG", "ER", "ET", "GA", "GH", "GM", "GN", "GQ", "GW", "KE", "KM",
      "LR", "LS", "LY", "MA", "MG", "ML", "MR", "MU", "MW", "MZ", "NA", "NE",
      "NG", "RW", "SC", "SD", "SL", "SN", "SO", "SS", "SZ", "TD", "TG", "TN",
      "TZ", "UG", "ZA", "ZM", "ZW",
    ],
  },
  asia: {
    label: { fr: "Asie", en: "Asia" },
    countryCodes: [
      "AE", "AF", "AM", "AZ", "BD", "BH", "BN", "BT", "CN", "GE", "HK", "ID",
      "IL", "IN", "IQ", "IR", "JO", "JP", "KG", "KH", "KP", "KR", "KW", "KZ",
      "LA", "LB", "LK", "MM", "MN", "MO", "MV", "MY", "NP", "OM", "PH", "PK",
      "PS", "QA", "SA", "SG", "SY", "TH", "TJ", "TL", "TM", "TR", "TW", "UZ",
      "VN", "YE",
    ],
  },
  oceania: {
    label: { fr: "Océanie", en: "Oceania" },
    countryCodes: [
      "AU", "FJ", "FM", "KI", "MH", "NR", "NZ", "PG", "PW", "SB", "TO", "TV",
      "VU", "WS",
    ],
  },
};

const TRANSPORT_LABELS = new Map(
  TRANSPORT_OPTIONS.map((option) => [option.value, option.label]),
);

const ACCOMODATION_LABELS = new Map(
  ACCOMODATION_OPTIONS.map((option) => [option.value, option.label]),
);

const TRAVEL_REASON_LABELS = new Map(
  TRAVEL_REASON_OPTIONS.map((option) => [option.value, option.label]),
);

const TRIP_CONTEXT_LABELS = new Map(
  TRIP_CONTEXT_OPTIONS.map((option) => [option.value, option.label]),
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

export function normalizeMultiValueField(value: string[] | string | null | undefined) {
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export function formatTravelReasonLabel(value: string, locale: Locale) {
  return formatOptionLabel(value, TRAVEL_REASON_LABELS, locale);
}

export function formatTravelReasonLabels(values: string[], locale: Locale) {
  return values.map((value) => formatTravelReasonLabel(value, locale)).join(", ");
}

export function formatTripContextLabel(value: string, locale: Locale) {
  return formatOptionLabel(value, TRIP_CONTEXT_LABELS, locale);
}

export function formatTripContextLabels(values: string[], locale: Locale) {
  return values.map((value) => formatTripContextLabel(value, locale)).join(", ");
}

export function getContinentKey(countryCode: string) {
  const normalizedCode = countryCode.toUpperCase();

  return (Object.entries(CONTINENT_OPTIONS).find(([, continent]) =>
    continent.countryCodes.includes(normalizedCode),
  )?.[0] ?? null) as keyof typeof CONTINENT_OPTIONS | null;
}
