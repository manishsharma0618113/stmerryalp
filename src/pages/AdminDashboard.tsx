import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Filter, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  UserPlus, 
  Download,
  ChevronRight,
  AlertCircle,
  Mail,
  Settings as SettingsIcon,
  Bell,
  Plus,
  Calendar
} from 'lucide-react';

interface Registration {
  id: string;
  studentName: string;
  parentName: string;
  email: string;
  phone: string;
  class: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: any;
  message?: string;
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

export const AdminDashboard = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'registrations' | 'notices'>('registrations');

  const [newReg, setNewReg] = useState({
    studentName: '',
    parentName: '',
    phone: '',
    email: '',
    class: 'Nursery',
    status: 'pending' as const
  });

  const [newNotice, setNewNotice] = useState({
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    priority: 'medium' as const,
    isActive: true
  });

  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, 'registrations'), orderBy('submittedAt', 'desc'));
    const unsubscribeReg = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Registration));
      setRegistrations(docs);
      setLoading(false);
      setError(null);
    }, (error: any) => {
      console.error('Registration snapshot error:', error);
      if (error.code === 'resource-exhausted') {
        setError('Daily free database limit reached. Please try again tomorrow or contact support.');
      } else {
        setError('Failed to load registrations.');
      }
      setLoading(false);
    });

    const noticeQ = query(collection(db, 'notices'), orderBy('createdAt', 'desc'));
    const unsubscribeNotices = onSnapshot(noticeQ, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notice));
      setNotices(docs);
    });

    const msgQ = query(collection(db, 'messages'), where('read', '==', false));
    const unsubscribeMessages = onSnapshot(msgQ, (snapshot) => {
      setUnreadMessages(snapshot.size);
    });

    return () => {
      unsubscribeReg();
      unsubscribeNotices();
      unsubscribeMessages();
    };
  }, [isAdmin]);

  const updateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'registrations', id), { status: newStatus });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const deleteRegistration = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this registration?')) {
      try {
        await deleteDoc(doc(db, 'registrations', id));
      } catch (error) {
        console.error('Error deleting registration:', error);
      }
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'registrations'), {
        ...newReg,
        submittedAt: serverTimestamp()
      });
      setShowAddModal(false);
      setNewReg({
        studentName: '',
        parentName: '',
        phone: '',
        email: '',
        class: 'Nursery',
        status: 'pending'
      });
    } catch (error) {
      console.error('Error adding registration:', error);
    }
  };

  const handleNoticeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'notices'), {
        ...newNotice,
        createdAt: serverTimestamp()
      });
      setShowNoticeModal(false);
      setNewNotice({
        title: '',
        content: '',
        date: new Date().toISOString().split('T')[0],
        priority: 'medium',
        isActive: true
      });
    } catch (error) {
      console.error('Error adding notice:', error);
    }
  };

  const deleteNotice = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this notice?')) {
      try {
        await deleteDoc(doc(db, 'notices', id));
      } catch (error) {
        console.error('Error deleting notice:', error);
      }
    }
  };

  const toggleNoticeActive = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(db, 'notices', id), { isActive: !current });
    } catch (error) {
      console.error('Error toggling notice status:', error);
    }
  };

  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = reg.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          reg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          reg.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (!isAdmin) {
    return (
      <div className="pt-32 pb-20 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-500 mt-2">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Error Alert */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700">
            <AlertCircle size={20} className="shrink-0" />
            <p className="text-xs">{error}</p>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-primary-blue">Admin <span className="text-primary-orange">Panel</span></h1>
            <p className="text-gray-500">Manage school data and notices</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/admin/messages" className="relative p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 shadow-sm">
              <Mail size={20} />
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {unreadMessages}
                </span>
              )}
            </Link>
            <Link to="/admin/settings" className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 shadow-sm">
              <SettingsIcon size={20} />
            </Link>
            {activeTab === 'registrations' ? (
              <button 
                onClick={() => setShowAddModal(true)}
                className="btn-blue flex items-center gap-2 !py-2.5 !px-5"
              >
                <UserPlus size={18} /> New Admission
              </button>
            ) : (
              <button 
                onClick={() => setShowNoticeModal(true)}
                className="btn-orange flex items-center gap-2 !py-2.5 !px-5"
              >
                <Plus size={18} /> Add Notice
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total Inquiries', count: registrations.length, color: 'text-primary-blue', bg: 'bg-blue-50', icon: <Users size={20}/> },
            { label: 'Active Notices', count: notices.filter(n => n.isActive).length, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <Bell size={20}/> },
            { label: 'Unread Messages', count: unreadMessages, color: 'text-pink-500', bg: 'bg-pink-50', icon: <Mail size={20}/>, path: '/admin/messages' },
            { label: 'Pending Review', count: registrations.filter(r => r.status === 'pending').length, color: 'text-orange-500', bg: 'bg-orange-50', icon: <Clock size={20}/> },
            { label: 'Approved', count: registrations.filter(r => r.status === 'approved').length, color: 'text-green-500', bg: 'bg-green-50', icon: <CheckCircle size={20}/> },
          ].map((stat, i) => (
            <div 
              key={stat.label} 
              onClick={() => stat.path && navigate(stat.path)}
              className={`bg-white p-4 rounded-2xl shadow-sm border border-gray-100 ${stat.path ? 'cursor-pointer hover:border-primary-orange transition-colors' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                  {stat.icon}
                </div>
                {stat.path && <ChevronRight size={16} className="text-gray-300" />}
              </div>
              <p className="text-xs font-medium text-gray-500">{stat.label}</p>
              <p className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.count}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button 
            onClick={() => setActiveTab('registrations')}
            className={`px-6 py-2 rounded-full text-sm font-black transition-all ${activeTab === 'registrations' ? 'bg-primary-blue text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
          >
            Registrations
          </button>
          <button 
            onClick={() => setActiveTab('notices')}
            className={`px-6 py-2 rounded-full text-sm font-black transition-all ${activeTab === 'notices' ? 'bg-primary-orange text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
          >
            Notice Board
          </button>
        </div>

        {activeTab === 'registrations' ? (
          <div className="space-y-6">
            <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-grow w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search students..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary-blue"
                />
              </div>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-50 border-none rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-primary-blue"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left hidden lg:table">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Student</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Parent</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Class</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">Loading...</td></tr>
                  ) : filteredRegistrations.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">No applications found.</td></tr>
                  ) : (
                    filteredRegistrations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900">{reg.studentName}</p>
                          <p className="text-xs text-gray-500">{reg.email}</p>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-700">{reg.parentName}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black uppercase">
                            {reg.class}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-bold capitalize ${
                            reg.status === 'approved' ? 'text-green-600' : 
                            reg.status === 'rejected' ? 'text-red-600' : 'text-orange-600'
                          }`}>
                            {reg.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => updateStatus(reg.id, 'approved')} className="p-1 text-green-600 hover:bg-green-50 rounded"><CheckCircle size={18}/></button>
                            <button onClick={() => updateStatus(reg.id, 'rejected')} className="p-1 text-red-600 hover:bg-red-50 rounded"><XCircle size={18}/></button>
                            <button onClick={() => deleteRegistration(reg.id)} className="p-1 text-gray-400 hover:text-red-600 rounded"><Trash2 size={18}/></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Mobile Card Layout for registrations */}
              <div className="lg:hidden divide-y divide-gray-100">
                {filteredRegistrations.map((reg) => (
                  <div key={reg.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-900">{reg.studentName}</p>
                        <p className="text-xs text-gray-300">{reg.class}</p>
                      </div>
                      <span className={`text-[10px] font-black uppercase ${
                        reg.status === 'approved' ? 'text-green-600' : 
                        reg.status === 'rejected' ? 'text-red-600' : 'text-orange-600'
                      }`}>{reg.status}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => updateStatus(reg.id, 'approved')} className="flex-1 py-2 bg-green-50 text-green-600 text-[10px] font-bold rounded-lg">Approve</button>
                      <button onClick={() => updateStatus(reg.id, 'rejected')} className="flex-1 py-2 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg">Reject</button>
                      <button onClick={() => deleteRegistration(reg.id)} className="p-2 text-gray-400"><Trash2 size={18}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {notices.map((notice) => (
              <div key={notice.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-primary-orange transition-all">
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      notice.priority === 'high' ? 'bg-red-50 text-red-600' :
                      notice.priority === 'medium' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {notice.priority}
                    </span>
                    {!notice.isActive && <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px] font-black uppercase">Inactive</span>}
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar size={12}/> {notice.date}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{notice.title}</h3>
                  <p className="text-gray-500 text-sm line-clamp-2">{notice.content}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleNoticeActive(notice.id, notice.isActive)}
                    className={`p-2 rounded-xl transition-colors ${notice.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                  >
                    <CheckCircle size={20} />
                  </button>
                  <button 
                    onClick={() => deleteNotice(notice.id)}
                    className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
            {notices.length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                <Bell size={48} className="mx-auto text-gray-100 mb-4" />
                <p className="text-gray-400">No notices posted yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Admission Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 shadow-2xl">
              <h2 className="text-2xl font-black text-primary-blue mb-6">New Registration</h2>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <input type="text" placeholder="Student Name" required value={newReg.studentName} onChange={(e) => setNewReg({...newReg, studentName: e.target.value})} className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-primary-blue" />
                <input type="text" placeholder="Parent Name" required value={newReg.parentName} onChange={(e) => setNewReg({...newReg, parentName: e.target.value})} className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-primary-blue" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="email" placeholder="Email" required value={newReg.email} onChange={(e) => setNewReg({...newReg, email: e.target.value})} className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-primary-blue" />
                  <input type="tel" placeholder="Phone" required value={newReg.phone} onChange={(e) => setNewReg({...newReg, phone: e.target.value})} className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-primary-blue" />
                </div>
                <select value={newReg.class} onChange={(e) => setNewReg({...newReg, class: e.target.value})} className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-primary-blue">
                  <option>Nursery</option><option>KG</option><option>Class I</option><option>Class II</option><option>Class III</option><option>Class IV</option><option>Class V</option><option>Class VI</option><option>Class VII</option><option>Class VIII</option><option>Class IX</option>
                </select>
                <button type="submit" className="w-full py-3 bg-primary-blue text-white font-black rounded-xl shadow-lg">Save Registration</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Notice Modal */}
      <AnimatePresence>
        {showNoticeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNoticeModal(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 shadow-2xl">
              <h2 className="text-2xl font-black text-primary-orange mb-6">Post Notice</h2>
              <form onSubmit={handleNoticeSubmit} className="space-y-4">
                <input type="text" placeholder="Notice Title" required value={newNotice.title} onChange={(e) => setNewNotice({...newNotice, title: e.target.value})} className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-primary-orange" />
                <textarea placeholder="Notice Details" required rows={4} value={newNotice.content} onChange={(e) => setNewNotice({...newNotice, content: e.target.value})} className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-primary-orange resize-none" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="date" required value={newNotice.date} onChange={(e) => setNewNotice({...newNotice, date: e.target.value})} className="w-full px-4 py-3 bg-gray-50 rounded-xl" />
                  <select value={newNotice.priority} onChange={(e) => setNewNotice({...newNotice, priority: e.target.value as any})} className="w-full px-4 py-3 bg-gray-50 rounded-xl">
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-3 bg-primary-orange text-white font-black rounded-xl shadow-lg">Post to Board</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
