import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/Logo/Logo';
import OtpVerification from '../../components/OtpVerification/OtpVerification';
import styles from './VerifyOtp.module.css';

const VerifyOtp = () => {
  const [params] = useSearchParams();
  const email = params.get('email') || '';
  const { saveAuthAfterVerify } = useAuth();

  const handleVerified = (data) => {
    saveAuthAfterVerify(data.token, data.user);
    window.location.href = '/dashboard';
  };

  if (!email) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <Logo size="md" />
          <p className={styles.error}>No email provided. Please sign up or log in first.</p>
          <Link to="/signup">Go to Sign Up</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Logo size="md" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2>Verify your email</h2>
          <OtpVerification email={email} onVerified={handleVerified} autoSend />
        </motion.div>
        <p className={styles.link}>
          <Link to="/login">Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyOtp;
