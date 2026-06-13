import styles from './Logo.module.css';

const Logo = ({ size = 'md', showText = true, variant = 'default' }) => {
  return (
    <div className={`${styles.logo} ${styles[size]} ${styles[variant]}`}>
      <svg viewBox="0 0 40 40" className={styles.icon} aria-hidden="true">
        <rect width="40" height="40" rx="10" fill="currentColor" className={styles.bg} />
        <path d="M20 8C20 8 12 15 12 23C12 27.4183 15.5817 31 20 31C24.4183 31 28 27.4183 28 23C28 15 20 8 20 8Z" fill="white" opacity="0.9" />
        <circle cx="20" cy="23" r="2.5" fill="#4F46E5" />
        <path d="M16 19L20 14L24 19" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {showText && (
        <div className={styles.text}>
          <span className={styles.name}>IntentSpace</span>
          {variant === 'sidebar' && <span className={styles.tagline}>Organize. Reflect. Grow.</span>}
        </div>
      )}
    </div>
  );
};

export default Logo;
