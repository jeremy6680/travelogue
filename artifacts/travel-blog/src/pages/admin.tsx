import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const COUNTRY_CODES: { code: string; name: string }[] = [
  { code: "AF", name: "Afghanistan" }, { code: "AL", name: "Albania" }, { code: "DZ", name: "Algeria" },
  { code: "AD", name: "Andorra" }, { code: "AO", name: "Angola" }, { code: "AG", name: "Antigua and Barbuda" },
  { code: "AR", name: "Argentina" }, { code: "AM", name: "Armenia" }, { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" }, { code: "AZ", name: "Azerbaijan" }, { code: "BS", name: "Bahamas" },
  { code: "BH", name: "Bahrain" }, { code: "BD", name: "Bangladesh" }, { code: "BB", name: "Barbados" },
  { code: "BY", name: "Belarus" }, { code: "BE", name: "Belgium" }, { code: "BZ", name: "Belize" },
  { code: "BJ", name: "Benin" }, { code: "BT", name: "Bhutan" }, { code: "BO", name: "Bolivia" },
  { code: "BA", name: "Bosnia and Herzegovina" }, { code: "BW", name: "Botswana" }, { code: "BR", name: "Brazil" },
  { code: "BN", name: "Brunei" }, { code: "BG", name: "Bulgaria" }, { code: "BF", name: "Burkina Faso" },
  { code: "BI", name: "Burundi" }, { code: "CV", name: "Cabo Verde" }, { code: "KH", name: "Cambodia" },
  { code: "CM", name: "Cameroon" }, { code: "CA", name: "Canada" }, { code: "CF", name: "Central African Republic" },
  { code: "TD", name: "Chad" }, { code: "CL", name: "Chile" }, { code: "CN", name: "China" },
  { code: "CO", name: "Colombia" }, { code: "KM", name: "Comoros" }, { code: "CG", name: "Congo" },
  { code: "CD", name: "Congo (DRC)" }, { code: "CR", name: "Costa Rica" }, { code: "HR", name: "Croatia" },
  { code: "CU", name: "Cuba" }, { code: "CY", name: "Cyprus" }, { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" }, { code: "DJ", name: "Djibouti" }, { code: "DM", name: "Dominica" },
  { code: "DO", name: "Dominican Republic" }, { code: "EC", name: "Ecuador" }, { code: "EG", name: "Egypt" },
  { code: "SV", name: "El Salvador" }, { code: "GQ", name: "Equatorial Guinea" }, { code: "ER", name: "Eritrea" },
  { code: "EE", name: "Estonia" }, { code: "SZ", name: "Eswatini" }, { code: "ET", name: "Ethiopia" },
  { code: "FJ", name: "Fiji" }, { code: "FI", name: "Finland" }, { code: "FR", name: "France" },
  { code: "GA", name: "Gabon" }, { code: "GM", name: "Gambia" }, { code: "GE", name: "Georgia" },
  { code: "DE", name: "Germany" }, { code: "GH", name: "Ghana" }, { code: "GR", name: "Greece" },
  { code: "GD", name: "Grenada" }, { code: "GT", name: "Guatemala" }, { code: "GN", name: "Guinea" },
  { code: "GW", name: "Guinea-Bissau" }, { code: "GY", name: "Guyana" }, { code: "HT", name: "Haiti" },
  { code: "HN", name: "Honduras" }, { code: "HU", name: "Hungary" }, { code: "IS", name: "Iceland" },
  { code: "IN", name: "India" }, { code: "ID", name: "Indonesia" }, { code: "IR", name: "Iran" },
  { code: "IQ", name: "Iraq" }, { code: "IE", name: "Ireland" }, { code: "IL", name: "Israel" },
  { code: "IT", name: "Italy" }, { code: "JM", name: "Jamaica" }, { code: "JP", name: "Japan" },
  { code: "JO", name: "Jordan" }, { code: "KZ", name: "Kazakhstan" }, { code: "KE", name: "Kenya" },
  { code: "KI", name: "Kiribati" }, { code: "KP", name: "Korea (North)" }, { code: "KR", name: "Korea (South)" },
  { code: "KW", name: "Kuwait" }, { code: "KG", name: "Kyrgyzstan" }, { code: "LA", name: "Laos" },
  { code: "LV", name: "Latvia" }, { code: "LB", name: "Lebanon" }, { code: "LS", name: "Lesotho" },
  { code: "LR", name: "Liberia" }, { code: "LY", name: "Libya" }, { code: "LI", name: "Liechtenstein" },
  { code: "LT", name: "Lithuania" }, { code: "LU", name: "Luxembourg" }, { code: "MG", name: "Madagascar" },
  { code: "MW", name: "Malawi" }, { code: "MY", name: "Malaysia" }, { code: "MV", name: "Maldives" },
  { code: "ML", name: "Mali" }, { code: "MT", name: "Malta" }, { code: "MH", name: "Marshall Islands" },
  { code: "MR", name: "Mauritania" }, { code: "MU", name: "Mauritius" }, { code: "MX", name: "Mexico" },
  { code: "FM", name: "Micronesia" }, { code: "MD", name: "Moldova" }, { code: "MC", name: "Monaco" },
  { code: "MN", name: "Mongolia" }, { code: "ME", name: "Montenegro" }, { code: "MA", name: "Morocco" },
  { code: "MZ", name: "Mozambique" }, { code: "MM", name: "Myanmar" }, { code: "NA", name: "Namibia" },
  { code: "NR", name: "Nauru" }, { code: "NP", name: "Nepal" }, { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" }, { code: "NI", name: "Nicaragua" }, { code: "NE", name: "Niger" },
  { code: "NG", name: "Nigeria" }, { code: "MK", name: "North Macedonia" }, { code: "NO", name: "Norway" },
  { code: "OM", name: "Oman" }, { code: "PK", name: "Pakistan" }, { code: "PW", name: "Palau" },
  { code: "PA", name: "Panama" }, { code: "PG", name: "Papua New Guinea" }, { code: "PY", name: "Paraguay" },
  { code: "PE", name: "Peru" }, { code: "PH", name: "Philippines" }, { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" }, { code: "QA", name: "Qatar" }, { code: "RO", name: "Romania" },
  { code: "RU", name: "Russia" }, { code: "RW", name: "Rwanda" }, { code: "KN", name: "Saint Kitts and Nevis" },
  { code: "LC", name: "Saint Lucia" }, { code: "VC", name: "Saint Vincent and the Grenadines" },
  { code: "WS", name: "Samoa" }, { code: "SM", name: "San Marino" }, { code: "ST", name: "São Tomé and Príncipe" },
  { code: "SA", name: "Saudi Arabia" }, { code: "SN", name: "Senegal" }, { code: "RS", name: "Serbia" },
  { code: "SC", name: "Seychelles" }, { code: "SL", name: "Sierra Leone" }, { code: "SG", name: "Singapore" },
  { code: "SK", name: "Slovakia" }, { code: "SI", name: "Slovenia" }, { code: "SB", name: "Solomon Islands" },
  { code: "SO", name: "Somalia" }, { code: "ZA", name: "South Africa" }, { code: "SS", name: "South Sudan" },
  { code: "ES", name: "Spain" }, { code: "LK", name: "Sri Lanka" }, { code: "SD", name: "Sudan" },
  { code: "SR", name: "Suriname" }, { code: "SE", name: "Sweden" }, { code: "CH", name: "Switzerland" },
  { code: "SY", name: "Syria" }, { code: "TW", name: "Taiwan" }, { code: "TJ", name: "Tajikistan" },
  { code: "TZ", name: "Tanzania" }, { code: "TH", name: "Thailand" }, { code: "TL", name: "Timor-Leste" },
  { code: "TG", name: "Togo" }, { code: "TO", name: "Tonga" }, { code: "TT", name: "Trinidad and Tobago" },
  { code: "TN", name: "Tunisia" }, { code: "TR", name: "Turkey" }, { code: "TM", name: "Turkmenistan" },
  { code: "TV", name: "Tuvalu" }, { code: "UG", name: "Uganda" }, { code: "UA", name: "Ukraine" },
  { code: "AE", name: "United Arab Emirates" }, { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" }, { code: "UY", name: "Uruguay" }, { code: "UZ", name: "Uzbekistan" },
  { code: "VU", name: "Vanuatu" }, { code: "VE", name: "Venezuela" }, { code: "VN", name: "Vietnam" },
  { code: "YE", name: "Yemen" }, { code: "ZM", name: "Zambia" }, { code: "ZW", name: "Zimbabwe" },
];
import { Layout } from "@/components/layout";
import {
  directusQueryKeys,
  useCreatePhotoMutation,
  useCreatePostMutation,
  useCreateTripMutation,
  useDeletePhotoMutation,
  useDeletePostMutation,
  useDeleteTripMutation,
  useDirectusHealthQuery,
  usePhotosQuery,
  usePostsQuery,
  useTripsQuery,
  useUpdatePhotoMutation,
  useUpdatePostMutation,
  useUpdateTripMutation,
} from "@/lib/directus";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit2, CheckCircle2, XCircle } from "lucide-react";

const actionButtonClass =
  "transition-all hover:scale-105 hover:bg-muted active:scale-95 active:opacity-80";

export default function AdminPage() {
  const [adminToken, setAdminToken] = useState(() =>
    typeof window === "undefined"
      ? ""
      : window.sessionStorage.getItem("travelogue_admin_api_token") ?? "",
  );
  const { data: posts = [] } = usePostsQuery();
  const { data: trips = [] } = useTripsQuery();
  const { data: photos = [] } = usePhotosQuery();
  const { data: health } = useDirectusHealthQuery();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createPost = useCreatePostMutation();
  const updatePost = useUpdatePostMutation();
  const deletePost = useDeletePostMutation();

  const createTrip = useCreateTripMutation();
  const updateTrip = useUpdateTripMutation();
  const deleteTrip = useDeleteTripMutation();

  const createPhoto = useCreatePhotoMutation();
  const updatePhoto = useUpdatePhotoMutation();
  const deletePhoto = useDeletePhotoMutation();

  const [editingPost, setEditingPost] = useState<any>(null);
  const [editingTrip, setEditingTrip] = useState<any>(null);
  const [editingPhoto, setEditingPhoto] = useState<any>(null);
  const [postTripId, setPostTripId] = useState("");
  const [postCountryCode, setPostCountryCode] = useState("");
  const [postLatitude, setPostLatitude] = useState("");
  const [postLongitude, setPostLongitude] = useState("");
  const isUnlocked = adminToken.trim().length > 0;
  const tripOptions = useMemo(
    () =>
      [...trips].sort((a, b) => a.name.localeCompare(b.name, "en")).map((trip) => ({
        id: trip.id,
        label: `${trip.name}, ${trip.countryCode}, Trip ID ${trip.id}`,
      })),
    [trips],
  );
  const findTripById = (value: FormDataEntryValue | null) => {
    const tripId = value ? Number(value) : null;
    return tripId != null ? trips.find((trip) => trip.id === tripId) ?? null : null;
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

    const linkedTrip = trips.find((trip) => trip.id === Number(tripIdValue)) ?? null;
    if (!linkedTrip) {
      return;
    }

    setPostLatitude(linkedTrip.latitude != null ? String(linkedTrip.latitude) : "");
    setPostLongitude(linkedTrip.longitude != null ? String(linkedTrip.longitude) : "");
    setPostCountryCode(linkedTrip.countryCode ?? "");
  };

  useEffect(() => {
    if (!editingPost) {
      resetPostFormState();
      return;
    }

    setPostTripId(editingPost.tripId != null ? String(editingPost.tripId) : "");
    setPostCountryCode(editingPost.countryCode ?? "");
    setPostLatitude(editingPost.latitude != null ? String(editingPost.latitude) : "");
    setPostLongitude(editingPost.longitude != null ? String(editingPost.longitude) : "");
  }, [editingPost]);

  const handleUnlock = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const token = String(formData.get("adminToken") ?? "").trim();
    if (!token) return;
    window.sessionStorage.setItem("travelogue_admin_api_token", token);
    setAdminToken(token);
    toast({ title: "Admin unlocked for this session" });
  };

  const handleLock = () => {
    window.sessionStorage.removeItem("travelogue_admin_api_token");
    setAdminToken("");
    toast({ title: "Admin locked" });
  };

  if (!isUnlocked) {
    return (
      <Layout>
        <div className="max-w-md mx-auto pt-16">
          <div className="bg-card p-6 rounded-2xl border space-y-4 shadow-sm">
            <div className="space-y-2">
              <h1 className="text-3xl font-serif font-bold text-foreground">Unlock Admin</h1>
              <p className="text-sm text-muted-foreground">
                Enter your admin API token. It will be stored only in this browser session.
              </p>
            </div>
            <form onSubmit={handleUnlock} className="space-y-4">
              <Input
                name="adminToken"
                type="password"
                placeholder="Admin API token"
                autoComplete="current-password"
                required
              />
              <Button type="submit" className="w-full">
                Unlock admin
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
      content: formData.get("content") as string,
      excerpt: formData.get("excerpt") as string,
      coverImageUrl: (formData.get("coverImageUrl") as string) || null,
      location: (formData.get("location") as string) || null,
      tripId: formData.get("tripId") ? Number(formData.get("tripId")) : null,
      countryCode: (formData.get("countryCode") as string) || linkedTrip?.countryCode || null,
      latitude: latitudeInput ? Number(latitudeInput) : (linkedTrip?.latitude ?? null),
      longitude: longitudeInput ? Number(longitudeInput) : (linkedTrip?.longitude ?? null),
      publishedAt: (formData.get("publishedAt") as string) || null,
    };

    if (editingPost) {
      updatePost.mutate({ token: adminToken, id: editingPost.id, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: directusQueryKeys.posts });
          queryClient.invalidateQueries({ queryKey: directusQueryKeys.mapPins });
          queryClient.invalidateQueries({ queryKey: directusQueryKeys.stats });
          setEditingPost(null);
          resetPostFormState();
          toast({ title: "Post updated successfully" });
        }
      });
    } else {
      createPost.mutate({ token: adminToken, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: directusQueryKeys.posts });
          queryClient.invalidateQueries({ queryKey: directusQueryKeys.mapPins });
          queryClient.invalidateQueries({ queryKey: directusQueryKeys.stats });
          toast({ title: "Post created successfully" });
          resetPostFormState();
          (e.target as HTMLFormElement).reset();
        }
      });
    }
  };

  const handleTripSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const latitudeInput = formData.get("latitude") as string;
    const longitudeInput = formData.get("longitude") as string;
    const data = {
      name: formData.get("name") as string,
      countryCode: formData.get("countryCode") as string,
      visitedCities: formData.get("visitedCities") as string,
      reasonForVisit: formData.get("reasonForVisit") as string,
      travelCompanions: formData.get("travelCompanions") as string,
      friendsFamilyMet: formData.get("friendsFamilyMet") as string,
      visitedAt: formData.get("visitedAt") as string,
      latitude: latitudeInput ? Number(latitudeInput) : undefined,
      longitude: longitudeInput ? Number(longitudeInput) : undefined,
      transportationTo: (formData.get("transportationTo") as string) || undefined,
      transportationOnSite: (formData.get("transportationOnSite") as string) || undefined,
    };

    if (editingTrip) {
      updateTrip.mutate({ token: adminToken, id: editingTrip.id, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: directusQueryKeys.trips });
          queryClient.invalidateQueries({ queryKey: directusQueryKeys.stats });
          setEditingTrip(null);
          toast({ title: "Trip updated successfully" });
        }
      });
    } else {
      createTrip.mutate({ token: adminToken, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: directusQueryKeys.trips });
          queryClient.invalidateQueries({ queryKey: directusQueryKeys.stats });
          toast({ title: "Trip added successfully" });
          (e.target as HTMLFormElement).reset();
        }
      });
    }
  };

  const handlePhotoSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const linkedTrip = findTripById(formData.get("tripId"));
    const data = {
      url: formData.get("url") as string,
      caption: (formData.get("caption") as string) || null,
      link: (formData.get("link") as string) || null,
      tripId: formData.get("tripId") ? Number(formData.get("tripId")) : null,
      countryCode: (formData.get("countryCode") as string) || linkedTrip?.countryCode || null,
      displayOrder: formData.get("displayOrder") ? Number(formData.get("displayOrder")) : 0,
    };

    if (editingPhoto) {
      updatePhoto.mutate({ token: adminToken, id: editingPhoto.id, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: directusQueryKeys.photos });
          setEditingPhoto(null);
          toast({ title: "Photo updated successfully" });
        }
      });
    } else {
      createPhoto.mutate({ token: adminToken, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: directusQueryKeys.photos });
          toast({ title: "Photo added successfully" });
          (e.target as HTMLFormElement).reset();
        }
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-12 max-w-5xl mx-auto">
        <header className="border-b pb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif font-bold text-foreground">Admin Journal</h1>
            <p className="text-muted-foreground mt-2 font-serif italic">Manage your dispatches and map pins.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-mono border rounded-full px-4 py-1.5 bg-card">
              Server Status: 
              {health?.status === 'ok' ? 
                <CheckCircle2 className="w-4 h-4 text-green-500" /> : 
                <XCircle className="w-4 h-4 text-red-500" />
              }
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleLock}>
              Lock
            </Button>
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Posts Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
              Dispatches <span className="text-sm font-sans font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{posts.length}</span>
            </h2>
            
            <form onSubmit={handlePostSubmit} className="bg-card p-6 rounded-2xl border space-y-4 shadow-sm">
              <h3 className="font-serif font-medium text-lg border-b pb-2 mb-4">{editingPost ? 'Edit Dispatch' : 'New Dispatch'}</h3>
              
              <div className="space-y-3">
                <Input name="title" placeholder="Title" defaultValue={editingPost?.title} required />
                <Input name="slug" placeholder="Slug (e.g. tokyo-nights)" defaultValue={editingPost?.slug} required />
                <Textarea name="excerpt" placeholder="Brief excerpt..." defaultValue={editingPost?.excerpt} required className="h-20" />
                <Textarea name="content" placeholder="Full story content..." defaultValue={editingPost?.content} required className="h-40" />
                <Input name="coverImageUrl" placeholder="Cover Image URL (optional)" defaultValue={editingPost?.coverImageUrl || ''} />
                <div className="grid grid-cols-2 gap-3">
                  <Input name="location" placeholder="Location string" defaultValue={editingPost?.location || ''} />
                  <select
                    name="tripId"
                    value={postTripId}
                    onChange={(event) => syncPostCoordinatesFromTrip(event.target.value)}
                    className={cn(
                      "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
                      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                      "disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                  >
                    <option value="">No linked trip</option>
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
                    className={cn(
                      "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
                      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                      "disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                  >
                    <option value="">Country from linked trip if possible</option>
                    {COUNTRY_CODES.map(c => (
                      <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                    ))}
                  </select>
                </div>
                <p className="text-sm text-muted-foreground">
                  Latitude et longitude se préremplissent depuis le voyage lié quand il est sélectionné, puis restent modifiables manuellement.
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
                <Input name="publishedAt" type="date" placeholder="Published At" defaultValue={editingPost?.publishedAt ?? ''} />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  {editingPost ? 'Update Dispatch' : 'Publish Dispatch'}
                </Button>
                {editingPost && (
                  <Button type="button" variant="outline" onClick={() => setEditingPost(null)}>Cancel</Button>
                )}
              </div>
            </form>

            <div className="space-y-3">
              {posts.map(post => (
                <div key={post.id} className="flex items-center justify-between p-4 bg-card border rounded-xl hover:border-primary/50 transition-colors">
                  <div>
                    <h4 className="font-serif font-bold">{post.title}</h4>
                    <p className="text-xs text-muted-foreground font-mono">{post.slug}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" className={actionButtonClass} onClick={() => setEditingPost(post)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="destructive" className={actionButtonClass} onClick={() => {
                      if(confirm("Delete this dispatch?")) {
                        deletePost.mutate({ token: adminToken, id: post.id }, {
                          onSuccess: () => {
                            queryClient.invalidateQueries({ queryKey: directusQueryKeys.posts });
                            queryClient.invalidateQueries({ queryKey: directusQueryKeys.mapPins });
                            queryClient.invalidateQueries({ queryKey: directusQueryKeys.stats });
                          }
                        });
                      }
                    }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Trips Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
              Trips <span className="text-sm font-sans font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{trips.length}</span>
            </h2>

            <form onSubmit={handleTripSubmit} className="bg-card p-6 rounded-2xl border space-y-4 shadow-sm">
              <h3 className="font-serif font-medium text-lg border-b pb-2 mb-4">{editingTrip ? 'Edit Trip' : 'Log New Trip'}</h3>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input name="name" placeholder="Trip Name" defaultValue={editingTrip?.name} required />
                  <select
                    name="countryCode"
                    defaultValue={editingTrip?.countryCode ?? ""}
                    required
                    className={cn(
                      "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
                      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                      "disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                  >
                    <option value="" disabled>Country</option>
                    {COUNTRY_CODES.map(c => (
                      <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                    ))}
                  </select>
                </div>
                <Input name="visitedCities" placeholder="Visited Cities" defaultValue={editingTrip?.visitedCities} required />
                <Input name="reasonForVisit" placeholder="Reason for Visit" defaultValue={editingTrip?.reasonForVisit} required />
                <Input name="travelCompanions" placeholder="Travel Companions" defaultValue={editingTrip?.travelCompanions} required />
                <Input name="friendsFamilyMet" placeholder="Friends/Family Met" defaultValue={editingTrip?.friendsFamilyMet} required />
                <div className="grid grid-cols-2 gap-3">
                  <Input name="transportationTo" placeholder="Getting There (optional)" defaultValue={editingTrip?.transportationTo || ''} />
                  <Input name="transportationOnSite" placeholder="Getting Around (optional)" defaultValue={editingTrip?.transportationOnSite || ''} />
                </div>
                <details className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  <summary className="cursor-pointer font-medium text-foreground">Advanced coordinates override</summary>
                  <p className="mt-2">
                    The schema now treats coordinates as secondary metadata. Automatic geocoding from the first listed city is not wired yet, so these fields remain optional overrides.
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <Input name="latitude" type="number" step="any" placeholder="Latitude override" defaultValue={editingTrip?.latitude ?? ''} />
                    <Input name="longitude" type="number" step="any" placeholder="Longitude override" defaultValue={editingTrip?.longitude ?? ''} />
                  </div>
                </details>
                <Input name="visitedAt" type="date" placeholder="Visited At" defaultValue={editingTrip?.visitedAt ?? ''} required />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  {editingTrip ? 'Update Trip' : 'Log Trip'}
                </Button>
                {editingTrip && (
                  <Button type="button" variant="outline" onClick={() => setEditingTrip(null)}>Cancel</Button>
                )}
              </div>
            </form>

            <div className="space-y-3">
              {trips.map(trip => (
                <div key={trip.id} className="flex items-center justify-between p-4 bg-card border rounded-xl hover:border-primary/50 transition-colors">
                  <div>
                    <h4 className="font-serif font-bold flex items-center gap-2">
                      {trip.name} <span className="text-xs font-mono font-normal text-muted-foreground">{trip.countryCode}</span>
                    </h4>
                    <p className="text-xs text-muted-foreground">Trip ID {trip.id} · {trip.visitedCities}</p>
                    {(trip.transportationTo || trip.transportationOnSite) && (
                      <p className="text-xs text-muted-foreground">
                        {trip.transportationTo ? `Getting There: ${trip.transportationTo}` : "Getting There: -"}
                        {" · "}
                        {trip.transportationOnSite ? `Getting Around: ${trip.transportationOnSite}` : "Getting Around: -"}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" className={actionButtonClass} onClick={() => setEditingTrip(trip)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="destructive" className={actionButtonClass} onClick={() => {
                      if(confirm("Remove this trip from passport?")) {
                        deleteTrip.mutate({ token: adminToken, id: trip.id }, {
                          onSuccess: () => {
                            queryClient.invalidateQueries({ queryKey: directusQueryKeys.trips });
                            queryClient.invalidateQueries({ queryKey: directusQueryKeys.stats });
                          }
                        });
                      }
                    }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Photos Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
            Photo Grid <span className="text-sm font-sans font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{photos.length}</span>
          </h2>

          <form onSubmit={handlePhotoSubmit} className="bg-card p-6 rounded-2xl border space-y-4 shadow-sm">
            <h3 className="font-serif font-medium text-lg border-b pb-2 mb-4">{editingPhoto ? 'Edit Photo' : 'Add Photo'}</h3>
            <div className="space-y-3">
              <Input name="url" placeholder="Image URL" defaultValue={editingPhoto?.url} required />
              <Input name="caption" placeholder="Caption (optional)" defaultValue={editingPhoto?.caption || ''} />
              <Input name="link" placeholder="Link URL (optional — e.g. /posts/my-post)" defaultValue={editingPhoto?.link || ''} />
              <div className="grid grid-cols-2 gap-3">
                <select
                  name="tripId"
                  defaultValue={editingPhoto?.tripId != null ? String(editingPhoto.tripId) : ""}
                  className={cn(
                    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    "disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                >
                  <option value="">No linked trip</option>
                  {tripOptions.map((trip) => (
                    <option key={trip.id} value={String(trip.id)}>
                      {trip.label}
                    </option>
                  ))}
                </select>
                <select
                  name="countryCode"
                  defaultValue={editingPhoto?.countryCode ?? ""}
                  className={cn(
                    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    "disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                >
                  <option value="">Country from linked trip if possible</option>
                  {COUNTRY_CODES.map(c => (
                    <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                  ))}
                </select>
              </div>
              <Input name="displayOrder" type="number" placeholder="Display order (0 = first)" defaultValue={editingPhoto?.displayOrder ?? 0} />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">{editingPhoto ? 'Update Photo' : 'Add Photo'}</Button>
              {editingPhoto && (
                <Button type="button" variant="outline" onClick={() => setEditingPhoto(null)}>Cancel</Button>
              )}
            </div>
          </form>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {photos.map(photo => (
              <div key={photo.id} className="group relative aspect-square rounded-xl overflow-hidden bg-muted border">
                <img src={photo.url} alt={photo.caption ?? ''} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                  <p className="text-white text-xs text-center line-clamp-2">{photo.caption}</p>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-white hover:text-white hover:bg-white/20 active:scale-95 transition-all" onClick={() => setEditingPhoto(photo)}>
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="destructive" className="h-7 w-7 active:scale-95 transition-all" onClick={() => {
                      if (confirm("Delete this photo?")) {
                        deletePhoto.mutate({ token: adminToken, id: photo.id }, {
                          onSuccess: () => queryClient.invalidateQueries({ queryKey: directusQueryKeys.photos })
                        });
                      }
                    }}>
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
