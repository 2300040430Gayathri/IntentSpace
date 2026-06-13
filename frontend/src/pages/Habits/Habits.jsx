import { useState, useEffect, useCallback, memo } from 'react';
import { format, subDays } from 'date-fns';
import { IoAdd, IoSparkles } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { habitAPI, aiAPI } from '../../services/api';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import Input from '../../components/Input/Input';
import Calendar from '../../components/Calendar/Calendar';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import { HabitsSkeleton } from '../../components/Loader/Loader';
import styles from './Habits.module.css';

const HABIT_PRESETS = [
  { name: 'Exercise', icon: '🏃', type: 'yes_no', color: '#10B981' },
  { name: 'Meditation', icon: '🧘', type: 'yes_no', color: '#8B5CF6' },
  { name: 'Reading', icon: '📖', type: 'range', unit: 'pages', target: 20, color: '#F59E0B' },
  { name: 'Water Intake', icon: '💧', type: 'range', unit: 'glasses', target: 8, color: '#06B6D4' },
];

const HabitCard = memo(({ habit, completed, onToggle, onEdit, onDelete }) => (
  <Card className={styles.habitCard}>
    <div className={styles.habitHeader}>
      <span className={styles.habitIcon} style={{ background: `${habit.color}20`, color: habit.color }}>{habit.icon}</span>
      <div className={styles.habitMeta}>
        <strong>{habit.name}</strong>
        <span>🔥 {habit.currentStreak} · Best {habit.bestStreak}</span>
      </div>
      <div className={styles.habitActions}>
        <button onClick={() => onEdit(habit)} className={styles.editBtn}>Edit</button>
        <button onClick={() => onDelete(habit._id)} className={styles.deleteBtn}>×</button>
      </div>
    </div>
    <ProgressBar value={habit.completionRate || 0} label="30-day completion" color={habit.color} size="sm" />
    {habit.type === 'yes_no' ? (
      <button
        className={`${styles.toggleBtn} ${completed ? styles.done : ''}`}
        onClick={() => onToggle(habit, !completed)}
      >
        {completed ? '✓ Completed' : 'Mark Complete'}
      </button>
    ) : (
      <div className={styles.rangeInput}>
        <input
          type="number"
          placeholder={`Target: ${habit.target} ${habit.unit}`}
          onBlur={(e) => onToggle(habit, Number(e.target.value) >= habit.target, Number(e.target.value))}
        />
      </div>
    )}
  </Card>
));

