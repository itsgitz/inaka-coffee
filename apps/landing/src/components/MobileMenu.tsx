import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const links = [
  { href: '#menu', label: 'Menu' },
  { href: '#wedding', label: 'Wedding' },
  { href: '#contact', label: 'Contact' },
];

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const close = () => setIsOpen(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(true)}
        className="text-white p-2"
        aria-label="Buka menu"
      >
        <Menu size={24} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={close}
            />

            {/* Slide-in panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed top-0 right-0 h-full w-72 z-50 flex flex-col"
              style={{ backgroundColor: '#3E2723' }}
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <span
                  className="text-xl font-bold text-white"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  Inaka Coffee
                </span>
                <button onClick={close} className="text-white/80 hover:text-white p-1">
                  <X size={20} />
                </button>
              </div>

              <nav className="flex flex-col gap-2 p-6">
                {links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={close}
                    className="text-white/85 hover:text-white py-3 text-lg font-medium border-b border-white/10 last:border-0 transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
