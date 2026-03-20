export interface StrapiResponse<T> {
  data: T;
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiMedia {
  id: number;
  url: string;
  alternativeText: string | null;
  width: number;
  height: number;
  formats?: {
    thumbnail?: { url: string };
    small?: { url: string };
    medium?: { url: string };
    large?: { url: string };
  };
}

export interface Hero {
  id: number;
  headline: string;
  subheadline: string;
  backgroundImage: StrapiMedia | null;
}

export interface MenuCategory {
  id: number;
  name: string;
  slug: string;
  order: number;
}

export interface MenuItem {
  id: number;
  name: string;
  price: number;
  description: string | null;
  image: StrapiMedia | null;
  category: MenuCategory | null;
}

export interface WeddingFacility {
  name: string;
  icon: string;
}

export interface WeddingInfo {
  id: number;
  title: string;
  description: unknown;
  capacity: number;
  facilities: WeddingFacility[];
  pricelistPdf: StrapiMedia | null;
  galleryImages: StrapiMedia[];
}

export interface BusinessInfo {
  id: number;
  whatsappNumber: string;
  whatsappMessage: string;
  mapCoordinates: string;
  mapEmbedUrl: string;
  ramadanHours: Record<string, string>;
  normalHours: Record<string, string>;
}
