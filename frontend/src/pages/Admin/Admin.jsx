import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { IoSearch, IoChatboxEllipses } from 'react-icons/io5';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { adminAPI } from '../../services/api';
import Card from '../../components/Card/Card';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import { DashboardSkeleton } from '../../components/Loader/Loader';
import styles from './Admin.module.css';

const Admin = () => {
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadData = async (searchTerm = search, pageNum = page) => {
    setLoading(true);
    try {
      const [ov, us, an] = await Promise.all([
        adminAPI.getOverview(),
        adminAPI.getUsers({ search: searchTerm, page: pageNum }),
        adminAPI.getAnalytics(),
      ]);
      setOverview(ov.data.data);
      setUsers(us.data.data);
      setPages(us.data.pages || 1);
      setAnalytics(an.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(search, page); }, [page]);

  const handleSearch = () => {
    setPage(1);
    loadData(search, 1);
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2>Admin Dashboard</h2>
          <p className={styles.sub}>Platform overview & user management</p>
        </div>
        <Link to="/admin/feedback" className={styles.feedbackLink}>
          <IoChatboxEllipses /> Manage Feedback
        </Link>
      </div>

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}><span className={styles.statValue}>{overview?.totalUsers || 0}</span><span className={styles.statLabel}>Total Users</span></Card>
        <Card className={styles.statCard}><span className={styles.statValue}>{overview?.activeUsers || 0}</span><span className={styles.statLabel}>Active Users (7d)</span></Card>
        <Card className={styles.statCard}><span className={styles.statValue}>{overview?.totalNotes || 0}</span><span className={styles.statLabel}>Total Notes</span></Card>
        <Card className={styles.statCard}><span className={styles.statValue}>{overview?.totalJournals || 0}</span><span className={styles.statLabel}>Total Journals</span></Card>
        <Card className={styles.statCard}><span className={styles.statValue}>{overview?.totalTasks || 0}</span><span className={styles.statLabel}>Total Tasks</span></Card>
        <Card className={styles.statCard}><span className={styles.statValue}>{overview?.totalFocus || 0}</span><span className={styles.statLabel}>Focus Sessions</span></Card>
      </div>

      <div className={styles.charts}>
        <Card>
          <h3>User Growth</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={analytics?.userGrowth || []}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h3>Journal Activity</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics?.journalStats || []}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h3>English Progress (Avg Score)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={analytics?.englishStats || []}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="avgScore" stroke="#8B5CF6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h3>Focus Time (minutes)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics?.focusByDay || []}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="minutes" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className={styles.section}>
        <h3>User Management</h3>
        <div className={styles.searchBar}>
          <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<IoSearch />} />
          <Button variant="outline" onClick={handleSearch}>Search</Button>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Verified</th>
              <th>Level</th>
              <th>Registered</th>
              <th>Last Login</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.isVerified ? '✓' : '—'}</td>
                <td>{u.englishLevel || '—'}</td>
                <td>{format(new Date(u.createdAt), 'MMM d, yyyy')}</td>
                <td>{u.lastLogin ? format(new Date(u.lastLogin), 'MMM d, yyyy') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {pages > 1 && (
          <div className={styles.pagination}>
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span>Page {page} of {pages}</span>
            <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Admin;
