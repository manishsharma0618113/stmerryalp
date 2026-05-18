import { motion, AnimatePresence } from 'motion/react';
import { useState, useRef, ChangeEvent, MouseEvent, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Camera, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

interface GalleryItem {
  id: string;
  url: string;
  title: string;
  category: string;
  createdAt?: any;
}

export const Gallery = () => {
  const [galleryImages, setGalleryImages] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newImageCategory, setNewImageCategory] = useState("Annual Day");
  
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addFileInputRef = useRef<HTMLInputElement>(null);
  const { isAdmin } = useAuth();

  const categories = ["All", "Annual Day", "Independence Day", "Science Fair", "Sports Meet", "Result Day", "Group Images", "Teacher's Activity"];

  const fetchGallery = async (forceRefresh = false) => {
    // 1. Try to load from cache first for instant UI response and quota protection
    const cachedData = localStorage.getItem('st_merry_gallery_prod');
    const lastFetch = localStorage.getItem('st_merry_gallery_last_fetch');
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;

    if (!forceRefresh && cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        if (Array.isArray(parsed)) {
          setGalleryImages(parsed);
          setLoading(false);

          // If cache is fresh (less than 1 hour old), skip network request
          if (lastFetch && (now - parseInt(lastFetch)) < ONE_HOUR) {
            console.log('Using fresh gallery cache');
            return;
          }
        }
      } catch (e) {
        console.error("Cache corrupted:", e);
      }
    }

    try {
      if (forceRefresh) setLoading(true);
      const galleryCollection = collection(db, 'gallery');
      const q = query(galleryCollection, orderBy('createdAt', 'desc'));
      
      const snapshot = await getDocs(q);
      const images = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GalleryItem[];
      
      setGalleryImages(images);
      setError(null);
      
      // Update cache with fresh data
      try {
        localStorage.setItem('st_merry_gallery_prod', JSON.stringify(images));
        localStorage.setItem('st_merry_gallery_last_fetch', now.toString());
      } catch (cacheErr) {
        console.warn("Gallery cache quota exceeded, skipping local storage update:", cacheErr);
        // If quota exceeded, we might want to clear old large data to make room, 
        // but for now, just failing silently is safer than crashing.
      }
    } catch (err: any) {
      console.error("Error fetching gallery:", err);
      if (err.code === 'permission-denied') {
        handleFirestoreError(err, OperationType.LIST, 'gallery');
      } else if (err.code === 'resource-exhausted') {
        setError("Daily limit reached. Showing cached photos.");
      } else {
        setError("Failed to load gallery. Using cache.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const filteredImages = activeCategory === "All" 
    ? galleryImages 
    : galleryImages.filter(img => img.category === activeCategory);

  const handleNext = () => {
    if (selectedImageIndex !== null && filteredImages.length > 0) {
      setSelectedImageIndex((selectedImageIndex + 1) % filteredImages.length);
    }
  };

  const handlePrev = () => {
    if (selectedImageIndex !== null && filteredImages.length > 0) {
      setSelectedImageIndex((selectedImageIndex - 1 + filteredImages.length) % filteredImages.length);
    }
  };

  const triggerImageChange = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) return;
    setEditingId(id);
    fileInputRef.current?.click();
  };

  const compressImage = (base64Str: string, maxWidth = 1200, maxHeight = 1200, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    });
  };

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingId && isAdmin) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          try {
            setIsUploading(true);
            // Compress image before upload
            const compressed = await compressImage(event.target.result as string);
            
            const docRef = doc(db, 'gallery', editingId);
            await updateDoc(docRef, {
              url: compressed,
              updatedAt: serverTimestamp()
            });
            await fetchGallery(true);
          } catch (err: any) {
            handleFirestoreError(err, OperationType.UPDATE, `gallery/${editingId}`);
          } finally {
            setIsUploading(false);
          }
        }
      };
      reader.readAsDataURL(file);
    }
    setEditingId(null);
  };

  const handleAddImage = () => {
    if (!isAdmin) return;
    addFileInputRef.current?.click();
  };

  const onNewFileSelected = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isAdmin) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          try {
            setIsUploading(true);
            // New: Show a loading state if possible or just proceed with compression
            const compressed = await compressImage(event.target.result as string);

            await addDoc(collection(db, 'gallery'), {
              url: compressed,
              title: "Event Photo",
              category: newImageCategory === "All" ? "Annual Day" : newImageCategory,
              createdAt: serverTimestamp()
            });
            
            // Force refresh data
            await fetchGallery(true);
          } catch (err: any) {
            handleFirestoreError(err, OperationType.CREATE, 'gallery');
          } finally {
            setIsUploading(false);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteImage = async (id: string, e: MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) return;
    
    setDeletingId(id);
    setConfirmDeleteId(null);

    // Optimistic update: save previous state in case we need to rollback
    const previousImages = [...galleryImages];
    setGalleryImages(prev => prev.filter(img => img.id !== id));

    try {
      await deleteDoc(doc(db, 'gallery', id));
      // Refresh cache
      const updatedImages = galleryImages.filter(img => img.id !== id);
      try {
        localStorage.setItem('st_merry_gallery_prod', JSON.stringify(updatedImages));
      } catch (e) {
        console.warn("Storage quota exceeded during deletion cache update");
      }
      setError(null);
    } catch (err: any) {
      console.error("Deletion failed:", err);
      // Rollback
      setGalleryImages(previousImages);
      
      if (err.code === 'resource-exhausted') {
        setError("Daily database limit reached. Cannot delete right now.");
      } else {
        setError("Failed to delete image. Please check your connection.");
        try {
          handleFirestoreError(err, OperationType.DELETE, `gallery/${id}`);
        } catch (silentErr) {
          // handleFirestoreError throws, but we want to catch it to avoid breaking the UI flow
        }
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h1 className="section-title text-center md:text-left">Photo <span className="text-primary-orange">Gallery</span></h1>
          
          {isAdmin && (
            <div className="flex items-center gap-3">
              <select 
                value={newImageCategory}
                onChange={(e) => setNewImageCategory(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-primary-blue outline-none"
              >
                {categories.filter(c => c !== "All").map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button
                onClick={handleAddImage}
                disabled={isUploading}
                className={`flex items-center gap-2 px-6 py-2 bg-primary-blue text-white rounded-full font-bold hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />} 
                {isUploading ? "Uploading..." : "Add Image"}
              </button>
              <button
                onClick={() => fetchGallery(true)}
                title="Refresh Gallery"
                className="p-2 bg-white border border-gray-200 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <Loader2 size={20} className={loading ? "animate-spin" : ""} />
              </button>
              <input 
                type="file" 
                ref={addFileInputRef}
                className="hidden"
                accept="image/*"
                onChange={onNewFileSelected}
              />
            </div>
          )}
        </div>
        
        {/* Category Filter */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setSelectedImageIndex(null);
                if (cat !== "All") setNewImageCategory(cat);
              }}
              className={`px-5 py-2 rounded-full font-medium transition-all ${
                activeCategory === cat 
                ? "bg-primary-orange text-white shadow-lg scale-105" 
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-10 h-10 animate-spin text-primary-blue mb-4" />
            <p className="font-bold text-lg">Loading gallery...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={onFileChange} 
            />
            {filteredImages.map((img, i) => (
              <motion.div
                key={img.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3 }}
                className="relative aspect-square overflow-hidden rounded-lg cursor-pointer shadow-sm hover:shadow-lg transition-shadow group"
                onClick={() => setSelectedImageIndex(i)}
              >
                <img 
                  src={img.url} 
                  alt={img.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                    <div className="flex gap-2">
                      {isAdmin && (
                        <>
                          <button
                            onClick={(e) => triggerImageChange(img.id, e)}
                            className="p-3 bg-white text-primary-orange rounded-full hover:bg-primary-orange hover:text-white shadow-lg transition-colors"
                            title="Change Image"
                          >
                            <Camera size={20} />
                          </button>
                          {confirmDeleteId === img.id ? (
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => handleDeleteImage(img.id, e)}
                                disabled={deletingId === img.id}
                                className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg transition-colors flex items-center justify-center"
                                title="Confirm Delete"
                              >
                                {deletingId === img.id ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                                className="p-3 bg-white text-gray-600 rounded-full hover:bg-gray-100 shadow-lg transition-colors"
                                title="Cancel"
                              >
                                <X size={20} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(img.id); }}
                              disabled={deletingId !== null}
                              className="p-3 bg-white text-red-600 rounded-full hover:bg-red-600 hover:text-white shadow-lg transition-colors disabled:opacity-50"
                              title="Delete Image"
                            >
                              <Trash2 size={20} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    <p className="text-white text-sm font-bold bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                      {img.title}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        
        {!loading && filteredImages.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No images found in this category.</p>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImageIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 md:p-10"
          >
            <button 
              onClick={() => setSelectedImageIndex(null)}
              className="absolute top-6 right-6 text-white hover:text-primary-orange transition-colors z-50"
            >
              <X size={32} />
            </button>

            <button 
              onClick={handlePrev}
              className="absolute left-4 md:left-10 text-white hover:text-primary-orange transition-colors z-50 p-2"
            >
              <ChevronLeft size={48} />
            </button>

            <button 
              onClick={handleNext}
              className="absolute right-4 md:right-10 text-white hover:text-primary-orange transition-colors z-50 p-2"
            >
              <ChevronRight size={48} />
            </button>

            <motion.img
              key={selectedImageIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              src={filteredImages[selectedImageIndex].url}
              alt={filteredImages[selectedImageIndex].title}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <div className="absolute bottom-10 left-0 right-0 text-center">
              <h3 className="text-white text-xl font-bold">{filteredImages[selectedImageIndex].title}</h3>
              <p className="text-gray-400 text-sm mt-1">{filteredImages[selectedImageIndex].category}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