const Habits = () => {
  const [habits, setHabits] = useState([]);
  const [entries, setEntries] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'yes_no', unit: '', target: 1, color: '#2563EB', icon: '✓' });

  const fetchHabits = useCallback(async () => {
    try {
      const { data } = await habitAPI.getAll();
      setHabits(data.data);
      await habitAPI.autoMark();

      // Fetch entries for all habits once on load
      if (data.data.length) {
        const start = format(subDays(new Date(), 60), 'yyyy-MM-dd');
        const end = format(new Date(), 'yyyy-MM-dd');
        const results = await Promise.all(
          data.data.map(async (h) => {
            const { data: res } = await habitAPI.getEntries(h._id, { start, end });
            return [h._id, res.data];
          })
        );
        const map = {};
        results.forEach(([id, e]) => {
          map[id] = e;
        });
        setEntries(map);
      }
    } catch {
      toast.error('Failed to load habits');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHabits(); }, [fetchHabits]);

  const getMarkedDates = useCallback(() => {
    const marked = {};
    Object.values(entries).flat().forEach((e) => {
      const key = format(new Date(e.date), 'yyyy-MM-dd');
      marked[key] = e.completed ? 'completed' : 'missed';
    });
    return marked;
  }, [entries]);

  const isCompleted = useCallback((habitId) => {
    const key = format(selectedDate, 'yyyy-MM-dd');
    const entry = (entries[habitId] || []).find((e) => format(new Date(e.date), 'yyyy-MM-dd') === key);
    return entry?.completed;
  }, [entries, selectedDate]);

  const toggleHabit = useCallback(async (habit, completed, value = 0) => {
    const prevEntries = { ...entries };
    const prevHabits = [...habits];
    const targetDateStr = format(selectedDate, 'yyyy-MM-dd');

    // Optimistically update entries state
    setEntries((prev) => {
      const habitEntries = [...(prev[habit._id] || [])];
      const idx = habitEntries.findIndex((e) => format(new Date(e.date), 'yyyy-MM-dd') === targetDateStr);
      const tempEntry = {
        _id: `temp-${Date.now()}`,
        habit: habit._id,
        date: selectedDate.toISOString(),
        completed,
        value: habit.type === 'range' ? value : (completed ? 1 : 0),
      };
      if (idx >= 0) {
        habitEntries[idx] = { ...habitEntries[idx], completed, value: tempEntry.value };
      } else {
        habitEntries.push(tempEntry);
      }
      return { ...prev, [habit._id]: habitEntries };
    });

    // Optimistically update streaks in habits list state
    setHabits((prev) =>
      prev.map((h) => {
        if (h._id === habit._id) {
          const wasCompleted = isCompleted(h._id);
          let streakDiff = 0;
          if (completed && !wasCompleted) streakDiff = 1;
          else if (!completed && wasCompleted) streakDiff = -1;

          const newStreak = Math.max(0, h.currentStreak + streakDiff);
          return {
            ...h,
            currentStreak: newStreak,
            bestStreak: Math.max(h.bestStreak, newStreak),
          };
        }
        return h;
      })
    );

    try {
      const { data } = await habitAPI.upsertEntry(habit._id, {
        date: selectedDate.toISOString(),
        completed,
        value: habit.type === 'range' ? value : (completed ? 1 : 0),
      });

      // Synchronize state with actual database response
      setEntries((prev) => {
        const habitEntries = [...(prev[habit._id] || [])];
        const idx = habitEntries.findIndex((e) => format(new Date(e.date), 'yyyy-MM-dd') === targetDateStr);
        if (idx >= 0) habitEntries[idx] = data.data;
        return { ...prev, [habit._id]: habitEntries };
      });
      setHabits((prev) => prev.map((h) => h._id === habit._id ? { ...h, ...data.streaks } : h));
    } catch {
      toast.error('Failed to update habit');
      // Rollback to previous state on failure
      setEntries(prevEntries);
      setHabits(prevHabits);
    }
  }, [entries, habits, selectedDate, isCompleted]);

  const handleSave = useCallback(async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await habitAPI.update(editing._id, form);
        toast.success('Habit updated');
      } else {
        await habitAPI.create(form);
        toast.success('Habit created');
      }
      setShowModal(false);
      setEditing(null);
      setForm({ name: '', type: 'yes_no', unit: '', target: 1, color: '#2563EB', icon: '✓' });
      fetchHabits();
    } catch {
      toast.error('Failed to save habit');
    }
  }, [editing, form, fetchHabits]);

  const handleDelete = useCallback(async (id) => {
    if (!confirm('Delete this habit?')) return;
    await habitAPI.delete(id);
    toast.success('Habit deleted');
    fetchHabits();
  }, [fetchHabits]);

  const loadAISuggestions = useCallback(async () => {
    const { data } = await aiAPI.generate('habit_suggestions');
    setAiSuggestions(data.data);
  }, []);

  const openEdit = useCallback((habit) => {
    setEditing(habit);
    setForm({ name: habit.name, type: habit.type, unit: habit.unit, target: habit.target, color: habit.color, icon: habit.icon });
    setShowModal(true);
  }, []);

  if (loading) return <HabitsSkeleton />;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2>Habits</h2>
          <p className={styles.sub}>Build consistency, one day at a time</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="outline" icon={<IoSparkles />} onClick={loadAISuggestions}>AI Suggestions</Button>
          <Button icon={<IoAdd />} onClick={() => { setEditing(null); setShowModal(true); }}>Add Habit</Button>
        </div>
      </div>

      {aiSuggestions && (
        <Card className={styles.aiCard}>
          <p style={{ whiteSpace: 'pre-line' }}>{aiSuggestions.content}</p>
          <Button variant="ghost" size="sm" onClick={() => setAiSuggestions(null)}>Dismiss</Button>
        </Card>
      )}

      <div className={styles.layout}>
        <div className={styles.habitList}>
          <p className={styles.dateLabel}>{format(selectedDate, 'EEEE, MMM d')}</p>
          {habits.map((habit) => (
            <HabitCard
              key={habit._id}
              habit={habit}
              completed={isCompleted(habit._id)}
              onToggle={toggleHabit}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
          {habits.length === 0 && <p className={styles.empty}>No habits yet. Add one or try AI suggestions!</p>}
        </div>

        <div className={styles.sidebar}>
          <Calendar selectedDate={selectedDate} onSelectDate={setSelectedDate} markedDates={getMarkedDates()} />
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Habit' : 'Add Habit'}>
        <form onSubmit={handleSave} className={styles.form}>
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div className={styles.field}>
            <label>Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={styles.select}>
              <option value="yes_no">Yes / No</option>
              <option value="range">Range</option>
            </select>
          </div>
          {form.type === 'range' && (
            <>
              <Input label="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
              <Input label="Target" type="number" value={form.target} onChange={(e) => setForm({ ...form, target: Number(e.target.value) })} />
            </>
          )}
          <div className={styles.presets}>
            {HABIT_PRESETS.map((p) => (
              <button key={p.name} type="button" className={styles.preset} onClick={() => setForm({ ...form, ...p })}>
                {p.icon} {p.name}
              </button>
            ))}
          </div>
          <Button type="submit" fullWidth>{editing ? 'Update' : 'Create'} Habit</Button>
        </form>
      </Modal>
    </div>
  );
};

export default Habits;
