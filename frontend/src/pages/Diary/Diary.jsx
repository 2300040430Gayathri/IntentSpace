import { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { IoAdd, IoSearch, IoAnalytics } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { diaryAPI } from '../../services/api';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import Input from '../../components/Input/Input';
import RichTextEditor from '../../components/RichTextEditor/RichTextEditor';
import Calendar from '../../components/Calendar/Calendar';
import Loader from '../../components/Loader/Loader';
import { moodEmojis } from '../../utils/helpers';
import styles from './Diary.module.css';

const MOODS = ['great', 'good', 'okay', 'low', 'sad'];

const stripHtml = (html) => (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const Diary = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [form, setForm] = useState({ title: '', content: '', mood: 'good', date: new Date().toISOString() });
  const [saveStatus, setSaveStatus] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [coach, setCoach] = useState(null);
  const autoSaveTimer = useRef(null);

  const fetchEntries = async (params = {}) => {
    try {
      const { data } = await diaryAPI.getAll(params);
      setEntries(data.data);
    } catch {
      toast.error('Failed to load entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEntries(); }, []);

  const handleSearch = () => fetchEntries(search ? { search } : {});

  const autoSave = useCallback(async () => {
    if (!form.content && !form.title) return;
    setSaveStatus('Saving...');
    try {
      if (selected?._id) {
        await diaryAPI.update(selected._id, { ...form, date: selectedDate.toISOString() });
      } else if (form.content.length > 20) {
        const { data } = await diaryAPI.autoSave({ ...form, date: selectedDate.toISOString() });
        setSelected(data.data);
      }
      setSaveStatus('Auto-saved');
    } catch {
      setSaveStatus('');
    }
  }, [form, selected, selectedDate]);

  useEffect(() => {
    if (!showModal) return;
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(autoSave, 1500);
    return () => clearTimeout(autoSaveTimer.current);
  }, [form, showModal, autoSave]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      let saved;
      if (selected?._id) {
        const { data } = await diaryAPI.update(selected._id, { ...form, date: selectedDate.toISOString() });
        saved = data.data;
        toast.success('Entry updated');
      } else {
        const { data } = await diaryAPI.create({ ...form, date: selectedDate.toISOString() });
        saved = data.data;
        toast.success('Entry saved');
        if (data.data.aiReflection) {
          toast(data.data.aiReflection, { icon: '💙', duration: 6000 });
        }
      }
      setAnalysis(saved.englishAnalysis);
      if (saved.aiCoach) setCoach(saved.aiCoach);
      setShowModal(false);
      setSelected(null);
      setForm({ title: '', content: '', mood: 'good', date: new Date().toISOString() });
      fetchEntries();
    } catch {
      toast.error('Failed to save entry');
    }
  };

  const openEntry = (entry) => {
    setSelected(entry);
    setForm({ title: entry.title, content: entry.content, mood: entry.mood, date: entry.date });
    setAnalysis(entry.englishAnalysis);
    setCoach(entry.aiCoach);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return;
    await diaryAPI.delete(id);
    toast.success('Entry deleted');
    fetchEntries();
  };

  if (loading) return <Loader fullPage />;

  const markedDates = entries.reduce((acc, e) => {
    acc[format(new Date(e.date), 'yyyy-MM-dd')] = 'completed';
    return acc;
  }, {});

  const sortedTimeline = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2>Diary</h2>
          <p className={styles.sub}>Your personal journal with AI English analysis</p>
        </div>
        <div className={styles.headerActions}>
          <button className={`${styles.viewBtn} ${view === 'list' ? styles.active : ''}`} onClick={() => setView('list')}>List</button>
          <button className={`${styles.viewBtn} ${view === 'timeline' ? styles.active : ''}`} onClick={() => setView('timeline')}>Timeline</button>
          <Button icon={<IoAdd />} onClick={() => { setSelected(null); setAnalysis(null); setCoach(null); setShowModal(true); }}>New Entry</Button>
        </div>
      </div>

      <div className={styles.searchBar}>
        <Input placeholder="Search entries..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<IoSearch />} />
        <Button variant="outline" onClick={handleSearch}>Search</Button>
      </div>

      {view === 'timeline' ? (
        <div className={styles.timeline}>
          {sortedTimeline.map((entry) => (
            <div key={entry._id} className={styles.timelineItem} onClick={() => openEntry(entry)}>
              <span className={styles.timelineDate}>{format(new Date(entry.date), 'MMM d, yyyy')}</span>
              <div className={styles.timelineContent}>
                <span className={styles.mood}>{moodEmojis[entry.mood]}</span>
                <strong>{entry.title || 'Untitled'}</strong>
                <p>{stripHtml(entry.content).slice(0, 120)}...</p>
                {entry.englishAnalysis && (
                  <span className={styles.levelTag}>{entry.englishAnalysis.level} · {entry.englishAnalysis.scores?.overall}/100</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.layout}>
          <div className={styles.entries}>
            {entries.length === 0 ? (
              <p className={styles.empty}>No diary entries yet. Start writing your story!</p>
            ) : (
              entries.map((entry) => (
                <Card key={entry._id} className={styles.entryCard} onClick={() => openEntry(entry)}>
                  <div className={styles.entryHeader}>
                    <span className={styles.mood}>{moodEmojis[entry.mood]}</span>
                    <div>
                      <strong>{entry.title || 'Untitled'}</strong>
                      <span className={styles.date}>{format(new Date(entry.date), 'MMM d, yyyy')}</span>
                    </div>
                    <button className={styles.deleteBtn} onClick={(e) => { e.stopPropagation(); handleDelete(entry._id); }}>×</button>
                  </div>
                  <p className={styles.preview}>{stripHtml(entry.content).slice(0, 150)}{stripHtml(entry.content).length > 150 ? '...' : ''}</p>
                  {entry.englishAnalysis && (
                    <span className={styles.levelTag}>{entry.englishAnalysis.level} · Score: {entry.englishAnalysis.scores?.overall}</span>
                  )}
                  {entry.aiReflection && <p className={styles.reflection}>💙 {entry.aiReflection}</p>}
                </Card>
              ))
            )}
          </div>
          <Calendar selectedDate={selectedDate} onSelectDate={setSelectedDate} markedDates={markedDates} />
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={selected ? 'Edit Entry' : 'New Entry'} size="lg">
        <form onSubmit={handleSave} className={styles.form}>
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <div className={styles.moods}>
            {MOODS.map((m) => (
              <button key={m} type="button" className={`${styles.moodBtn} ${form.mood === m ? styles.active : ''}`} onClick={() => setForm({ ...form, mood: m })}>
                {moodEmojis[m]} {m}
              </button>
            ))}
          </div>
          <RichTextEditor value={form.content} onChange={(content) => setForm({ ...form, content })} placeholder="What's on your mind today?" />
          {saveStatus && <span className={styles.saveStatus}>{saveStatus}</span>}
          <Button type="submit" fullWidth>{selected ? 'Update' : 'Save'} Entry</Button>
        </form>

        {analysis && (
          <div className={styles.analysisPanel}>
            <h4><IoAnalytics /> English Analysis</h4>
            <div className={styles.scoreGrid}>
              <div><span>Overall</span><strong>{analysis.scores?.overall}</strong></div>
              <div><span>Grammar</span><strong>{analysis.scores?.grammar}</strong></div>
              <div><span>Vocabulary</span><strong>{analysis.scores?.vocabulary}</strong></div>
              <div><span>Writing</span><strong>{analysis.scores?.writing}</strong></div>
              <div><span>Communication</span><strong>{analysis.scores?.communication}</strong></div>
            </div>
            <p className={styles.levelTag}>Level: {analysis.level}</p>
            {analysis.mistakes?.length > 0 && (
              <div className={styles.analysisSection}>
                <strong>Issues Found</strong>
                <ul>{analysis.mistakes.slice(0, 5).map((m, i) => <li key={i}>{m.text} → {m.suggestion}</li>)}</ul>
              </div>
            )}
            {analysis.improvedVersion && (
              <div className={styles.analysisSection}>
                <strong>Improved Version</strong>
                <p>{analysis.improvedVersion}</p>
              </div>
            )}
          </div>
        )}

        {coach && (
          <div className={styles.coachPanel}>
            <h4>AI Coach</h4>
            <p>{coach.feedback}</p>
            {coach.tips?.length > 0 && (
              <div className={styles.analysisSection}>
                <strong>Tips</strong>
                <ul>{coach.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
              </div>
            )}
            {coach.wordsToLearn?.length > 0 && (
              <div className={styles.analysisSection}>
                <strong>Learn These Words</strong>
                <p>{coach.wordsToLearn.join(', ')}</p>
              </div>
            )}
            {coach.goals?.length > 0 && (
              <div className={styles.analysisSection}>
                <strong>Writing Goals</strong>
                <ul>{coach.goals.map((g, i) => <li key={i}>{g}</li>)}</ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Diary;
