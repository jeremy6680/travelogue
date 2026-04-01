import React, { useState } from "react";
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
  useListPosts, useCreatePost, useUpdatePost, useDeletePost,
  useListTrips, useCreateTrip, useUpdateTrip, useDeleteTrip,
  useListPhotos, useCreatePhoto, useUpdatePhoto, useDeletePhoto,
  getListPostsQueryKey, getListTripsQueryKey, getListPhotosQueryKey,
  useHealthCheck, getHealthCheckQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, CheckCircle2, XCircle } from "lucide-react";

export default function AdminPage() {
  const { data: posts = [] } = useListPosts({ query: { queryKey: ["posts"] } });
  const { data: trips = [] } = useListTrips({ query: { queryKey: ["trips"] } });
  const { data: photos = [] } = useListPhotos({ query: { queryKey: ["photos"] } });
  const { data: health } = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey() } });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();

  const createTrip = useCreateTrip();
  const updateTrip = useUpdateTrip();
  const deleteTrip = useDeleteTrip();

  const createPhoto = useCreatePhoto();
  const updatePhoto = useUpdatePhoto();
  const deletePhoto = useDeletePhoto();

  const [editingPost, setEditingPost] = useState<any>(null);
  const [editingTrip, setEditingTrip] = useState<any>(null);
  const [editingPhoto, setEditingPhoto] = useState<any>(null);

  const handlePostSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      slug: formData.get("slug") as string,
      content: formData.get("content") as string,
      excerpt: formData.get("excerpt") as string,
      coverImageUrl: (formData.get("coverImageUrl") as string) || null,
      location: (formData.get("location") as string) || null,
      tripId: formData.get("tripId") ? Number(formData.get("tripId")) : null,
      latitude: formData.get("latitude") ? Number(formData.get("latitude")) : null,
      longitude: formData.get("longitude") ? Number(formData.get("longitude")) : null,
      publishedAt: (formData.get("publishedAt") as string) || null,
    };

    if (editingPost) {
      updatePost.mutate({ id: editingPost.id, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
          setEditingPost(null);
          toast({ title: "Post updated successfully" });
        }
      });
    } else {
      createPost.mutate({ data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
          toast({ title: "Post created successfully" });
          (e.target as HTMLFormElement).reset();
        }
      });
    }
  };

  const handleTripSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      countryCode: formData.get("countryCode") as string,
      visitedCities: formData.get("visitedCities") as string,
      reasonForVisit: formData.get("reasonForVisit") as string,
      travelCompanions: formData.get("travelCompanions") as string,
      friendsFamilyMet: formData.get("friendsFamilyMet") as string,
      visitedAt: formData.get("visitedAt") as string,
      latitude: Number(formData.get("latitude")),
      longitude: Number(formData.get("longitude")),
    };

    if (editingTrip) {
      updateTrip.mutate({ id: editingTrip.id, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTripsQueryKey() });
          setEditingTrip(null);
          toast({ title: "Trip updated successfully" });
        }
      });
    } else {
      createTrip.mutate({ data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTripsQueryKey() });
          toast({ title: "Trip added successfully" });
          (e.target as HTMLFormElement).reset();
        }
      });
    }
  };

  const handlePhotoSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      url: formData.get("url") as string,
      caption: (formData.get("caption") as string) || null,
      link: (formData.get("link") as string) || null,
      displayOrder: formData.get("displayOrder") ? Number(formData.get("displayOrder")) : 0,
    };

    if (editingPhoto) {
      updatePhoto.mutate({ id: editingPhoto.id, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPhotosQueryKey() });
          setEditingPhoto(null);
          toast({ title: "Photo updated successfully" });
        }
      });
    } else {
      createPhoto.mutate({ data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPhotosQueryKey() });
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
          <div className="flex items-center gap-2 text-sm font-mono border rounded-full px-4 py-1.5 bg-card">
            Server Status: 
            {health?.status === 'ok' ? 
              <CheckCircle2 className="w-4 h-4 text-green-500" /> : 
              <XCircle className="w-4 h-4 text-red-500" />
            }
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
                  <Input name="tripId" type="number" placeholder="Trip ID" defaultValue={editingPost?.tripId || ''} />
                  <Input name="latitude" type="number" step="any" placeholder="Latitude" defaultValue={editingPost?.latitude || ''} />
                  <Input name="longitude" type="number" step="any" placeholder="Longitude" defaultValue={editingPost?.longitude || ''} />
                </div>
                <Input name="publishedAt" type="datetime-local" placeholder="Published At" defaultValue={editingPost?.publishedAt ? new Date(editingPost.publishedAt).toISOString().slice(0, 16) : ''} />
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
                    <Button size="icon" variant="ghost" onClick={() => setEditingPost(post)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="destructive" onClick={() => {
                      if(confirm("Delete this dispatch?")) {
                        deletePost.mutate({ id: post.id }, {
                          onSuccess: () => queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() })
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
                  <Input name="latitude" type="number" step="any" placeholder="Latitude" defaultValue={editingTrip?.latitude} required />
                  <Input name="longitude" type="number" step="any" placeholder="Longitude" defaultValue={editingTrip?.longitude} required />
                </div>
                <Input name="visitedAt" type="datetime-local" placeholder="Visited At" defaultValue={editingTrip?.visitedAt ? new Date(editingTrip.visitedAt).toISOString().slice(0, 16) : ''} required />
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
                    <p className="text-xs text-muted-foreground">{trip.visitedCities}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => setEditingTrip(trip)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="destructive" onClick={() => {
                      if(confirm("Remove this trip from passport?")) {
                        deleteTrip.mutate({ id: trip.id }, {
                          onSuccess: () => queryClient.invalidateQueries({ queryKey: getListTripsQueryKey() })
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
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-white hover:text-white hover:bg-white/20" onClick={() => setEditingPhoto(photo)}>
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => {
                      if (confirm("Delete this photo?")) {
                        deletePhoto.mutate({ id: photo.id }, {
                          onSuccess: () => queryClient.invalidateQueries({ queryKey: getListPhotosQueryKey() })
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
