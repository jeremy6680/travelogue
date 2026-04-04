import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { enUS, fr } from "date-fns/locale";

export type Locale = "fr" | "en";

const STORAGE_KEY = "travelogue_locale";
const AVAILABLE_LOCALES = getAvailableLocales();

const messages = {
  fr: {
    navHome: "Accueil",
    navAtlas: "Atlas",
    navJournal: "Journal",
    navTrips: "Voyages",
    navAdmin: "Admin",
    footerTagline: "Carnets de voyage pensés avec soin.",
    languageLabel: "Langue",
    heroTitle: "Cartographier le monde,",
    heroTitleAccent: "une histoire après l'autre",
    heroSubtitle:
      "Une collection de récits venus de routes poussiéreuses, de trains de nuit et de rivages inconnus.",
    readJournal: "Lire le journal",
    viewAtlas: "Voir l'atlas",
    statTrips: "Voyages",
    statContinents: "Continents",
    statCities: "Villes",
    statDispatches: "Récits",
    latestWriting: "Derniers textes",
    recentDispatches: "Récits récents",
    allPosts: "Tous les articles",
    readDispatch: "Lire le récit",
    onTheRoad: "Sur la route",
    photoJournal: "Journal photo",
    travelJournal: "Journal de voyage",
    journalSubtitle: "Récits, notes de terrain et réflexions glanés en chemin.",
    allTrips: "Tous les voyages",
    allTransport: "Tous les transports",
    allYears: "Toutes les années",
    newestFirst: "Plus récents d'abord",
    oldestFirst: "Plus anciens d'abord",
    clear: "Effacer",
    clearFilters: "Effacer les filtres",
    entry_one: "entrée",
    entry_other: "entrées",
    retrievingEntries: "Récupération des entrées du journal...",
    noEntries: "Aucune entrée ne correspond à vos filtres.",
    atlasTitle: "L'atlas",
    atlasSubtitle: "Chaque repère raconte une histoire. Cliquez pour la lire.",
    passportTitle: "Le passeport",
    passportSubtitle:
      "Une trace chronologique des frontières franchies, des fuseaux traversés et des inconnus devenus familiers.",
    loadingPost: "Le récit refait surface...",
    backToJournal: "Retour au journal",
    fromTheRoad: "Depuis la route",
    photoGallery: "Galerie photo",
    moreFrom: "Plus de",
    moreFromSuffix: "",
    exploreRegion: "Explore d'autres récits et notes de cette région.",
    viewItinerary: "Voir l'itinéraire",
    notFoundTitle: "Hors carte",
    notFoundBody:
      "On dirait qu'on s'est égaré en territoire inconnu. La page que vous cherchez n'existe pas, ou s'est perdue avec le temps.",
    returnBasecamp: "Retour au camp de base",
    visited: "Visité",
    post: "Article",
    tripsCountLabel: "voyages",
    postsCountLabel: "récits",
    readMore: "Lire",
    sameDay: "Même jour",
    day_one: "jour",
    day_other: "jours",
    approxKm: "environ",
    estimatedDistance: "Distance estimée",
    estimatedTripDistance: "Distance estimée du voyage",
    estimatedJourneyDistance: "Distance estimée du parcours",
    citiesVisited: "Villes visitées",
    mission: "Objectif",
    companions: "Compagnons de route",
    metAlongTheWay: "Rencontres",
    gettingThere: "Aller sur place",
    gettingAround: "Se déplacer",
    accommodation: "Hébergement",
    lengthOfStay: "Durée du séjour",
    dispatchesFrom: "Récits depuis",
    allRegions: "Toutes les zones",
    france: "France",
    international: "International",
    loadingMap: "La carte se déplie...",
    multiCountryJourney: "Parcours multi-pays",
    stepOf: "Étape",
    unknownStart: "Début inconnu",
    unknownEnd: "Fin inconnue",
    noLinkedTrip: "Aucun voyage lié",
    noLinkedAsset: "Aucun asset Cloudinary lié",
    noLinkedCountry: "Pays du voyage lié si possible",
    standaloneTrip: "Voyage autonome",
    photoFallbackAlt: "Photo",
  },
  en: {
    navHome: "Home",
    navAtlas: "Atlas",
    navJournal: "Journal",
    navTrips: "Trips",
    navAdmin: "Admin",
    footerTagline: "Travel journals crafted with intention.",
    languageLabel: "Language",
    heroTitle: "Mapping the World,",
    heroTitleAccent: "One Story at a Time",
    heroSubtitle:
      "A collection of dispatches from dusty roads, night trains, and unfamiliar shores.",
    readJournal: "Read Journal",
    viewAtlas: "View Atlas",
    statTrips: "Trips",
    statContinents: "Continents",
    statCities: "Cities",
    statDispatches: "Dispatches",
    latestWriting: "Latest writing",
    recentDispatches: "Recent Dispatches",
    allPosts: "All posts",
    readDispatch: "Read dispatch",
    onTheRoad: "On the road",
    photoJournal: "Photo Journal",
    travelJournal: "Travel Journal",
    journalSubtitle: "Stories, field notes, and reflections from the road.",
    allTrips: "All Trips",
    allTransport: "All Transport",
    allYears: "All Years",
    newestFirst: "Newest First",
    oldestFirst: "Oldest First",
    clear: "Clear",
    clearFilters: "Clear filters",
    entry_one: "entry",
    entry_other: "entries",
    retrievingEntries: "Retrieving journal entries...",
    noEntries: "No entries match your filters.",
    atlasTitle: "The Atlas",
    atlasSubtitle: "Every pin is a story. Click one to read it.",
    passportTitle: "The Passport",
    passportSubtitle:
      "A chronological record of borders crossed, timezones shifted, and familiar strangers met along the way.",
    loadingPost: "Unearthing the dispatch...",
    backToJournal: "Back to Journal",
    fromTheRoad: "From the road",
    photoGallery: "Photo Gallery",
    moreFrom: "More from",
    moreFromSuffix: "",
    exploreRegion: "Explore other dispatches and notes from this region.",
    viewItinerary: "View Itinerary",
    notFoundTitle: "Off the Map",
    notFoundBody:
      "It seems we've wandered into uncharted territory. The page you're looking for doesn't exist or has been lost to time.",
    returnBasecamp: "Return to Basecamp",
    visited: "Visited",
    post: "Post",
    tripsCountLabel: "trips",
    postsCountLabel: "dispatches",
    readMore: "Read",
    sameDay: "Same day",
    day_one: "day",
    day_other: "days",
    approxKm: "approx.",
    estimatedDistance: "Estimated Distance",
    estimatedTripDistance: "Estimated Trip Distance",
    estimatedJourneyDistance: "Estimated Journey Distance",
    citiesVisited: "Cities Visited",
    mission: "The Mission",
    companions: "Companions",
    metAlongTheWay: "Met Along the Way",
    gettingThere: "Getting There",
    gettingAround: "Getting Around",
    accommodation: "Accommodation",
    lengthOfStay: "Length of Stay",
    dispatchesFrom: "Dispatches from",
    allRegions: "All Regions",
    france: "France",
    international: "International",
    loadingMap: "Unfolding the map...",
    multiCountryJourney: "Multi-country journey",
    stepOf: "Step",
    unknownStart: "Unknown start",
    unknownEnd: "Unknown end",
    noLinkedTrip: "No linked trip",
    noLinkedAsset: "No linked Cloudinary asset",
    noLinkedCountry: "Country from linked trip if possible",
    standaloneTrip: "Standalone trip",
    photoFallbackAlt: "Photo",
  },
} as const;

