import { useMemo } from "react";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Film,
  Globe2,
  Heart,
  Laptop2,
  MapPin,
  Mic2,
  Timer,
  Trophy,
  Users,
} from "lucide-react";
import { PCloudGallery } from "@/components/gallery/PCloudGallery";
import { Layout } from "@/components/layout";
import {
  useConcertsQuery,
  useJourneysQuery,
  useRunningQuery,
  useSportEventsQuery,
  useTechEventsQuery,
  useTripsQuery,
  useWeddingsQuery,
} from "@/lib/directus";
import {
  formatConcertGenreLabel,
  formatSportLabel,
  formatSportLabelLowercase,
  getSportEventName,
  getSportEventResultItems,
  isRacePodiumSport,
} from "@/lib/event-options";
import { getEventDetailHref, type EventKind } from "@/lib/event-links";
import { useI18n } from "@/lib/i18n";
import {
  formatAccomodationLabels,
  formatTransportLabels,
  formatTravelReasonLabels,
  formatTripContextLabels,
} from "@/lib/trip-options";
import type { Concert, Journey, RunningEvent, SportEvent, TechEvent, Trip, Wedding } from "@/lib/travel-types";
import NotFound from "@/pages/not-found";

type EventDetailModel = {
  kind: EventKind;
  kindLabel: string;
  icon: typeof Mic2;
  title: string;
  subtitle: string;
  date: string;
  city: string | null;
  countryCode: string | null;
  venue: string | null;
  tripId: number | null;
  tripName: string | null;
  attendees: string[];
  galleryLink: string | null;
  storyLink: string | null;
  videoEmbedUrl: string | null;
  meta: Array<{ label: string; value: string }>;
};

type RelatedEventLink = {
  id: number;
  label: string;
  href: string;
};

function TripContextBlock({
  locale,
  trip,
  journey,
  detailTripName,
  formatDate,
}: {
  locale: "fr" | "en";
  trip: Trip | null;
  journey: Journey | null;
  detailTripName: string | null;
  formatDate: (value: string | Date, style: "short" | "long" | "monthYear") => string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-border/60 bg-card/70 p-6">
      <div className="flex items-center gap-3">
        <Globe2 className="h-5 w-5 text-primary" />
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.22em] text-muted-foreground">
            {locale === "fr" ? "Contexte" : "Context"}
          </p>
          <h2 className="text-2xl font-serif font-bold text-foreground">
            {locale === "fr" ? "Voyage lié" : "Linked trip"}
          </h2>
        </div>
      </div>
      <div className="mt-5">
        {trip ? (
          <div className="space-y-5">
            <div className="space-y-1">
              <p className="text-lg font-semibold text-foreground">{trip.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatTripDateRange(trip.visitedAt, trip.visitedUntil, formatDate, locale)}
              </p>
            </div>

            <div className="grid gap-4">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {locale === "fr" ? "Villes" : "Cities"}
                </p>
                <p className="text-sm leading-6 text-foreground">{trip.visitedCities}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {locale === "fr" ? "Motif" : "Reason"}
                </p>
                <p className="text-sm leading-6 text-foreground">
                  {trip.reasonForTravel.length > 0
                    ? formatTravelReasonLabels(trip.reasonForTravel, locale)
                    : trip.reasonForVisit}
                </p>
              </div>

              {trip.tripContext.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {locale === "fr" ? "Contexte" : "Context"}
                  </p>
                  <p className="text-sm leading-6 text-foreground">
                    {formatTripContextLabels(trip.tripContext, locale)}
                  </p>
                </div>
              ) : null}

              {trip.travelCompanionsPeople.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {locale === "fr" ? "Compagnons" : "Companions"}
                  </p>
                  <p className="text-sm leading-6 text-foreground">
                    {trip.travelCompanionsPeople.join(", ")}
                  </p>
                </div>
              ) : null}

              {trip.transportationTo.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {locale === "fr" ? "Transport aller" : "Getting there"}
                  </p>
                  <p className="text-sm leading-6 text-foreground">
                    {formatTransportLabels(trip.transportationTo, locale)}
                  </p>
                </div>
              ) : null}

              {trip.transportationOnSite.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {locale === "fr" ? "Sur place" : "Getting around"}
                  </p>
                  <p className="text-sm leading-6 text-foreground">
                    {formatTransportLabels(trip.transportationOnSite, locale)}
                  </p>
                </div>
              ) : null}

              {trip.accomodation.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {locale === "fr" ? "Hébergement" : "Accommodation"}
                  </p>
                  <p className="text-sm leading-6 text-foreground">
                    {formatAccomodationLabels(trip.accomodation, locale)}
                  </p>
                </div>
              ) : null}
            </div>

            {journey ? (
              <div className="rounded-[1.25rem] border border-border/60 bg-background/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {locale === "fr" ? "Périple" : "Journey"}
                </p>
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-semibold text-foreground">{journey.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {journey.startDate
                      ? formatTripDateRange(journey.startDate, journey.endDate, formatDate, locale)
                      : locale === "fr"
                        ? "Dates non renseignées"
                        : "Dates not available"}
                    {trip.journeyOrder != null
                      ? locale === "fr"
                        ? ` · Étape ${trip.journeyOrder}`
                        : ` · Step ${trip.journeyOrder}`
                      : ""}
                  </p>
                  {journey.notes ? (
                    <p className="pt-1 text-sm leading-6 text-foreground">{journey.notes}</p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        ) : detailTripName ? (
          <p className="text-base text-foreground">{detailTripName}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {locale === "fr" ? "Aucun voyage lié pour cette entrée." : "No trip linked to this entry."}
          </p>
        )}
      </div>
    </div>
  );
}

