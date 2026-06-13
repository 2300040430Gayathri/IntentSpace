import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { IoAdd, IoSparkles } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { plannerAPI } from '../../services/api';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import Input from '../../components/Input/Input';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import { PlannerSkeleton } from '../../components/Loader/Loader';
import styles from './Planner.module.css';

const SECTIONS = [
  { key: 'morning', label: 'Morning', icon: '🌅' },
  { key: 'afternoon', label: 'Afternoon', icon: '☀️' },
  { key: 'evening', label: 'Evening', icon: '🌆' },
  { key: 'night', label: 'Night', icon: '🌙' },
];

const Planner = () => {
  const [planner, setPlanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [aiReview, setAiReview] = useState(null);
  const [form, setForm] = useState({ title: '', startTime: '09:00', endTime: '10:00', section: 'morning', note: '' });

  const fetchPlanner = async () => {
    try {
      const { data } = await plannerAPI.get({ date: new Date().toISOString() });
      setPlanner(data.data);
    } catch {
      toast.error('Failed to load planner');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlanner(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const { data } = await plannerAPI.addBlock({ ...form, date: new Date().toISOString() });
      setPlanner(data.data);
      setShowModal(false);
      setForm({ title: '', startTime: '09:00', endTime: '10:00', section: 'morning', note: '' });
      toast.success('Block added');
    } catch {
      toast.error('Failed to add block');
    }
  };

  const toggleBlock = async (block) => {
    const { data } = await plannerAPI.updateBlock(planner._id, block._id, { completed: !block.completed });
    setPlanner(data.data);
  };

  const deleteBlock = async (blockId) => {
    const { data } = await plannerAPI.deleteBlock(planner._id, blockId);
    setPlanner(data.data);
    toast.success('Block removed');
  };

  const loadAIReview = async () => {
    const { data } = await plannerAPI.aiReview({ date: new Date().toISOString() });
    setAiReview(data.data);
  };

  if (loading) return <PlannerSkeleton />;

  const blocksBySection = (section) => planner?.blocks?.filter((b) => b.section === section).sort((a, b) => a.order - b.order) || [];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2>Daily Planner</h2>
          <p className={styles.sub}>{format(new Date(), 'EEEE, MMMM d')}</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="outline" icon={<IoSparkles />} onClick={loadAIReview}>AI Review</Button>
          <Button icon={<IoAdd />} onClick={() => setShowModal(true)}>Add Block</Button>
        </div>
      </div>

      <ProgressBar value={planner?.completionRate || 0} label="Today's Progress" size="lg" className={styles.progress} />

      {aiReview && (
        <Card className={styles.aiCard}>
          <p style={{ whiteSpace: 'pre-line' }}>{aiReview.content}</p>
          <Button variant="ghost" size="sm" onClick={() => setAiReview(null)}>Dismiss</Button>
        </Card>
      )}

      <div className={styles.sections}>
        {SECTIONS.map((section) => (
          <Card key={section.key} className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>{section.icon} {section.label}</h3>
            {blocksBySection(section.key).length === 0 ? (
              <p className={styles.emptySection}>No blocks scheduled</p>
            ) : (
              blocksBySection(section.key).map((block) => (
                <div key={block._id} className={`${styles.block} ${block.completed ? styles.completed : ''}`}>
                  <button className={styles.blockCheck} onClick={() => toggleBlock(block)}>
                    {block.completed ? '✓' : '○'}
                  </button>
                  <div className={styles.blockInfo}>
                    <strong>{block.title}</strong>
                    <span>{block.startTime} – {block.endTime}</span>
                  </div>
                  <button className={styles.deleteBtn} onClick={() => deleteBlock(block._id)}>×</button>
                </div>
              ))
            )}
          </Card>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Time Block">
        <form onSubmit={handleAdd} className={styles.form}>
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <div className={styles.row}>
            <Input label="Start" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            <Input label="End" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          </div>
          <div className={styles.field}>
            <label>Section</label>
            <select value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} className={styles.select}>
              {SECTIONS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <Button type="submit" fullWidth>Add Block</Button>
        </form>
      </Modal>
    </div>
  );
};

export default Planner;
