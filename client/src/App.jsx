import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Named and default page imports
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { EventDetailsPage } from './pages/EventDetailsPage';
import { SeatBookingPage } from './pages/SeatBookingPage';
import { UserDashboardPage } from './pages/UserDashboardPage';
import { OrganizerDashboardPage } from './pages/OrganizerDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import OrganizerLoginPage from './pages/OrganizerLoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AuthPage from './pages/AuthPage';

import { useState } from 'react';
import AiAssistantModal from './components/AiAssistantModal';

// ── Protected Route Wrapper ───────────────────────────────────────────────────
const ProtectedRoute = ({ children, allowedRoles, redirectTo = '/auth' }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#f84464] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-xs font-semibold">Verifying secure access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (allowedRoles) {
    const userRole = (user.role || '').toLowerCase();
    const isAllowed = allowedRoles.some(r => {
      const normAllowed = r.toLowerCase() === 'user' ? 'customer' : (r.toLowerCase() === 'coordinator' ? 'organizer' : r.toLowerCase());
      const normUser = userRole === 'user' ? 'customer' : (userRole === 'coordinator' ? 'organizer' : userRole);
      return normAllowed === normUser || normAllowed === userRole;
    });

    if (!isAllowed) {
      // Deny access and redirect appropriately based on role
      if (allowedRoles.includes('admin')) {
        return <Navigate to="/admin/login" replace />;
      }
      if (allowedRoles.includes('organizer') || allowedRoles.includes('coordinator')) {
        return <Navigate to="/organizer/login" replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

// ── Inner App Content ─────────────────────────────────────────────────────────
function AppContent() {
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#222222] flex flex-col">
      <Navbar onOpenAiChat={() => setAiOpen(true)} />
      <main className="flex-1">
        <Routes>
          {/* Public Customer Routes */}
          <Route path="/" element={<HomePage onOpenAiChat={() => setAiOpen(true)} />} />
          <Route path="/events/:id" element={<EventDetailsPage onOpenAiChat={() => setAiOpen(true)} />} />
          <Route path="/event/:id" element={<EventDetailsPage onOpenAiChat={() => setAiOpen(true)} />} />
          <Route path="/auth" element={<AuthPage />} />

          {/* Dedicated Portal Logins */}
          <Route path="/organizer/login" element={<OrganizerLoginPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Customer Protected Routes */}
          <Route path="/book/:showId" element={
            <ProtectedRoute redirectTo="/auth">
              <SeatBookingPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute redirectTo="/auth">
              <UserDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/user-dashboard" element={<Navigate to="/dashboard" replace />} />
          <Route path="/my-bookings" element={<Navigate to="/dashboard" replace />} />

          {/* Organizer Protected Routes */}
          <Route path="/organizer/dashboard" element={
            <ProtectedRoute allowedRoles={['organizer', 'coordinator', 'admin']} redirectTo="/organizer/login">
              <OrganizerDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/organizer" element={<Navigate to="/organizer/dashboard" replace />} />
          <Route path="/coordinator" element={<Navigate to="/organizer/dashboard" replace />} />
          <Route path="/coordinator-dashboard" element={<Navigate to="/organizer/dashboard" replace />} />

          {/* Admin Protected Routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']} redirectTo="/admin/login">
              <AdminDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />

      {/* Gemini AI Chat Modal */}
      <AiAssistantModal isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Toaster
            position="top-right"
            gutter={8}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#ffffff',
                color: '#222222',
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '600',
              },
              success: { iconTheme: { primary: '#f84464', secondary: '#fff' } },
              error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
            }}
          />
          <AppContent />
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}
