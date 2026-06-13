import { motion } from 'framer-motion';
import Logo from '../Logo/Logo';
import styles from './SplashScreen.module.css';

const SplashScreen = () => (
  <motion.div
    className={styles.splash}
    initial={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.4 }}
  >
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Logo size="lg" />
    </motion.div>
    <motion.p
      className={styles.tagline}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      Organize. Reflect. Grow.
    </motion.p>
    <motion.div
      className={styles.loader}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    />
  </motion.div>
);

export default SplashScreen;