type MessageKey = keyof typeof messages.fr;

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  availableLocales: Locale[];
  isLocaleSwitcherEnabled: boolean;
  t: (key: MessageKey) => string;
  dateFnsLocale: typeof fr;
  numberLocale: string;
  formatDate: (value: string | Date, pattern: "short" | "long" | "monthYear") => string;
  formatCountLabel: (count: number) => string;
  formatDaysLabel: (count: number) => string;
  formatDistanceKm: (distanceKm: number | null) => string | null;
  countryName: (code: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function getAvailableLocales(): Locale[] {
  const rawValue = String(import.meta.env.VITE_SITE_LANGUAGES ?? "both").trim().toLowerCase();

  if (rawValue === "fr") return ["fr"];
  if (rawValue === "en") return ["en"];
  if (rawValue === "2" || rawValue === "both" || rawValue === "all" || rawValue === "fr,en") {
    return ["fr", "en"];
  }

  return ["fr", "en"];
}

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "fr";
  if (AVAILABLE_LOCALES.length === 1) {
    return AVAILABLE_LOCALES[0];
  }
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved && AVAILABLE_LOCALES.includes(saved as Locale)
    ? (saved as Locale)
    : AVAILABLE_LOCALES[0];
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  useEffect(() => {
    const effectiveLocale = AVAILABLE_LOCALES.length === 1 ? AVAILABLE_LOCALES[0] : locale;

    if (AVAILABLE_LOCALES.length > 1) {
      window.localStorage.setItem(STORAGE_KEY, effectiveLocale);
    }

    document.documentElement.lang = effectiveLocale;
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => {
    const effectiveLocale = AVAILABLE_LOCALES.length === 1 ? AVAILABLE_LOCALES[0] : locale;
    const catalog = messages[effectiveLocale];
    const dateFnsLocale = effectiveLocale === "fr" ? fr : enUS;
    const numberLocale = effectiveLocale === "fr" ? "fr-FR" : "en-US";
    const regionNames = new Intl.DisplayNames([numberLocale], { type: "region" });

    return {
      locale: effectiveLocale,
      availableLocales: AVAILABLE_LOCALES,
      setLocale: (nextLocale) => {
        if (!AVAILABLE_LOCALES.includes(nextLocale)) {
          return;
        }
        setLocaleState(nextLocale);
      },
      isLocaleSwitcherEnabled: AVAILABLE_LOCALES.length > 1,
      t: (key) => catalog[key],
      dateFnsLocale,
      numberLocale,
      formatDate: (value, pattern) => {
        const date = value instanceof Date ? value : new Date(value);
        const token =
          pattern === "long" ? "PPP" : pattern === "monthYear" ? "LLLL yyyy" : "PP";
        return format(date, token, { locale: dateFnsLocale });
      },
      formatCountLabel: (count) =>
        `${count} ${catalog[count === 1 ? "entry_one" : "entry_other"]}`,
      formatDaysLabel: (count) =>
        `${count} ${catalog[count === 1 ? "day_one" : "day_other"]}`,
      formatDistanceKm: (distanceKm) => {
        if (distanceKm == null) return null;
        return `${Math.round(distanceKm).toLocaleString(numberLocale)} km ${catalog.approxKm}`;
      },
      countryName: (code) => regionNames.of(code.toUpperCase()) ?? code.toUpperCase(),
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
