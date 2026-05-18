import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { Bell, Calendar, ChevronRight, AlertCircle, Info, Clock } from 'lucide-react';

interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'low' | 'medium' | 'high';
  isActive: boolean;
  createdAt: any;
}

export const NoticeBoard = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'notices'), 
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notice));
      setNotices(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching notices:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="pt-32 pb-20 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-12 text-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-primary-orange rounded-full text-xs font-black uppercase tracking-widest mb-4"
          >
            <Bell size={14} className="animate-bounce" />
            Official Updates
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black text-primary-blue mb-4 leading-tight">
            School <span className="text-primary-orange italic">Notice Board</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Stay updated with the latest announcements, events, and important news from St. Merry High School.
          </p>
        </header>

        <div className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] shadow-sm border border-gray-100">
              <div className="w-12 h-12 border-4 border-primary-blue/20 border-t-primary-blue rounded-full animate-spin mb-4" />
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Fetching notices...</p>
            </div>
          ) : notices.length > 0 ? (
            notices.map((notice, i) => (
              <motion.div 
                key={notice.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group relative bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:border-primary-orange transition-all hover:shadow-xl hover:shadow-orange-500/5 overflow-hidden"
              >
                {/* Priority Decorator */}
                <div className={`absolute top-0 left-0 w-2 h-full opacity-60 ${
                  notice.priority === 'high' ? 'bg-red-500' :
                  notice.priority === 'medium' ? 'bg-orange-500' : 'bg-primary-blue'
                }`} />

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="flex-grow">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                        notice.priority === 'high' ? 'bg-red-50 text-red-600' :
                        notice.priority === 'medium' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-primary-blue'
                      }`}>
                        {notice.priority} Priority
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-400 text-xs font-bold uppercase tracking-widest">
                        <Calendar size={14} />
                        {notice.date}
                      </div>
                    </div>
                    
                    <h2 className="text-2xl font-black text-primary-blue mb-4 group-hover:text-primary-orange transition-colors">
                      {notice.title}
                    </h2>
                    
                    <div className="prose prose-sm prose-orange text-gray-600 font-medium leading-relaxed max-w-none whitespace-pre-wrap">
                      {notice.content}
                    </div>
                  </div>

                  <div className="shrink-0 flex md:flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex flex-center items-center justify-center text-gray-400 border border-gray-100 italic font-black text-xl">
                      {i + 1 < 10 ? `0${i + 1}` : i + 1}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-gray-200">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Info size={40} className="text-gray-200" />
              </div>
              <h3 className="text-2xl font-bold text-gray-400 mb-2">Notice Board Empty</h3>
              <p className="text-gray-400">There are no active notices at the moment. Please check back later.</p>
            </div>
          )}
        </div>

        {/* Support Section */}
        <div className="mt-16 p-8 bg-primary-blue rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
              <Clock size={32} />
            </div>
            <div>
              <h4 className="text-xl font-black mb-1">Need Clarification?</h4>
              <p className="text-blue-100/80 text-sm">Contact our admin office for more details about any notice.</p>
            </div>
          </div>
          <Link 
            to="/contact" 
            className="flex items-center gap-2 px-8 py-4 bg-white text-primary-blue font-black rounded-xl hover:bg-primary-orange hover:text-white transition-all shadow-lg"
          >
            Contact Us <ChevronRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
};
