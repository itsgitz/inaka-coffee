import type { MenuItem } from '../types/strapi';
import { resolveMediaUrl } from '../lib/strapi';

interface Props {
  item: MenuItem;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
}

export default function MenuCard({ item }: Props) {
  const imageUrl = item.image
    ? resolveMediaUrl(item.image.url)
    : 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80';

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col"
      style={{ backgroundColor: '#FFF8E1', border: '1px solid rgba(74,93,78,0.1)' }}>
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={imageUrl}
          alt={item.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-base leading-tight" style={{ color: '#3E2723', fontFamily: 'var(--font-serif)' }}>
            {item.name}
          </h3>
          {item.category && (
            <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium"
              style={{ backgroundColor: 'rgba(74,93,78,0.12)', color: '#4A5D4E' }}>
              {item.category.name}
            </span>
          )}
        </div>

        {item.description && (
          <p className="text-sm mb-3 leading-relaxed flex-1" style={{ color: 'rgba(62,39,35,0.65)' }}>
            {item.description}
          </p>
        )}

        <p className="font-bold text-lg mt-auto" style={{ color: '#4A5D4E' }}>
          {formatPrice(item.price)}
        </p>
      </div>
    </div>
  );
}
