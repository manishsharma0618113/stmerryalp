import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, X, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

interface GalleryItem {
  id: string;
  url: string;
  title: string;
  category: string;
}

export const AnnualDay = () => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImages = async (forceRefresh = false) => {
      // Try cache first
      const cachedData = localStorage.getItem('st_merry_gallery_prod');
      if (!forceRefresh && cachedData) {
        try {
          const parsed = JSON.parse(cachedData) as GalleryItem[];
          const categoryImages = parsed.filter(img => img.category === 'Annual Day');
          if (categoryImages.length > 0) {
            setImages(categoryImages);
            setLoading(false);
            // Even if we have cache, we might want to check the "freshness" like in Gallery.tsx
            // but for simplicity, we'll just stop here if we have data.
            return;
          }
        } catch (e) {
          console.error("Cache read error:", e);
        }
      }

      try {
        setLoading(true);
        const q = query(
          collection(db, 'gallery'),
          where('category', '==', 'Annual Day'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const fetchedImages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as GalleryItem[];
        setImages(fetchedImages);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching annual day photos:", err);
        if (err.code === 'resource-exhausted') {
          setError("Daily viewing limit reached. Showing saved photos.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  const handleNext = () => {
    if (selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex + 1) % images.length);
    }
  };

  const handlePrev = () => {
    if (selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex - 1 + images.length) % images.length);
    }
  };

  return (
    <div className="pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/gallery" className="inline-flex items-center text-primary-blue hover:text-primary-orange transition-colors mb-8 font-bold">
          <ChevronLeft className="mr-2" /> Back to Gallery
        </Link>
        
        <h1 className="section-title text-center mb-4">Annual Day <span className="text-primary-orange">Celebrations</span></h1>
        <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">A grand showcase of talent, culture, and achievements of our brilliant students.</p>
        
        {error && (
          <div className="mb-8 p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center gap-3 text-orange-700 max-w-xl mx-auto">
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary-blue mb-4" />
            <p className="text-gray-500 font-medium">Loading photos...</p>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No annual day photos found yet.</p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {images.map((img, i) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedImageIndex(i)}
                className="relative group overflow-hidden rounded-2xl break-inside-avoid shadow-lg cursor-pointer"
              >
                <img src={img.url} alt={img.title} className="w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                  <h3 className="text-white font-bold">{img.title}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedImageIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          >
            <button onClick={() => setSelectedImageIndex(null)} className="absolute top-6 right-6 text-white hover:text-primary-orange transition-colors z-50">
              <X size={40} />
            </button>
            <button onClick={handlePrev} className="absolute left-6 text-white hover:text-primary-orange transition-all z-50 bg-white/5 p-2 rounded-full backdrop-blur-sm">
              <ChevronLeft size={48} />
            </button>
            <button onClick={handleNext} className="absolute right-6 text-white hover:text-primary-orange transition-all z-50 bg-white/5 p-2 rounded-full backdrop-blur-sm">
              <ChevronRight size={48} />
            </button>
            <motion.img
              key={selectedImageIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              src={images[selectedImageIndex].url}
              alt={images[selectedImageIndex].title}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
