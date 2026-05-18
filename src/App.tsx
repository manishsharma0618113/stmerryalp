import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Admission } from './pages/Admission';
import { Facilities } from './pages/Facilities';
import { Gallery } from './pages/Gallery';
import { AnnualDay } from './pages/AnnualDay';
import { SportsMeet } from './pages/SportsMeet';
import { ScienceFair } from './pages/ScienceFair';
import { GroupPhoto } from './pages/GroupPhoto';
import { Faculty } from './pages/Faculty';
import { Contact } from './pages/Contact';
import { Login } from './pages/Login';
import { NoticeBoard } from './pages/NoticeBoard';
import { ScrollToTop } from './components/ScrollToTop';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminMessages } from './pages/AdminMessages';
import { AdminSettings } from './pages/AdminSettings';
import { AuthProvider, useAuth } from './context/AuthContext';

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!user || !isAdmin) return <Navigate to="/login/admin" />;
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col selection:bg-primary-orange selection:text-white">
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/admission" element={<Admission />} />
              <Route path="/facilities" element={<Facilities />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/gallery/annual-day" element={<AnnualDay />} />
              <Route path="/gallery/sports-meet" element={<SportsMeet />} />
              <Route path="/gallery/science-fair" element={<ScienceFair />} />
              <Route path="/gallery/group-photo" element={<GroupPhoto />} />
              <Route path="/faculty" element={<Faculty />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/notices" element={<NoticeBoard />} />
              <Route path="/login/:type" element={<Login />} />
              <Route 
                path="/admin/dashboard" 
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } 
              />
              <Route 
                path="/admin/messages" 
                element={
                  <AdminRoute>
                    <AdminMessages />
                  </AdminRoute>
                } 
              />
              <Route 
                path="/admin/settings" 
                element={
                  <AdminRoute>
                    <AdminSettings />
                  </AdminRoute>
                } 
              />
            </Routes>
          </main>
          <Footer />
          <ScrollToTop />
        </div>
      </Router>
    </AuthProvider>
  );
}