const YOUTUBE_HOSTS = new Set([
  "youtu.be",
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
]);

function isEventKind(value: string | undefined): value is EventKind {
  return (
    value === "concerts" ||
    value === "sport-events" ||
    value === "tech-events" ||
    value === "running" ||
    value === "weddings"
  );
}

function parseRecordId(value: string | undefined) {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractYouTubeEmbedUrl(url: string | null | undefined) {
  if (!url) return null;

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    if (!YOUTUBE_HOSTS.has(hostname)) return null;

    let videoId = "";

    if (hostname === "youtu.be") {
      videoId = parsedUrl.pathname.replace("/", "");
    } else if (parsedUrl.pathname === "/watch") {
      videoId = parsedUrl.searchParams.get("v") ?? "";
    } else if (parsedUrl.pathname.startsWith("/embed/")) {
      videoId = parsedUrl.pathname.replace("/embed/", "");
    } else if (parsedUrl.pathname.startsWith("/shorts/")) {
      videoId = parsedUrl.pathname.replace("/shorts/", "");
    }

    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  } catch {
    return null;
  }
}

function buildLocation(city: string | null, countryCode: string | null, countryName: (code: string) => string) {
  return [city, countryCode ? countryName(countryCode) : null].filter(Boolean).join(", ");
}

function buildVenueLocation(
  venue: string | null | undefined,
  city: string | null,
  countryCode: string | null,
  countryName: (code: string) => string,
) {
  return [venue, city, countryCode ? countryName(countryCode) : null].filter(Boolean).join(", ");
}

function splitMediaLinks(articleLink: string | null, photosLink: string | null) {
  const articleVideoEmbedUrl = extractYouTubeEmbedUrl(articleLink);
  const photosVideoEmbedUrl = extractYouTubeEmbedUrl(photosLink);

  return {
    videoEmbedUrl: articleVideoEmbedUrl ?? photosVideoEmbedUrl,
    galleryLink: photosVideoEmbedUrl ? null : photosLink,
    storyLink: articleVideoEmbedUrl ? null : articleLink,
  };
}

function isPCloudGalleryLink(url: string | null | undefined) {
  if (!url) return false;

  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.endsWith("pcloud.link") && parsedUrl.searchParams.has("code");
  } catch {
    return false;
  }
}

function formatTripDateRange(
  start: string,
  end: string | null,
  formatDate: (value: string | Date, style: "short" | "long" | "monthYear") => string,
  locale: "fr" | "en",
) {
  if (!end || end === start) {
    return formatDate(start, "long");
  }

  return locale === "fr"
    ? `${formatDate(start, "long")} au ${formatDate(end, "long")}`
    : `${formatDate(start, "long")} to ${formatDate(end, "long")}`;
}

function appendNoteToSubtitle(subtitle: string, notes: string | null | undefined) {
  const note = notes?.trim();
  return note ? `${subtitle} — ${note}` : subtitle;
}

function getEventDateRangeLabel(
  start: string,
  end: string | null | undefined,
  locale: "fr" | "en",
  formatDate: (value: string | Date, style: "short" | "long" | "monthYear") => string,
) {
  const normalizedEnd = end ?? start;
  if (normalizedEnd === start) {
    return formatDate(start, "long");
  }

  return locale === "fr"
    ? `${formatDate(start, "long")} au ${formatDate(normalizedEnd, "long")}`
    : `${formatDate(start, "long")} to ${formatDate(normalizedEnd, "long")}`;
}

function parseDurationToSeconds(value: string | null | undefined) {
  if (!value) return null;
  const parts = value.trim().split(":").map((part) => Number.parseInt(part, 10));
  if (parts.some((part) => !Number.isFinite(part))) return null;

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }

  return null;
}

