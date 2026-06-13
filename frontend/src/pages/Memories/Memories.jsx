import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { IoAdd } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { memoryAPI } from '../../services/api';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import Input from '../../components/Input/Input';
import Calendar from '../../components/Calendar/Calendar';
import Loader from '../../components/Loader/Loader';
import { moodEmojis } from '../../utils/helpers';
import styles from './Memories.module.css';

const MOODS = ['happy', 'sad', 'excited', 'emotional', 'angry', 'neutral'];

const Memories = () => {
  const [memories, setMemories] = useState([]);
  const [onThisDay, setOnThisDay] = useState([]);
  const [recap, setRecap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', mood: 'happy', date: new Date().toISOString(), location: '' });

  const fetchMemories = async () => {
    try {
      const [all, otd] = await Promise.all([memoryAPI.getAll(), memoryAPI.onThisDay()]);
      setMemories(all.data.data);
      setOnThisDay(otd.data.data);
    } catch {
      toast.error('Failed to load memories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMemories(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await memoryAPI.update(editing._id, form);
        toast.success('Memory updated');
      } else {
        await memoryAPI.create(form);
        toast.success('Memory saved');
      }
      setShowModal(false);
      setEditing(null);
      fetchMemories();
    } catch {
      toast.error('Failed to save memory');
    }
  };

  const loadRecap = async () => {
    const now = new Date();
    const { data } = await memoryAPI.recap({ month: now.getMonth() + 1, year: now.getFullYear() });
    setRecap(data.data);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this memory?')) return;
    await memoryAPI.delete(id);
    toast.success('Memory deleted');
    fetchMemories();
  };

  if (loading) return <Loader fullPage />;

  const markedDates = memories.reduce((acc, m) => {
    acc[format(new Date(m.date), 'yyyy-MM-dd')] = 'completed';
    return acc;
  }, {});

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2>Memories</h2>
          <p className={styles.sub}>Preserve your life's beautiful moments</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="outline" onClick={loadRecap}>Monthly Recap</Button>
          <Button icon={<IoAdd />} onClick={() => { setEditing(null); setForm({ title: '', description: '', mood: 'happy', date: new Date().toISOString(), location: '' }); setShowModal(true); }}>Add Memory</Button>
        </div>
      </div>

      {recap && (
        <Card className={styles.recapCard}>
          <p style={{ whiteSpace: 'pre-line' }}>{recap.content}</p>
          <Button variant="ghost" size="sm" onClick={() => setRecap(null)}>Dismiss</Button>
        </Card>
      )}

      {onThisDay.length > 0 && (
        <Card className={styles.onThisDay}>
          <h3>✨ On This Day</h3>
          {onThisDay.map((m) => (
            <div key={m._id} className={styles.otdItem}>
              <span>{moodEmojis[m.mood]}</span>
              <div>
                <strong>{m.title}</strong>
                <span>{format(new Date(m.date), 'yyyy')}</span>
              </div>
            </div>
          ))}
        </Card>
      )}

      <div className={styles.layout}>
        <div className={styles.grid}>
          {memories.map((memory) => (
            <Card key={memory._id} className={styles.memoryCard}>
              <div className={styles.memoryMood}>{moodEmojis[memory.mood]}</div>
              <h3>{memory.title}</h3>
              <p className={styles.memoryDesc}>{memory.description}</p>
              <div className={styles.memoryFooter}>
                <span>{format(new Date(memory.date), 'MMM d, yyyy')}</span>
                {memory.location && <span>📍 {memory.location}</span>}
              </div>
              <div className={styles.memoryActions}>
                <button onClick={() => { setEditing(memory); setForm({ title: memory.title, description: memory.description, mood: memory.mood, date: memory.date, location: memory.location }); setShowModal(true); }}>Edit</button>
                <button onClick={() => handleDelete(memory._id)} className={styles.deleteBtn}>Delete</button>
              </div>
            </Card>
          ))}
        </div>
        <Calendar markedDates={markedDates} />
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Memory' : 'Add Memory'}>
        <form onSubmit={handleSave} className={styles.form}>
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <div className={styles.field}>
            <label>Description</label>
            <textarea className={styles.textarea} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
          </div>
          <div className={styles.moods}>
            {MOODS.map((m) => (
              <button key={m} type="button" className={`${styles.moodBtn} ${form.mood === m ? styles.active : ''}`} onClick={() => setForm({ ...form, mood: m })}>
                {moodEmojis[m]}
              </button>
            ))}
          </div>
          <Input label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <Input label="Date" type="date" value={format(new Date(form.date), 'yyyy-MM-dd')} onChange={(e) => setForm({ ...form, date: new Date(e.target.value).toISOString() })} />
          <Button type="submit" fullWidth>{editing ? 'Update' : 'Save'} Memory</Button>
        </form>
      </Modal>
    </div>
  );
};

export default Memories;
