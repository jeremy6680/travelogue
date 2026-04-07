import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  CLOUDINARY_UPLOAD_FOLDERS,
  getMediaAssetImageUrl,
  uploadImageToCloudinary,
} from "@/lib/cloudinary";
import { Layout } from "@/components/layout";
import {
  directusQueryKeys,
  useCreateJourneyMutation,
  useCreateMediaAssetMutation,
  useCreatePhotoMutation,
  useCreatePostMutation,
  useCreateTripMutation,
  useDeleteJourneyMutation,
  useDeleteMediaAssetMutation,
  useDeletePhotoMutation,
  useDeletePostMutation,
  useDeleteTripMutation,
  useDirectusHealthQuery,
  useJourneysQuery,
  useMediaAssetsQuery,
  usePhotosQuery,
  usePostsQuery,
  useTripsQuery,
  useUpdateJourneyMutation,
  useUpdateMediaAssetMutation,
  useUpdatePhotoMutation,
  useUpdatePostMutation,
  useUpdateTripMutation,
} from "@/lib/directus";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  COMPANION_OPTIONS,
  TRAVEL_REASON_OPTIONS,
  TRANSPORT_OPTIONS,
  formatTransportLabels,
  formatTravelReasonLabels,
} from "@/lib/trip-options";
import { normalizeTagList } from "@/lib/post-taxonomy";
import {
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  LoaderCircle,
  UploadCloud,
} from "lucide-react";
import type {
  Journey,
  MediaAsset,
  Photo,
  Post,
  Trip,
} from "@/lib/travel-types";

