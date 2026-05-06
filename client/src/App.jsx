import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout/Layout';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TestPage from './pages/TestPage';
import CodingEditor from './pages/CodingEditor';
import PracticePage from './pages/PracticePage';
import ResultsPage from './pages/ResultsPage';
import Leaderboard from './pages/Leaderboard';
import AdminPanel from './pages/AdminPanel';
import ResumePage from './pages/ResumePage';
import MockInterviewPage from './pages/MockInterviewPage';
import CoreSubjectsPage from './pages/CoreSubjectsPage';
import ProfilePage from './pages/ProfilePage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/test" element={<ProtectedRoute><TestPage /></ProtectedRoute>} />
      <Route path="/coding" element={<ProtectedRoute><CodingEditor /></ProtectedRoute>} />
      <Route path="/practice" element={<ProtectedRoute><PracticePage /></ProtectedRoute>} />
      <Route path="/results" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
      <Route path="/resume" element={<ProtectedRoute><ResumePage /></ProtectedRoute>} />
      <Route path="/core" element={<ProtectedRoute><CoreSubjectsPage /></ProtectedRoute>} />
      <Route path="/interview" element={<ProtectedRoute><MockInterviewPage /></ProtectedRoute>} />
      <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: '#0f172a', color: '#f8fafc', border: '1px solid rgba(148, 163, 184, 0.35)', borderRadius: '12px', fontFamily: "'Manrope', 'DM Sans', sans-serif" },
              success: { iconTheme: { primary: '#10b981', secondary: '#0f172a' } },
              error: { iconTheme: { primary: '#f43f5e', secondary: '#0f172a' } },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