function formatRunningPace(
  distanceKm: number | null | undefined,
  duration: string | null | undefined,
) {
  if (!distanceKm || distanceKm <= 0) return "—";
  const totalSeconds = parseDurationToSeconds(duration);
  if (!totalSeconds) return "—";
  const paceSeconds = Math.round(totalSeconds / distanceKm);
  const minutes = Math.floor(paceSeconds / 60);
  const seconds = paceSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")} / km`;
}

function getConcertRelatedLabel(entry: Concert) {
  return entry.eventName ? `${entry.artist} · ${entry.eventName}` : entry.artist;
}

function getSportRelatedLabel(entry: SportEvent, locale: "fr" | "en") {
  return getSportEventName(entry, locale) || formatSportLabelLowercase(entry.sport, locale);
}

function getWeddingRelatedLabel(entry: Wedding, locale: "fr" | "en") {
  return (
    [entry.brideName, entry.groomName].filter(Boolean).join(" & ") ||
    (locale === "fr" ? "Mariage" : "Wedding")
  );
}

function getTechRelatedLabel(entry: TechEvent) {
  return entry.eventName;
}

function getRunningRelatedLabel(entry: RunningEvent) {
  return entry.eventName;
}

function SectionLinks({
  title,
  items,
}: {
  title: string;
  items: RelatedEventLink[];
}) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-serif font-bold text-foreground">{title}</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-[1.5rem] border border-border/60 bg-card/70 px-5 py-4 text-foreground transition-colors hover:border-primary/35 hover:bg-background"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function buildConcertDetail(
  concert: Concert,
  locale: "fr" | "en",
  countryName: (code: string) => string,
): EventDetailModel {
  const { videoEmbedUrl, galleryLink, storyLink } = splitMediaLinks(
    concert.articleLink,
    concert.photosLink,
  );
  const genreLabel =
    formatConcertGenreLabel(concert.genre, concert.subgenre, locale);

  return {
    kind: "concerts",
    kindLabel: locale === "fr" ? "Concert" : "Concert",
    icon: Mic2,
    title: concert.artist,
    subtitle: appendNoteToSubtitle(
      concert.eventName ||
        buildLocation(concert.city, concert.countryCode, countryName) ||
        (locale === "fr" ? "Souvenir live" : "Live memory"),
      concert.notes,
    ),
    date: concert.eventDate,
    city: concert.city,
    countryCode: concert.countryCode,
    venue: concert.venue,
    tripId: concert.tripId,
    tripName: null,
    attendees: concert.attendeesPeople,
    galleryLink,
    storyLink,
    videoEmbedUrl,
    meta: [
      { label: locale === "fr" ? "Evènement" : "Event", value: concert.eventName ?? "—" },
      { label: locale === "fr" ? "Genre" : "Genre", value: genreLabel || "—" },
      { label: locale === "fr" ? "Salle" : "Venue", value: concert.venue ?? "—" },
      {
        label: locale === "fr" ? "Lieu" : "Location",
        value: buildLocation(concert.city, concert.countryCode, countryName) || "—",
      },
    ],
  };
}

function buildSportDetail(
  event: SportEvent,
  locale: "fr" | "en",
  countryName: (code: string) => string,
): EventDetailModel {
  const { videoEmbedUrl, galleryLink, storyLink } = splitMediaLinks(
    event.articleLink,
    event.photosLink,
  );
  const eventName = getSportEventName(event, locale);
  const resultItems = getSportEventResultItems(event, locale);
  const competitionLabel =
    isRacePodiumSport(event.sport) && event.raceName
      ? [event.competition, event.raceName].filter(Boolean).join(" - ")
      : (event.competition ?? "—");
  const podiumValue =
    isRacePodiumSport(event.sport) && resultItems.length
      ? resultItems
          .map((item) => item.value)
          .filter(Boolean)
          .join(", ")
      : null;

  return {
    kind: "sport-events",
    kindLabel: locale === "fr" ? "Evènement sportif" : "Sport event",
    icon: Trophy,
    title: eventName || formatSportLabelLowercase(event.sport, locale),
    subtitle: appendNoteToSubtitle(
      event.competition ?? formatSportLabelLowercase(event.sport, locale),
      event.notes,
    ),
    date: event.eventDate,
    city: event.city,
    countryCode: event.countryCode,
    venue: event.venue,
    tripId: event.tripId,
    tripName: null,
    attendees: event.attendeesPeople,
    galleryLink,
    storyLink,
    videoEmbedUrl,
    meta: [
      { label: locale === "fr" ? "Sport" : "Sport", value: formatSportLabelLowercase(event.sport, locale) },
      { label: locale === "fr" ? "Compétition" : "Competition", value: competitionLabel },
      ...(podiumValue
        ? [{ label: locale === "fr" ? "Podium" : "Podium", value: podiumValue }]
        : resultItems.map((item) => ({ label: item.label, value: item.value ?? "—" }))),
      {
        label: locale === "fr" ? "Lieu" : "Location",
        value: buildVenueLocation(event.venue, event.city, event.countryCode, countryName) || "—",
      },
    ],
  };
}

