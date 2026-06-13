import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IoMail } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api';
import Logo from '../../components/Logo/Logo';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import styles from './ForgotPassword.module.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      toast.success('Reset OTP sent if email exists');
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <Logo size="md" />
        <h2>Forgot password?</h2>
        <p className={styles.sub}>Enter your email and we'll send a verification code</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} icon={<IoMail />} required />
          <Button type="submit" fullWidth loading={loading}>Send Reset OTP</Button>
        </form>
        <Link to="/login" className={styles.back}>← Back to Login</Link>
      </Card>
    </div>
  );
};

export default ForgotPassword;
