import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { feedbackAPI } from '../../services/api';
import Card from '../../components/Card/Card';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import { GenericPageSkeleton } from '../../components/Loader/Loader';
import styles from './Feedback.module.css';

const CATEGORIES = [
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'ui', label: 'UI Improvement' },
  { value: 'performance', label: 'Performance Issue' },
  { value: 'general', label: 'General Feedback' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const STATUS_LABELS = {
  pending: 'Pending',
  in_review: 'In Review',
  planned: 'Planned',
  completed: 'Completed',
  rejected: 'Rejected',
};

const Feedback = () => {
  const [form, setForm] = useState({ title: '', description: '', category: 'general', priority: 'medium' });
  const [screenshot, setScreenshot] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  const loadHistory = async () => {
    try {
      const { data } = await feedbackAPI.getAll();
      setHistory(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHistory(); }, []);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Screenshot must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setScreenshot(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error('Title and description are required');
      return;
    }
    setSubmitting(true);
    try {
      await feedbackAPI.create({ ...form, screenshot });
      toast.success('Feedback submitted!');
      setForm({ title: '', description: '', category: 'general', priority: 'medium' });
      setScreenshot('');
      if (fileRef.current) fileRef.current.value = '';
      await loadHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <GenericPageSkeleton />;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2>Feedback</h2>
        <p className={styles.sub}>Help us improve IntentSpace</p>
      </div>

      <div className={styles.grid}>
        <Card className={styles.formCard}>
          <h3>Submit Feedback</h3>
          <form onSubmit={handleSubmit} className={styles.form}>
            <Input
              label="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <div className={styles.field}>
              <label>Description</label>
              <textarea
                className={styles.textarea}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                required
              />
            </div>
            <div className={styles.row}>
              <div className={styles.field}>
                <label>Category</label>
                <select
                  className={styles.select}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label>Priority</label>
                <select
                  className={styles.select}
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.field}>
              <label>Screenshot (optional)</label>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className={styles.fileInput} />
              {screenshot && <img src={screenshot} alt="Preview" className={styles.preview} />}
            </div>
            <Button type="submit" loading={submitting}>Submit Feedback</Button>
          </form>
        </Card>

        <Card className={styles.historyCard}>
          <h3>Your Feedback History</h3>
          {history.length === 0 ? (
            <p className={styles.empty}>No feedback submitted yet.</p>
          ) : (
            <div className={styles.historyList}>
              {history.map((item) => (
                <div key={item._id} className={styles.historyItem}>
                  <div className={styles.historyHeader}>
                    <strong>{item.title}</strong>
                    <span className={`${styles.status} ${styles[item.status]}`}>
                      {STATUS_LABELS[item.status]}
                    </span>
                  </div>
                  <p className={styles.historyMeta}>
                    {CATEGORIES.find((c) => c.value === item.category)?.label} · {item.priority} priority
                  </p>
                  <p className={styles.historyDates}>
                    Created {format(new Date(item.createdAt), 'MMM d, yyyy')} · Updated {format(new Date(item.updatedAt), 'MMM d, yyyy')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Feedback;