function buildWeddingDetail(
  wedding: Wedding,
  locale: "fr" | "en",
  countryName: (code: string) => string,
): EventDetailModel {
  const { videoEmbedUrl, galleryLink, storyLink } = splitMediaLinks(
    wedding.articleLink,
    wedding.photosLink,
  );
  const marriedPeople =
    [wedding.brideName, wedding.groomName].filter(Boolean).join(" & ") ||
    (locale === "fr" ? "Mariage" : "Wedding");

  return {
    kind: "weddings",
    kindLabel: locale === "fr" ? "Mariage" : "Wedding",
    icon: Heart,
    title: marriedPeople,
    subtitle: appendNoteToSubtitle(
      buildLocation(wedding.city, wedding.countryCode, countryName) ||
        (locale === "fr" ? "Cérémonie" : "Ceremony"),
      wedding.notes,
    ),
    date: wedding.weddingDate,
    city: wedding.city,
    countryCode: wedding.countryCode,
    venue: null,
    tripId: wedding.tripId,
    tripName: wedding.tripName,
    attendees: wedding.attendeesPeople,
    galleryLink,
    storyLink,
    videoEmbedUrl,
    meta: [
      { label: locale === "fr" ? "Couple" : "Couple", value: marriedPeople },
      {
        label: locale === "fr" ? "Lieu" : "Location",
        value: buildLocation(wedding.city, wedding.countryCode, countryName) || "—",
      },
      { label: locale === "fr" ? "Voyage lié" : "Linked trip", value: wedding.tripName ?? "—" },
      {
        label: locale === "fr" ? "Invités référencés" : "Referenced guests",
        value: wedding.attendeesPeople.length ? String(wedding.attendeesPeople.length) : "—",
      },
    ],
  };
}

function buildTechDetail(
  event: TechEvent,
  locale: "fr" | "en",
  countryName: (code: string) => string,
  formatDate: (value: string | Date, style: "short" | "long" | "monthYear") => string,
): EventDetailModel {
  const { videoEmbedUrl, galleryLink, storyLink } = splitMediaLinks(
    event.articleLink,
    event.photosLink,
  );

  return {
    kind: "tech-events",
    kindLabel: locale === "fr" ? "Evènement tech" : "Tech event",
    icon: Laptop2,
    title: event.eventName,
    subtitle: appendNoteToSubtitle(
      buildLocation(event.city, event.countryCode, countryName) ||
        (locale === "fr" ? "Conférence" : "Conference"),
      event.notes,
    ),
    date: event.startDate,
    city: event.city,
    countryCode: event.countryCode,
    venue: null,
    tripId: event.tripId,
    tripName: event.tripName,
    attendees: event.attendeesPeople,
    galleryLink,
    storyLink,
    videoEmbedUrl,
    meta: [
      { label: locale === "fr" ? "Evènement" : "Event", value: event.eventName },
      {
        label: locale === "fr" ? "Dates" : "Dates",
        value: getEventDateRangeLabel(event.startDate, event.endDate, locale, formatDate),
      },
      {
        label: locale === "fr" ? "Lieu" : "Location",
        value: buildLocation(event.city, event.countryCode, countryName) || "—",
      },
      { label: locale === "fr" ? "Voyage lié" : "Linked trip", value: event.tripName ?? "—" },
    ],
  };
}

function buildRunningDetail(
  event: RunningEvent,
  locale: "fr" | "en",
  countryName: (code: string) => string,
): EventDetailModel {
  const { videoEmbedUrl, galleryLink, storyLink } = splitMediaLinks(
    event.articleLink,
    event.photosLink,
  );
  const distanceLabel = event.distanceKm != null ? `${event.distanceKm} km` : "—";

  return {
    kind: "running",
    kindLabel: locale === "fr" ? "Running" : "Running",
    icon: Timer,
    title: event.eventName,
    subtitle: appendNoteToSubtitle(
      buildLocation(event.city, event.countryCode, countryName) ||
        (locale === "fr" ? "Course" : "Race"),
      event.notes,
    ),
    date: event.eventDate,
    city: event.city,
    countryCode: event.countryCode,
    venue: null,
    tripId: event.tripId,
    tripName: event.tripName,
    attendees: event.attendeesPeople,
    galleryLink,
    storyLink,
    videoEmbedUrl,
    meta: [
      { label: locale === "fr" ? "Epreuve" : "Race", value: event.eventName },
      { label: locale === "fr" ? "Distance" : "Distance", value: distanceLabel },
      { label: locale === "fr" ? "Temps" : "Time", value: event.duration ?? "—" },
      { label: locale === "fr" ? "Moyenne" : "Pace", value: formatRunningPace(event.distanceKm, event.duration) },
      {
        label: locale === "fr" ? "Lieu" : "Location",
        value: buildLocation(event.city, event.countryCode, countryName) || "—",
      },
    ],
  };
}

