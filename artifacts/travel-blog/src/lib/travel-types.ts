export interface GalleryImage {
  url: string;
  caption: string;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImageUrl: string | null;
  gallery: GalleryImage[] | null;
  latitude: number | null;
  longitude: number | null;
  location: string | null;
  tripId: number | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostBody {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImageUrl?: string | null;
  gallery?: GalleryImage[] | null;
  latitude?: number | null;
  longitude?: number | null;
  location?: string | null;
  tripId?: number | null;
  publishedAt?: string | null;
}

export interface UpdatePostBody {
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  coverImageUrl?: string | null;
  gallery?: GalleryImage[] | null;
  latitude?: number | null;
  longitude?: number | null;
  location?: string | null;
  tripId?: number | null;
  publishedAt?: string | null;
}

export interface Trip {
  id: number;
  name: string;
  countryCode: string;
  visitedCities: string;
  reasonForVisit: string;
  travelCompanions: string;
  friendsFamilyMet: string;
  visitedAt: string;
  latitude?: number | null;
  longitude?: number | null;
  transportationTo: string | null;
  transportationOnSite: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTripBody {
  name: string;
  countryCode: string;
  visitedCities: string;
  reasonForVisit: string;
  travelCompanions: string;
  friendsFamilyMet: string;
  visitedAt: string;
  latitude?: number | null;
  longitude?: number | null;
  transportationTo?: string | null;
  transportationOnSite?: string | null;
}

export interface UpdateTripBody {
  name?: string;
  countryCode?: string;
  visitedCities?: string;
  reasonForVisit?: string;
  travelCompanions?: string;
  friendsFamilyMet?: string;
  visitedAt?: string;
  latitude?: number | null;
  longitude?: number | null;
  transportationTo?: string | null;
  transportationOnSite?: string | null;
}

export interface Photo {
  id: number;
  url: string;
  caption: string | null;
  link: string | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePhotoBody {
  url: string;
  caption?: string | null;
  link?: string | null;
  displayOrder?: number;
}

export interface UpdatePhotoBody {
  url?: string;
  caption?: string | null;
  link?: string | null;
  displayOrder?: number;
}

export interface MapPin {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string | null;
  latitude: number;
  longitude: number;
  location: string | null;
  publishedAt: string | null;
}

export interface TravelStats {
  totalTrips: number;
  totalPosts: number;
  totalCities: number;
  continents: number;
}
