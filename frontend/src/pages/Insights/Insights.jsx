import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { IoSparkles } from 'react-icons/io5';
import { insightsAPI, aiAPI } from '../../services/api';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import { DashboardSkeleton } from '../../components/Loader/Loader';
import styles from './Insights.module.css';

const COLORS = ['#2563EB', '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
const MOOD_COLORS = { great: '#10B981', good: '#2563EB', okay: '#F59E0B', low: '#EF4444' };

const Insights = () => {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('monthly');
  const [aiReport, setAiReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    insightsAPI.get({ period }).then(({ data: res }) => setData(res.data)).finally(() => setLoading(false));
  }, [period]);

  const loadAIReport = async () => {
    const type = period === 'weekly' ? 'weekly_summary' : 'daily_summary';
    const { data: res } = await aiAPI.generate(type);
    setAiReport(res.data);
  };

  if (loading) return <DashboardSkeleton />;
  if (!data) return null;

  const focusData = Object.entries(data.focus?.byDay || {}).map(([date, minutes]) => ({ date: date.slice(5), minutes }));
  const habitData = Object.entries(data.habits?.byDay || {}).map(([date, count]) => ({ date: date.slice(5), count }));
  const moodData = Object.entries(data.moods || {}).map(([mood, count]) => ({ mood, count }));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2>Insights</h2>
          <p className={styles.sub}>Analytics & growth reports</p>
        </div>
        <div className={styles.headerActions}>
          {['weekly', 'monthly'].map((p) => (
            <button key={p} className={`${styles.periodBtn} ${period === p ? styles.active : ''}`} onClick={() => setPeriod(p)}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
          <Button variant="outline" icon={<IoSparkles />} onClick={loadAIReport}>AI Report</Button>
        </div>
      </div>

      {aiReport && (
        <Card className={styles.aiCard}>
          <p style={{ whiteSpace: 'pre-line' }}>{aiReport.content}</p>
          <Button variant="ghost" size="sm" onClick={() => setAiReport(null)}>Dismiss</Button>
        </Card>
      )}

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <span className={styles.statIcon}>✅</span>
          <span className={styles.statValue}>{data.habits?.total || 0}</span>
          <span className={styles.statLabel}>Habit Completions</span>
        </Card>
        <Card className={styles.statCard}>
          <span className={styles.statIcon}>📋</span>
          <span className={styles.statValue}>{data.tasks?.completed || 0}</span>
          <span className={styles.statLabel}>Tasks Done</span>
        </Card>
        <Card className={styles.statCard}>
          <span className={styles.statIcon}>⏱️</span>
          <span className={styles.statValue}>{data.focus?.totalMinutes || 0}</span>
          <span className={styles.statLabel}>Focus Minutes</span>
        </Card>
        <Card className={styles.statCard}>
          <span className={styles.statIcon}>📸</span>
          <span className={styles.statValue}>{data.memories?.count || 0}</span>
          <span className={styles.statLabel}>Memories</span>
        </Card>
      </div>

      <div className={styles.charts}>
        <Card>
          <h3>Focus Time</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={focusData}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="minutes" fill="#2563EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3>Habit Activity</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={habitData}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3>Mood Distribution</h3>
          {moodData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={moodData} dataKey="count" nameKey="mood" cx="50%" cy="50%" outerRadius={70} label>
                  {moodData.map((entry) => (
                    <Cell key={entry.mood} fill={MOOD_COLORS[entry.mood] || COLORS[0]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className={styles.empty}>No mood data yet</p>
          )}
        </Card>

        <Card>
          <h3>Skill Practice</h3>
          <div className={styles.skillStat}>
            <span className={styles.bigNum}>{data.skills?.practiceSessions || 0}</span>
            <span>practice sessions</span>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Insights;
