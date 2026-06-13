import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import SplashScreen from './components/SplashScreen/SplashScreen';
import Loader from './components/Loader/Loader';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import AdminRoute from './components/AdminRoute/AdminRoute';
import DashboardLayout from './layouts/DashboardLayout';

// Lazy load pages for code splitting
const Login = lazy(() => import('./pages/Login/Login'));
const Signup = lazy(() => import('./pages/Signup/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail/VerifyEmail'));
const VerifyOtp = lazy(() => import('./pages/VerifyOtp/VerifyOtp'));
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const Habits = lazy(() => import('./pages/Habits/Habits'));
const Tasks = lazy(() => import('./pages/Tasks/Tasks'));
const Planner = lazy(() => import('./pages/Planner/Planner'));
const Notepad = lazy(() => import('./pages/Notepad/Notepad'));
const Diary = lazy(() => import('./pages/Diary/Diary'));
const Progress = lazy(() => import('./pages/Progress/Progress'));
const Memories = lazy(() => import('./pages/Memories/Memories'));
const Skills = lazy(() => import('./pages/Skills/Skills'));
const Focus = lazy(() => import('./pages/Focus/Focus'));
const Voice = lazy(() => import('./pages/Voice/Voice'));
const Insights = lazy(() => import('./pages/Insights/Insights'));
const Admin = lazy(() => import('./pages/Admin/Admin'));
const AdminFeedback = lazy(() => import('./pages/Admin/AdminFeedback'));
const Feedback = lazy(() => import('./pages/Feedback/Feedback'));
const Settings = lazy(() => import('./pages/Settings/Settings'));

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
          <Suspense fallback={<Loader fullPage size="lg" />}>
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
          </Suspense>
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
