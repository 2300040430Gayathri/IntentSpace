import styles from './Loader.module.css';

const Loader = ({ size = 'md', fullPage = false }) => {
  const loader = <div className={`${styles.loader} ${styles[size]}`} />;
  if (fullPage) {
    return <div className={styles.fullPage}>{loader}</div>;
  }
  return loader;
};

export const Skeleton = ({ width = '100%', height = 20, className = '' }) => (
  <div className={`${styles.skeleton} ${className}`} style={{ width, height }} />
);

export default Loader;
