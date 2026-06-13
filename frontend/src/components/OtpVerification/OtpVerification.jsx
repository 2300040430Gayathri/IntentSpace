import { useState, useEffect, useCallback } from 'react';
import { IoKeypad } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api';
import Input from '../Input/Input';
import Button from '../Button/Button';
import styles from './OtpVerification.module.css';

const OtpVerification = ({ email, onVerified, autoSend = false }) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [expiresIn, setExpiresIn] = useState(600);

  const startCountdown = useCallback((seconds = 600) => {
    setExpiresIn(seconds);
  }, []);

  useEffect(() => {
    if (expiresIn <= 0) return undefined;
    const timer = setInterval(() => setExpiresIn((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [expiresIn]);

  useEffect(() => {
    if (autoSend && email) {
      authAPI.resendOtp(email).then(({ data }) => {
        if (data.expiresIn) startCountdown(Math.floor(data.expiresIn / 1000));
      }).catch(() => {});
    }
  }, [autoSend, email, startCountdown]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authAPI.verifyOtp({ email, otp });
      toast.success('Email verified successfully!');
      onVerified?.(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      const { data } = await authAPI.resendOtp(email);
      toast.success('New OTP sent to your email');
      startCountdown(data.expiresIn ? Math.floor(data.expiresIn / 1000) : 600);
      setOtp('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleVerify}>
      <p className={styles.sub}>
        Enter the 6-digit code sent to <strong>{email}</strong>
      </p>

      <Input
        label="Verification Code"
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder="000000"
        icon={<IoKeypad />}
        maxLength={6}
        required
      />

      <div className={`${styles.timer} ${expiresIn <= 0 ? styles.expired : ''}`}>
        {expiresIn > 0 ? (
          <>Code expires in <strong>{formatTime(expiresIn)}</strong></>
        ) : (
          <>OTP expired. Please request a new code.</>
        )}
      </div>

      <Button type="submit" fullWidth loading={loading} size="lg" disabled={expiresIn <= 0}>
        Verify OTP
      </Button>

      <Button
        type="button"
        variant="outline"
        fullWidth
        onClick={handleResend}
        loading={resendLoading}
        disabled={expiresIn > 540}
      >
        Resend OTP
      </Button>
    </form>
  );
};

export default OtpVerification;
