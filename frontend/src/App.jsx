import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import SplashScreen from './components/SplashScreen/SplashScreen';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import AdminRoute from './components/AdminRoute/AdminRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login/Login';
import Signup from './pages/Signup/Signup';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/ResetPassword/ResetPassword';
import VerifyEmail from './pages/VerifyEmail/VerifyEmail';
import VerifyOtp from './pages/VerifyOtp/VerifyOtp';
import Dashboard from './pages/Dashboard/Dashboard';
import Habits from './pages/Habits/Habits';
import Tasks from './pages/Tasks/Tasks';
import Planner from './pages/Planner/Planner';
import Notepad from './pages/Notepad/Notepad';
import Diary from './pages/Diary/Diary';
import Progress from './pages/Progress/Progress';
import Memories from './pages/Memories/Memories';
import Skills from './pages/Skills/Skills';
import Focus from './pages/Focus/Focus';
import Voice from './pages/Voice/Voice';
import Insights from './pages/Insights/Insights';
import Admin from './pages/Admin/Admin';
import AdminFeedback from './pages/Admin/AdminFeedback';
import Feedback from './pages/Feedback/Feedback';
import Settings from './pages/Settings/Settings';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <AnimatePresence>{showSplash && <SplashScreen />}</AnimatePresence>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />

            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/habits" element={<Habits />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/planner" element={<Planner />} />
              <Route path="/notepad" element={<Notepad />} />
              <Route path="/diary" element={<Diary />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/memories" element={<Memories />} />
              <Route path="/skills" element={<Skills />} />
              <Route path="/skills/:id" element={<Skills />} />
              <Route path="/focus" element={<Focus />} />
              <Route path="/voice" element={<Voice />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
              <Route path="/admin/feedback" element={<AdminRoute><AdminFeedback /></AdminRoute>} />
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--card)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              fontSize: '0.875rem',
            },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
