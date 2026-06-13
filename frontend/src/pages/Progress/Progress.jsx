import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { progressAPI } from '../../services/api';
import Card from '../../components/Card/Card';
import Loader from '../../components/Loader/Loader';
import styles from './Progress.module.css';

const Progress = () => {
  const [data, setData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([progressAPI.getDashboard(), progressAPI.getTimeline()])
      .then(([dash, time]) => {
        setData(dash.data.data);
        setTimeline(time.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader fullPage />;
  if (!data) return null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2>Writing Progress</h2>
          <p className={styles.sub}>Track your English growth & writing streaks</p>
        </div>
        <span className={styles.levelBadge}>{data.englishLevel}</span>
      </div>

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <span className={styles.statValue}>🔥 {data.dailyStreak}</span>
          <span className={styles.statLabel}>Daily Streak</span>
        </Card>
        <Card className={styles.statCard}>
          <span className={styles.statValue}>{data.weeklyStreak}</span>
          <span className={styles.statLabel}>Active Days (Week)</span>
        </Card>
        <Card className={styles.statCard}>
          <span className={styles.statValue}>{data.totalEntries}</span>
          <span className={styles.statLabel}>Journal Entries</span>
        </Card>
        <Card className={styles.statCard}>
          <span className={styles.statValue}>{data.totalWords.toLocaleString()}</span>
          <span className={styles.statLabel}>Words Written</span>
        </Card>
        <Card className={styles.statCard}>
          <span className={styles.statValue}>{data.currentScore}</span>
          <span className={styles.statLabel}>English Score</span>
        </Card>
        <Card className={styles.statCard}>
          <span className={styles.statValue}>{data.improvementPct > 0 ? '+' : ''}{data.improvementPct}%</span>
          <span className={styles.statLabel}>Improvement</span>
        </Card>
      </div>

      <div className={styles.charts}>
        <Card>
          <h3>Weekly Scores</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.weeklyGraph}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#2563EB" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h3>Words Written (Monthly)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.monthlyGraph}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="words" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <h3>Skill Trends (Weekly Avg)</h3>
        <div className={styles.trends}>
          <div className={styles.trendItem}><span className={styles.trendNum}>{data.trends.grammar}</span>Grammar</div>
          <div className={styles.trendItem}><span className={styles.trendNum}>{data.trends.vocabulary}</span>Vocabulary</div>
          <div className={styles.trendItem}><span className={styles.trendNum}>{data.trends.writing}</span>Writing</div>
          <div className={styles.trendItem}><span className={styles.trendNum}>{data.trends.communication}</span>Communication</div>
        </div>
      </Card>

      <Card className={styles.timeline}>
        <h3>Journal Timeline</h3>
        {timeline.length === 0 ? (
          <p className={styles.sub}>Write your first journal entry to see your timeline.</p>
        ) : (
          timeline.map((entry) => (
            <div key={entry._id} className={styles.timelineItem}>
              <span className={styles.timelineDate}>{format(new Date(entry.date), 'MMM d, yyyy')}</span>
              <div className={styles.timelineContent}>
                <strong>{entry.title || 'Untitled'}</strong>
                <span className={styles.timelineMeta}>
                  {entry.englishAnalysis?.level || '—'} · Score: {entry.englishAnalysis?.scores?.overall || '—'}
                </span>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
};

export default Progress;
