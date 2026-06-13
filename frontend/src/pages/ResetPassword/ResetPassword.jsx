import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { IoLockClosed, IoMail, IoKeypad } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/Logo/Logo';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import styles from './ResetPassword.module.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { saveAuthAfterVerify } = useAuth();

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Email is required');
      return;
    }
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP verification code');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authAPI.resetPassword({ email, token: otp, password });
      if (data.token && data.user) {
        saveAuthAfterVerify(data.token, data.user);
        toast.success('Password reset successfully!');
        navigate('/dashboard');
      } else {
        toast.success('Password reset successfully! Please log in.');
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <Logo size="md" />
        <h2>Reset password</h2>
        <p className={styles.sub}>Enter your verification code and new password</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            icon={<IoMail />}
            required
          />
          <Input
            label="Verification Code (6-digit OTP)"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            icon={<IoKeypad />}
            maxLength={6}
            required
          />
          <Input
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            icon={<IoLockClosed />}
            required
          />
          <Input
            label="Confirm Password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            icon={<IoLockClosed />}
            required
          />
          <Button type="submit" fullWidth loading={loading}>Reset Password</Button>
        </form>
        <Link to="/login" className={styles.back} style={{ display: 'block', textAlign: 'center', marginTop: '1rem' }}>
          ← Back to Login
        </Link>
      </Card>
    </div>
  );
};

export default ResetPassword;
