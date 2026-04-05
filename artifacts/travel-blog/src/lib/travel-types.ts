export interface MediaAsset {
  id: number;
  title: string | null;
  publicId: string;
  deliveryUrl: string | null;
  width: number | null;
  height: number | null;
  format: string | null;
  resourceType: string | null;
  bytes: number | null;
  alt: string | null;
  caption: string | null;
  folder: string | null;
  placeholderUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryImage {
  assetId?: number | null;
  publicId?: string | null;
  url: string | null;
  alt?: string | null;
  caption: string;
  width?: number | null;
  height?: number | null;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string;
  externalUrl: string | null;
  coverImageUrl: string | null;
  coverImage: MediaAsset | null;
  gallery: GalleryImage[] | null;
  latitude: number | null;
  longitude: number | null;
  location: string | null;
  tripId: number | null;
  countryCode: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostBody {
  title: string;
  slug: string;
  content?: string | null;
  excerpt: string;
  externalUrl?: string | null;
  coverImageId?: number | null;
  coverImageUrl?: string | null;
  gallery?: GalleryImage[] | null;
  latitude?: number | null;
  longitude?: number | null;
  location?: string | null;
  tripId?: number | null;
  countryCode?: string | null;
  publishedAt?: string | null;
}

export interface UpdatePostBody {
  title?: string;
  slug?: string;
  content?: string | null;
  excerpt?: string;
  externalUrl?: string | null;
  coverImageId?: number | null;
  coverImageUrl?: string | null;
  gallery?: GalleryImage[] | null;
  latitude?: number | null;
  longitude?: number | null;
  location?: string | null;
  tripId?: number | null;
  countryCode?: string | null;
  publishedAt?: string | null;
}

export interface Trip {
  id: number;
  name: string;
  countryCode: string;
  visitedCities: string;
  accomodation: string[];
  reasonForVisit: string;
  reasonForTravel: string[];
  travelCompanions: string[];
  friendsFamilyMet: string;
  visitedAt: string;
  visitedUntil: string | null;
  latitude?: number | null;
  longitude?: number | null;
  coverImageId: number | null;
  coverImage: MediaAsset | null;
  journeyId: number | null;
  journeyOrder: number | null;
  transportationTo: string[];
  transportationOnSite: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTripBody {
  name: string;
  countryCode: string;
  visitedCities: string;
  accomodation?: string[] | null;
  reasonForVisit: string;
  reasonForTravel?: string[] | string | null;
  travelCompanions?: string[] | string | null;
  friendsFamilyMet: string;
  visitedAt: string;
  visitedUntil?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  coverImageId?: number | null;
  journeyId?: number | null;
  journeyOrder?: number | null;
  transportationTo?: string[] | string | null;
  transportationOnSite?: string[] | string | null;
}

export interface UpdateTripBody {
  name?: string;
  countryCode?: string;
  visitedCities?: string;
  accomodation?: string[] | null;
  reasonForVisit?: string;
  reasonForTravel?: string[] | string | null;
  travelCompanions?: string[] | string | null;
  friendsFamilyMet?: string;
  visitedAt?: string;
  visitedUntil?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  coverImageId?: number | null;
  journeyId?: number | null;
  journeyOrder?: number | null;
  transportationTo?: string[] | string | null;
  transportationOnSite?: string[] | string | null;
}

export interface Journey {
  id: number;
  name: string;
  slug: string;
  startDate: string | null;
  endDate: string | null;
  originMode: "default_nice" | "custom";
  originLatitude: number | null;
  originLongitude: number | null;
  destinationMode: "default_nice" | "custom";
  destinationLatitude: number | null;
  destinationLongitude: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJourneyBody {
  name: string;
  slug: string;
  startDate?: string | null;
  endDate?: string | null;
  originMode?: "default_nice" | "custom";
  originLatitude?: number | null;
  originLongitude?: number | null;
  destinationMode?: "default_nice" | "custom";
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
  notes?: string | null;
}

export interface UpdateJourneyBody {
  name?: string;
  slug?: string;
  startDate?: string | null;
  endDate?: string | null;
  originMode?: "default_nice" | "custom";
  originLatitude?: number | null;
  originLongitude?: number | null;
  destinationMode?: "default_nice" | "custom";
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
  notes?: string | null;
}

export interface Photo {
  id: number;
  url: string | null;
  mediaAssetId: number | null;
  mediaAsset: MediaAsset | null;
  caption: string | null;
  link: string | null;
  tripId: number | null;
  countryCode: string | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePhotoBody {
  url?: string | null;
  mediaAssetId?: number | null;
  caption?: string | null;
  link?: string | null;
  tripId?: number | null;
  countryCode?: string | null;
  displayOrder?: number;
}

export interface UpdatePhotoBody {
  url?: string | null;
  mediaAssetId?: number | null;
  caption?: string | null;
  link?: string | null;
  tripId?: number | null;
  countryCode?: string | null;
  displayOrder?: number;
}

export interface CreateMediaAssetBody {
  title?: string | null;
  publicId: string;
  deliveryUrl?: string | null;
  width?: number | null;
  height?: number | null;
  format?: string | null;
  resourceType?: string | null;
  bytes?: number | null;
  alt?: string | null;
  caption?: string | null;
  folder?: string | null;
  placeholderUrl?: string | null;
}

export interface UpdateMediaAssetBody {
  title?: string | null;
  publicId?: string;
  deliveryUrl?: string | null;
  width?: number | null;
  height?: number | null;
  format?: string | null;
  resourceType?: string | null;
  bytes?: number | null;
  alt?: string | null;
  caption?: string | null;
  folder?: string | null;
  placeholderUrl?: string | null;
}

export interface MapPin {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  externalUrl: string | null;
  coverImageUrl: string | null;
  coverImage: MediaAsset | null;
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
