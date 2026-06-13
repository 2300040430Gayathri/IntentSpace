import { useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../../components/Button/Button';
import styles from '../Login/Login.module.css';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email');

  useEffect(() => {
    toast('Please use the OTP code sent to your email');
    navigate(email ? `/verify-otp?email=${encodeURIComponent(email)}` : '/verify-otp', { replace: true });
  }, [email, navigate]);

  return (
    <div className={styles.page} style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className={styles.formWrap} style={{ textAlign: 'center', maxWidth: 400 }}>
        <h2>Redirecting...</h2>
        <p className={styles.formSub}>Email verification now uses OTP codes.</p>
        <Link to="/verify-otp"><Button fullWidth>Go to OTP Verification</Button></Link>
      </div>
    </div>
  );
};

export default VerifyEmail;
