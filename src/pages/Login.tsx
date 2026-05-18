import { motion } from 'motion/react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogIn, ArrowLeft, UserPlus, AlertCircle } from 'lucide-react';
import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export const Login = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const portalType = type === 'admin' ? 'admin' : 'student';
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign Up
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await updateProfile(user, { displayName: fullName });
        
        // Save user to Firestore
        await setDoc(doc(db, 'users', user.uid), {
          userId: user.uid,
          email: user.email,
          fullName: fullName,
          role: (email === 'manishrana55589@gmail.com' || email === 'mmss741852@gmail.com' || email === 'stmerry777@gmail.com') ? 'admin' : 'student',
          createdAt: serverTimestamp(),
        });

        navigate((email === 'manishrana55589@gmail.com' || email === 'mmss741852@gmail.com' || email === 'stmerry777@gmail.com') ? '/admin/dashboard' : '/admission');
      } else {
        // Sign In
        await signInWithEmailAndPassword(auth, email, password);
        const isAdminLogin = email === 'manishrana55589@gmail.com' || email === 'mmss741852@gmail.com' || email === 'stmerry777@gmail.com';
        navigate(isAdminLogin ? '/admin/dashboard' : '/admission');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/invalid-credential') {
        setError(isSignUp ? 'Registration failed. Please check your details.' : 'Account not found or incorrect password. If you are a new admin, please Register first.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection or disable ad-blockers.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-20 min-h-screen bg-gray-50 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-blue/5 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-orange/5 rounded-full blur-[100px]"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <Link to="/" className="inline-flex items-center space-x-2 text-primary-blue hover:text-primary-orange transition-colors mb-6 font-medium">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        
        <div className="glass-card shadow-2xl border-white/50">
          <div className="text-center mb-10">
            <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-6 shadow-xl ${portalType === 'admin' ? 'bg-primary-blue text-white shadow-blue-200' : 'bg-primary-orange text-white shadow-orange-200'}`}>
              {portalType === 'admin' ? (isSignUp ? <UserPlus size={32} /> : <LayoutDashboard size={32} />) : (isSignUp ? <UserPlus size={32} /> : <LogIn size={32} />)}
            </div>
            <h2 className="text-3xl font-black text-primary-blue capitalize">
              {portalType} {isSignUp ? 'Registration' : 'Portal'}
            </h2>
            <p className="text-gray-500 mt-2">
              {isSignUp ? (portalType === 'admin' ? 'Create an admin account' : 'Create an account to apply for admission') : 'Enter your credentials to access the portal'}
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex flex-col space-y-2 text-red-600"
            >
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
              
              {/* Contextual help buttons */}
              {error === 'This email is already registered.' && (
                <button 
                  onClick={() => { setIsSignUp(false); setError(null); }}
                  className="text-xs font-bold underline text-left ml-8"
                >
                  Click here to Login instead
                </button>
              )}
              {error === 'No account found with these credentials or wrong password.' && !isSignUp && (
                <button 
                  onClick={() => { setIsSignUp(true); setError(null); }}
                  className="text-xs font-bold underline text-left ml-8"
                >
                  Click here to Register a new account
                </button>
              )}
            </motion.div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {isSignUp && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-100 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-primary-blue transition-all" 
                  placeholder="Enter your full name" 
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-100 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-primary-blue transition-all" 
                placeholder="Enter your email" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-100 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-primary-blue transition-all" 
                placeholder="••••••••" 
              />
            </div>
            {!isSignUp && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary-blue focus:ring-primary-blue" />
                  <span className="text-gray-600 group-hover:text-primary-blue transition-colors">Remember me</span>
                </label>
                <a href="#" className="text-primary-orange font-bold hover:underline">Forgot password?</a>
              </div>
            )}
            <button 
              disabled={loading}
              className={`w-full py-4 rounded-xl font-black text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 ${portalType === 'admin' ? 'bg-primary-blue hover:bg-blue-700 shadow-blue-100' : 'bg-primary-orange hover:bg-orange-600 shadow-orange-100'}`}
            >
              {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Login Now')}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              {' '}
              <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary-blue font-bold hover:underline"
              >
                {isSignUp ? 'Login instead' : 'Register here'}
              </button>
            </p>
          </div>

          <div className="mt-10 pt-8 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Need technical support? <br /> 
              <span className="text-primary-blue font-bold cursor-pointer hover:underline">Contact System Admin</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
