import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { IoMail, IoLockClosed, IoLogoGoogle } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../../components/Logo/Logo';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import styles from './Login.module.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const remembered = localStorage.getItem('rememberEmail');
    if (remembered) {
      setEmail(remembered);
      setRemember(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      if (remember) {
        localStorage.setItem('rememberEmail', email);
      } else {
        localStorage.removeItem('rememberEmail');
      }
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.requiresVerification) {
        toast.error('Please verify your email with the OTP sent to you');
        navigate(`/verify-otp?email=${encodeURIComponent(err.response.data.email || email)}`);
        return;
      }
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.brand}
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Logo size="lg" variant="light" />
        <h1 className={styles.brandTitle}>IntentSpace</h1>
        <p className={styles.brandSubtitle}>
          Organize your life.<br />
          Track your growth.<br />
          Remember your journey.
        </p>
        <div className={styles.illustration}>
          <motion.div className={styles.float1} animate={{ y: [0, -15, 0] }} transition={{ duration: 4, repeat: Infinity }}>📈</motion.div>
          <motion.div className={styles.float2} animate={{ y: [0, 12, 0] }} transition={{ duration: 3.5, repeat: Infinity }}>✨</motion.div>
          <motion.div className={styles.float3} animate={{ y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity }}>🎯</motion.div>
          <div className={styles.centralOrb} />
        </div>
      </motion.div>

      <motion.div
        className={styles.formSide}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <button className={styles.themeToggle} onClick={toggleTheme}>
          {isDark ? '☀️' : '🌙'}
        </button>

        <div className={styles.formWrap}>
          <h2>Welcome back</h2>
          <p className={styles.formSub}>Sign in to continue your journey</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              icon={<IoMail />}
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={<IoLockClosed />}
              required
            />

            <div className={styles.options}>
              <label className={styles.remember}>
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                Remember me
              </label>
              <Link to="/forgot-password" className={styles.forgotLink}>Forgot password?</Link>
            </div>

            <Button type="submit" fullWidth loading={loading} size="lg">Sign In</Button>
          </form>

          <div className={styles.divider}><span>or</span></div>

          <Button variant="outline" fullWidth icon={<IoLogoGoogle />} onClick={() => toast('Google login coming soon!')}>
            Continue with Google
          </Button>

          <p className={styles.signupLink}>
            Don't have an account? <Link to="/signup">Create Account</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
