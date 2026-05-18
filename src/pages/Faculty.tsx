import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { motion } from 'motion/react';
import { Mail, Linkedin, Camera, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

interface FacultyMember {
  id: string;
  name: string;
  role: string;
  qualification?: string;
  subject?: string;
  image: string;
  bio?: string;
  message?: string;
  type: 'leadership' | 'teacher';
  order: number;
}

export const Faculty = () => {
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState<FacultyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'faculty'), orderBy('order', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FacultyMember[];
      setMembers(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'faculty');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> => {
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

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>, memberId: string) => {
    const file = e.target.files?.[0];
    if (!file || !isAdmin) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image size too large. Please select an image under 2MB.");
      return;
    }

    setUploadingId(memberId);
    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result) {
        try {
          const compressed = await compressImage(event.target.result as string);
          await updateDoc(doc(db, 'faculty', memberId), {
            image: compressed,
            updatedAt: serverTimestamp()
          });
        } catch (err) {
          console.error("Failed to update image:", err);
          alert("Failed to update image.");
        } finally {
          setUploadingId(null);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateMember = async (memberId: string, updates: Partial<FacultyMember>) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'faculty', memberId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to update member:", err);
      alert("Update failed.");
    }
  };

  const seedInitialData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    
    const initialLeadership = [
      { id: "director", name: "Mr. Mahesh Sharma", role: "Director", qualification: "M.A., B.Ed.", image: "/src/assets/images/regenerated_image_1778566923773.jpg", bio: "Visionary leader dedicated to providing affordable quality education to every child.", message: "Welcome to St. Merry School. Our mission is to nurture young minds with values and innovation.", type: "leadership", order: 1 },
      { id: "principal", name: "Mr. Pradeep Yadav", role: "Principal", qualification: "M.Sc., B.Ed.", image: "/src/assets/images/principal_portrait_1778743944643.png", bio: "Advocating for academic excellence and holistic development for over 15 years.", message: "Academic excellence combined with character building is what we strive for every day.", type: "leadership", order: 2 },
      { id: "vice-principal", name: "Mr. Amit Mishra", role: "Vice Principal", qualification: "M.A., M.Ed.", image: "/src/assets/images/regenerated_image_1778563504563.jpg", bio: "Focused on student welfare and implementing modern pedagogical techniques.", message: "We are committed to creating a safe and stimulating environment for all our students.", type: "leadership", order: 3 },
    ];

    const initialTeachers = [
      { id: "teacher-1", name: "Mr. Ajay Kr. Sharma", role: "Senior Faculty", qualification: "M.Sc. (Maths)", subject: "Mathematics", image: "/src/assets/images/regenerated_image_1778563820357.jpg", type: "teacher", order: 1 },
      { id: "teacher-2", name: "Ms. Anjali Verma", role: "Coordinator", qualification: "M.Sc. (Physics)", subject: "Physics", image: "/src/assets/images/regenerated_image_1778563746018.png", type: "teacher", order: 2 },
      { id: "teacher-3", name: "Mr. Sameer Sen", role: "IT Head", qualification: "MCA", subject: "Computer Science", image: "/src/assets/images/regenerated_image_1778563622100.png", type: "teacher", order: 3 },
      { id: "teacher-4", name: "Mrs. Sunita Roy", role: "Senior Faculty", qualification: "M.A. (English)", subject: "English & History", image: "/src/assets/images/regenerated_image_1778521395143.png", type: "teacher", order: 4 },
      { id: "teacher-5", name: "Mr. Rahul Singh", role: "Faculty", qualification: "M.Sc. (Chemistry)", subject: "Chemistry", image: "/src/assets/images/regenerated_image_1778566337366.png", type: "teacher", order: 5 },
      { id: "teacher-6", name: "Ms. Kavita Devi", role: "Faculty", qualification: "M.Sc. (Biology)", subject: "Biology", image: "/src/assets/images/student_portrait_7_1778742300151.png", type: "teacher", order: 6 },
    ];

    try {
      for (const member of [...initialLeadership, ...initialTeachers]) {
        const { id, ...data } = member;
        await setDoc(doc(db, 'faculty', id), {
          ...data,
          updatedAt: serverTimestamp()
        });
      }
      alert("Faculty data seeded successfully!");
    } catch (err) {
      console.error("Seeding failed:", err);
      alert("Seeding failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const leadership = members.filter(m => m.type === 'leadership');
  const teachers = members.filter(m => m.type === 'teacher');
  const [activeTeacherId, setActiveTeacherId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="pt-32 pb-20 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-blue animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading faculty members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20 relative">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="section-title"
          >
            Meet Our Dedicated <span className="text-primary-orange">Faculty</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-600 max-w-2xl mx-auto mt-4"
          >
            Guided by excellence, led by passion. Our experienced educators are the backbone of St. Merry School.
          </motion.p>
          
          {isAdmin && members.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-8 p-6 bg-blue-50 border border-blue-100 rounded-3xl max-w-md mx-auto"
            >
              <div className="flex items-center gap-3 text-primary-blue mb-4 justify-center">
                <AlertCircle size={24} />
                <h3 className="font-bold text-lg">No Data Found</h3>
              </div>
              <p className="text-sm text-blue-700/80 mb-6">The faculty collection is currently empty. Initialize it with default staff data.</p>
              <button 
                onClick={seedInitialData}
                className="btn-blue flex items-center gap-2 mx-auto"
              >
                <RefreshCw size={18} />
                Seed Initial Data
              </button>
            </motion.div>
          )}
        </div>

        {/* Leadership Section */}
        {leadership.length > 0 && (
          <div className="mb-24">
            <div className="flex items-center gap-4 mb-10">
              <div className="h-0.5 flex-grow bg-gray-200"></div>
              <h2 className="text-2xl font-black text-primary-blue uppercase tracking-widest whitespace-nowrap">School Leadership</h2>
              <div className="h-0.5 flex-grow bg-gray-200"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {leadership.map((l, i) => (
                <motion.div
                  key={l.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group bg-white rounded-[40px] p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-blue-900/5 transition-all relative"
                >
                  {isAdmin && (
                    <div className="absolute top-10 right-10 z-10 flex gap-2">
                      <label className="w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-primary-blue hover:text-primary-orange cursor-pointer transition-all hover:scale-110 border border-gray-100">
                        {uploadingId === l.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Camera className="w-5 h-5" />
                        )}
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, l.id)}
                          disabled={uploadingId === l.id}
                        />
                      </label>
                    </div>
                  )}

                  <div className="relative overflow-hidden rounded-[32px] mb-6 aspect-[4/5]">
                    <img src={l.image} alt={l.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary-blue/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8">
                      <p className="text-white/90 text-sm italic line-clamp-3">"{l.bio}"</p>
                      <div className="flex gap-4 mt-6">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-primary-orange transition-colors cursor-pointer">
                          <Mail className="w-5 h-5" />
                        </div>
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-primary-orange transition-colors cursor-pointer">
                          <Linkedin className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center px-4">
                    {isAdmin ? (
                      <input 
                        type="text"
                        className="text-2xl font-black text-primary-blue mb-1 w-full text-center bg-transparent border-b border-transparent hover:border-gray-200 focus:border-primary-blue focus:outline-none"
                        defaultValue={l.name}
                        onBlur={(e) => handleUpdateMember(l.id, { name: e.target.value })}
                      />
                    ) : (
                      <h3 className="text-2xl font-black text-primary-blue mb-1">{l.name}</h3>
                    )}
                    <div className="inline-block px-4 py-1 bg-primary-orange/10 text-primary-orange rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                      {isAdmin ? (
                        <input 
                          type="text"
                          className="bg-transparent text-center focus:outline-none border-b border-transparent hover:border-primary-orange/30"
                          defaultValue={l.role}
                          onBlur={(e) => handleUpdateMember(l.id, { role: e.target.value })}
                        />
                      ) : l.role}
                    </div>
                    <div className="text-xs font-medium text-gray-500 mb-2">
                      {isAdmin ? (
                        <input 
                          type="text"
                          placeholder="Qualification"
                          className="bg-transparent text-center focus:outline-none border-b border-transparent hover:border-gray-200 w-full"
                          defaultValue={l.qualification}
                          onBlur={(e) => handleUpdateMember(l.id, { qualification: e.target.value })}
                        />
                      ) : l.qualification}
                    </div>
                    {/* Message Section */}
                    {isAdmin ? (
                      <div className="mt-4 px-4 text-center">
                        <textarea
                          placeholder="Enter leadership message..."
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm text-gray-600 focus:outline-none focus:border-primary-blue transition-all resize-none italic"
                          defaultValue={l.message || ""}
                          rows={3}
                          onBlur={(e) => handleUpdateMember(l.id, { message: e.target.value })}
                        />
                      </div>
                    ) : l.message && (
                      <div className="mt-4 px-8 text-center relative">
                        <span className="absolute -top-2 left-6 text-4xl text-primary-orange/20 font-serif leading-none">"</span>
                        <p className="text-gray-600 italic text-sm leading-relaxed relative z-10 px-2">{l.message}</p>
                        <span className="absolute -bottom-4 right-6 text-4xl text-primary-orange/20 font-serif leading-none">"</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Teachers Section */}
        {teachers.length > 0 && (
          <div>
            <div className="flex items-center gap-4 mb-14">
              <div className="h-0.5 flex-grow bg-gray-200"></div>
              <h2 className="text-2xl font-black text-primary-blue uppercase tracking-widest whitespace-nowrap">Our Educators</h2>
              <div className="h-0.5 flex-grow bg-gray-200"></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 text-center">
              {teachers.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative cursor-pointer"
                  onTouchStart={() => setActiveTeacherId(t.id)}
                  onClick={() => setActiveTeacherId(t.id)}
                >
                  <div className="relative mb-4 mx-auto w-32 h-32 md:w-40 md:h-40">
                    <div className={`absolute inset-0 bg-primary-orange rounded-full transition-transform duration-300 ${activeTeacherId === t.id ? 'scale-105' : 'scale-0 group-hover:scale-105'}`}></div>
                    <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white shadow-lg shadow-gray-200">
                      <img 
                        src={t.image} 
                        alt={t.name} 
                        className={`w-full h-full object-cover transition-all duration-500 ${
                          activeTeacherId === t.id 
                            ? 'grayscale-0 scale-110' 
                            : 'grayscale group-hover:grayscale-0 group-hover:scale-110'
                        }`} 
                      />
                    </div>
                    {isAdmin && (
                      <label className="absolute bottom-2 right-2 w-8 h-8 bg-primary-blue text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer transform scale-0 group-hover:scale-100 transition-transform duration-300 hover:bg-primary-orange">
                        {uploadingId === t.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Camera size={14} />
                        )}
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, t.id)}
                          disabled={uploadingId === t.id}
                        />
                      </label>
                    )}
                  </div>
                  {isAdmin ? (
                    <input 
                      type="text"
                      className="text-lg font-bold text-primary-blue mb-0.5 w-full text-center bg-transparent border-b border-transparent hover:border-gray-200 focus:border-primary-blue focus:outline-none"
                      defaultValue={t.name}
                      onBlur={(e) => handleUpdateMember(t.id, { name: e.target.value })}
                    />
                  ) : (
                    <h4 className="text-lg font-bold text-primary-blue mb-0.5">{t.name}</h4>
                  )}
                  <div className="text-xs font-bold text-primary-orange uppercase mb-1 tracking-tight">
                    {isAdmin ? (
                      <input 
                        type="text"
                        className="bg-transparent text-center focus:outline-none border-b border-transparent hover:border-primary-orange/30 w-full"
                        defaultValue={t.subject}
                        onBlur={(e) => handleUpdateMember(t.id, { subject: e.target.value })}
                      />
                    ) : t.subject}
                  </div>
                  <div className="text-[10px] text-gray-400 font-medium px-2 mb-1">
                    {isAdmin ? (
                      <input 
                        type="text"
                        className="bg-transparent text-center focus:outline-none border-b border-transparent hover:border-gray-200 w-full"
                        defaultValue={t.role}
                        onBlur={(e) => handleUpdateMember(t.id, { role: e.target.value })}
                      />
                    ) : t.role}
                  </div>
                  <div className="text-[9px] text-gray-500 font-bold px-2">
                    {isAdmin ? (
                      <input 
                        type="text"
                        placeholder="Qualification"
                        className="bg-transparent text-center focus:outline-none border-b border-transparent hover:border-gray-200 w-full font-bold"
                        defaultValue={t.qualification}
                        onBlur={(e) => handleUpdateMember(t.id, { qualification: e.target.value })}
                      />
                    ) : t.qualification}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
