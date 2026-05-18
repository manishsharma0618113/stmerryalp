import React, { useState, useEffect, ChangeEvent, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ImageIcon, Users, Heart, ArrowRight, Star, Camera, Loader2, RefreshCw, AlertCircle, Instagram, ChevronRight, Bell } from 'lucide-react';
import { 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  orderBy, 
  where,
  updateDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

interface Topper {
  id: string;
  name: string;
  class: string;
  percentage: string;
  image: string;
  order: number;
}

interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'low' | 'medium' | 'high';
  isActive: boolean;
  createdAt: any;
}

const DEFAULT_HERO_IMAGES: string[] = [];

export const Home = () => {
  const { isAdmin } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [toppers, setToppers] = useState<Topper[]>([]);
  const [loadingToppers, setLoadingToppers] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (!isMobile || !scrollContainerRef.current) return;

    const observerOptions = {
      root: scrollContainerRef.current,
      threshold: 0.7,
      rootMargin: '0px -25% 0px -25%' // Focus on the center area
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.getAttribute('data-index') || '-1');
          setActiveIndex(index);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const children = scrollContainerRef.current.querySelectorAll('.topper-card');
    children.forEach(child => observer.observe(child));

    return () => observer.disconnect();
  }, [toppers, loadingToppers]);
  
  useEffect(() => {
    // Listen for site settings changes
    const unsubscribeSite = onSnapshot(doc(db, 'settings', 'site'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().heroImages?.length > 0) {
        setHeroImages(docSnap.data().heroImages);
      } else {
        setHeroImages([]);
      }
    }, (error) => {
      console.error("Error fetching hero images:", error);
    });

    // Listen for toppers
    const q = query(collection(db, 'toppers'), orderBy('order', 'asc'));
    const unsubscribeToppers = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Topper[];
      setToppers(data);
      setLoadingToppers(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'toppers');
      setLoadingToppers(false);
    });

    // Listen for notices
    const noticeQ = query(
      collection(db, 'notices'), 
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    const unsubscribeNotices = onSnapshot(noticeQ, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notice[];
      setNotices(data.slice(0, 3)); // Show top 3 recent notices
    });

    return () => {
      unsubscribeSite();
      unsubscribeToppers();
      unsubscribeNotices();
    };
  }, []);

  useEffect(() => {
    if (heroImages.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroImages]);

  const compressImage = (base64Str: string, maxWidth = 600, maxHeight = 600, quality = 0.7): Promise<string> => {
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

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>, topperId: string) => {
    const file = e.target.files?.[0];
    if (!file || !isAdmin) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image size too large. Please select an image under 2MB.");
      return;
    }

    setUploadingId(topperId);
    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result) {
        try {
          const compressed = await compressImage(event.target.result as string);
          await updateDoc(doc(db, 'toppers', topperId), {
            image: compressed,
            updatedAt: serverTimestamp()
          });
        } catch (err) {
          console.error("Failed to update topper image:", err);
          alert("Failed to update image.");
        } finally {
          setUploadingId(null);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const seedToppers = async () => {
    if (!isAdmin) return;
    setLoadingToppers(true);
    
    const initialToppers = [
      { id: "topper-1", name: "Priya Kumari", class: "X", percentage: "84.20%", image: "https://api.dicebear.com/7.x/initials/svg?seed=PK", order: 1 },
      { id: "topper-2", name: "Sanjana Kumari", class: "X", percentage: "88.80%", image: "https://api.dicebear.com/7.x/initials/svg?seed=SK", order: 2 },
      { id: "topper-3", name: "Ankita Rana", class: "IX", percentage: "88.40%", image: "https://api.dicebear.com/7.x/initials/svg?seed=AR", order: 3 },
      { id: "topper-4", name: "Shiwani Kumari", class: "X", percentage: "87.80%", image: "https://api.dicebear.com/7.x/initials/svg?seed=SK2", order: 4 },
      { id: "topper-5", name: "Priyanka Kumari", class: "VIII", percentage: "85.60%", image: "https://api.dicebear.com/7.x/initials/svg?seed=PK2", order: 5 },
      { id: "topper-6", name: "Sapna Kumari", class: "X", percentage: "85.00%", image: "https://api.dicebear.com/7.x/initials/svg?seed=SK3", order: 6 },
      { id: "topper-7", name: "Akshay Kumar", class: "X", percentage: "82.00%", image: "https://api.dicebear.com/7.x/initials/svg?seed=AK", order: 7 },
    ];

    try {
      for (const t of initialToppers) {
        const { id, ...data } = t;
        await setDoc(doc(db, 'toppers', id), {
          ...data,
          updatedAt: serverTimestamp()
        });
      }
      alert("Toppers data seeded successfully!");
    } catch (err) {
      console.error("Seeding failed:", err);
      alert("Seeding failed.");
    } finally {
      setLoadingToppers(false);
    }
  };

  return (
    <div className="pt-16">
      {/* Registration Banner */}
      <div className="bg-[#ffb900] text-[#b40012] py-3 px-4 sticky top-0 md:top-auto z-40 mt-[10px] overflow-hidden">
        <div className="flex w-max">
          <motion.div 
            animate={{ x: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
            className="flex items-center gap-12 whitespace-nowrap pr-12"
          >
            <div className="flex items-center gap-2 text-sm md:text-base font-bold">
              <span className="animate-pulse bg-white text-primary-green px-2 py-0.5 rounded text-xs uppercase tracking-tighter">New Admission</span>
              Registration open for 2026-27 for class Nur to IX. Apply now!
              <ArrowRight className="w-4 h-4" />
            </div>
            {/* Duplicated for seamless loop */}
            <div className="flex items-center gap-2 text-sm md:text-base font-bold">
              <span className="animate-pulse bg-white text-primary-green px-2 py-0.5 rounded text-xs uppercase tracking-tighter">New Admission</span>
              Registration open for 2026-27 for class Nur to IX. Apply now!
              <ArrowRight className="w-4 h-4" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative h-[95vh] md:h-[85vh] flex flex-col md:flex-row md:items-center overflow-hidden bg-primary-blue md:bg-transparent">
        {/* Image Container (Top on Mobile, Absolute on Desktop) */}
        <div className="relative h-[55%] md:h-full md:absolute md:inset-0 w-full z-0 overflow-hidden">
          <AnimatePresence mode="wait">
            {heroImages.length > 0 ? (
              <motion.img
                key={currentSlide}
                src={heroImages[currentSlide]}
                alt="School Campus"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full object-cover brightness-75 md:brightness-50"
              />
            ) : (
              <div className="absolute inset-0 bg-primary-blue flex items-center justify-center text-white/20">
                <ImageIcon size={100} strokeWidth={0.5} />
              </div>
            )}
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-primary-blue/80 md:from-primary-blue/60 to-transparent"></div>
          
          {/* Slide Indicators inside the image area for mobile */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 md:space-x-3 z-20">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
                  currentSlide === index ? "bg-primary-orange w-6 md:w-8" : "bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content Container (Bottom on Mobile, Top-Left on Desktop) */}
        <div className="relative z-10 flex-1 flex flex-col justify-center md:justify-start px-4 md:px-0 md:absolute md:inset-0 md:pt-16">
          <div className="w-full px-4 md:px-12 text-white">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-3xl flex flex-col items-center md:items-start text-center md:text-left"
            >
              <div className="flex items-center space-x-2 text-primary-orange font-black uppercase tracking-[0.2em] md:tracking-[0.3em] mb-3 md:mb-4">
                <Star className="w-4 h-4 md:w-5 md:h-5 animate-spin-slow" />
                <span className="text-[11px] md:text-[13px]">Excellence in Education</span>
              </div>
              
              <div className="flex flex-col md:flex-row items-center md:items-start gap-3 md:gap-6 mb-4 md:mb-8 md:-ml-[17px]">
                <img 
                  src="https://lh3.googleusercontent.com/d/1ys56o3Q1Qx-QqUpmsONl8_0fHcGwm08u" 
                  alt="St. Merry Emblem" 
                  className="h-[70px] md:h-[97px] w-auto object-contain" 
                  style={{ marginLeft: '-7px', height: '76px', marginRight: '0px', marginBottom: '2px', paddingRight: '-2px', paddingLeft: '10px' }}
                  onError={(e) => e.currentTarget.style.display = 'none'} 
                />
                <h1 className="text-[37px] md:text-[43px] font-black leading-[1.1] text-[#ff8d00]" style={{ marginTop: '1px', marginLeft: '-11px', lineHeight: '34.3px' }}>
                  ST.MERRY <br />
                  <span className="text-lg md:text-[23px] text-[#ff9800]" style={{ lineHeight: '24px', marginLeft: '0px', marginTop: '0px', paddingTop: '0px' }}>HIGH SCHOOL, ALPITO</span>
                </h1>
              </div>

              <div className="text-white/90 font-bold text-[10px] md:text-sm mb-2 tracking-wide uppercase" style={{ marginLeft: '-9px', marginTop: '3px', marginBottom: '22px' }}>
                AN ENGLISH MEDIUM CO-EDUCATIONAL SCHOOL 
              </div>
              
              <p className="text-sm md:text-[16px] leading-relaxed text-white/90 mb-8 md:mb-10 max-w-xl font-medium" style={{ width: '385px', marginLeft: '-8px', marginTop: '-1px' }}>
                Alpito - choutha | Bishnugarh | hazaribagh | Jharkhand.<br />
                Empowering young minds with brilliance and values.
              </p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-5">
                <Link to="/admission" className="btn-green h-12 md:h-[56px] px-6 md:px-8 text-sm md:text-lg flex items-center justify-center shadow-xl shadow-green-500/20" style={{ marginLeft: '5px', marginTop: '-25px', paddingTop: '7px', marginRight: '-1px', paddingBottom: '9px', paddingLeft: '17px', fontSize: '17px' }}>Apply for 2026</Link>
                <Link to="/about" className="btn-outline-blue bg-white/5 border-white text-white hover:bg-white hover:text-primary-blue h-12 md:h-[53.7px] px-6 md:px-8 text-sm md:text-base backdrop-blur-sm flex items-center justify-center" style={{ marginLeft: '-8px', paddingLeft: '27px', paddingBottom: '9px', marginTop: '-6px', marginBottom: '19px' }}>Our Legacy</Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Floating Buttons */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4 items-end" style={{ marginLeft: '-3px', marginTop: '3px', paddingTop: '0px', paddingLeft: '2px', marginRight: '-26px', marginBottom: '47px' }}>
        {/* Instagram Floating Button */}
        <motion.a
          href="https://www.instagram.com/st.merry_hs?igsh=MWJobzlxN2kxbjgxYg=="
          target="_blank"
          rel="noopener noreferrer"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="flex items-center justify-center w-[45px] h-[45px] bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] rounded-full shadow-lg text-white group relative"
        >
          <Instagram size={24} />
          <span className="absolute bottom-full right-0 mb-4 bg-white text-gray-800 px-4 py-2 rounded-2xl text-sm font-bold shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-gray-100">
            Follow on Instagram
          </span>
        </motion.a>

        {/* WhatsApp Floating Feature */}
        <motion.a
          href="https://wa.me/919835064300"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="flex items-center justify-center w-[45px] h-[45px] bg-[#25D366] rounded-full shadow-[0_10px_25px_-5px_rgba(37,211,102,0.5)] text-white group relative"
        >
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            stroke="currentColor"
            fill="currentColor"
            strokeWidth="0"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
          <span className="absolute bottom-full right-0 mb-4 bg-white text-[#075e54] px-4 py-2 rounded-2xl text-sm font-bold shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-gray-100">
            WhatsApp: 9835064300
          </span>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
        </motion.a>
      </div>

      {/* Toppers Section */}
      <section className="py-32 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-primary-orange font-bold uppercase tracking-widest text-sm mb-2 block">Achievers</span>
              <h2 className="section-title mb-0">Meet Our <span className="text-primary-orange italic">Toppers</span></h2>
            </div>
            <p className="text-gray-500 max-w-sm">Every year, our students set new benchmarks of excellence through their hard work, dedication, and outstanding achievements, making our school proud and inspiring others to achieve success.</p>
          </div>
        </div>
        
        <div className="relative group overflow-hidden md:overflow-visible">
          {toppers.length > 0 ? (
            <div 
              ref={scrollContainerRef}
              className="flex space-x-6 md:space-x-8 overflow-x-auto md:overflow-visible snap-x snap-mandatory no-scrollbar pb-12 md:pb-0 px-6 md:px-0 animate-scroll"
            >
              {[...toppers, ...toppers].map((topper, index) => (
                <div 
                  key={`${topper.id}-${index}`} 
                  data-index={index}
                  className="topper-card flex-shrink-0 w-64 snap-center glass-card group/item hover:border-primary-orange transition-all duration-500 md:hover:-translate-y-4 relative"
                >
                  <div className="relative mb-6 overflow-hidden rounded-2xl aspect-square">
                    <img 
                      src={topper.image} 
                      alt={topper.name} 
                      className={`w-full h-full object-cover transition-all duration-700 cursor-pointer ${
                        activeIndex === index ? 'grayscale-0' : 'grayscale group-hover/item:grayscale-0 active:grayscale-0'
                      }`} 
                    />
                    <div className="absolute bottom-3 right-3 bg-primary-green text-white text-xl font-black px-3 py-1 rounded-xl shadow-lg z-10">
                      {topper.percentage}
                    </div>
                    {isAdmin && (
                      <label className="absolute top-3 left-3 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-primary-blue hover:text-primary-orange cursor-pointer transition-all hover:scale-110 z-20 shadow-lg">
                        {uploadingId === topper.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Camera className="w-5 h-5" />
                        )}
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, topper.id)}
                          disabled={uploadingId === topper.id}
                        />
                      </label>
                    )}
                  </div>
                  <h3 className="font-black text-xl text-primary-blue mb-1">{topper.name}</h3>
                  <p className="text-primary-orange font-bold text-sm tracking-widest uppercase">CLASS X RANK 1</p>
                </div>
              ))}
            </div>
          ) : isAdmin ? (
            <div className="text-center py-20 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200 mx-4">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-500 mb-2">No Toppers Found</h3>
              <p className="text-gray-400 mb-6">Initialize the achievers list with default students.</p>
              <button 
                onClick={seedToppers}
                className="btn-orange flex items-center gap-2 mx-auto"
                disabled={loadingToppers}
              >
                {loadingToppers ? <Loader2 className="animate-spin" /> : <RefreshCw size={18} />}
                Seed Toppers Data
              </button>
            </div>
          ) : (
            <div className="text-center py-20">
              <Loader2 className="w-10 h-10 text-primary-blue animate-spin mx-auto" />
            </div>
          )}
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-20 bg-primary-blue text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          <div>
            <h4 className="text-5xl font-black mb-2 text-primary-orange">100%</h4>
            <p className="text-blue-100 font-bold uppercase tracking-widest text-xs">Board Results</p>
          </div>
          <div>
            <h4 className="text-5xl font-black mb-2 text-primary-orange">1:25</h4>
            <p className="text-blue-100 font-bold uppercase tracking-widest text-xs">Teacher Ratio</p>
          </div>
          <div>
            <h4 className="text-5xl font-black mb-2 text-primary-orange">20+</h4>
            <p className="text-blue-100 font-bold uppercase tracking-widest text-xs">Total Staff</p>
          </div>
          <div>
            <h4 className="text-5xl font-black mb-2 text-primary-orange">10+</h4>
            <p className="text-blue-100 font-bold uppercase tracking-widest text-xs">Sports Disciplines</p>
          </div>
        </div>
      </section>
      {/* Latest Notices Section */}
      <section className="py-24 bg-gray-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <span className="text-primary-orange font-bold uppercase tracking-widest text-sm mb-2 block">Updates</span>
              <h2 className="section-title mb-0 text-primary-blue">Latest <span className="text-primary-orange italic">Notices</span></h2>
            </div>
            <Link 
              to="/notices" 
              className="text-primary-blue font-black flex items-center gap-2 hover:text-primary-orange transition-colors group"
            >
              View All Notices <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {notices.map((notice, i) => (
              <motion.div
                key={notice.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:border-primary-orange transition-all group relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 transition-transform group-hover:scale-110 ${
                  notice.priority === 'high' ? 'bg-red-500' :
                  notice.priority === 'medium' ? 'bg-orange-500' : 'bg-primary-blue'
                }`} />
                
                <div className="flex items-center gap-3 mb-4">
                  <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                    notice.priority === 'high' ? 'bg-red-50 text-red-600' :
                    notice.priority === 'medium' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {notice.priority}
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{notice.date}</span>
                </div>
                
                <h3 className="text-xl font-bold text-primary-blue mb-4 leading-tight group-hover:text-primary-orange transition-colors line-clamp-2">
                  {notice.title}
                </h3>
                
                <p className="text-gray-500 text-sm line-clamp-3 mb-6 font-medium leading-relaxed">
                  {notice.content}
                </p>

                <Link 
                  to="/notices" 
                  className="inline-flex items-center gap-2 text-xs font-black text-primary-blue hover:text-primary-orange transition-colors"
                >
                  READ FULL <ChevronRight size={14} />
                </Link>
              </motion.div>
            ))}
            
            {notices.length === 0 && (
              <div className="col-span-full py-16 text-center bg-white rounded-[2.5rem] border border-dashed border-gray-200">
                <Bell size={40} className="mx-auto text-gray-100 mb-4" />
                <p className="text-gray-400 font-bold">No active notices at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary-blue to-accent-blue rounded-[2.5rem] blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative p-10 bg-white rounded-[2.5rem] h-full">
                <div className="w-16 h-16 bg-blue-100 text-primary-blue rounded-2xl flex items-center justify-center mb-8">
                  <ImageIcon size={32} />
                </div>
                <h3 className="text-3xl font-black text-primary-blue mb-4 leading-tight">Interactive <br />Learning</h3>
                <p className="text-gray-600 leading-relaxed">Hands-on activities that make complex subject easy and fun to understand.</p>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary-orange to-accent-orange rounded-[2.5rem] blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative p-10 bg-white rounded-[2.5rem] h-full">
                <div className="w-16 h-16 bg-orange-100 text-primary-orange rounded-2xl flex items-center justify-center mb-8">
                  <Users size={32} />
                </div>
                <h3 className="text-3xl font-black text-primary-blue mb-4 leading-tight">Holistic <br />Growth</h3>
                <p className="text-gray-600 leading-relaxed">Focus on extra-curricular activities including dance, music, and sports for overall personality development.</p>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary-green to-accent-green rounded-[2.5rem] blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative p-10 bg-white rounded-[2.5rem] h-full">
                <div className="w-16 h-16 bg-green-100 text-primary-green rounded-2xl flex items-center justify-center mb-8">
                  <Heart size={32} />
                </div>
                <h3 className="text-3xl font-black text-primary-blue mb-4 leading-tight">Values-Based <br />Life</h3>
                <p className="text-gray-600 leading-relaxed">Instilling core moral values and discipline to build strong character and responsible citizens.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
