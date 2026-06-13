import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IoMail, IoLockClosed, IoPerson } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import Logo from '../../components/Logo/Logo';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import OtpVerification from '../../components/OtpVerification/OtpVerification';
import styles from './Signup.module.css';

const Signup = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', password: '', bio: '', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
  const [loading, setLoading] = useState(false);
  const { register, saveAuthAfterVerify } = useAuth();
  const navigate = useNavigate();

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleStep1 = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      setStep(2);
      toast.success('OTP sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerified = (data) => {
    saveAuthAfterVerify(data.token, data.user);
    setStep(3);
  };

  const handleStep3 = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.updateProfile({ bio: form.bio, timezone: form.timezone });
      toast.success('Profile setup complete!');
      navigate('/dashboard');
    } catch {
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const steps = ['Account', 'Verify OTP', 'Profile'];

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Logo size="md" />
        <div className={styles.steps}>
          {steps.map((s, i) => (
            <div key={s} className={`${styles.step} ${step > i + 1 ? styles.done : ''} ${step === i + 1 ? styles.active : ''}`}>
              <span className={styles.stepNum}>{step > i + 1 ? '✓' : i + 1}</span>
              <span>{s}</span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form key="step1" className={styles.form} onSubmit={handleStep1} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2>Create your account</h2>
              <p className={styles.sub}>Start organizing your life with IntentSpace</p>
              <Input label="Full Name" value={form.name} onChange={update('name')} icon={<IoPerson />} required />
              <Input label="Email" type="email" value={form.email} onChange={update('email')} icon={<IoMail />} required />
              <Input label="Password" type="password" value={form.password} onChange={update('password')} icon={<IoLockClosed />} required />
              <Button type="submit" fullWidth loading={loading} size="lg">Continue</Button>
            </motion.form>
          )}

          {step === 2 && (
            <motion.div key="step2" className={styles.form} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2>Verify your email</h2>
              <OtpVerification email={form.email} onVerified={handleOtpVerified} />
            </motion.div>
          )}

          {step === 3 && (
            <motion.form key="step3" className={styles.form} onSubmit={handleStep3} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2>Set up your profile</h2>
              <p className={styles.sub}>Tell us a bit about yourself</p>
              <div className={styles.field}>
                <label>Bio</label>
                <textarea className={styles.textarea} value={form.bio} onChange={update('bio')} placeholder="A few words about your goals..." rows={3} />
              </div>
              <Input label="Timezone" value={form.timezone} onChange={update('timezone')} />
              <Button type="submit" fullWidth loading={loading} size="lg">Get Started</Button>
            </motion.form>
          )}
        </AnimatePresence>

        <p className={styles.loginLink}>Already have an account? <Link to="/login">Sign In</Link></p>
      </div>
    </div>
  );
};

export default Signup;
