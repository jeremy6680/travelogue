import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { format } from "date-fns";
import { enUS, fr } from "date-fns/locale";

export type Locale = "fr" | "en";

const STORAGE_KEY = "travelogue_locale";
const AVAILABLE_LOCALES = getAvailableLocales();

const messages = {
  fr: {
    navHome: "Accueil",
    navAtlas: "Atlas",
    navDataViz: "DataViz",
    navJournal: "Journal",
    navTrips: "Voyages",
    navAdmin: "Admin",
    footerTagline: "Carnets de voyage pensés avec soin.",
    languageLabel: "Langue",
    heroTitle: "Parcourir le monde,",
    heroTitleAccent: "une histoire après l'autre",
    heroSubtitle:
      "Une collection de récits venus de routes poussiéreuses, de trains de nuit et de rivages inconnus.",
    readJournal: "Lire le journal",
    viewAtlas: "Voir l'Atlas",
    statTrips: "Voyages",
    statContinents: "Continents",
    statCities: "Villes",
    statDispatches: "Récits",
    latestWriting: "Derniers textes",
    recentDispatches: "Récits récents",
    allPosts: "Tous les articles",
    readDispatch: "Lire le récit",
    readExternalArticle: "Lire l'article",
    externalArticle: "Article externe",
    articleHostedElsewhere: "Cet article est hébergé ailleurs.",
    openOriginalArticle: "Ouvrir l'article original",
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
    atlasTitle: "L'Atlas",
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
    estimatedLegDistance: "Distance estimée de l'étape",
    estimatedJourneyDistance: "Distance estimée du périple",
    citiesVisited: "Villes visitées",
    mission: "Pourquoi ce voyage",
    companions: "Compagnons de route",
    metAlongTheWay: "Rencontres",
    gettingThere: "Transport pour y aller",
    gettingAround: "Transport sur place",
    accommodation: "Hébergement",
    lengthOfStay: "Durée du séjour",
    dispatchesFrom: "Récits depuis",
    allRegions: "Toutes les zones",
    france: "France",
    international: "International",
    loadingMap: "La carte se déplie...",
    multiCountryJourney: "Périple multi-pays",
    stepOf: "Étape",
    unknownStart: "Début inconnu",
    unknownEnd: "Fin inconnue",
    noLinkedTrip: "Aucun voyage lié",
    noLinkedAsset: "Aucun asset Cloudinary lié",
    noLinkedCountry: "Pays du voyage lié si possible",
    standaloneTrip: "Voyage autonome",
    photoFallbackAlt: "Photo",
    datavizTitle: "DataViz",
    datavizSubtitle:
      "Une lecture visuelle de mes voyages: distances estimées, rythmes annuels, compagnons récurrents et zones du monde les plus traversées.",
    datavizEstimatedNote:
      "Les kilomètres sont des estimations calculées à partir des coordonnées enregistrées et réparties entre les modes de transport déclarés pour chaque trajet.",
    datavizTotalDistance: "Distance estimée",
    datavizTripsAnalyzed: "Voyages analysés",
    datavizCompanionsCount: "Compagnons distincts",
    datavizContinentsCount: "Continents visités",
    datavizTransportDistance: "Kilomètres par transport",
    datavizTransportDistanceDesc:
      "Répartition estimée des distances selon les modes utilisés pour rejoindre chaque destination.",
    datavizYearlyDistance: "Distance au fil des années",
    datavizYearlyDistanceDesc:
      "Courbe des kilomètres estimés parcourus année après année.",
    datavizCompanions: "Compagnons les plus présents",
    datavizCompanionsDesc:
      "Les personnes qui reviennent le plus souvent d'un voyage à l'autre.",
    datavizContinents: "Continents traversés",
    datavizContinentsDesc:
      "Part des voyages par continent, avec le volume de déplacements associé.",
    datavizScatter: "Distance vs durée",
    datavizScatterDesc:
      "Chaque point représente un voyage: plus la bulle est grande, plus il y a eu de récits publiés.",
    datavizHeatmap: "Heatmap mensuelle",
    datavizHeatmapDesc:
      "Une vue rapide de l'intensité des départs mois par mois et année par année.",
    datavizHeatmapLegend:
      "Plus la case est dense, plus le mois a concentré de voyages.",
    datavizDistanceSeries: "Distance",
    datavizDurationSeries: "Durée",
    datavizDaysLabel: "jours",
    datavizNoData: "Pas encore assez de données pour afficher ce graphique.",
  },
  en: {
    navHome: "Home",
    navAtlas: "Atlas",
    navDataViz: "DataViz",
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
    readExternalArticle: "Read article",
    externalArticle: "External article",
    articleHostedElsewhere: "This article is hosted elsewhere.",
    openOriginalArticle: "Open original article",
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
    estimatedLegDistance: "Estimated Leg Distance",
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
    datavizTitle: "DataViz",
    datavizSubtitle:
      "A visual reading of my travels: estimated distances, yearly rhythm, recurring travel companions, and the parts of the world crossed most often.",
    datavizEstimatedNote:
      "Kilometers are estimated from stored coordinates and split across the transport modes declared for each trip.",
    datavizTotalDistance: "Estimated distance",
    datavizTripsAnalyzed: "Trips analyzed",
    datavizCompanionsCount: "Distinct companions",
    datavizContinentsCount: "Continents visited",
    datavizTransportDistance: "Kilometers by transport",
    datavizTransportDistanceDesc:
      "Estimated distance split across the modes used to reach each destination.",
    datavizYearlyDistance: "Distance over time",
    datavizYearlyDistanceDesc:
      "A yearly curve of estimated kilometers traveled.",
    datavizCompanions: "Most frequent companions",
    datavizCompanionsDesc:
      "The people who show up most often from one trip to the next.",
    datavizContinents: "Continents crossed",
    datavizContinentsDesc:
      "Share of trips by continent, along with their associated travel volume.",
    datavizScatter: "Distance vs duration",
    datavizScatterDesc:
      "Each point is a trip: larger bubbles mean more published dispatches.",
    datavizHeatmap: "Monthly heatmap",
    datavizHeatmapDesc:
      "A quick look at travel intensity by month and by year.",
    datavizHeatmapLegend:
      "Darker cells indicate months with more trips.",
    datavizDistanceSeries: "Distance",
    datavizDurationSeries: "Duration",
    datavizDaysLabel: "days",
    datavizNoData: "There is not enough data yet to render this chart.",
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
  formatDate: (
    value: string | Date,
    pattern: "short" | "long" | "monthYear",
  ) => string;
  formatCountLabel: (count: number) => string;
  formatDaysLabel: (count: number) => string;
  formatDistanceKm: (distanceKm: number | null) => string | null;
  countryName: (code: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function getAvailableLocales(): Locale[] {
  const rawValue = String(import.meta.env.VITE_SITE_LANGUAGES ?? "both")
    .trim()
    .toLowerCase();

  if (rawValue === "fr") return ["fr"];
  if (rawValue === "en") return ["en"];
  if (
    rawValue === "2" ||
    rawValue === "both" ||
    rawValue === "all" ||
    rawValue === "fr,en"
  ) {
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
    const effectiveLocale =
      AVAILABLE_LOCALES.length === 1 ? AVAILABLE_LOCALES[0] : locale;

    if (AVAILABLE_LOCALES.length > 1) {
      window.localStorage.setItem(STORAGE_KEY, effectiveLocale);
    }

    document.documentElement.lang = effectiveLocale;
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => {
    const effectiveLocale =
      AVAILABLE_LOCALES.length === 1 ? AVAILABLE_LOCALES[0] : locale;
    const catalog = messages[effectiveLocale];
    const dateFnsLocale = effectiveLocale === "fr" ? fr : enUS;
    const numberLocale = effectiveLocale === "fr" ? "fr-FR" : "en-US";
    const regionNames = new Intl.DisplayNames([numberLocale], {
      type: "region",
    });

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
          pattern === "long"
            ? "PPP"
            : pattern === "monthYear"
              ? "LLLL yyyy"
              : "PP";
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
      countryName: (code) =>
        regionNames.of(code.toUpperCase()) ?? code.toUpperCase(),
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
