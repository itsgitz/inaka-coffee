import type {
  StrapiResponse,
  Hero,
  MenuCategory,
  MenuItem,
  WeddingInfo,
  BusinessInfo,
} from '../types/strapi';

const STRAPI_URL = import.meta.env.STRAPI_URL ?? 'http://localhost:1337';
const STRAPI_TOKEN = import.meta.env.STRAPI_TOKEN ?? '';

export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${STRAPI_URL}${url}`;
}

async function fetchAPI<T>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T | null> {
  try {
    const query = new URLSearchParams(params).toString();
    const url = `${STRAPI_URL}/api/${endpoint}${query ? `?${query}` : ''}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${STRAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

export async function getHero(): Promise<Hero> {
  const data = await fetchAPI<StrapiResponse<Hero>>('hero', {
    populate: 'backgroundImage',
  });

  return (
    data?.data ?? {
      id: 0,
      headline: 'A trip for coffee won\'t hurt your feet',
      subheadline: 'Nikmati kopi berkualitas tinggi di tengah suasana alam yang tenang.',
      backgroundImage: null,
    }
  );
}

export async function getMenuCategories(): Promise<MenuCategory[]> {
  const data = await fetchAPI<StrapiResponse<MenuCategory[]>>('menu-categories', {
    sort: 'order:asc',
  });

  return (
    data?.data ?? [
      { id: 1, name: 'Kopi', slug: 'kopi', order: 1 },
      { id: 2, name: 'Non-Kopi', slug: 'non-kopi', order: 2 },
      { id: 3, name: 'Makanan', slug: 'makanan', order: 3 },
    ]
  );
}

export async function getMenuItems(): Promise<MenuItem[]> {
  const data = await fetchAPI<StrapiResponse<MenuItem[]>>('menu-items', {
    populate: 'image,category',
    'pagination[pageSize]': '50',
    'filters[publishedAt][$notNull]': 'true',
  });

  return (
    data?.data ?? [
      {
        id: 1,
        name: 'Americano',
        price: 25000,
        description: 'Espresso dengan air panas, bold dan bersih.',
        image: null,
        category: { id: 1, name: 'Kopi', slug: 'kopi', order: 1 },
      },
      {
        id: 2,
        name: 'Cappuccino',
        price: 30000,
        description: 'Espresso dengan steamed milk dan foam yang lembut.',
        image: null,
        category: { id: 1, name: 'Kopi', slug: 'kopi', order: 1 },
      },
      {
        id: 3,
        name: 'Matcha Latte',
        price: 32000,
        description: 'Matcha premium dengan susu segar yang creamy.',
        image: null,
        category: { id: 2, name: 'Non-Kopi', slug: 'non-kopi', order: 2 },
      },
      {
        id: 4,
        name: 'Croissant',
        price: 20000,
        description: 'Croissant butter fresh-baked, renyah dan lezat.',
        image: null,
        category: { id: 3, name: 'Makanan', slug: 'makanan', order: 3 },
      },
    ]
  );
}

export async function getWeddingInfo(): Promise<WeddingInfo> {
  const data = await fetchAPI<StrapiResponse<WeddingInfo>>('wedding-info', {
    populate: 'facilities,pricelistPdf,galleryImages',
  });

  return (
    data?.data ?? {
      id: 0,
      title: 'Rayakan Momen Istimewa Anda di Inaka Coffee',
      description: null,
      capacity: 200,
      facilities: [
        { name: 'Area Indoor & Outdoor', icon: 'home' },
        { name: 'Sound System', icon: 'music' },
        { name: 'Dekorasi', icon: 'flower' },
        { name: 'Catering', icon: 'utensils' },
        { name: 'Parkir Luas', icon: 'car' },
        { name: 'Photobooth', icon: 'camera' },
      ],
      pricelistPdf: null,
      galleryImages: [],
    }
  );
}

export async function getBusinessInfo(): Promise<BusinessInfo> {
  const data = await fetchAPI<StrapiResponse<BusinessInfo>>('business-info');

  return (
    data?.data ?? {
      id: 0,
      whatsappNumber: '6281234567890',
      whatsappMessage: 'Halo Inaka Coffee, saya ingin reservasi untuk acara pernikahan.',
      mapCoordinates: '-6.200000,106.816666',
      mapEmbedUrl:
        'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.521260322283!2d106.8133!3d-6.2!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwMTInMDAuMCJTIDEwNsKwNDgnNDguMCJF!5e0!3m2!1sen!2sid!4v1234567890',
      ramadanHours: { weekday: '16:00 - 22:00', weekend: '14:00 - 22:00' },
      normalHours: { weekday: '08:00 - 22:00', weekend: '08:00 - 23:00' },
    }
  );
}
