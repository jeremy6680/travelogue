export type CountryLocale = "fr" | "en";

const CUSTOM_COUNTRY_NAMES: Record<string, Record<CountryLocale, string>> = {
  XE: { fr: "Angleterre", en: "England" },
  XS: { fr: "Ecosse", en: "Scotland" },
  XW: { fr: "Pays de Galles", en: "Wales" },
};

const CUSTOM_FLAG_EMOJIS: Record<string, string> = {
  XE: "🏴",
  XS: "🏴",
  XW: "🏴",
};

const CUSTOM_FLAG_ASSETS: Record<string, string> = {
  XE: "/flags/england.svg",
  XS: "/flags/scotland.svg",
  XW: "/flags/wales.svg",
};

const MAP_COUNTRY_CODE_ALIASES: Record<string, string> = {
  XE: "GB",
  XS: "GB",
  XW: "GB",
};

export function getCountryDisplayName(
  code: string,
  locale: CountryLocale,
  regionNames?: Intl.DisplayNames,
) {
  const normalizedCode = code.toUpperCase();
  const customName = CUSTOM_COUNTRY_NAMES[normalizedCode]?.[locale];
  if (customName) return customName;
  return regionNames?.of(normalizedCode) ?? normalizedCode;
}

export function getCountryFlagEmoji(code: string) {
  const normalizedCode = code.toUpperCase();
  const customFlag = CUSTOM_FLAG_EMOJIS[normalizedCode];
  if (customFlag) return customFlag;
  if (normalizedCode.length !== 2) return "";

  return String.fromCodePoint(
    ...normalizedCode.split("").map((char) => 127397 + char.charCodeAt(0)),
  );
}

export function getCountryFlagAsset(code: string) {
  return CUSTOM_FLAG_ASSETS[code.toUpperCase()] ?? null;
}

export function getAtlasCountryCode(code: string) {
  return MAP_COUNTRY_CODE_ALIASES[code.toUpperCase()] ?? code.toUpperCase();
}
