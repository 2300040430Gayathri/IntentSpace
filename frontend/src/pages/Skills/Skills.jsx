import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IoAdd, IoArrowBack, IoSparkles } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { skillAPI } from '../../services/api';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import Input from '../../components/Input/Input';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import Calendar from '../../components/Calendar/Calendar';
import { GenericPageSkeleton } from '../../components/Loader/Loader';
import { format } from 'date-fns';
import styles from './Skills.module.css';

const SKILL_PRESETS = ['DSA', 'DBMS', 'SQL', 'OS', 'React', 'Node', 'AWS', 'System Design'];

const Skills = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [skillDetail, setSkillDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', icon: '📚', color: '#4F46E5' });
  const [entryForm, setEntryForm] = useState({ topicsLearned: '', practiceDone: '', practiceMinutes: 30, mistakes: '', notes: '', completed: true });

  useEffect(() => {
    if (id) {
      skillAPI.get(id).then(({ data }) => { setSkillDetail(data.data); setLoading(false); }).catch(() => setLoading(false));
    } else {
      skillAPI.getAll().then(({ data }) => { setSkills(data.data); setLoading(false); }).catch(() => setLoading(false));
    }
  }, [id]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await skillAPI.create(form);
      toast.success('Skill added');
      setShowModal(false);
      const { data } = await skillAPI.getAll();
      setSkills(data.data);
    } catch {
      toast.error('Failed to create skill');
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    try {
      await skillAPI.addEntry(id, {
        ...entryForm,
        topicsLearned: entryForm.topicsLearned.split(',').map((t) => t.trim()).filter(Boolean),
        date: new Date().toISOString(),
      });
      toast.success('Practice logged');
      setShowEntryModal(false);
      const { data } = await skillAPI.get(id);
      setSkillDetail(data.data);
    } catch {
      toast.error('Failed to log practice');
    }
  };

  const loadAIInsights = async () => {
    const { data } = await skillAPI.aiInsights(id);
    setAiInsights(data.data);
  };

  if (loading) return <GenericPageSkeleton />;

  if (id && skillDetail) {
    const markedDates = skillDetail.entries?.reduce((acc, e) => {
      if (e.completed) acc[format(new Date(e.date), 'yyyy-MM-dd')] = 'completed';
      return acc;
    }, {}) || {};

    return (
      <div className={styles.page}>
        <button className={styles.backBtn} onClick={() => navigate('/skills')}><IoArrowBack /> Back to Skills</button>
        <div className={styles.detailHeader}>
          <span className={styles.skillIcon} style={{ background: `${skillDetail.color}20` }}>{skillDetail.icon}</span>
          <div>
            <h2>{skillDetail.name}</h2>
            <p>🔥 {skillDetail.currentStreak} day streak · Best {skillDetail.bestStreak}</p>
          </div>
          <div className={styles.detailActions}>
            <Button variant="outline" icon={<IoSparkles />} onClick={loadAIInsights}>AI Insights</Button>
            <Button icon={<IoAdd />} onClick={() => setShowEntryModal(true)}>Log Practice</Button>
          </div>
        </div>

        {aiInsights && (
          <Card className={styles.aiCard}>
            <p style={{ whiteSpace: 'pre-line' }}>{aiInsights.content}</p>
            <Button variant="ghost" size="sm" onClick={() => setAiInsights(null)}>Dismiss</Button>
          </Card>
        )}

        <ProgressBar value={skillDetail.progress} label="Overall Progress" color={skillDetail.color} size="lg" className={styles.progress} />

        <div className={styles.detailLayout}>
          <Card>
            <h3>Recent Entries</h3>
            {skillDetail.entries?.map((entry) => (
              <div key={entry._id} className={styles.entryItem}>
                <strong>{format(new Date(entry.date), 'MMM d')}</strong>
                <p>{entry.topicsLearned?.join(', ') || entry.practiceDone || 'Practice session'}</p>
                {entry.notes && <span className={styles.entryNotes}>{entry.notes}</span>}
              </div>
            ))}
          </Card>
          <Calendar markedDates={markedDates} />
        </div>

        <Modal isOpen={showEntryModal} onClose={() => setShowEntryModal(false)} title="Log Practice">
          <form onSubmit={handleAddEntry} className={styles.form}>
            <Input label="Topics Learned (comma separated)" value={entryForm.topicsLearned} onChange={(e) => setEntryForm({ ...entryForm, topicsLearned: e.target.value })} />
            <Input label="Practice Done" value={entryForm.practiceDone} onChange={(e) => setEntryForm({ ...entryForm, practiceDone: e.target.value })} />
            <Input label="Minutes" type="number" value={entryForm.practiceMinutes} onChange={(e) => setEntryForm({ ...entryForm, practiceMinutes: Number(e.target.value) })} />
            <div className={styles.field}>
              <label>Mistakes</label>
              <textarea className={styles.textarea} value={entryForm.mistakes} onChange={(e) => setEntryForm({ ...entryForm, mistakes: e.target.value })} rows={2} />
            </div>
            <div className={styles.field}>
              <label>Notes</label>
              <textarea className={styles.textarea} value={entryForm.notes} onChange={(e) => setEntryForm({ ...entryForm, notes: e.target.value })} rows={2} />
            </div>
            <Button type="submit" fullWidth>Save Entry</Button>
          </form>
        </Modal>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2>Skills</h2>
          <p className={styles.sub}>Track your learning journey</p>
        </div>
        <Button icon={<IoAdd />} onClick={() => setShowModal(true)}>Add Skill</Button>
      </div>

      <div className={styles.grid}>
        {skills.map((skill) => (
          <Card key={skill._id} className={styles.skillCard} onClick={() => navigate(`/skills/${skill._id}`)}>
            <span className={styles.skillIcon} style={{ background: `${skill.color}20`, color: skill.color }}>{skill.icon}</span>
            <h3>{skill.name}</h3>
            <p className={styles.streak}>🔥 {skill.currentStreak} day streak</p>
            <ProgressBar value={Math.min(100, skill.totalPracticeMinutes / 10)} color={skill.color} size="sm" />
          </Card>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Skill">
        <form onSubmit={handleCreate} className={styles.form}>
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div className={styles.presets}>
            {SKILL_PRESETS.map((p) => (
              <button key={p} type="button" className={styles.preset} onClick={() => setForm({ ...form, name: p })}>{p}</button>
            ))}
          </div>
          <Button type="submit" fullWidth>Create Skill</Button>
        </form>
      </Modal>
    </div>
  );
};

export default Skills;
