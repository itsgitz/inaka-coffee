import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface Props {
  whatsappNumber: string;
}

export default function ReservationModal({ whatsappNumber }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ name: '', date: '', guests: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const buildMessage = () => {
    const lines = [
      'Halo Inaka Coffee, saya ingin menanyakan tentang venue pernikahan.',
      `Nama: ${form.name}`,
      `Tanggal Acara: ${form.date}`,
      `Jumlah Tamu: ${form.guests} orang`,
    ];
    return encodeURIComponent(lines.join('\n'));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.open(`https://wa.me/${whatsappNumber}?text=${buildMessage()}`, '_blank');
    setIsOpen(false);
    setForm({ name: '', date: '', guests: '' });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white transition-all duration-300 hover:scale-105"
        style={{ backgroundColor: '#4A5D4E' }}
      >
        Reservasi Sekarang
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
            onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
              style={{ backgroundColor: '#FFF8E1' }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3
                  className="text-xl font-bold"
                  style={{ color: '#3E2723', fontFamily: 'var(--font-serif)' }}
                >
                  Reservasi Wedding
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-full hover:bg-black/10 transition-colors"
                  style={{ color: '#3E2723' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#3E2723' }}>
                    Nama
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Nama Anda"
                    className="w-full px-4 py-2.5 rounded-xl outline-none focus:ring-2 text-sm"
                    style={{
                      backgroundColor: 'white',
                      border: '1px solid rgba(62,39,35,0.2)',
                      color: '#3E2723',
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#3E2723' }}>
                    Tanggal Acara
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 rounded-xl outline-none focus:ring-2 text-sm"
                    style={{
                      backgroundColor: 'white',
                      border: '1px solid rgba(62,39,35,0.2)',
                      color: '#3E2723',
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#3E2723' }}>
                    Jumlah Tamu
                  </label>
                  <input
                    type="number"
                    name="guests"
                    value={form.guests}
                    onChange={handleChange}
                    required
                    min="1"
                    placeholder="Estimasi jumlah tamu"
                    className="w-full px-4 py-2.5 rounded-xl outline-none focus:ring-2 text-sm"
                    style={{
                      backgroundColor: 'white',
                      border: '1px solid rgba(62,39,35,0.2)',
                      color: '#3E2723',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 hover:opacity-90 mt-2 flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#4A5D4E' }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Kirim via WhatsApp
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
