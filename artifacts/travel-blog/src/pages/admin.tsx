import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { 
  useListPosts, useCreatePost, useUpdatePost, useDeletePost,
  useListTrips, useCreateTrip, useUpdateTrip, useDeleteTrip,
  getListPostsQueryKey, getListTripsQueryKey,
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
  const { data: health } = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey() } });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();

  const createTrip = useCreateTrip();
  const updateTrip = useUpdateTrip();
  const deleteTrip = useDeleteTrip();

  const [editingPost, setEditingPost] = useState<any>(null);
  const [editingTrip, setEditingTrip] = useState<any>(null);

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
                  <Input name="countryCode" placeholder="Code (e.g. JP)" defaultValue={editingTrip?.countryCode} required maxLength={2} />
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
      </div>
    </Layout>
  );
}
