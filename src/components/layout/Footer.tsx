import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Users, Instagram } from 'lucide-react';
import { doc, getDoc, updateDoc, increment, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export const Footer = () => {
  const [visitorCount, setVisitorCount] = useState<number | null>(null);

  useEffect(() => {
    const trackVisitor = async () => {
      const VISITOR_CACHE_KEY = 'st_merry_visitor_count';
      const LAST_UPDATE_KEY = 'st_merry_visitor_last_sync';
      const now = Date.now();
      const ONE_DAY = 24 * 60 * 60 * 1000;

      // Initialize from cache immediately for speed and to avoid initial read
      const cachedCount = localStorage.getItem(VISITOR_CACHE_KEY);
      if (cachedCount) {
        setVisitorCount(parseInt(cachedCount));
      }

      const isCountedInSession = sessionStorage.getItem('v_counted');
      const lastSync = localStorage.getItem(LAST_UPDATE_KEY);
      
      // Decide if we should talk to Firestore
      // 1. If not counted in session -> We definitely want to increment
      // 2. OR if cache is older than 24 hours -> We want to sync the display count
      const shouldSync = !isCountedInSession || !lastSync || (now - parseInt(lastSync)) > ONE_DAY;

      if (!shouldSync) {
        // If we don't sync, but we counted in this session, increment the local display if it matches our session count
        return;
      }

      try {
        const statsRef = doc(db, 'stats', 'visitors');
        
        if (!isCountedInSession) {
          // Attempt blind increment (saves a read compared to getDoc + updateDoc)
          // Note: If the document doesn't exist, this will fail. We ignore that for now
          // as the doc should be seeded in firebase-blueprint or manual setup.
          try {
            await updateDoc(statsRef, {
              count: increment(1)
            });
            sessionStorage.setItem('v_counted', 'true');
          } catch (e: any) {
            if (e.code === 'not-found') {
              await setDoc(statsRef, { count: 1 });
              sessionStorage.setItem('v_counted', 'true');
            } else {
              throw e;
            }
          }
        }

        // Only fetch the full count if the cache is stale or we just incremented
        const statsDoc = await getDoc(statsRef);
        if (statsDoc.exists()) {
          const newCount = statsDoc.data().count;
          setVisitorCount(newCount);
          try {
            localStorage.setItem(VISITOR_CACHE_KEY, newCount.toString());
            localStorage.setItem(LAST_UPDATE_KEY, now.toString());
          } catch (e) {
            console.warn('Storage quota exceeded for visitor tracking');
          }
        }
      } catch (error: any) {
        if (error.code === 'resource-exhausted') {
          console.warn('Visitor tracking quota hit. Using local estimation.');
          // If quota hit, just increment our local display for this user
          if (!isCountedInSession) {
            setVisitorCount(prev => prev !== null ? prev + 1 : (cachedCount ? parseInt(cachedCount) + 1 : 100));
            sessionStorage.setItem('v_counted', 'true');
          }
        } else {
          console.error('Error tracking visitor:', error);
        }
      }
    };

    trackVisitor();
  }, []);

  return (
    <footer className="bg-primary-blue text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center space-x-3 mb-6">
            <img src="https://lh3.googleusercontent.com/d/1ys56o3Q1Qx-QqUpmsONl8_0fHcGwm08u" alt="St. Merry Logo" className="w-16 h-16 object-contain bg-white rounded-full p-0.5 shadow-sm" onError={(e) => e.currentTarget.src = 'https://placehold.co/200x200?text=St.+Merry+Logo'} />
            <div>
              <h2 className="text-2xl font-bold uppercase tracking-tight">ST. MERRY</h2>
              <p className="text-sm text-blue-200">High School, Alpito - Bishnugarh</p>
            </div>
          </div>
          <p className="text-blue-100 max-w-md mb-8">
            Empowering young minds with excellence in education and holistic development since 2008. Our mission is to nurture future leaders with moral values and academic brilliance.
          </p>
          <div className="flex items-center space-x-4">
            <a href="tel:+919934062897" className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center hover:bg-primary-orange transition-colors cursor-pointer">
              <Phone className="w-5 h-5" />
            </a>
            <a href="mailto:stmerry777@gmail.com" className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center hover:bg-primary-orange transition-colors cursor-pointer">
              <Mail className="w-5 h-5" />
            </a>
            <a 
              href="https://www.instagram.com/st.merry_hs?igsh=MWJobzlxN2kxbjgxYg==" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center hover:bg-primary-orange transition-colors cursor-pointer"
              title="Follow us on Instagram"
            >
              <Instagram className="w-5 h-5 text-white" />
            </a>
            <div className="flex items-center gap-4">
              <a 
                href="https://www.google.com/maps/search/?api=1&query=3Q6W%2BGJP%2C+Alpito%2C+Jharkhand+825322" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-lg border border-blue-700 shadow-xl"
              >
                <img 
                  src="https://placehold.co/300x200/1e3a8a/orange?text=Locate+Us" 
                  alt="School Location Map" 
                  className="w-32 h-20 object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-colors">
                  <MapPin className="w-6 h-6 text-white drop-shadow-lg" />
                </div>
              </a>
              <a 
                href="https://www.google.com/maps/search/?api=1&query=3Q6W%2BGJP%2C+Alpito%2C+Jharkhand+825322"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-blue-200 hover:text-primary-orange transition-colors uppercase tracking-widest border-b border-blue-800 hover:border-primary-orange pb-0.5"
              >
                Open Maps
              </a>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-6 text-primary-orange">Quick Links</h3>
          <ul className="space-y-3">
            <li><Link to="/about" className="hover:text-primary-orange transition-colors">About Us</Link></li>
            <li><Link to="/admission" className="hover:text-primary-orange transition-colors">Admission 2026</Link></li>
            <li><Link to="/facilities" className="hover:text-primary-orange transition-colors">School Facilities</Link></li>
            <li><Link to="/contact" className="hover:text-primary-orange transition-colors">Contact Us</Link></li>
            <li><Link to="/login/student" className="hover:text-primary-orange transition-colors">Student Portal</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-6 text-primary-orange">Timings</h3>
          <ul className="space-y-3 text-blue-100">
            <li className="flex justify-between"><span>Mon - Fri:</span> <span>8:00 AM - 2:00 PM</span></li>
            <li className="flex justify-between"><span>Saturday:</span> <span>8:00 AM - 12:30 PM</span></li>
            <li className="flex justify-between text-red-300"><span>Sunday:</span> <span>Closed</span></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-blue-800">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-blue-300">&copy; {new Date().getFullYear()} St. Merry High School. All Rights Reserved.</p>
          
          <p className="text-sm text-blue-300 font-medium tracking-wide">Developed by Manish Sharma</p>
          
          <div className="flex items-center gap-2 bg-blue-900/50 px-4 py-1.5 rounded-full border border-blue-800 shadow-inner">
            <Users size={14} className="text-primary-orange" />
            <span className="text-xs font-bold text-blue-200">Total Website Visitors:</span>
            <span className="text-sm font-black text-white bg-blue-800 px-2 rounded min-w-[30px] text-center">
              {visitorCount !== null ? visitorCount.toLocaleString() : '...'}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
