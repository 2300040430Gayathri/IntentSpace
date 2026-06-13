import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { IoAdd, IoTimer, IoCheckbox, IoBook } from 'react-icons/io5';
import { dashboardAPI } from '../../services/api';
import Card from '../../components/Card/Card';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import Loader, { Skeleton } from '../../components/Loader/Loader';
import { moodEmojis, priorityColors } from '../../utils/helpers';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.get().then(({ data: res }) => setData(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.page}><Skeleton height={200} /><Skeleton height={300} className={styles.mt} /></div>;
  if (!data) return <Loader fullPage size="lg" />;

  const quickActions = [
    { label: 'Add Task', icon: IoAdd, path: '/tasks', color: '#2563EB' },
    { label: 'Start Focus', icon: IoTimer, path: '/focus', color: '#4F46E5' },
    { label: 'Log Habit', icon: IoCheckbox, path: '/habits', color: '#10B981' },
    { label: 'Write Diary', icon: IoBook, path: '/diary', color: '#F59E0B' },
  ];

  return (
    <motion.div className={styles.page} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className={styles.grid}>
        <Card className={styles.aiCard}>
          <div className={styles.aiHeader}>
            <span>🤖</span>
            <h3>AI Summary</h3>
          </div>
          <p className={styles.aiText}>{data.aiSummary || 'Your daily summary will appear here.'}</p>
        </Card>

        <Card>
          <h3 className={styles.cardTitle}>Today's Tasks</h3>
          {data.todayTasks?.length === 0 ? (
            <p className={styles.empty}>No pending tasks. Great job!</p>
          ) : (
            <ul className={styles.taskList}>
              {data.todayTasks?.map((t) => (
                <li key={t._id} className={styles.taskItem}>
                  <span className={styles.priority} style={{ background: priorityColors[t.priority] }} />
                  {t.title}
                </li>
              ))}
            </ul>
          )}
          <Link to="/tasks" className={styles.viewAll}>View all tasks →</Link>
        </Card>

        <Card>
          <h3 className={styles.cardTitle}>Habit Streaks</h3>
          <div className={styles.habitList}>
            {data.habitStreaks?.map((h) => (
              <div key={h.name} className={styles.habitItem}>
                <span className={styles.habitIcon} style={{ background: `${h.color}20`, color: h.color }}>{h.icon}</span>
                <div className={styles.habitInfo}>
                  <span>{h.name}</span>
                  <span className={styles.streak}>🔥 {h.currentStreak} day streak</span>
                </div>
                <span className={`${styles.check} ${h.completedToday ? styles.checked : ''}`}>
                  {h.completedToday ? '✓' : '○'}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className={styles.cardTitle}>Focus Time</h3>
          <div className={styles.focusStat}>
            <span className={styles.focusNum}>{data.focusMinutes}</span>
            <span className={styles.focusUnit}>minutes today</span>
          </div>
          <p className={styles.focusSessions}>{data.focusSessions} sessions completed</p>
          <Link to="/focus"><ProgressBar value={data.focusMinutes} max={120} label="Daily goal (2h)" /></Link>
        </Card>

        <Card>
          <h3 className={styles.cardTitle}>Skill Progress</h3>
          {data.skills?.map((s) => (
            <ProgressBar key={s.name} value={s.progress} label={`${s.icon} ${s.name}`} color={s.color} className={styles.skillBar} />
          ))}
        </Card>

        <Card>
          <h3 className={styles.cardTitle}>Recent Memories</h3>
          {data.recentMemories?.length === 0 ? (
            <p className={styles.empty}>No memories yet. Start capturing moments!</p>
          ) : (
            data.recentMemories?.map((m) => (
              <div key={m._id} className={styles.memoryItem}>
                <span>{moodEmojis[m.mood] || '✨'}</span>
                <div>
                  <strong>{m.title}</strong>
                  <span className={styles.memoryDate}>{new Date(m.date).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </Card>

        <Card>
          <h3 className={styles.cardTitle}>Mood Today</h3>
          <div className={styles.moodDisplay}>
            {data.todayMood ? (
              <>
                <span className={styles.moodEmoji}>{moodEmojis[data.todayMood.mood]}</span>
                <span className={styles.moodLabel}>{data.todayMood.mood}</span>
              </>
            ) : (
              <p className={styles.empty}>No mood logged yet</p>
            )}
          </div>
        </Card>

        <Card className={styles.quickActions}>
          <h3 className={styles.cardTitle}>Quick Actions</h3>
          <div className={styles.actions}>
            {quickActions.map((a) => (
              <Link key={a.label} to={a.path} className={styles.actionBtn} style={{ '--action-color': a.color }}>
                <a.icon size={20} />
                <span>{a.label}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </motion.div>
  );
};

export default Dashboard;
