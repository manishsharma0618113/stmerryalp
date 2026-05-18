import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Trash2, CheckCircle, Clock } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Message {
  id: string;
  fullName: string;
  email: string;
  subject: string;
  message: string;
  createdAt: any;
  read: boolean;
}

export const AdminMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
      setLoading(false);
      setError(null);
    }, (error: any) => {
      console.error('Messages monitor error:', error);
      if (error.code === 'resource-exhausted') {
        setError('Daily free database limit reached. No new messages can be loaded right now.');
      } else {
        setError('Could not connect to the recruitment system.');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const markAsRead = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'messages', id), {
        read: !currentStatus
      });
    } catch (error) {
      console.error('Error updating message:', error);
    }
  };

  const deleteMessage = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await deleteDoc(doc(db, 'messages', id));
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleString();
  };

  return (
    <div className="pt-32 pb-20 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary-blue">Inquiry Messages</h1>
            <p className="text-gray-600">Review and manage contact form submissions.</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
            <span className="text-sm font-medium text-gray-500">Total Messages: </span>
            <span className="text-lg font-bold text-primary-orange">{messages.length}</span>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700">
            <Mail className="shrink-0" size={20} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20 glass-card">
            <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900">No messages found</h3>
            <p className="text-gray-500">Contact form submissions will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass-card p-6 border-l-4 ${message.read ? 'border-gray-300 opacity-75' : 'border-primary-orange'}`}
              >
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                        message.subject.includes('Admission') ? 'bg-orange-100 text-orange-600' : 
                        message.subject.includes('Fees') ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {message.subject}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{message.fullName}</h3>
                    <p className="text-sm text-primary-blue mb-4">{message.email}</p>
                    <div className="bg-gray-50 p-4 rounded-lg text-gray-700 whitespace-pre-wrap italic">
                      "{message.message}"
                    </div>
                  </div>
                  <div className="flex md:flex-col gap-2 shrink-0">
                    <button
                      onClick={() => markAsRead(message.id, message.read)}
                      className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
                        message.read ? 'bg-gray-100 text-gray-400 hover:bg-gray-200' : 'bg-green-100 text-green-600 hover:bg-green-200'
                      }`}
                      title={message.read ? 'Mark as unread' : 'Mark as read'}
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => deleteMessage(message.id)}
                      className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors flex items-center justify-center"
                      title="Delete message"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
