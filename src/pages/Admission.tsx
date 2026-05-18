import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, FileText, Calendar, UserPlus, LogIn, AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, limit, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export const Admission = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    studentName: '',
    parentName: '',
    phone: '',
    email: user?.email || '',
    class: 'Nursery',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingApp, setExistingApp] = useState<any>(null);
  const [prospectusUrl, setProspectusUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProspectus = async () => {
      try {
        const docRef = doc(db, 'settings', 'site');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProspectusUrl(docSnap.data().prospectusUrl || null);
        }
      } catch (err) {
        console.error("Error fetching prospectus:", err);
      }
    };
    fetchProspectus();
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'registrations'), 
      where('studentId', '==', user.uid),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setExistingApp({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setExistingApp(null);
      }
      setLoading(false);
      setError(null);
    }, (err: any) => {
      console.error("Error fetching application:", err);
      if (err.message?.includes('insufficient permissions')) {
        handleFirestoreError(err, OperationType.LIST, 'registrations');
      }
      if (err.code === 'resource-exhausted') {
        setError("Daily database limit reached. We cannot check your status right now.");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      await addDoc(collection(db, 'registrations'), {
        ...formData,
        studentId: user.uid,
        status: 'pending',
        submittedAt: serverTimestamp()
      });
      setSubmitted(true);
      setError(null);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('insufficient permissions')) {
        handleFirestoreError(err, OperationType.CREATE, 'registrations');
      }
      if (err.code === 'resource-exhausted') {
        setError('Daily submission limit reached. Please try again tomorrow.');
      } else {
        setError('Failed to submit application. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          icon: <CheckCircle className="text-green-500" size={48} />,
          bg: 'bg-green-50',
          title: 'Admission Approved!',
          color: 'text-green-600',
          desc: 'Congratulations! Your admission inquiry has been approved. Please visit the school office with original documents for document verification.'
        };
      case 'rejected':
        return {
          icon: <XCircle className="text-red-500" size={48} />,
          bg: 'bg-red-50',
          title: 'Application Rejected',
          color: 'text-red-600',
          desc: 'We regret to inform you that your application could not be processed at this time. Please contact the office for more details.'
        };
      default:
        return {
          icon: <Clock className="text-orange-500" size={48} />,
          bg: 'bg-orange-50',
          title: 'Application Pending',
          color: 'text-orange-600',
          desc: 'Your application is currently under review by our admissions team. We will notify you once a decision is made.'
        };
    }
  };

  return (
    <div className="pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-primary-blue rounded-[3rem] p-8 md:p-16 text-white mb-20 relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-4xl md:text-6xl font-black mb-6">Join the <span className="text-primary-orange">Excellence</span></h1>
            <p className="text-xl text-blue-100 max-w-2xl mb-8">
              Registration open for 2026 - 27 for class Nur to IX. We invite you to be a part of a community that fosters growth, curiosity, and leadership.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => {
                  if (prospectusUrl) {
                    window.open(prospectusUrl, '_blank');
                  } else {
                    alert("Prospectus not available yet. Please check back later.");
                  }
                }}
                className="btn-orange text-lg"
              >
                Download Prospectus
              </button>
              {!user && (
                <Link to="/login/student" className="btn-outline-blue border-white text-white hover:bg-white hover:text-primary-blue !text-lg flex items-center gap-2">
                  <LogIn size={20} /> Login to Apply
                </Link>
              )}
            </div>
          </div>
          <div className="absolute top-1/2 right-0 -translate-y-1/2 opacity-10 hidden lg:block">
            <GraduationCapIcon className="w-[400px] h-[400px]" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-primary-blue">Admission Process</h2>
            <div className="space-y-4">
              {[
                { step: "01", title: "Registration", desc: "Obtain the registration form from the school office or download online." },
                { step: "02", title: "Assessment", desc: "Interaction/Entrance test for students (Class I to IX)." },
                { step: "03", title: "Documents", desc: "Submission of required documents and previous records." },
                { step: "04", title: "Finalization", desc: "Confirmation of admission after verification." },
              ].map((s, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <span className="text-2xl font-black text-primary-orange">{s.step}</span>
                  <div>
                    <h4 className="font-bold text-lg">{s.title}</h4>
                    <p className="text-gray-600 text-sm">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            {!user ? (
              <div className="bg-white rounded-[2rem] shadow-2xl p-12 border border-gray-100 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-50 text-primary-blue rounded-full flex items-center justify-center mb-6">
                  <LogIn size={32} />
                </div>
                <h3 className="text-2xl font-bold text-primary-blue mb-4">Login Required</h3>
                <p className="text-gray-500 mb-8 max-w-sm">
                  To ensure the security of your application and track your progress, please log in or create an account before applying.
                </p>
                <Link to="/login/student" className="btn-blue px-8 py-3 rounded-xl flex items-center gap-2">
                  Go to Login Portal <ArrowRight size={18} />
                </Link>
              </div>
            ) : loading ? (
              <div className="bg-white rounded-[2rem] shadow-2xl p-20 border border-gray-100 text-center">
                <div className="animate-spin w-10 h-10 border-4 border-primary-blue border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-500">Checking application status...</p>
              </div>
            ) : existingApp ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2rem] shadow-2xl p-8 md:p-12 border border-gray-100"
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`p-6 rounded-full mb-8 ${getStatusDisplay(existingApp.status).bg}`}>
                    {getStatusDisplay(existingApp.status).icon}
                  </div>
                  <h3 className="text-3xl font-black text-primary-blue mb-2">
                    {getStatusDisplay(existingApp.status).title}
                  </h3>
                  <div className="bg-gray-50 px-4 py-1 rounded-full mb-6">
                    <span className="text-xs font-black uppercase text-gray-400">Application ID: {existingApp.id.slice(0, 8)}</span>
                  </div>
                  <p className="text-gray-600 text-lg max-w-xl mb-10">
                    {getStatusDisplay(existingApp.status).desc}
                  </p>
                </div>

                <div className="border-t border-dashed border-gray-200 pt-8 mt-4">
                  <h4 className="text-lg font-bold text-gray-900 mb-6">Application Summary</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Student Name</p>
                        <p className="font-bold text-gray-800">{existingApp.studentName}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Applied Class</p>
                        <p className="font-bold text-gray-800">{existingApp.class}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Submission Date</p>
                        <p className="font-bold text-gray-800">{existingApp.submittedAt?.toDate().toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current Status</p>
                        <p className={`font-black capitalize ${getStatusDisplay(existingApp.status).color}`}>
                          {existingApp.status}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {existingApp.status === 'rejected' && (
                  <div className="mt-8 pt-8 border-t border-gray-100 flex justify-center">
                    <button 
                      onClick={() => setExistingApp(null)}
                      className="text-primary-blue font-bold hover:underline"
                    >
                      Want to submit a new application?
                    </button>
                  </div>
                )}
              </motion.div>
            ) : submitted ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-[2rem] shadow-2xl p-12 border border-gray-100 text-center"
              >
                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-8 mx-auto">
                  <CheckCircle2 size={48} />
                </div>
                <h3 className="text-3xl font-black text-primary-blue mb-4">Application Submitted!</h3>
                <p className="text-gray-500 text-lg mb-8">
                  Thank you for applying, {formData.studentName}. Our team will review your application and get back to you shortly.
                </p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="text-primary-blue font-bold hover:underline"
                >
                  Submit another application
                </button>
              </motion.div>
            ) : (
              <div className="bg-white rounded-[2rem] shadow-2xl p-8 border border-gray-50">
                <h3 className="text-2xl font-bold text-primary-blue mb-8">Admission Inquiry Form</h3>
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center space-x-3 text-red-600">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}
                <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Student's Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.studentName}
                      onChange={(e) => setFormData({...formData, studentName: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-blue" 
                      placeholder="Enter student name" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Applying for Class</label>
                    <select 
                      value={formData.class}
                      onChange={(e) => setFormData({...formData, class: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-blue"
                    >
                      <option>Nursery</option>
                      <option>KG</option>
                      <option>Class I</option>
                      <option>Class II</option>
                      <option>Class III</option>
                      <option>Class IV</option>
                      <option>Class V</option>
                      <option>Class VI</option>
                      <option>Class VII</option>
                      <option>Class VIII</option>
                      <option>Class IX</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parent's Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.parentName}
                      onChange={(e) => setFormData({...formData, parentName: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-blue" 
                      placeholder="Enter parent name" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                    <input 
                      type="tel" 
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-blue" 
                      placeholder="XXXXX XXXXX" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message / Additional Info</label>
                    <textarea 
                      rows={4} 
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-blue" 
                      placeholder="Tell us more..."
                    ></textarea>
                  </div>
                  <div className="md:col-span-2 text-sm text-gray-500 mb-2">
                    Logged in as: <span className="font-bold text-primary-blue">{user.email}</span>
                  </div>
                  <div className="md:col-span-2">
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full btn-blue py-4 text-lg disabled:opacity-50"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Application Inquiry'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const GraduationCapIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);