export default function EventDetailPage() {
  const { kind, id } = useParams<{ kind?: string; id?: string }>();
  const { locale, formatDate, countryName } = useI18n();
  const concertsQuery = useConcertsQuery();
  const journeysQuery = useJourneysQuery();
  const runningQuery = useRunningQuery();
  const sportEventsQuery = useSportEventsQuery();
  const techEventsQuery = useTechEventsQuery();
  const weddingsQuery = useWeddingsQuery();
  const tripsQuery = useTripsQuery();

  const recordId = parseRecordId(id);
  const isValidKind = isEventKind(kind);
  const isLoading =
    concertsQuery.isLoading ||
    journeysQuery.isLoading ||
    runningQuery.isLoading ||
    sportEventsQuery.isLoading ||
    techEventsQuery.isLoading ||
    weddingsQuery.isLoading ||
    tripsQuery.isLoading;

  const detail = useMemo(() => {
    if (!isValidKind || !recordId) return null;

    switch (kind) {
      case "concerts": {
        const concert = (concertsQuery.data ?? []).find((entry) => entry.id === recordId);
        return concert ? buildConcertDetail(concert, locale, countryName) : null;
      }
      case "sport-events": {
        const event = (sportEventsQuery.data ?? []).find((entry) => entry.id === recordId);
        return event ? buildSportDetail(event, locale, countryName) : null;
      }
      case "tech-events": {
        const event = (techEventsQuery.data ?? []).find((entry) => entry.id === recordId);
        return event ? buildTechDetail(event, locale, countryName, formatDate) : null;
      }
      case "running": {
        const event = (runningQuery.data ?? []).find((entry) => entry.id === recordId);
        return event ? buildRunningDetail(event, locale, countryName) : null;
      }
      case "weddings": {
        const wedding = (weddingsQuery.data ?? []).find((entry) => entry.id === recordId);
        return wedding ? buildWeddingDetail(wedding, locale, countryName) : null;
      }
    }
  }, [
    concertsQuery.data,
    countryName,
    formatDate,
    isValidKind,
    kind,
    locale,
    recordId,
    runningQuery.data,
    sportEventsQuery.data,
    techEventsQuery.data,
    weddingsQuery.data,
  ]);

  const trip = useMemo(
    () => (detail ? (tripsQuery.data ?? []).find((entry) => entry.id === detail.tripId) ?? null : null),
    [detail, tripsQuery.data],
  );
  const journey = useMemo(
    () =>
      trip?.journeyId != null
        ? (journeysQuery.data ?? []).find((entry) => entry.id === trip.journeyId) ?? null
        : null,
    [journeysQuery.data, trip],
  );
  const locationLabel = detail
    ? detail.kind === "sport-events"
      ? buildVenueLocation(detail.venue, detail.city, detail.countryCode, countryName)
      : buildLocation(detail.city, detail.countryCode, countryName)
    : "";
  const hasPCloudGallery = detail ? isPCloudGalleryLink(detail.galleryLink) : false;
  const hasGallery = Boolean(detail?.galleryLink);
  const hasVideo = Boolean(detail?.videoEmbedUrl);
  const categoryLabelPlural =
    locale === "fr"
      ? detail?.kind === "concerts"
        ? "Concerts"
        : detail?.kind === "running"
          ? "Running"
        : detail?.kind === "sport-events"
          ? "Evènements sportifs"
          : detail?.kind === "tech-events"
            ? "Evènements tech"
          : "Mariages"
      : detail?.kind === "concerts"
        ? "Concerts"
        : detail?.kind === "running"
          ? "Running"
        : detail?.kind === "sport-events"
          ? "Sport events"
          : detail?.kind === "tech-events"
            ? "Tech events"
          : "Weddings";

  const sameCategorySameTrip = useMemo<RelatedEventLink[]>(() => {
    if (!trip || !detail) return [];

    switch (detail.kind) {
      case "concerts":
        return (concertsQuery.data ?? [])
          .filter((entry) => entry.id !== recordId && entry.tripId === trip.id)
          .slice(0, 6)
          .map((entry) => ({
            id: entry.id,
            label: getConcertRelatedLabel(entry),
            href: getEventDetailHref("concerts", entry.id),
          }));
      case "sport-events":
        return (sportEventsQuery.data ?? [])
          .filter((entry) => entry.id !== recordId && entry.tripId === trip.id)
          .slice(0, 6)
          .map((entry) => ({
            id: entry.id,
            label: getSportRelatedLabel(entry, locale),
            href: getEventDetailHref("sport-events", entry.id),
          }));
      case "tech-events":
        return (techEventsQuery.data ?? [])
          .filter((entry) => entry.id !== recordId && entry.tripId === trip.id)
          .slice(0, 6)
          .map((entry) => ({
            id: entry.id,
            label: getTechRelatedLabel(entry),
            href: getEventDetailHref("tech-events", entry.id),
          }));
      case "running":
        return (runningQuery.data ?? [])
          .filter((entry) => entry.id !== recordId && entry.tripId === trip.id)
          .slice(0, 6)
          .map((entry) => ({
            id: entry.id,
            label: getRunningRelatedLabel(entry),
            href: getEventDetailHref("running", entry.id),
          }));
      case "weddings":
        return (weddingsQuery.data ?? [])
          .filter((entry) => entry.id !== recordId && entry.tripId === trip.id)
          .slice(0, 6)
          .map((entry) => ({
            id: entry.id,
            label: getWeddingRelatedLabel(entry, locale),
            href: getEventDetailHref("weddings", entry.id),
          }));
    }
  }, [
    concertsQuery.data,
    detail,
    locale,
    recordId,
    runningQuery.data,
    sportEventsQuery.data,
    techEventsQuery.data,
    trip,
    weddingsQuery.data,
  ]);

  const otherCategoriesSameTrip = useMemo<
    Array<{ title: string; items: RelatedEventLink[] }>
  >(() => {
    if (!trip || !detail) return [];

    const sections: Array<{ title: string; items: RelatedEventLink[] }> = [];

    if (detail.kind !== "concerts") {
      const items = (concertsQuery.data ?? [])
        .filter((entry) => entry.tripId === trip.id)
        .slice(0, 6)
        .map((entry) => ({
          id: entry.id,
          label: getConcertRelatedLabel(entry),
          href: getEventDetailHref("concerts", entry.id),
        }));

      if (items.length > 0) {
        sections.push({
          title: locale === "fr" ? "Concerts du même voyage" : "Concerts from the same trip",
          items,
        });
      }
    }

    if (detail.kind !== "sport-events") {
      const items = (sportEventsQuery.data ?? [])
        .filter((entry) => entry.tripId === trip.id)
        .slice(0, 6)
        .map((entry) => ({
          id: entry.id,
          label: getSportRelatedLabel(entry, locale),
          href: getEventDetailHref("sport-events", entry.id),
        }));

      if (items.length > 0) {
        sections.push({
          title:
            locale === "fr"
              ? "Evènements sportifs du même voyage"
              : "Sport events from the same trip",
          items,
        });
      }
    }

    if (detail.kind !== "tech-events") {
      const items = (techEventsQuery.data ?? [])
        .filter((entry) => entry.tripId === trip.id)
        .slice(0, 6)
        .map((entry) => ({
          id: entry.id,
          label: getTechRelatedLabel(entry),
          href: getEventDetailHref("tech-events", entry.id),
        }));

      if (items.length > 0) {
        sections.push({
          title: locale === "fr" ? "Evènements tech du même voyage" : "Tech events from the same trip",
          items,
        });
      }
    }

    if (detail.kind !== "running") {
      const items = (runningQuery.data ?? [])
        .filter((entry) => entry.tripId === trip.id)
        .slice(0, 6)
        .map((entry) => ({
          id: entry.id,
          label: getRunningRelatedLabel(entry),
          href: getEventDetailHref("running", entry.id),
        }));

      if (items.length > 0) {
        sections.push({
          title: locale === "fr" ? "Courses du même voyage" : "Running events from the same trip",
          items,
        });
      }
    }

    if (detail.kind !== "weddings") {
      const items = (weddingsQuery.data ?? [])
        .filter((entry) => entry.tripId === trip.id)
        .slice(0, 6)
        .map((entry) => ({
          id: entry.id,
          label: getWeddingRelatedLabel(entry, locale),
          href: getEventDetailHref("weddings", entry.id),
        }));

      if (items.length > 0) {
        sections.push({
          title: locale === "fr" ? "Mariages du même voyage" : "Weddings from the same trip",
          items,
        });
      }
    }

    return sections;
  }, [
    concertsQuery.data,
    detail,
    locale,
    runningQuery.data,
    sportEventsQuery.data,
    techEventsQuery.data,
    trip,
    weddingsQuery.data,
  ]);

  const sameCategoryOtherTrips = useMemo<RelatedEventLink[]>(() => {
    if (!detail) return [];

    switch (detail.kind) {
      case "concerts":
        return (concertsQuery.data ?? [])
          .filter((entry) => entry.id !== recordId && entry.tripId !== detail.tripId)
          .slice(0, 6)
          .map((entry) => ({
            id: entry.id,
            label: getConcertRelatedLabel(entry),
            href: getEventDetailHref("concerts", entry.id),
          }));
      case "sport-events":
        return (sportEventsQuery.data ?? [])
          .filter((entry) => entry.id !== recordId && entry.tripId !== detail.tripId)
          .slice(0, 3)
          .map((entry) => ({
            id: entry.id,
            label: getSportRelatedLabel(entry, locale),
            href: getEventDetailHref("sport-events", entry.id),
          }));
      case "tech-events":
        return (techEventsQuery.data ?? [])
          .filter((entry) => entry.id !== recordId && entry.tripId !== detail.tripId)
          .slice(0, 6)
          .map((entry) => ({
            id: entry.id,
            label: getTechRelatedLabel(entry),
            href: getEventDetailHref("tech-events", entry.id),
          }));
      case "running":
        return (runningQuery.data ?? [])
          .filter((entry) => entry.id !== recordId && entry.tripId !== detail.tripId)
          .slice(0, 6)
          .map((entry) => ({
            id: entry.id,
            label: getRunningRelatedLabel(entry),
            href: getEventDetailHref("running", entry.id),
          }));
      case "weddings":
        return (weddingsQuery.data ?? [])
          .filter((entry) => entry.id !== recordId && entry.tripId !== detail.tripId)
          .slice(0, 6)
          .map((entry) => ({
            id: entry.id,
            label: getWeddingRelatedLabel(entry, locale),
            href: getEventDetailHref("weddings", entry.id),
          }));
    }
  }, [
    concertsQuery.data,
    detail,
    locale,
    recordId,
    runningQuery.data,
    sportEventsQuery.data,
    techEventsQuery.data,
    weddingsQuery.data,
  ]);

  if (!isValidKind || !recordId) {
    return <NotFound />;
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="py-32 text-center font-serif text-lg italic text-muted-foreground animate-pulse">
          {locale === "fr" ? "La fiche évènement se prépare..." : "Preparing event record..."}
        </div>
      </Layout>
    );
  }

  if (!detail) {
    return <NotFound />;
  }

  const Icon = detail.icon;

  return (
    <Layout>
      <article className="mx-auto max-w-5xl space-y-10 pb-20">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            {locale === "fr" ? "Accueil" : "Home"}
          </Link>
          <span>/</span>
          <Link href="/events" className="hover:text-foreground transition-colors">
            {locale === "fr" ? "Evènements" : "Events"}
          </Link>
          <span>/</span>
          <span>{categoryLabelPlural}</span>
          <span>/</span>
          <span className="text-foreground">{detail.title}</span>
        </nav>

        <Link
          href="/events"
          className="group inline-flex items-center gap-2 text-sm font-mono uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          {locale === "fr" ? "Retour aux évènements" : "Back to events"}
        </Link>

        <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-[linear-gradient(135deg,rgba(20,70,90,0.08),rgba(247,243,238,0.92)_45%,rgba(232,240,0,0.15))]">
          <div className="grid gap-8 px-6 py-8 md:px-10 md:py-10 lg:grid-cols-[1.35fr_0.9fr] lg:items-end">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="space-y-6"
            >
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/70 px-4 py-2 font-mono uppercase tracking-[0.24em] text-primary">
                  <Icon className="h-4 w-4" />
                  {detail.kindLabel}
                </span>
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 text-primary" />
                  {formatDate(detail.date, "long")}
                </span>
                {locationLabel && (
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    {locationLabel}
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-serif font-bold leading-tight tracking-tight text-foreground md:text-6xl">
                  {detail.title}
                </h1>
                <p className="max-w-2xl text-lg font-serif italic leading-relaxed text-muted-foreground md:text-2xl">
                  {detail.subtitle}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {detail.galleryLink && (
                  <a
                    href={detail.galleryLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[var(--color-primary-hover)]"
                  >
                    {locale === "fr" ? "Ouvrir la galerie" : "Open gallery"}
                  </a>
                )}
                {detail.storyLink && (
                  <a
                    href={detail.storyLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background/80 px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/40"
                  >
                    {locale === "fr" ? "Voir le lien associé" : "Open related link"}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </motion.div>

            <motion.aside
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="rounded-[1.75rem] border border-white/70 bg-white/70 p-5 shadow-[0_16px_60px_rgba(20,70,90,0.08)] backdrop-blur"
            >
              <p className="text-xs font-mono uppercase tracking-[0.24em] text-muted-foreground">
                {locale === "fr" ? "Fiche express" : "Quick facts"}
              </p>
              <div className="mt-4 space-y-4">
                {detail.meta.map((item) => (
                  <div key={item.label} className="border-b border-border/60 pb-4 last:border-b-0 last:pb-0">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
                    <p className="mt-1 text-base font-medium text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
            </motion.aside>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            {hasGallery ? (
              <section className="rounded-[1.75rem] border border-border/60 bg-card/70 p-6">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs font-mono uppercase tracking-[0.22em] text-muted-foreground">
                      {locale === "fr" ? "Images" : "Images"}
                    </p>
                    <h2 className="text-2xl font-serif font-bold text-foreground">
                      {locale === "fr" ? "Galerie photo" : "Photo gallery"}
                    </h2>
                  </div>
                </div>

                {detail.galleryLink && hasPCloudGallery ? (
                  <div className="mt-5">
                    <PCloudGallery publicLink={detail.galleryLink} locale={locale} />
                  </div>
                ) : detail.galleryLink ? (
                  <div className="mt-5 space-y-4 rounded-[1.5rem] border border-border/60 bg-background/80 p-5">
                    <p className="text-sm leading-7 text-foreground">
                      {locale === "fr"
                        ? "La fiche pointe vers une galerie externe. Ce lien reste utilisable tel quel, même s’il n’est pas encore interprété automatiquement comme une galerie pCloud."
                        : "The record can already point to an external gallery. For a true integrated grid gallery, we should ideally store a list of images and their metadata rather than a single link."}
                    </p>
                    <a
                      href={detail.galleryLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-primary underline underline-offset-4"
                    >
                      {locale === "fr" ? "Ouvrir la galerie liée" : "Open linked gallery"}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                ) : null}
              </section>
            ) : null}

            {!hasGallery ? (
              <TripContextBlock
                locale={locale}
                trip={trip}
                journey={journey}
                detailTripName={detail.tripName}
                formatDate={formatDate}
              />
            ) : null}
          </div>

          <div className="space-y-6">
            {hasVideo ? (
              <section className="rounded-[1.75rem] border border-border/60 bg-card/70 p-6">
                <div className="flex items-center gap-3">
                  <Film className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs font-mono uppercase tracking-[0.22em] text-muted-foreground">
                      {locale === "fr" ? "Média" : "Media"}
                    </p>
                    <h2 className="text-2xl font-serif font-bold text-foreground">
                      {locale === "fr" ? "Vidéo YouTube" : "YouTube video"}
                    </h2>
                  </div>
                </div>

                {detail.videoEmbedUrl ? (
                  <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-border/60 bg-black">
                    <div className="aspect-video">
                      <iframe
                        src={detail.videoEmbedUrl}
                        title={detail.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="h-full w-full"
                      />
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}

            <div className="rounded-[1.75rem] border border-border/60 bg-card/70 p-6">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs font-mono uppercase tracking-[0.22em] text-muted-foreground">
                    {locale === "fr" ? "Présences" : "Attendees"}
                  </p>
                  <h2 className="text-2xl font-serif font-bold text-foreground">
                    {locale === "fr" ? "Qui était là" : "Who was there"}
                  </h2>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {detail.attendees.length ? (
                  detail.attendees.map((person) => (
                    <span
                      key={person}
                      className="rounded-full border border-primary/15 bg-[var(--color-primary-lightest)] px-4 py-2 text-sm text-[var(--color-primary)]"
                    >
                      {person}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {locale === "fr" ? "Aucun compagnon renseigné pour le moment." : "No attendee recorded yet."}
                  </p>
                )}
              </div>
            </div>

            {hasGallery ? (
              <TripContextBlock
                locale={locale}
                trip={trip}
                journey={journey}
                detailTripName={detail.tripName}
                formatDate={formatDate}
              />
            ) : null}
          </div>
        </section>

        {(sameCategorySameTrip.length > 0 ||
          otherCategoriesSameTrip.length > 0 ||
          sameCategoryOtherTrips.length > 0) && (
          <section className="space-y-4 border-t border-border/60 pt-8">
            <p className="text-xs font-mono uppercase tracking-[0.24em] text-muted-foreground">
              {locale === "fr" ? "Autour de cet évènement" : "Around this event"}
            </p>
            <div className="space-y-6">
              <SectionLinks
                title={
                  locale === "fr"
                    ? `${categoryLabelPlural} du même voyage`
                    : `More ${categoryLabelPlural.toLowerCase()} from the same trip`
                }
                items={sameCategorySameTrip}
              />
              {otherCategoriesSameTrip.map((section) => (
                <SectionLinks key={section.title} title={section.title} items={section.items} />
              ))}
              <SectionLinks
                title={
                  locale === "fr"
                    ? `${categoryLabelPlural} d'autres voyages`
                    : `${categoryLabelPlural} from other trips`
                }
                items={sameCategoryOtherTrips}
              />
            </div>
          </section>
        )}
      </article>
    </Layout>
  );
}
