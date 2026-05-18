import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { 
  Settings as SettingsIcon, 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
  Upload,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminSettings = () => {
  const { isAdmin } = useAuth();
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [prospectusUrl, setProspectusUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAdmin) return;
    
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'site');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setHeroImages(data.heroImages || []);
          setProspectusUrl(data.prospectusUrl || '');
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
        setError("Failed to load settings.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [isAdmin]);

  const compressImage = (base64Str: string, maxWidth = 1200, maxHeight = 1200, quality = 0.6): Promise<string> => {
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

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isAdmin) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size too large. Please select an image under 5MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          try {
            setIsUploading(true);
            const compressed = await compressImage(event.target.result as string);
            setHeroImages(prev => [...prev, compressed]);
            setError(null);
          } catch (err) {
            console.error("Image processing failed:", err);
            setError("Failed to process image.");
          } finally {
            setIsUploading(false);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddImageUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageUrl.trim()) return;
    if (!newImageUrl.startsWith('http') && !newImageUrl.startsWith('data:image')) {
      setError("Please enter a valid image URL or data URL");
      return;
    }
    setHeroImages(prev => [...prev, newImageUrl.trim()]);
    setNewImageUrl('');
    setError(null);
  };

  const handleRemoveImage = (index: number) => {
    setHeroImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!isAdmin) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Document total size check (approximate)
      const totalSize = JSON.stringify(heroImages).length;
      if (totalSize > 800000) { // Firestore limit is 1MB, let's play safe at 800KB
        setError("Total image data exceeds limits. Please remove some images or use smaller images.");
        setSaving(false);
        return;
      }

      await setDoc(doc(db, 'settings', 'site'), {
        heroImages,
        prospectusUrl,
        updatedAt: serverTimestamp()
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error saving settings:", err);
      if (err.code === 'resource-exhausted') {
        setError("Daily database limit reached. Cannot save right now.");
      } else {
        setError("Failed to save settings. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="pt-32 pb-20 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center gap-4 mb-8">
          <Link to="/admin" className="p-2 bg-white rounded-xl shadow-sm text-gray-600 hover:text-primary-blue transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-primary-blue">Site <span className="text-primary-orange">Settings</span></h1>
            <p className="text-gray-500">Customize home page content and assets</p>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700">
            <AlertCircle size={20} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-8 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-700">
            <CheckCircle2 size={20} />
            <p className="text-sm font-medium">Settings saved successfully!</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary-blue" size={40} />
          </div>
        ) : (
          <div className="space-y-8">
            <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-primary-blue rounded-xl">
                    <ImageIcon size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Home Page Hero Images</h2>
                </div>
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary-orange text-white rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-100 disabled:opacity-50"
                >
                  {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                  {isUploading ? 'Uploading...' : 'Upload Image'}
                </button>
                <input 
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <AnimatePresence>
                  {heroImages.length === 0 ? (
                    <div className="col-span-full py-20 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center text-gray-400">
                      <ImageIcon size={48} className="mb-4 opacity-20" />
                      <p>No hero images added. Will use school defaults.</p>
                    </div>
                  ) : (
                    heroImages.map((url, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="relative group aspect-video rounded-2xl overflow-hidden border-2 border-gray-100"
                      >
                        <img src={url} alt={`Hero ${idx + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            onClick={() => handleRemoveImage(idx)}
                            className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                        <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-white text-[10px] font-bold">
                          Slide {idx + 1}
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <p className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <Plus size={16} /> Add via Image URL (Alternative)
                </p>
                <form onSubmit={handleAddImageUrl} className="flex gap-3">
                  <input 
                    type="url" 
                    placeholder="Enter image URL..."
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="flex-grow px-4 py-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary-blue transition-all"
                  />
                  <button 
                    type="submit"
                    className="btn-blue !px-6 flex items-center gap-2 whitespace-nowrap"
                  >
                    Add URL
                  </button>
                </form>
              </div>
              <p className="mt-4 text-xs text-gray-400 italic">
                Note: Firestore document size is limited. Avoid adding too many high-resolution images.
              </p>
            </section>

            <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-orange-50 text-primary-orange rounded-xl">
                  <FileText size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">School Prospectus</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">
                    Prospectus PDF URL
                  </label>
                  <div className="flex gap-3">
                    <input 
                      type="url" 
                      placeholder="Enter PDF URL (e.g., Google Drive link, S3, etc.)"
                      value={prospectusUrl}
                      onChange={(e) => setProspectusUrl(e.target.value)}
                      className="flex-grow px-4 py-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary-blue transition-all"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    Provide a direct link to the school prospectus PDF file. This will be used in the Admission page.
                  </p>
                </div>
              </div>
            </section>

            <div className="flex justify-end">
              <button 
                onClick={handleSave}
                disabled={saving || isUploading}
                className="btn-blue !px-10 flex items-center gap-3 shadow-xl shadow-blue-200"
              >
                {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                {saving ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