const COUNTRY_CODES: { code: string; name: string }[] = [
  { code: "AF", name: "Afghanistan" },
  { code: "AL", name: "Albania" },
  { code: "DZ", name: "Algeria" },
  { code: "AD", name: "Andorra" },
  { code: "AO", name: "Angola" },
  { code: "AG", name: "Antigua and Barbuda" },
  { code: "AR", name: "Argentina" },
  { code: "AM", name: "Armenia" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "AZ", name: "Azerbaijan" },
  { code: "BS", name: "Bahamas" },
  { code: "BH", name: "Bahrain" },
  { code: "BD", name: "Bangladesh" },
  { code: "BB", name: "Barbados" },
  { code: "BY", name: "Belarus" },
  { code: "BE", name: "Belgium" },
  { code: "BZ", name: "Belize" },
  { code: "BJ", name: "Benin" },
  { code: "BT", name: "Bhutan" },
  { code: "BO", name: "Bolivia" },
  { code: "BA", name: "Bosnia and Herzegovina" },
  { code: "BW", name: "Botswana" },
  { code: "BR", name: "Brazil" },
  { code: "BN", name: "Brunei" },
  { code: "BG", name: "Bulgaria" },
  { code: "BF", name: "Burkina Faso" },
  { code: "BI", name: "Burundi" },
  { code: "CV", name: "Cabo Verde" },
  { code: "KH", name: "Cambodia" },
  { code: "CM", name: "Cameroon" },
  { code: "CA", name: "Canada" },
  { code: "CF", name: "Central African Republic" },
  { code: "TD", name: "Chad" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CO", name: "Colombia" },
  { code: "KM", name: "Comoros" },
  { code: "CG", name: "Congo" },
  { code: "CD", name: "Congo (DRC)" },
  { code: "CR", name: "Costa Rica" },
  { code: "HR", name: "Croatia" },
  { code: "CU", name: "Cuba" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" },
  { code: "DJ", name: "Djibouti" },
  { code: "DM", name: "Dominica" },
  { code: "DO", name: "Dominican Republic" },
  { code: "EC", name: "Ecuador" },
  { code: "EG", name: "Egypt" },
  { code: "SV", name: "El Salvador" },
  { code: "GQ", name: "Equatorial Guinea" },
  { code: "ER", name: "Eritrea" },
  { code: "EE", name: "Estonia" },
  { code: "SZ", name: "Eswatini" },
  { code: "ET", name: "Ethiopia" },
  { code: "FJ", name: "Fiji" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "GA", name: "Gabon" },
  { code: "GM", name: "Gambia" },
  { code: "GE", name: "Georgia" },
  { code: "DE", name: "Germany" },
  { code: "GH", name: "Ghana" },
  { code: "GR", name: "Greece" },
  { code: "GD", name: "Grenada" },
  { code: "GT", name: "Guatemala" },
  { code: "GN", name: "Guinea" },
  { code: "GW", name: "Guinea-Bissau" },
  { code: "GY", name: "Guyana" },
  { code: "HT", name: "Haiti" },
  { code: "HN", name: "Honduras" },
  { code: "HU", name: "Hungary" },
  { code: "IS", name: "Iceland" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IR", name: "Iran" },
  { code: "IQ", name: "Iraq" },
  { code: "IE", name: "Ireland" },
  { code: "IL", name: "Israel" },
  { code: "IT", name: "Italy" },
  { code: "JM", name: "Jamaica" },
  { code: "JP", name: "Japan" },
  { code: "JO", name: "Jordan" },
  { code: "KZ", name: "Kazakhstan" },
  { code: "KE", name: "Kenya" },
  { code: "KI", name: "Kiribati" },
  { code: "KP", name: "Korea (North)" },
  { code: "KR", name: "Korea (South)" },
  { code: "KW", name: "Kuwait" },
  { code: "KG", name: "Kyrgyzstan" },
  { code: "LA", name: "Laos" },
  { code: "LV", name: "Latvia" },
  { code: "LB", name: "Lebanon" },
  { code: "LS", name: "Lesotho" },
  { code: "LR", name: "Liberia" },
  { code: "LY", name: "Libya" },
  { code: "LI", name: "Liechtenstein" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MG", name: "Madagascar" },
  { code: "MW", name: "Malawi" },
  { code: "MY", name: "Malaysia" },
  { code: "MV", name: "Maldives" },
  { code: "ML", name: "Mali" },
  { code: "MT", name: "Malta" },
  { code: "MH", name: "Marshall Islands" },
  { code: "MR", name: "Mauritania" },
  { code: "MU", name: "Mauritius" },
  { code: "MX", name: "Mexico" },
  { code: "FM", name: "Micronesia" },
  { code: "MD", name: "Moldova" },
  { code: "MC", name: "Monaco" },
  { code: "MN", name: "Mongolia" },
  { code: "ME", name: "Montenegro" },
  { code: "MA", name: "Morocco" },
  { code: "MZ", name: "Mozambique" },
  { code: "MM", name: "Myanmar" },
  { code: "NA", name: "Namibia" },
  { code: "NR", name: "Nauru" },
  { code: "NP", name: "Nepal" },
  { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" },
  { code: "NI", name: "Nicaragua" },
  { code: "NE", name: "Niger" },
  { code: "NG", name: "Nigeria" },
  { code: "MK", name: "North Macedonia" },
  { code: "NO", name: "Norway" },
  { code: "OM", name: "Oman" },
  { code: "PK", name: "Pakistan" },
  { code: "PW", name: "Palau" },
  { code: "PA", name: "Panama" },
  { code: "PG", name: "Papua New Guinea" },
  { code: "PY", name: "Paraguay" },
  { code: "PE", name: "Peru" },
  { code: "PH", name: "Philippines" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "QA", name: "Qatar" },
  { code: "RO", name: "Romania" },
  { code: "RU", name: "Russia" },
  { code: "RW", name: "Rwanda" },
  { code: "KN", name: "Saint Kitts and Nevis" },
  { code: "LC", name: "Saint Lucia" },
  { code: "VC", name: "Saint Vincent and the Grenadines" },
  { code: "WS", name: "Samoa" },
  { code: "SM", name: "San Marino" },
  { code: "ST", name: "São Tomé and Príncipe" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SN", name: "Senegal" },
  { code: "RS", name: "Serbia" },
  { code: "SC", name: "Seychelles" },
  { code: "SL", name: "Sierra Leone" },
  { code: "SG", name: "Singapore" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "SB", name: "Solomon Islands" },
  { code: "SO", name: "Somalia" },
  { code: "ZA", name: "South Africa" },
  { code: "SS", name: "South Sudan" },
  { code: "ES", name: "Spain" },
  { code: "LK", name: "Sri Lanka" },
  { code: "SD", name: "Sudan" },
  { code: "SR", name: "Suriname" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "SY", name: "Syria" },
  { code: "TW", name: "Taiwan" },
  { code: "TJ", name: "Tajikistan" },
  { code: "TZ", name: "Tanzania" },
  { code: "TH", name: "Thailand" },
  { code: "TL", name: "Timor-Leste" },
  { code: "TG", name: "Togo" },
  { code: "TO", name: "Tonga" },
  { code: "TT", name: "Trinidad and Tobago" },
  { code: "TN", name: "Tunisia" },
  { code: "TR", name: "Turkey" },
  { code: "TM", name: "Turkmenistan" },
  { code: "TV", name: "Tuvalu" },
  { code: "UG", name: "Uganda" },
  { code: "UA", name: "Ukraine" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "UY", name: "Uruguay" },
  { code: "UZ", name: "Uzbekistan" },
  { code: "VU", name: "Vanuatu" },
  { code: "VE", name: "Venezuela" },
  { code: "VN", name: "Vietnam" },
  { code: "YE", name: "Yemen" },
  { code: "ZM", name: "Zambia" },
  { code: "ZW", name: "Zimbabwe" },
];

const frenchRegionNames = new Intl.DisplayNames(["fr-FR"], { type: "region" });

function getCountryDisplayName(code: string, fallback: string) {
  return frenchRegionNames.of(code) ?? fallback;
}

const actionButtonClass =
  "transition-all hover:scale-105 hover:bg-muted active:scale-95 active:opacity-80";

const selectClassName = cn(
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

type CheckboxOption = {
  value: string;
  label: string;
};

function CheckboxGroup({
  name,
  options,
  defaultValues = [],
}: {
  name: string;
  options: readonly CheckboxOption[];
  defaultValues?: readonly string[];
}) {
  const selectedValues = new Set(defaultValues);

  return (
    <div className="grid grid-cols-2 gap-2 rounded-xl border border-input/60 bg-background/60 p-3">
      {options.map((option) => (
        <label
          key={option.value}
          className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-2 text-sm text-foreground"
        >
          <input
            type="checkbox"
            name={name}
            value={option.value}
            defaultChecked={selectedValues.has(option.value)}
            className="h-4 w-4"
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

function MultiSelectWithCustomOption({
  name,
  options,
  defaultValues = [],
  customLabel,
  customPlaceholder,
}: {
  name: string;
  options: readonly CheckboxOption[];
  defaultValues?: readonly string[];
  customLabel: string;
  customPlaceholder: string;
}) {
  const knownValues = useMemo(
    () => new Set(options.map((option) => option.value)),
    [options],
  );
  const [selectedValues, setSelectedValues] = useState<string[]>(() =>
    Array.from(new Set(defaultValues.map((value) => value.trim()).filter(Boolean))),
  );
  const [customValue, setCustomValue] = useState("");

  useEffect(() => {
    setSelectedValues(
      Array.from(new Set(defaultValues.map((value) => value.trim()).filter(Boolean))),
    );
    setCustomValue("");
  }, [defaultValues]);

  const customValues = selectedValues.filter((value) => !knownValues.has(value));

  const toggleValue = (value: string) => {
    setSelectedValues((currentValues) =>
      currentValues.includes(value)
        ? currentValues.filter((currentValue) => currentValue !== value)
        : [...currentValues, value],
    );
  };

  const addCustomValue = () => {
    const nextValue = customValue.trim();
    if (!nextValue) return;

    setSelectedValues((currentValues) =>
      currentValues.includes(nextValue)
        ? currentValues
        : [...currentValues, nextValue],
    );
    setCustomValue("");
  };

  return (
    <div className="space-y-3 rounded-xl border border-input/60 bg-background/60 p-3">
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-2 text-sm text-foreground"
          >
            <input
              type="checkbox"
              checked={selectedValues.includes(option.value)}
              onChange={() => toggleValue(option.value)}
              className="h-4 w-4"
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>

      <div className="space-y-2 rounded-lg border border-dashed border-border/70 bg-card/60 p-3">
        <p className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
          {customLabel}
        </p>
        <div className="flex gap-2">
          <Input
            value={customValue}
            onChange={(event) => setCustomValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addCustomValue();
              }
            }}
            placeholder={customPlaceholder}
          />
          <Button type="button" variant="outline" onClick={addCustomValue}>
            Ajouter
          </Button>
        </div>
        {customValues.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {customValues.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => toggleValue(value)}
                className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground transition-colors hover:bg-muted"
              >
                {value} ×
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedValues.map((value) => (
        <input key={value} type="hidden" name={name} value={value} />
      ))}
    </div>
  );
}

function useAdminInvalidation() {
  const queryClient = useQueryClient();

  return {
    invalidatePosts() {
      queryClient.invalidateQueries({ queryKey: directusQueryKeys.posts });
      queryClient.invalidateQueries({ queryKey: directusQueryKeys.mapPins });
      queryClient.invalidateQueries({ queryKey: directusQueryKeys.stats });
    },
    invalidateTrips() {
      queryClient.invalidateQueries({ queryKey: directusQueryKeys.trips });
      queryClient.invalidateQueries({ queryKey: directusQueryKeys.stats });
    },
    invalidatePhotos() {
      queryClient.invalidateQueries({ queryKey: directusQueryKeys.photos });
    },
    invalidateMedia() {
      queryClient.invalidateQueries({
        queryKey: directusQueryKeys.mediaAssets,
      });
      queryClient.invalidateQueries({ queryKey: directusQueryKeys.posts });
      queryClient.invalidateQueries({ queryKey: directusQueryKeys.photos });
      queryClient.invalidateQueries({ queryKey: directusQueryKeys.mapPins });
    },
  };
}

export default function AdminPage() {
  const [adminToken, setAdminToken] = useState(() =>
    typeof window === "undefined"
      ? ""
      : (window.sessionStorage.getItem("travelogue_admin_api_token") ?? ""),
  );

  const { data: posts = [] } = usePostsQuery();
  const { data: journeys = [] } = useJourneysQuery();
  const { data: trips = [] } = useTripsQuery();
  const { data: photos = [] } = usePhotosQuery();
  const { data: mediaAssets = [] } = useMediaAssetsQuery();
  const { data: health } = useDirectusHealthQuery();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const invalidation = useAdminInvalidation();

  const createJourney = useCreateJourneyMutation();
  const updateJourney = useUpdateJourneyMutation();
  const deleteJourney = useDeleteJourneyMutation();

  const createPost = useCreatePostMutation();
  const updatePost = useUpdatePostMutation();
  const deletePost = useDeletePostMutation();

  const createTrip = useCreateTripMutation();
  const updateTrip = useUpdateTripMutation();
  const deleteTrip = useDeleteTripMutation();

  const createPhoto = useCreatePhotoMutation();
  const updatePhoto = useUpdatePhotoMutation();
  const deletePhoto = useDeletePhotoMutation();

  const createMediaAsset = useCreateMediaAssetMutation();
  const updateMediaAsset = useUpdateMediaAssetMutation();
  const deleteMediaAsset = useDeleteMediaAssetMutation();

  const [editingJourney, setEditingJourney] = useState<Journey | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [editingMediaAsset, setEditingMediaAsset] = useState<MediaAsset | null>(
    null,
  );
  const [tripFormVersion, setTripFormVersion] = useState(0);
  const [postTripId, setPostTripId] = useState("");
  const [postCountryCode, setPostCountryCode] = useState("");
  const [postLatitude, setPostLatitude] = useState("");
  const [postLongitude, setPostLongitude] = useState("");
  const [isUploadingAsset, setIsUploadingAsset] = useState(false);
  const isUnlocked = adminToken.trim().length > 0;
  const journeyOptions = useMemo(
    () =>
      [...journeys]
        .sort((a, b) => a.name.localeCompare(b.name, "en"))
        .map((journey) => ({
          id: journey.id,
          label: journey.name,
        })),
    [journeys],
  );
  const tripOptions = useMemo(
    () =>
      [...trips]
        .sort((a, b) => a.name.localeCompare(b.name, "en"))
        .map((trip) => ({
          id: trip.id,
          label: `${trip.name}, ${trip.countryCode}, ID voyage ${trip.id}`,
        })),
    [trips],
  );
  const findTripById = (value: FormDataEntryValue | null) => {
    const tripId = value ? Number(value) : null;
    return tripId != null
      ? (trips.find((trip) => trip.id === tripId) ?? null)
      : null;
  };
  const resetPostFormState = () => {
    setPostTripId("");
    setPostCountryCode("");
    setPostLatitude("");
    setPostLongitude("");
  };
  const syncPostCoordinatesFromTrip = (tripIdValue: string) => {
    setPostTripId(tripIdValue);

    if (!tripIdValue) {
      return;
    }

    const linkedTrip =
      trips.find((trip) => trip.id === Number(tripIdValue)) ?? null;
    if (!linkedTrip) {
      return;
    }

    setPostLatitude(
      linkedTrip.latitude != null ? String(linkedTrip.latitude) : "",
    );
    setPostLongitude(
      linkedTrip.longitude != null ? String(linkedTrip.longitude) : "",
    );
    setPostCountryCode(linkedTrip.countryCode ?? "");
  };

  useEffect(() => {
    if (!editingPost) {
      resetPostFormState();
      return;
    }

    setPostTripId(editingPost.tripId != null ? String(editingPost.tripId) : "");
    setPostCountryCode(editingPost.countryCode ?? "");
    setPostLatitude(
      editingPost.latitude != null ? String(editingPost.latitude) : "",
    );
    setPostLongitude(
      editingPost.longitude != null ? String(editingPost.longitude) : "",
    );
  }, [editingPost]);

  const mediaAssetOptions = useMemo(
    () =>
      [...mediaAssets]
        .sort((a, b) => a.publicId.localeCompare(b.publicId, "en"))
        .map((asset) => ({
          id: asset.id,
          label: `${asset.publicId} · Asset ID ${asset.id}`,
        })),
    [mediaAssets],
  );

  const handleUnlock = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const token = String(formData.get("adminToken") ?? "").trim();
    if (!token) return;
    window.sessionStorage.setItem("travelogue_admin_api_token", token);
    setAdminToken(token);
    toast({ title: "Admin déverrouillé pour cette session" });
  };

  const handleLock = () => {
    window.sessionStorage.removeItem("travelogue_admin_api_token");
    setAdminToken("");
    toast({ title: "Admin verrouillé" });
  };

  if (!isUnlocked) {
    return (
      <Layout>
        <div className="max-w-md mx-auto pt-16">
          <div className="bg-card p-6 rounded-2xl border space-y-4 shadow-sm">
            <div className="space-y-2">
              <h1 className="text-3xl font-serif font-bold text-foreground">
                Déverrouiller l'admin
              </h1>
              <p className="text-sm text-muted-foreground">
                Saisis ton token API admin. Il sera stocké uniquement dans cette
                session du navigateur.
              </p>
            </div>
            <form onSubmit={handleUnlock} className="space-y-4">
              <Input
                name="adminToken"
                type="password"
                placeholder="Token API admin"
                autoComplete="current-password"
                required
              />
              <Button type="submit" className="w-full">
                Déverrouiller
              </Button>
            </form>
          </div>
        </div>
      </Layout>
    );
  }

  const handlePostSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const linkedTrip = findTripById(formData.get("tripId"));
    const latitudeInput = formData.get("latitude") as string;
    const longitudeInput = formData.get("longitude") as string;
    const data = {
      title: formData.get("title") as string,
      slug: formData.get("slug") as string,
      content: (formData.get("content") as string) || null,
      excerpt: formData.get("excerpt") as string,
      externalUrl: (formData.get("externalUrl") as string) || null,
      category: (formData.get("category") as string) || null,
      tags: normalizeTagList((formData.get("tags") as string) || null),
      featuredOnHome: formData.get("featuredOnHome") === "on",
      featuredHomeOrder: formData.get("featuredHomeOrder")
        ? Number(formData.get("featuredHomeOrder"))
        : null,
      coverImageId: formData.get("coverImageId")
        ? Number(formData.get("coverImageId"))
        : null,
      coverImageUrl: (formData.get("coverImageUrl") as string) || null,
      location: (formData.get("location") as string) || null,
      tripId: formData.get("tripId") ? Number(formData.get("tripId")) : null,
      countryCode:
        (formData.get("countryCode") as string) ||
        linkedTrip?.countryCode ||
        null,
      latitude: latitudeInput
        ? Number(latitudeInput)
        : (linkedTrip?.latitude ?? null),
      longitude: longitudeInput
        ? Number(longitudeInput)
        : (linkedTrip?.longitude ?? null),
      publishedAt: (formData.get("publishedAt") as string) || null,
    };

    if (editingPost) {
      updatePost.mutate(
        { token: adminToken, id: editingPost.id, data },
        {
          onSuccess: () => {
            invalidation.invalidatePosts();
            setEditingPost(null);
            resetPostFormState();
            toast({ title: "Article mis à jour" });
          },
        },
      );
    } else {
      createPost.mutate(
        { token: adminToken, data },
        {
          onSuccess: () => {
            invalidation.invalidatePosts();
            toast({ title: "Article créé" });
            resetPostFormState();
            (e.target as HTMLFormElement).reset();
          },
        },
      );
    }
  };

  const handleJourneySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const originMode =
      (formData.get("originMode") as "default_nice" | "custom") ||
      "default_nice";
    const destinationMode =
      (formData.get("destinationMode") as "default_nice" | "custom") ||
      "default_nice";
    const originLatitude = formData.get("originLatitude") as string;
    const originLongitude = formData.get("originLongitude") as string;
    const destinationLatitude = formData.get("destinationLatitude") as string;
    const destinationLongitude = formData.get("destinationLongitude") as string;
    const data = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      startDate: (formData.get("startDate") as string) || null,
      endDate: (formData.get("endDate") as string) || null,
      originMode,
      originLatitude:
        originMode === "custom" && originLatitude
          ? Number(originLatitude)
          : null,
      originLongitude:
        originMode === "custom" && originLongitude
          ? Number(originLongitude)
          : null,
      destinationMode,
      destinationLatitude:
        destinationMode === "custom" && destinationLatitude
          ? Number(destinationLatitude)
          : null,
      destinationLongitude:
        destinationMode === "custom" && destinationLongitude
          ? Number(destinationLongitude)
          : null,
      notes: (formData.get("notes") as string) || null,
    };

    if (editingJourney) {
      updateJourney.mutate(
        { token: adminToken, id: editingJourney.id, data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: directusQueryKeys.journeys,
            });
            queryClient.invalidateQueries({
              queryKey: directusQueryKeys.trips,
            });
            setEditingJourney(null);
            toast({ title: "Périple mis à jour" });
          },
        },
      );
    } else {
      createJourney.mutate(
        { token: adminToken, data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: directusQueryKeys.journeys,
            });
            toast({ title: "Périple créé" });
            (e.target as HTMLFormElement).reset();
          },
        },
      );
    }
  };

  const handleTripSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const latitudeInput = formData.get("latitude") as string;
    const longitudeInput = formData.get("longitude") as string;
    const journeyIdInput = formData.get("journeyId") as string;
    const journeyOrderInput = formData.get("journeyOrder") as string;
    const travelCompanions = formData
      .getAll("travelCompanions")
      .map((value) => String(value).trim())
      .filter(Boolean);
    const reasonForTravel = formData
      .getAll("reasonForTravel")
      .map((value) => String(value).trim())
      .filter(Boolean);
    const transportationTo = formData
      .getAll("transportationTo")
      .map((value) => String(value).trim())
      .filter(Boolean);
    const transportationOnSite = formData
      .getAll("transportationOnSite")
      .map((value) => String(value).trim())
      .filter(Boolean);

    const data = {
      name: formData.get("name") as string,
      countryCode: formData.get("countryCode") as string,
      visitedCities: formData.get("visitedCities") as string,
      reasonForVisit: formData.get("reasonForVisit") as string,
      reasonForTravel,
      travelCompanions,
      friendsFamilyMet: formData.get("friendsFamilyMet") as string,
      visitedAt: formData.get("visitedAt") as string,
      coverImageId: formData.get("coverImageId")
        ? Number(formData.get("coverImageId"))
        : null,
      latitude: latitudeInput ? Number(latitudeInput) : undefined,
      longitude: longitudeInput ? Number(longitudeInput) : undefined,
      journeyId: journeyIdInput ? Number(journeyIdInput) : null,
      journeyOrder: journeyOrderInput ? Number(journeyOrderInput) : null,
      transportationTo,
      transportationOnSite,
    };

    if (editingTrip) {
      updateTrip.mutate(
        { token: adminToken, id: editingTrip.id, data },
        {
          onSuccess: () => {
            invalidation.invalidateTrips();
            setEditingTrip(null);
            setTripFormVersion((currentValue) => currentValue + 1);
            toast({ title: "Voyage mis à jour" });
          },
        },
      );
    } else {
      createTrip.mutate(
        { token: adminToken, data },
        {
          onSuccess: () => {
            invalidation.invalidateTrips();
            setTripFormVersion((currentValue) => currentValue + 1);
            toast({ title: "Voyage ajouté" });
          },
        },
      );
    }
  };

  const handlePhotoSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const linkedTrip = findTripById(formData.get("tripId"));
    const data = {
      mediaAssetId: formData.get("mediaAssetId")
        ? Number(formData.get("mediaAssetId"))
        : null,
      url: (formData.get("url") as string) || null,
      caption: (formData.get("caption") as string) || null,
      link: (formData.get("link") as string) || null,
      tripId: formData.get("tripId") ? Number(formData.get("tripId")) : null,
      countryCode:
        (formData.get("countryCode") as string) ||
        linkedTrip?.countryCode ||
        null,
      displayOrder: formData.get("displayOrder")
        ? Number(formData.get("displayOrder"))
        : 0,
    };

    if (editingPhoto) {
      updatePhoto.mutate(
        { token: adminToken, id: editingPhoto.id, data },
        {
          onSuccess: () => {
            invalidation.invalidatePhotos();
            setEditingPhoto(null);
            toast({ title: "Photo mise à jour" });
          },
        },
      );
    } else {
      createPhoto.mutate(
        { token: adminToken, data },
        {
          onSuccess: () => {
            invalidation.invalidatePhotos();
            toast({ title: "Photo ajoutée" });
            (e.target as HTMLFormElement).reset();
          },
        },
      );
    }
  };

  const handleMediaAssetSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: (formData.get("title") as string) || null,
      publicId: formData.get("publicId") as string,
      deliveryUrl: (formData.get("deliveryUrl") as string) || null,
      width: formData.get("width") ? Number(formData.get("width")) : null,
      height: formData.get("height") ? Number(formData.get("height")) : null,
      format: (formData.get("format") as string) || null,
      resourceType: (formData.get("resourceType") as string) || null,
      bytes: formData.get("bytes") ? Number(formData.get("bytes")) : null,
      alt: (formData.get("alt") as string) || null,
      caption: (formData.get("caption") as string) || null,
      folder: (formData.get("folder") as string) || null,
      placeholderUrl: (formData.get("placeholderUrl") as string) || null,
    };

    if (editingMediaAsset) {
      updateMediaAsset.mutate(
        { token: adminToken, id: editingMediaAsset.id, data },
        {
          onSuccess: () => {
            invalidation.invalidateMedia();
            setEditingMediaAsset(null);
            toast({ title: "Asset média mis à jour" });
          },
        },
      );
    } else {
      createMediaAsset.mutate(
        { token: adminToken, data },
        {
          onSuccess: () => {
            invalidation.invalidateMedia();
            toast({ title: "Asset média ajouté" });
            (e.target as HTMLFormElement).reset();
          },
        },
      );
    }
  };

  const handleCloudinaryUpload = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const selectedFile = formData.get("file");

    if (!(selectedFile instanceof File) || selectedFile.size === 0) {
      toast({
        title: "Aucun fichier sélectionné",
        description: "Choisis une image avant de lancer l'envoi Cloudinary.",
      });
      return;
    }

    setIsUploadingAsset(true);

    try {
      const uploaded = await uploadImageToCloudinary({
        adminToken,
        alt: (formData.get("alt") as string) || null,
        assetFolder: formData.get(
          "assetFolder",
        ) as (typeof CLOUDINARY_UPLOAD_FOLDERS)[number],
        caption: (formData.get("caption") as string) || null,
        file: selectedFile,
        publicId: (formData.get("publicId") as string) || null,
        title: (formData.get("title") as string) || null,
      });

      createMediaAsset.mutate(
        {
          token: adminToken,
          data: uploaded.mediaAsset,
        },
        {
          onSuccess: () => {
            invalidation.invalidateMedia();
            toast({
              title: "Image envoyée vers Cloudinary",
              description: uploaded.upload.publicId,
            });
            (e.target as HTMLFormElement).reset();
          },
          onError: (error) => {
            toast({
              title: "Upload Cloudinary OK, synchronisation Directus échouée",
              description: error.message,
              variant: "destructive",
            });
          },
          onSettled: () => {
            setIsUploadingAsset(false);
          },
        },
      );
    } catch (error) {
      setIsUploadingAsset(false);
      toast({
        title: "Échec de l'upload",
        description:
          error instanceof Error ? error.message : "Erreur Cloudinary inconnue",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-12 max-w-5xl mx-auto">
        <header className="border-b pb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif font-bold text-foreground">
              Administration
            </h1>
            <p className="text-muted-foreground mt-2 font-serif italic">
              Gère tes articles, voyages et médias Cloudinary.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-mono border rounded-full px-4 py-1.5 bg-card">
              Statut serveur :
              {health?.status === "ok" ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLock}
            >
              Verrouiller
            </Button>
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-12">
          <section className="space-y-6">
            <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
              Articles{" "}
              <span className="text-sm font-sans font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {posts.length}
              </span>
            </h2>

            <form
              key={editingPost ? `post-${editingPost.id}` : "post-new"}
              onSubmit={handlePostSubmit}
              className="bg-card p-6 rounded-2xl border space-y-4 shadow-sm"
            >
              <h3 className="font-serif font-medium text-lg border-b pb-2 mb-4">
                {editingPost ? "Modifier l'article" : "Nouvel article"}
              </h3>

              <div className="space-y-3">
                <Input
                  name="title"
                  placeholder="Titre"
                  defaultValue={editingPost?.title}
                  required
                />
                <Input
                  name="slug"
                  placeholder="Slug (ex. tokyo-nights)"
                  defaultValue={editingPost?.slug}
                  required
                />
                <Textarea
                  name="excerpt"
                  placeholder="Court extrait..."
                  defaultValue={editingPost?.excerpt}
                  required
                  className="h-20"
                />
                <Textarea
                  name="content"
                  placeholder="Contenu complet... (optionnel pour un article externe)"
                  defaultValue={editingPost?.content ?? ""}
                  className="h-40"
                />
                <Input
                  name="externalUrl"
                  type="url"
                  placeholder="URL de l'article externe (optionnel)"
                  defaultValue={editingPost?.externalUrl || ""}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    name="category"
                    placeholder="Catégorie (optionnel)"
                    defaultValue={editingPost?.category || ""}
                  />
                  <Input
                    name="tags"
                    placeholder="Tags séparés par des virgules"
                    defaultValue={editingPost?.tags.join(", ") || ""}
                  />
                </div>
                <div className="grid grid-cols-[auto_1fr] items-center gap-3 rounded-xl border border-dashed px-3 py-3">
                  <input
                    id="featuredOnHome"
                    name="featuredOnHome"
                    type="checkbox"
                    defaultChecked={editingPost?.featuredOnHome ?? false}
                    className="h-4 w-4"
                  />
                  <label
                    htmlFor="featuredOnHome"
                    className="text-sm text-foreground"
                  >
                    Mettre en avant sur la home
                  </label>
                  <span className="text-xs text-muted-foreground col-start-2">
                    Si plusieurs articles sont cochés, l’ordre ci-dessous décide
                    lesquels remontent en premier.
                  </span>
                </div>
                <Input
                  name="featuredHomeOrder"
                  type="number"
                  min="1"
                  placeholder="Ordre de mise en avant sur la home (optionnel)"
                  defaultValue={editingPost?.featuredHomeOrder ?? ""}
                />
                <select
                  name="coverImageId"
                  defaultValue={
                    editingPost?.coverImage?.id != null
                      ? String(editingPost.coverImage.id)
                      : ""
                  }
                  className={selectClassName}
                >
                  <option value="">Aucun asset Cloudinary lié</option>
                  {mediaAssetOptions.map((asset) => (
                    <option key={asset.id} value={String(asset.id)}>
                      {asset.label}
                    </option>
                  ))}
                </select>
                <Input
                  name="coverImageUrl"
                  placeholder="URL d'image de couverture legacy (optionnel)"
                  defaultValue={editingPost?.coverImageUrl || ""}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    name="location"
                    placeholder="Lieu"
                    defaultValue={editingPost?.location || ""}
                  />
                  <select
                    name="tripId"
                    value={postTripId}
                    onChange={(event) =>
                      syncPostCoordinatesFromTrip(event.target.value)
                    }
                    className={selectClassName}
                  >
                    <option value="">Aucun voyage lié</option>
                    {tripOptions.map((trip) => (
                      <option key={trip.id} value={String(trip.id)}>
                        {trip.label}
                      </option>
                    ))}
                  </select>
                  <select
                    name="countryCode"
                    value={postCountryCode}
                    onChange={(event) => setPostCountryCode(event.target.value)}
                    className={selectClassName}
                  >
                    <option value="">Pays du voyage lié si possible</option>
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {getCountryDisplayName(c.code, c.name)}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-sm text-muted-foreground">
                  Latitude et longitude se préremplissent depuis le voyage lié
                  quand il est sélectionné, puis restent modifiables
                  manuellement.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    name="latitude"
                    type="number"
                    step="any"
                    placeholder="Latitude"
                    value={postLatitude}
                    onChange={(event) => setPostLatitude(event.target.value)}
                  />
                  <Input
                    name="longitude"
                    type="number"
                    step="any"
                    placeholder="Longitude"
                    value={postLongitude}
                    onChange={(event) => setPostLongitude(event.target.value)}
                  />
                </div>
                <Input
                  name="publishedAt"
                  type="date"
                  placeholder="Date de publication"
                  defaultValue={editingPost?.publishedAt ?? ""}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  {editingPost
                    ? "Mettre à jour l'article"
                    : "Publier l'article"}
                </Button>
                {editingPost && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingPost(null);
                      resetPostFormState();
                    }}
                  >
                    Annuler
                  </Button>
                )}
              </div>
            </form>

            <div className="space-y-3">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between p-4 bg-card border rounded-xl hover:border-primary/50 transition-colors"
                >
                  <div>
                    <h4 className="font-serif font-bold">{post.title}</h4>
                    <p className="text-xs text-muted-foreground font-mono">
                      {post.slug}
                    </p>
                    {post.externalUrl && (
                      <p className="text-xs text-muted-foreground">
                        Article externe
                      </p>
                    )}
                    {(post.category || post.tags.length > 0) && (
                      <p className="text-xs text-muted-foreground">
                        {[post.category, ...post.tags]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                    {post.featuredOnHome && (
                      <p className="text-xs text-amber-700">
                        Mis en avant sur la home
                        {post.featuredHomeOrder != null
                          ? ` · ordre ${post.featuredHomeOrder}`
                          : ""}
                      </p>
                    )}
                    {post.coverImage && (
                      <p className="text-xs text-muted-foreground">
                        Asset ID {post.coverImage.id} ·{" "}
                        {post.coverImage.publicId}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className={actionButtonClass}
                      onClick={() => setEditingPost(post)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      className={actionButtonClass}
                      onClick={() => {
                        if (confirm("Supprimer cet article ?")) {
                          deletePost.mutate(
                            { token: adminToken, id: post.id },
                            {
                              onSuccess: () => invalidation.invalidatePosts(),
                            },
                          );
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
              Périple{" "}
              <span className="text-sm font-sans font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {journeys.length}
              </span>
            </h2>

            <form
              key={editingJourney?.id ?? "new-journey"}
              onSubmit={handleJourneySubmit}
              className="bg-card p-6 rounded-2xl border space-y-4 shadow-sm"
            >
              <h3 className="font-serif font-medium text-lg border-b pb-2 mb-4">
                {editingJourney ? "Modifier le Périple" : "Créer un Périple"}
              </h3>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    name="name"
                    placeholder="Nom du Périple"
                    defaultValue={editingJourney?.name}
                    required
                  />
                  <Input
                    name="slug"
                    placeholder="journey-slug"
                    defaultValue={editingJourney?.slug}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    name="startDate"
                    type="date"
                    defaultValue={editingJourney?.startDate ?? ""}
                  />
                  <Input
                    name="endDate"
                    type="date"
                    defaultValue={editingJourney?.endDate ?? ""}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    name="originMode"
                    defaultValue={editingJourney?.originMode ?? "default_nice"}
                    className={cn(
                      "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
                      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    )}
                  >
                    <option value="default_nice">
                      Départ : Nice par défaut
                    </option>
                    <option value="custom">
                      Départ : coordonnées personnalisées
                    </option>
                  </select>
                  <select
                    name="destinationMode"
                    defaultValue={
                      editingJourney?.destinationMode ?? "default_nice"
                    }
                    className={cn(
                      "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
                      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    )}
                  >
                    <option value="default_nice">
                      Retour : Nice par défaut
                    </option>
                    <option value="custom">
                      Retour : coordonnées personnalisées
                    </option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    name="originLatitude"
                    type="number"
                    step="any"
                    placeholder="Latitude départ"
                    defaultValue={editingJourney?.originLatitude ?? ""}
                  />
                  <Input
                    name="originLongitude"
                    type="number"
                    step="any"
                    placeholder="Longitude départ"
                    defaultValue={editingJourney?.originLongitude ?? ""}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    name="destinationLatitude"
                    type="number"
                    step="any"
                    placeholder="Latitude arrivée"
                    defaultValue={editingJourney?.destinationLatitude ?? ""}
                  />
                  <Input
                    name="destinationLongitude"
                    type="number"
                    step="any"
                    placeholder="Longitude arrivée"
                    defaultValue={editingJourney?.destinationLongitude ?? ""}
                  />
                </div>
                <Textarea
                  name="notes"
                  placeholder="Notes optionnelles sur ce Périple multi-pays"
                  defaultValue={editingJourney?.notes ?? ""}
                  className="h-24"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  {editingJourney
                    ? "Mettre à jour le Périple"
                    : "Créer le Périple"}
                </Button>
                {editingJourney && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingJourney(null)}
                  >
                    Annuler
                  </Button>
                )}
              </div>
            </form>

            <div className="space-y-3">
              {journeys.map((journey) => (
                <div
                  key={journey.id}
                  className="flex items-center justify-between p-4 bg-card border rounded-xl hover:border-primary/50 transition-colors"
                >
                  <div>
                    <h4 className="font-serif font-bold">{journey.name}</h4>
                    <p className="text-xs text-muted-foreground font-mono">
                      {journey.slug} · ID Périple {journey.id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {journey.startDate || "Début inconnu"} ·{" "}
                      {journey.endDate || "Fin inconnue"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className={actionButtonClass}
                      onClick={() => setEditingJourney(journey)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      className={actionButtonClass}
                      onClick={() => {
                        if (
                          confirm(
                            "Supprimer ce Périple ? Les voyages redeviendront simplement autonomes.",
                          )
                        ) {
                          deleteJourney.mutate(
                            { token: adminToken, id: journey.id },
                            {
                              onSuccess: () => {
                                queryClient.invalidateQueries({
                                  queryKey: directusQueryKeys.journeys,
                                });
                                queryClient.invalidateQueries({
                                  queryKey: directusQueryKeys.trips,
                                });
                              },
                            },
                          );
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
              Voyages{" "}
              <span className="text-sm font-sans font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {trips.length}
              </span>
            </h2>

            <form
              key={editingTrip ? `trip-${editingTrip.id}` : `trip-new-${tripFormVersion}`}
              onSubmit={handleTripSubmit}
              className="bg-card p-6 rounded-2xl border space-y-4 shadow-sm"
            >
              <h3 className="font-serif font-medium text-lg border-b pb-2 mb-4">
                {editingTrip ? "Modifier le voyage" : "Ajouter un voyage"}
              </h3>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    name="name"
                    placeholder="Nom du voyage"
                    defaultValue={editingTrip?.name}
                    required
                  />
                  <select
                    name="countryCode"
                    defaultValue={editingTrip?.countryCode ?? ""}
                    required
                    className={selectClassName}
                  >
                    <option value="" disabled>
                      Pays
                    </option>
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {getCountryDisplayName(c.code, c.name)}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  name="visitedCities"
                  placeholder="Villes visitées"
                  defaultValue={editingTrip?.visitedCities}
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
                      Périple
                    </label>
                    <select
                      name="journeyId"
                      defaultValue={
                        editingTrip?.journeyId != null
                          ? String(editingTrip.journeyId)
                          : ""
                      }
                      className={cn(
                        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
                        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                      )}
                    >
                      <option value="">Voyage autonome</option>
                      {journeyOptions.map((journey) => (
                        <option key={journey.id} value={String(journey.id)}>
                          {journey.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input
                    name="journeyOrder"
                    type="number"
                    min="1"
                    placeholder="Ordre dans le Périple"
                    defaultValue={editingTrip?.journeyOrder ?? ""}
                  />
                </div>
                <Input
                  name="reasonForVisit"
                  placeholder="Motif du voyage"
                  defaultValue={editingTrip?.reasonForVisit}
                  required
                />
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
                    Raison du voyage
                  </label>
                  <MultiSelectWithCustomOption
                    name="reasonForTravel"
                    options={TRAVEL_REASON_OPTIONS.map((option) => ({
                      value: option.value,
                      label: option.label.fr,
                    }))}
                    defaultValues={editingTrip?.reasonForTravel ?? []}
                    customLabel="Autre raison"
                    customPlaceholder="Saisir une autre raison"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
                    Compagnons de voyage
                  </label>
                  <MultiSelectWithCustomOption
                    name="travelCompanions"
                    options={COMPANION_OPTIONS.map((name) => ({
                      value: name,
                      label: name,
                    }))}
                    defaultValues={editingTrip?.travelCompanions ?? []}
                    customLabel="Autre compagnon"
                    customPlaceholder="Saisir une autre personne"
                  />
                </div>
                <Input
                  name="friendsFamilyMet"
                  placeholder="Amis / famille rencontrés"
                  defaultValue={editingTrip?.friendsFamilyMet}
                  required
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
                      Transport aller
                    </label>
                    <CheckboxGroup
                      name="transportationTo"
                      options={TRANSPORT_OPTIONS.map((option) => ({
                        value: option.value,
                        label: option.label.fr,
                      }))}
                      defaultValues={editingTrip?.transportationTo ?? []}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
                      Transport sur place
                    </label>
                    <CheckboxGroup
                      name="transportationOnSite"
                      options={TRANSPORT_OPTIONS.map((option) => ({
                        value: option.value,
                        label: option.label.fr,
                      }))}
                      defaultValues={editingTrip?.transportationOnSite ?? []}
                    />
                  </div>
                </div>
                <select
                  name="coverImageId"
                  defaultValue={
                    editingTrip?.coverImageId != null
                      ? String(editingTrip.coverImageId)
                      : ""
                  }
                  className={selectClassName}
                >
                  <option value="">Aucune couverture Cloudinary liée</option>
                  {mediaAssetOptions.map((asset) => (
                    <option key={asset.id} value={String(asset.id)}>
                      {asset.label}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    name="latitude"
                    type="number"
                    step="any"
                    placeholder="Latitude (optionnel)"
                    defaultValue={editingTrip?.latitude ?? ""}
                  />
                  <Input
                    name="longitude"
                    type="number"
                    step="any"
                    placeholder="Longitude (optionnel)"
                    defaultValue={editingTrip?.longitude ?? ""}
                  />
                </div>
                <details className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  <summary className="cursor-pointer font-medium text-foreground">
                    Surcharge avancée des coordonnées
                  </summary>
                  <p className="mt-2">
                    La latitude et la longitude sont maintenant calculées
                    automatiquement à partir de la première ville listée, avec
                    le pays du voyage comme contexte. Ces champs restent des
                    surcharges manuelles optionnelles.
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <Input
                      name="latitude"
                      type="number"
                      step="any"
                      placeholder="Surcharge latitude"
                      defaultValue={editingTrip?.latitude ?? ""}
                    />
                    <Input
                      name="longitude"
                      type="number"
                      step="any"
                      placeholder="Surcharge longitude"
                      defaultValue={editingTrip?.longitude ?? ""}
                    />
                  </div>
                </details>
                <Input
                  name="visitedAt"
                  type="date"
                  placeholder="Date de visite"
                  defaultValue={editingTrip?.visitedAt ?? ""}
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  {editingTrip
                    ? "Mettre à jour le voyage"
                    : "Ajouter le voyage"}
                </Button>
                {editingTrip && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingTrip(null)}
                  >
                    Annuler
                  </Button>
                )}
              </div>
            </form>

            <div className="space-y-3">
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  className="flex items-center justify-between p-4 bg-card border rounded-xl hover:border-primary/50 transition-colors"
                >
                  <div>
                    <h4 className="font-serif font-bold flex items-center gap-2">
                      {trip.name}{" "}
                      <span className="text-xs font-mono font-normal text-muted-foreground">
                        {trip.countryCode}
                      </span>
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      ID voyage {trip.id} · {trip.visitedCities}
                    </p>
                    {trip.coverImage && (
                      <p className="text-xs text-muted-foreground">
                        Asset de couverture {trip.coverImage.id} ·{" "}
                        {trip.coverImage.publicId}
                      </p>
                    )}
                    {trip.journeyId != null && (
                      <p className="text-xs text-muted-foreground">
                        Périple :{" "}
                        {journeys.find(
                          (journey) => journey.id === trip.journeyId,
                        )?.name ?? `#${trip.journeyId}`}
                        {trip.journeyOrder != null
                          ? ` · Étape ${trip.journeyOrder}`
                          : ""}
                      </p>
                    )}
                    {(trip.transportationTo || trip.transportationOnSite) && (
                      <p className="text-xs text-muted-foreground">
                        {trip.transportationTo.length > 0
                          ? `Transport aller : ${formatTransportLabels(trip.transportationTo, "fr")}`
                          : "Transport aller : -"}
                        {" · "}
                        {trip.transportationOnSite.length > 0
                          ? `Transport sur place : ${formatTransportLabels(trip.transportationOnSite, "fr")}`
                          : "Transport sur place : -"}
                      </p>
                    )}
                    {trip.reasonForTravel.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Raison du voyage :{" "}
                        {formatTravelReasonLabels(trip.reasonForTravel, "fr")}
                      </p>
                    )}
                    {trip.travelCompanions.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Compagnons : {trip.travelCompanions.join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className={actionButtonClass}
                      onClick={() => setEditingTrip(trip)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      className={actionButtonClass}
                      onClick={() => {
                        if (confirm("Supprimer ce voyage du passeport ?")) {
                          deleteTrip.mutate(
                            { token: adminToken, id: trip.id },
                            {
                              onSuccess: () => invalidation.invalidateTrips(),
                            },
                          );
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="space-y-6">
          <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
            Assets média{" "}
            <span className="text-sm font-sans font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {mediaAssets.length}
            </span>
          </h2>

          <form
            onSubmit={handleCloudinaryUpload}
            className="bg-card p-6 rounded-2xl border space-y-4 shadow-sm"
          >
            <h3 className="font-serif font-medium text-lg border-b pb-2 mb-4">
              Upload direct vers Cloudinary
            </h3>
            <p className="text-sm text-muted-foreground">
              Le fichier part directement du navigateur vers Cloudinary.
              Directus ne stocke ensuite que les métadonnées.
            </p>
            <div className="space-y-3">
              <Input name="file" type="file" accept="image/*" required />
              <select
                name="assetFolder"
                defaultValue={CLOUDINARY_UPLOAD_FOLDERS[0]}
                className={selectClassName}
              >
                {CLOUDINARY_UPLOAD_FOLDERS.map((folder) => (
                  <option key={folder} value={folder}>
                    {folder}
                  </option>
                ))}
              </select>
              <div className="grid md:grid-cols-2 gap-3">
                <Input name="title" placeholder="Titre (optionnel)" />
                <Input
                  name="publicId"
                  placeholder="public_id personnalisé sans extension (optionnel)"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <Input name="alt" placeholder="Texte alternatif (optionnel)" />
                <Input name="caption" placeholder="Légende (optionnel)" />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isUploadingAsset || createMediaAsset.isPending}
            >
              {isUploadingAsset || createMediaAsset.isPending ? (
                <>
                  <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
                  Envoi vers Cloudinary...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4 mr-2" />
                  Envoyer l'image et créer l'asset média
                </>
              )}
            </Button>
          </form>

          <form
            onSubmit={handleMediaAssetSubmit}
            className="bg-card p-6 rounded-2xl border space-y-4 shadow-sm"
          >
            <h3 className="font-serif font-medium text-lg border-b pb-2 mb-4">
              {editingMediaAsset
                ? "Modifier l'asset média"
                : "Ajouter un asset Cloudinary"}
            </h3>
            <div className="space-y-3">
              <Input
                name="publicId"
                placeholder="Cloudinary public_id"
                defaultValue={editingMediaAsset?.publicId}
                required
              />
              <div className="grid md:grid-cols-2 gap-3">
                <Input
                  name="title"
                  placeholder="Titre (optionnel)"
                  defaultValue={editingMediaAsset?.title || ""}
                />
                <Input
                  name="folder"
                  placeholder="Dossier (optionnel)"
                  defaultValue={editingMediaAsset?.folder || ""}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <Input
                  name="alt"
                  placeholder="Texte alternatif (optionnel)"
                  defaultValue={editingMediaAsset?.alt || ""}
                />
                <Input
                  name="caption"
                  placeholder="Légende (optionnel)"
                  defaultValue={editingMediaAsset?.caption || ""}
                />
              </div>
              <Input
                name="deliveryUrl"
                placeholder="Cloudinary secure_url de secours (optionnel)"
                defaultValue={editingMediaAsset?.deliveryUrl || ""}
              />
              <Input
                name="placeholderUrl"
                placeholder="URL de placeholder / blur (optionnel)"
                defaultValue={editingMediaAsset?.placeholderUrl || ""}
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Input
                  name="width"
                  type="number"
                  placeholder="Largeur"
                  defaultValue={editingMediaAsset?.width ?? ""}
                />
                <Input
                  name="height"
                  type="number"
                  placeholder="Hauteur"
                  defaultValue={editingMediaAsset?.height ?? ""}
                />
                <Input
                  name="format"
                  placeholder="Format"
                  defaultValue={editingMediaAsset?.format || ""}
                />
                <Input
                  name="resourceType"
                  placeholder="Type de ressource"
                  defaultValue={editingMediaAsset?.resourceType || ""}
                />
              </div>
              <Input
                name="bytes"
                type="number"
                placeholder="Poids en octets (optionnel)"
                defaultValue={editingMediaAsset?.bytes ?? ""}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                {editingMediaAsset
                  ? "Mettre à jour l'asset"
                  : "Ajouter l'asset"}
              </Button>
              {editingMediaAsset && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingMediaAsset(null)}
                >
                  Annuler
                </Button>
              )}
            </div>
          </form>

          <div className="grid md:grid-cols-2 gap-4">
            {mediaAssets.map((asset) => (
              <div
                key={asset.id}
                className="flex gap-4 p-4 bg-card border rounded-xl"
              >
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted shrink-0">
                  {getMediaAssetImageUrl(asset, {
                    width: 192,
                    height: 192,
                    crop: "fill",
                  }) && (
                    <img
                      src={
                        getMediaAssetImageUrl(asset, {
                          width: 192,
                          height: 192,
                          crop: "fill",
                        }) ?? ""
                      }
                      alt={asset.alt ?? asset.title ?? asset.publicId}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-serif font-bold truncate">
                    {asset.title || asset.publicId}
                  </h4>
                  <p className="text-xs text-muted-foreground font-mono break-all">
                    {asset.publicId}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Asset ID {asset.id}
                    {asset.folder ? ` · ${asset.folder}` : ""}
                  </p>
                  {asset.alt && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {asset.alt}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className={actionButtonClass}
                    onClick={() => setEditingMediaAsset(asset)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    className={actionButtonClass}
                    onClick={() => {
                      if (
                        confirm(
                          "Supprimer cet asset média ? Les contenus liés perdront leur référence.",
                        )
                      ) {
                        deleteMediaAsset.mutate(
                          { token: adminToken, id: asset.id },
                          {
                            onSuccess: () => invalidation.invalidateMedia(),
                          },
                        );
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
            Grille photo{" "}
            <span className="text-sm font-sans font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {photos.length}
            </span>
          </h2>

          <form
            onSubmit={handlePhotoSubmit}
            className="bg-card p-6 rounded-2xl border space-y-4 shadow-sm"
          >
            <h3 className="font-serif font-medium text-lg border-b pb-2 mb-4">
              {editingPhoto ? "Modifier la photo" : "Ajouter une photo"}
            </h3>
            <div className="space-y-3">
              <select
                name="mediaAssetId"
                defaultValue={
                  editingPhoto?.mediaAssetId != null
                    ? String(editingPhoto.mediaAssetId)
                    : ""
                }
                className={selectClassName}
              >
                <option value="">Aucun asset Cloudinary lié</option>
                {mediaAssetOptions.map((asset) => (
                  <option key={asset.id} value={String(asset.id)}>
                    {asset.label}
                  </option>
                ))}
              </select>
              <Input
                name="url"
                placeholder="URL d'image legacy / de secours (optionnel)"
                defaultValue={editingPhoto?.url || ""}
              />
              <Input
                name="caption"
                placeholder="Légende (optionnel)"
                defaultValue={editingPhoto?.caption || ""}
              />
              <Input
                name="link"
                placeholder="URL du lien (optionnel — ex. /posts/mon-article)"
                defaultValue={editingPhoto?.link || ""}
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  name="tripId"
                  defaultValue={
                    editingPhoto?.tripId != null
                      ? String(editingPhoto.tripId)
                      : ""
                  }
                  className={selectClassName}
                >
                  <option value="">Aucun voyage lié</option>
                  {tripOptions.map((trip) => (
                    <option key={trip.id} value={String(trip.id)}>
                      {trip.label}
                    </option>
                  ))}
                </select>
                <select
                  name="countryCode"
                  defaultValue={editingPhoto?.countryCode ?? ""}
                  className={selectClassName}
                >
                  <option value="">Pays du voyage lié si possible</option>
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {getCountryDisplayName(c.code, c.name)}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                name="displayOrder"
                type="number"
                placeholder="Ordre d'affichage (0 = premier)"
                defaultValue={editingPhoto?.displayOrder ?? 0}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                {editingPhoto ? "Mettre à jour la photo" : "Ajouter la photo"}
              </Button>
              {editingPhoto && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingPhoto(null)}
                >
                  Annuler
                </Button>
              )}
            </div>
          </form>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative aspect-square rounded-xl overflow-hidden bg-muted border"
              >
                <img
                  src={
                    getMediaAssetImageUrl(photo.mediaAsset, {
                      width: 400,
                      height: 400,
                      crop: "fill",
                    }) ??
                    photo.url ??
                    ""
                  }
                  alt={photo.mediaAsset?.alt ?? photo.caption ?? ""}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                  <p className="text-white text-xs text-center line-clamp-2">
                    {photo.caption}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-white hover:text-white hover:bg-white/20 active:scale-95 transition-all"
                      onClick={() => setEditingPhoto(photo)}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-7 w-7 active:scale-95 transition-all"
                      onClick={() => {
                        if (confirm("Supprimer cette photo ?")) {
                          deletePhoto.mutate(
                            { token: adminToken, id: photo.id },
                            {
                              onSuccess: () => invalidation.invalidatePhotos(),
                            },
                          );
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}
