import styles from './Loader.module.css';

const Loader = ({ size = 'md', fullPage = false }) => {
  const loader = <div className={`${styles.loader} ${styles[size]}`} />;
  if (fullPage) {
    return <div className={styles.fullPage}>{loader}</div>;
  }
  return loader;
};

export const Skeleton = ({ width = '100%', height = 20, className = '', circle = false }) => (
  <div
    className={`${styles.skeleton} ${circle ? styles.skeletonCircle : ''} ${className}`}
    style={{
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height
    }}
  />
);

export const DashboardSkeleton = () => (
  <div className={styles.skeletonPage}>
    <div className={styles.skeletonHeader}>
      <div>
        <Skeleton width={200} height={28} />
        <Skeleton width={140} height={16} className={styles.mt} style={{ marginTop: '8px' }} />
      </div>
      <Skeleton width={120} height={40} />
    </div>

    {/* AI Card Skeleton */}
    <div className={styles.skeletonCard} style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.02), rgba(79,70,229,0.02))' }}>
      <div className={styles.skeletonRow}>
        <Skeleton width={24} height={24} circle />
        <Skeleton width={120} height={20} />
      </div>
      <Skeleton width="100%" height={16} />
      <Skeleton width="90%" height={16} />
      <Skeleton width="75%" height={16} />
    </div>

    {/* Grid Skeleton */}
    <div className={styles.skeletonGrid}>
      {[...Array(6)].map((_, i) => (
        <div key={i} className={styles.skeletonCard}>
          <Skeleton width="60%" height={20} />
          <div className={styles.skeletonList} style={{ marginTop: '8px' }}>
            <Skeleton width="100%" height={14} />
            <Skeleton width="90%" height={14} />
            <Skeleton width="80%" height={14} />
          </div>
          {i === 2 && <Skeleton width="100%" height={32} style={{ marginTop: '12px' }} />}
        </div>
      ))}
    </div>
  </div>
);

