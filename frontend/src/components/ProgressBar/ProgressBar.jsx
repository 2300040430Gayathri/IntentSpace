import { motion } from 'framer-motion';
import styles from './ProgressBar.module.css';

const ProgressBar = ({ value = 0, max = 100, color, label, showValue = true, size = 'md' }) => {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className={styles.wrapper}>
      {(label || showValue) && (
        <div className={styles.header}>
          {label && <span className={styles.label}>{label}</span>}
          {showValue && <span className={styles.value}>{pct}%</span>}
        </div>
      )}
      <div className={`${styles.track} ${styles[size]}`}>
        <motion.div
          className={styles.fill}
          style={{ background: color || 'var(--primary)' }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
