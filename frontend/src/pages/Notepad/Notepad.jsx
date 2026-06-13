import { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { IoAdd, IoSearch, IoPin, IoTrash } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { noteAPI } from '../../services/api';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import RichTextEditor from '../../components/RichTextEditor/RichTextEditor';
import Loader from '../../components/Loader/Loader';
import styles from './Notepad.module.css';

const Notepad = () => {
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState(['General']);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [pinned, setPinned] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const saveTimer = useRef(null);

  const fetchNotes = useCallback(async (params = {}) => {
    try {
      const { data } = await noteAPI.getAll(params);
      setNotes(data.data);
    } catch {
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
    noteAPI.getCategories().then(({ data }) => setCategories(data.data)).catch(() => {});
  }, [fetchNotes]);

  const selectNote = (note) => {
    setSelected(note);
    setTitle(note.title);
    setContent(note.content);
    setCategory(note.category || 'General');
    setPinned(note.pinned);
  };

  const newNote = () => {
    setSelected(null);
    setTitle('');
    setContent('');
    setCategory('General');
    setPinned(false);
  };

  const autoSave = useCallback(async (noteData) => {
    setSaveStatus('Saving...');
    try {
      if (selected?._id) {
        const { data } = await noteAPI.update(selected._id, noteData);
        setSelected(data.data);
        setNotes((prev) => prev.map((n) => (n._id === data.data._id ? data.data : n)));
      } else if (noteData.title || noteData.content) {
        const { data } = await noteAPI.create(noteData);
        setSelected(data.data);
        setNotes((prev) => [data.data, ...prev]);
      }
      setSaveStatus('Saved');
    } catch {
      setSaveStatus('Save failed');
    }
  }, [selected]);

  useEffect(() => {
    if (!title && !content) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      autoSave({ title: title || 'Untitled', content, category, pinned });
    }, 1200);
    return () => clearTimeout(saveTimer.current);
  }, [title, content, category, pinned, autoSave]);

  const handleSearch = () => fetchNotes({ search, category: categoryFilter || undefined });

  const handleDelete = async () => {
    if (!selected?._id || !confirm('Delete this note?')) return;
    await noteAPI.delete(selected._id);
    toast.success('Note deleted');
    newNote();
    fetchNotes();
  };

  const togglePin = () => setPinned((p) => !p);

  if (loading) return <Loader fullPage />;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2>Smart Notepad</h2>
          <p className={styles.sub}>Capture ideas with auto-save & categories</p>
        </div>
        <Button icon={<IoAdd />} onClick={newNote}>New Note</Button>
      </div>

      <div className={styles.toolbar}>
        <Input placeholder="Search notes..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<IoSearch />} />
        <Button variant="outline" onClick={handleSearch}>Search</Button>
      </div>

      <div className={styles.filters}>
        <button className={`${styles.filterBtn} ${!categoryFilter ? styles.active : ''}`} onClick={() => { setCategoryFilter(''); fetchNotes({ search }); }}>
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`${styles.filterBtn} ${categoryFilter === cat ? styles.active : ''}`}
            onClick={() => { setCategoryFilter(cat); fetchNotes({ category: cat, search }); }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className={styles.layout}>
        <div className={styles.sidebar}>
          {notes.length === 0 ? (
            <p className={styles.empty}>No notes yet</p>
          ) : (
            notes.map((note) => (
              <button
                key={note._id}
                className={`${styles.noteItem} ${selected?._id === note._id ? styles.active : ''} ${note.pinned ? styles.pinned : ''}`}
                onClick={() => selectNote(note)}
              >
                <span className={styles.noteTitle}>{note.pinned ? '📌 ' : ''}{note.title || 'Untitled'}</span>
                <span className={styles.noteMeta}>{note.category} · {format(new Date(note.updatedAt), 'MMM d, yyyy')}</span>
              </button>
            ))
          )}
        </div>

        <Card className={styles.editor}>
          <div className={styles.editorHeader}>
            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title" />
            <select className={styles.categorySelect} value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              <option value="Personal">Personal</option>
              <option value="Work">Work</option>
              <option value="Ideas">Ideas</option>
            </select>
            <div className={styles.actions}>
              <button className={`${styles.pinBtn} ${pinned ? styles.active : ''}`} onClick={togglePin} type="button">
                <IoPin /> {pinned ? 'Pinned' : 'Pin'}
              </button>
              {selected && (
                <Button variant="ghost" icon={<IoTrash />} onClick={handleDelete}>Delete</Button>
              )}
            </div>
          </div>
          <RichTextEditor value={content} onChange={setContent} placeholder="Start writing..." />
          <span className={styles.saveStatus}>{saveStatus}</span>
        </Card>
      </div>
    </div>
  );
};

export default Notepad;
