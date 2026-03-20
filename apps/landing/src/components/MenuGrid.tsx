import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MenuCategory, MenuItem } from '../types/strapi';
import MenuCard from './MenuCard';

interface Props {
  categories: MenuCategory[];
  items: MenuItem[];
}

export default function MenuGrid({ categories, items }: Props) {
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  const filtered =
    activeCategory === null
      ? items
      : items.filter((item) => item.category?.id === activeCategory);

  return (
    <div>
      {/* Category tabs */}
      <div className="flex flex-wrap gap-3 justify-center mb-10">
        <button
          onClick={() => setActiveCategory(null)}
          className="px-5 py-2 rounded-full font-medium text-sm transition-all duration-200"
          style={
            activeCategory === null
              ? { backgroundColor: '#4A5D4E', color: 'white' }
              : { backgroundColor: 'rgba(74,93,78,0.1)', color: '#4A5D4E' }
          }
        >
          Semua
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className="px-5 py-2 rounded-full font-medium text-sm transition-all duration-200"
            style={
              activeCategory === cat.id
                ? { backgroundColor: '#4A5D4E', color: 'white' }
                : { backgroundColor: 'rgba(74,93,78,0.1)', color: '#4A5D4E' }
            }
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Grid */}
      <motion.div
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <MenuCard item={item} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && (
        <p className="text-center py-12" style={{ color: 'rgba(62,39,35,0.5)' }}>
          Tidak ada item dalam kategori ini.
        </p>
      )}
    </div>
  );
}