export const HabitsSkeleton = () => (
  <div className={styles.skeletonPage}>
    <div className={styles.skeletonHeader}>
      <div>
        <Skeleton width={180} height={28} />
        <Skeleton width={220} height={16} style={{ marginTop: '8px' }} />
      </div>
      <div className={styles.skeletonRow}>
        <Skeleton width={120} height={40} />
        <Skeleton width={120} height={40} />
      </div>
    </div>

    <div className={styles.skeletonLayoutSplit}>
      <div className={styles.skeletonList}>
        <Skeleton width={150} height={20} style={{ marginBottom: '12px' }} />
        {[...Array(3)].map((_, i) => (
          <div key={i} className={styles.skeletonCard}>
            <div className={styles.skeletonRow}>
              <Skeleton width={40} height={40} circle />
              <div style={{ flex: 1 }}>
                <Skeleton width="40%" height={16} />
                <Skeleton width="20%" height={12} style={{ marginTop: '6px' }} />
              </div>
            </div>
            <Skeleton width="100%" height={10} style={{ marginTop: '8px' }} />
            <Skeleton width="100%" height={38} style={{ marginTop: '12px' }} />
          </div>
        ))}
      </div>
      <div className={styles.skeletonCard} style={{ height: '340px' }}>
        <Skeleton width="80%" height={20} />
        <div className={styles.skeletonGrid} style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginTop: '20px' }}>
          {[...Array(35)].map((_, i) => (
            <Skeleton key={i} width="100%" height={24} circle={i % 5 === 0} />
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const TasksSkeleton = () => (
  <div className={styles.skeletonPage}>
    <div className={styles.skeletonHeader}>
      <div>
        <Skeleton width={120} height={28} />
        <Skeleton width={180} height={16} style={{ marginTop: '8px' }} />
      </div>
      <div className={styles.skeletonRow}>
        <Skeleton width={110} height={40} />
        <Skeleton width={110} height={40} />
      </div>
    </div>

    <div className={styles.skeletonRow} style={{ flexWrap: 'wrap', gap: '8px', margin: '8px 0' }}>
      <Skeleton width={80} height={32} style={{ borderRadius: '100px' }} />
      <Skeleton width={90} height={32} style={{ borderRadius: '100px' }} />
      <Skeleton width={100} height={32} style={{ borderRadius: '100px' }} />
    </div>

    <div className={styles.skeletonCard} style={{ padding: '16px' }}>
      <Skeleton width="100%" height={12} />
    </div>

    <div className={styles.skeletonList}>
      {[...Array(5)].map((_, i) => (
        <div key={i} className={styles.skeletonListItem}>
          <Skeleton width={18} height={18} />
          <Skeleton width={22} height={22} circle />
          <div style={{ flex: 1 }}>
            <Skeleton width={`${70 - i * 8}%`} height={16} />
            <div className={styles.skeletonRow} style={{ marginTop: '6px', gap: '6px' }}>
              <Skeleton width={60} height={12} />
              <Skeleton width={80} height={12} />
            </div>
          </div>
          <Skeleton width={30} height={14} />
          <Skeleton width={14} height={14} />
        </div>
      ))}
    </div>
  </div>
);

export const PlannerSkeleton = () => (
  <div className={styles.skeletonPage}>
    <div className={styles.skeletonHeader}>
      <div>
        <Skeleton width={180} height={28} />
        <Skeleton width={140} height={16} style={{ marginTop: '8px' }} />
      </div>
      <div className={styles.skeletonRow}>
        <Skeleton width={110} height={40} />
        <Skeleton width={110} height={40} />
      </div>
    </div>

    <div className={styles.skeletonCard} style={{ padding: '16px' }}>
      <Skeleton width="100%" height={16} />
    </div>

    <div className={styles.skeletonGrid} style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className={styles.skeletonCard}>
          <Skeleton width="40%" height={18} style={{ marginBottom: '8px' }} />
          <div className={styles.skeletonList}>
            <div className={styles.skeletonRow}>
              <Skeleton width={18} height={18} circle />
              <div style={{ flex: 1 }}>
                <Skeleton width="80%" height={14} />
                <Skeleton width="30%" height={10} style={{ marginTop: '4px' }} />
              </div>
            </div>
            <div className={styles.skeletonRow}>
              <Skeleton width={18} height={18} circle />
              <div style={{ flex: 1 }}>
                <Skeleton width="70%" height={14} />
                <Skeleton width="40%" height={10} style={{ marginTop: '4px' }} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const NotepadSkeleton = () => (
  <div className={styles.skeletonPage}>
    <div className={styles.skeletonHeader}>
      <div>
        <Skeleton width={160} height={28} />
        <Skeleton width={240} height={16} style={{ marginTop: '8px' }} />
      </div>
      <Skeleton width={120} height={40} />
    </div>

    <div className={styles.skeletonRow}>
      <Skeleton width={200} height={40} />
      <Skeleton width={100} height={40} />
    </div>

    <div className={styles.skeletonLayoutSplit} style={{ gridTemplateColumns: '280px 1fr' }}>
      <div className={styles.skeletonList}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className={styles.skeletonCard} style={{ padding: '12px', gap: '8px' }}>
            <Skeleton width="80%" height={14} />
            <Skeleton width="50%" height={10} />
          </div>
        ))}
      </div>
      <div className={styles.skeletonCard} style={{ height: '400px' }}>
        <div className={styles.skeletonHeader}>
          <Skeleton width="50%" height={24} />
          <div className={styles.skeletonRow} style={{ width: 'auto' }}>
            <Skeleton width={80} height={30} />
            <Skeleton width={80} height={30} />
          </div>
        </div>
        <Skeleton width="100%" height="200px" style={{ flex: 1 }} />
      </div>
    </div>
  </div>
);

export const DiarySkeleton = () => (
  <div className={styles.skeletonPage}>
    <div className={styles.skeletonHeader}>
      <div>
        <Skeleton width={100} height={28} />
        <Skeleton width={200} height={16} style={{ marginTop: '8px' }} />
      </div>
      <div className={styles.skeletonRow}>
        <Skeleton width={70} height={36} />
        <Skeleton width={70} height={36} />
        <Skeleton width={120} height={40} />
      </div>
    </div>

    <div className={styles.skeletonRow}>
      <Skeleton width="100%" height={40} />
      <Skeleton width={100} height={40} />
    </div>

    <div className={styles.skeletonLayoutSplit}>
      <div className={styles.skeletonList}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className={styles.skeletonCard}>
            <div className={styles.skeletonRow}>
              <Skeleton width={24} height={24} circle />
              <div style={{ flex: 1 }}>
                <Skeleton width="60%" height={16} />
                <Skeleton width="30%" height={12} style={{ marginTop: '4px' }} />
              </div>
            </div>
            <Skeleton width="100%" height={14} style={{ marginTop: '8px' }} />
            <Skeleton width="85%" height={14} />
          </div>
        ))}
      </div>
      <div className={styles.skeletonCard} style={{ height: '340px' }}>
        <Skeleton width="80%" height={20} />
        <div className={styles.skeletonGrid} style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginTop: '20px' }}>
          {[...Array(35)].map((_, i) => (
            <Skeleton key={i} width="100%" height={24} circle={i % 6 === 0} />
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const GenericPageSkeleton = () => (
  <div className={styles.skeletonPage}>
    <div className={styles.skeletonHeader}>
      <div>
        <Skeleton width={180} height={28} />
        <Skeleton width={140} height={16} style={{ marginTop: '8px' }} />
      </div>
      <Skeleton width={100} height={40} />
    </div>
    <div className={styles.skeletonGrid}>
      {[...Array(3)].map((_, i) => (
        <div key={i} className={styles.skeletonCard}>
          <Skeleton width="40%" height={20} />
          <Skeleton width="100%" height={14} />
          <Skeleton width="90%" height={14} />
          <Skeleton width="75%" height={14} />
        </div>
      ))}
    </div>
  </div>
);

export default Loader;
