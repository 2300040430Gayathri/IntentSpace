import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { IoSearch, IoArrowBack } from 'react-icons/io5';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';
import Card from '../../components/Card/Card';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import { NotepadSkeleton } from '../../components/Loader/Loader';
import styles from './AdminFeedback.module.css';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'ui', label: 'UI Improvement' },
  { value: 'performance', label: 'Performance Issue' },
  { value: 'general', label: 'General Feedback' },
];

const STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_review', label: 'In Review' },
  { value: 'planned', label: 'Planned' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
];

const PRIORITIES = [
  { value: '', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const STATUS_ACTIONS = [
  { value: 'pending', label: 'Mark Pending' },
  { value: 'in_review', label: 'Mark In Review' },
  { value: 'planned', label: 'Mark Planned' },
  { value: 'completed', label: 'Mark Completed' },
  { value: 'rejected', label: 'Mark Rejected' },
];

const AdminFeedback = () => {
  const [items, setItems] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ search: '', category: '', status: '', priority: '' });
  const [loading, setLoading] = useState(true);

  const loadData = async (params = filters) => {
    setLoading(true);
    try {
      const [fb, an] = await Promise.all([
        adminAPI.getFeedback(params),
        adminAPI.getFeedbackAnalytics(),
      ]);
      setItems(fb.data.data);
      setAnalytics(an.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleFilter = () => loadData(filters);

  const updateStatus = async (id, status) => {
    try {
      await adminAPI.updateFeedbackStatus(id, status);
      toast.success('Status updated');
      setSelected(null);
      loadData();
    } catch {
      toast.error('Failed to update status');
    }
  };

  if (loading) return <NotepadSkeleton />;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link to="/admin" className={styles.back}><IoArrowBack /> Admin Dashboard</Link>
        <h2>Feedback Management</h2>
        <p className={styles.sub}>Review and manage user feedback</p>
      </div>

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <span className={styles.statValue}>{analytics?.total || 0}</span>
          <span className={styles.statLabel}>Total Feedback</span>
        </Card>
        <Card className={styles.statCard}>
          <span className={styles.statValue}>{analytics?.byCategory?.feature || 0}</span>
          <span className={styles.statLabel}>Feature Requests</span>
        </Card>
        <Card className={styles.statCard}>
          <span className={styles.statValue}>{analytics?.byCategory?.bug || 0}</span>
          <span className={styles.statLabel}>Bug Reports</span>
        </Card>
        <Card className={styles.statCard}>
          <span className={styles.statValue}>{analytics?.byStatus?.pending || 0}</span>
          <span className={styles.statLabel}>Pending</span>
        </Card>
      </div>

      {analytics?.trends?.length > 0 && (
        <Card className={styles.chartCard}>
          <h3>Feedback Trends (30 days)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={analytics.trends}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      <Card className={styles.filters}>
        <div className={styles.filterRow}>
          <Input placeholder="Search feedback..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} icon={<IoSearch />} />
          <select className={styles.select} value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select className={styles.select} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select className={styles.select} value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
            {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <Button variant="outline" onClick={handleFilter}>Filter</Button>
        </div>
      </Card>

      <div className={styles.layout}>
        <Card className={styles.list}>
          <h3>All Feedback ({items.length})</h3>
          <div className={styles.items}>
            {items.map((item) => (
              <button
                key={item._id}
                type="button"
                className={`${styles.item} ${selected?._id === item._id ? styles.active : ''}`}
                onClick={() => setSelected(item)}
              >
                <strong>{item.title}</strong>
                <span className={styles.itemMeta}>{item.user?.name} · {item.status}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card className={styles.detail}>
          {selected ? (
            <>
              <h3>{selected.title}</h3>
              <div className={styles.detailMeta}>
                <p><strong>User:</strong> {selected.user?.name} ({selected.user?.email})</p>
                <p><strong>Category:</strong> {selected.category} · <strong>Priority:</strong> {selected.priority}</p>
                <p><strong>Submitted:</strong> {format(new Date(selected.createdAt), 'MMM d, yyyy HH:mm')}</p>
                <p><strong>Status:</strong> {selected.status}</p>
              </div>
              <p className={styles.description}>{selected.description}</p>
              {selected.screenshot && (
                <img src={selected.screenshot} alt="Screenshot" className={styles.screenshot} />
              )}
              <div className={styles.actions}>
                {STATUS_ACTIONS.map((a) => (
                  <Button
                    key={a.value}
                    variant={selected.status === a.value ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => updateStatus(selected._id, a.value)}
                  >
                    {a.label}
                  </Button>
                ))}
              </div>
            </>
          ) : (
            <p className={styles.empty}>Select feedback to view details</p>
          )}
        </Card>
      </div>

      <div className={styles.analyticsGrid}>
        <Card>
          <h3>Most Requested Features</h3>
          {(analytics?.featureRequests || []).slice(0, 5).map((f) => (
            <div key={f._id} className={styles.analyticsItem}>{f.title} <span>({f.status})</span></div>
          ))}
          {!analytics?.featureRequests?.length && <p className={styles.empty}>No feature requests yet</p>}
        </Card>
        <Card>
          <h3>Most Reported Bugs</h3>
          {(analytics?.bugReports || []).slice(0, 5).map((b) => (
            <div key={b._id} className={styles.analyticsItem}>{b.title} <span>({b.status})</span></div>
          ))}
          {!analytics?.bugReports?.length && <p className={styles.empty}>No bug reports yet</p>}
        </Card>
        {analytics?.byCategory && (
          <Card>
            <h3>By Category</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={Object.entries(analytics.byCategory).map(([k, v]) => ({ name: k, count: v }))}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminFeedback;
