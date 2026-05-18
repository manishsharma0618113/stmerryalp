import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, GraduationCap, LogOut, User, Mail, Phone } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsOpen(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Notice Board', path: '/notices' },
    { name: 'About', path: '/about' },
    { name: 'Admission', path: '/admission' },
    { name: 'Facilities', path: '/facilities' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Faculty', path: '/faculty' },
    { name: 'Contact Us', path: '/contact' },
  ];

  if (isAdmin) {
    navLinks.push({ name: 'Admin Dashboard', path: '/admin/dashboard' });
  }

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'}`}>
      <div className="w-full px-4 sm:px-6 lg:px-12">
        <div className="flex justify-between items-center -ml-[11px]">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="flex items-center">
              <img src="https://lh3.googleusercontent.com/d/1ys56o3Q1Qx-QqUpmsONl8_0fHcGwm08u" alt="St. Merry Logo" className="h-[64px] w-[59px] -ml-[4px] object-contain" onError={(e) => e.currentTarget.src = 'https://placehold.co/200x200?text=St.+Merry+Logo'} />
              </div>
              <div>
                <h1 
                  className="font-bold leading-[21px] text-primary-blue"
                  style={{ fontSize: '23px', width: '117.95px' }}
                >
                  ST. MERRY
                </h1>
                <p 
                  className="leading-[18px] font-medium tracking-widest text-primary-orange uppercase"
                  style={{ fontSize: '15px' }}
                >
                  High School
                </p>
              </div>
            </Link>

            {/* Desktop Contact Info */}
            <div 
              className="hidden lg:flex items-center space-x-6 border-l border-gray-200 pl-8" 
              style={{ marginLeft: '0px', marginTop: '-1px', paddingLeft: '23px', paddingRight: '7px', paddingBottom: '6px', marginRight: '1px' }}
            >
              <a href="mailto:stmerry777@gmail.com" className="flex items-center space-x-3 group/contact">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover/contact:bg-primary-blue transition-all duration-300">
                  <Mail size={18} className="text-primary-blue group-hover/contact:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-black text-gray-400 leading-none mb-1">Email Us</p>
                  <p className="text-sm font-black text-primary-blue leading-none">stmerry777@gmail.com</p>
                </div>
              </a>
              <a href="tel:9934062897" className="flex items-center space-x-3 group/contact">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center group-hover/contact:bg-primary-orange transition-all duration-300">
                  <Phone size={18} className="text-primary-orange group-hover/contact:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-black text-gray-400 leading-none mb-1">Call Us</p>
                  <p className="text-sm font-black text-primary-blue leading-none">9934062897</p>
                </div>
              </a>
            </div>
          </div>

          {/* Desktop Nav */}
          <div 
            className="hidden md:flex items-center space-x-6 bg-white/80 backdrop-blur-md px-6 py-2 rounded-full border border-gray-200 shadow-sm ring-1 ring-black/5"
            style={{ marginRight: '-39px' }}
          >
            <div className="flex items-center space-x-6">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  to={link.path} 
                  className="text-sm font-bold text-gray-700 hover:text-primary-blue transition-colors relative group/link"
                >
                  {link.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-blue transition-all group-hover/link:w-full"></span>
                </Link>
              ))}
            </div>
            <div className="h-6 w-px bg-gray-200 mx-2"></div>
            <div className="flex items-center space-x-3">
              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-full border border-blue-100">
                    <User className="w-3.5 h-3.5 text-primary-blue" />
                    <span className="text-xs font-bold text-primary-blue max-w-[100px] truncate">{user.displayName || user.email?.split('@')[0]}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-xs font-bold text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link to="/login/student" className="btn-outline-blue !px-4 !py-1 text-xs !rounded-full">Student</Link>
                  <Link to="/login/admin" className="btn-green !px-4 !py-1 text-xs !rounded-full shadow-none hover:shadow-md">Admin</Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile contact & menu */}
          <div className="md:hidden flex items-center space-x-2">
            <div className="flex items-center space-x-2 mr-2">
              <a href="mailto:stmerry777@gmail.com" className="p-2 bg-blue-50 text-primary-blue rounded-lg">
                <Mail size={18} />
              </a>
              <a href="tel:9934062897" className="p-2 bg-orange-50 text-primary-orange rounded-lg">
                <Phone size={18} />
              </a>
            </div>
            <button onClick={() => setIsOpen(!isOpen)} className="text-primary-blue p-2">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-blue"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              {/* Mobile Contact Info */}
              <div className="pt-4 pb-2 border-t border-gray-100 flex flex-col gap-3">
                <a href="mailto:stmerry777@gmail.com" className="flex items-center space-x-3 p-3 bg-blue-50 rounded-xl">
                  <Mail size={18} className="text-primary-blue" />
                  <p className="text-sm font-bold text-primary-blue">stmerry777@gmail.com</p>
                </a>
                <a href="tel:9934062897" className="flex items-center space-x-3 p-3 bg-orange-50 rounded-xl">
                  <Phone size={18} className="text-primary-orange" />
                  <p className="text-sm font-bold text-primary-blue">9934062897</p>
                </a>
              </div>

              <div className="mt-4 px-3 space-y-4">
                {user ? (
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-xl">
                      <User className="text-primary-blue" />
                      <div>
                        <p className="text-sm font-bold text-gray-900">{user.displayName || 'Student'}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="w-full btn-outline-orange flex items-center justify-center gap-2 !py-3"
                    >
                      <LogOut size={18} /> Logout
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <Link to="/login/student" className="btn-outline-blue text-center !text-sm" onClick={() => setIsOpen(false)}>Student</Link>
                    <Link to="/login/admin" className="btn-green text-center !text-sm" onClick={() => setIsOpen(false)}>Admin</Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
