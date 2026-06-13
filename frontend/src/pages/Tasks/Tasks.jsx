import { useState, useEffect, useCallback, memo } from 'react';
import { format } from 'date-fns';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IoAdd, IoSparkles } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { taskAPI, aiAPI } from '../../services/api';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import Input from '../../components/Input/Input';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import { TasksSkeleton } from '../../components/Loader/Loader';
import { priorityColors, formatDate } from '../../utils/helpers';
import styles from './Tasks.module.css';

const SortableTask = memo(({ task, onToggle, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task._id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className={styles.taskItem}>
      <button className={styles.dragHandle} {...attributes} {...listeners}>⠿</button>
      <button className={`${styles.checkBtn} ${task.status === 'completed' ? styles.checked : ''}`} onClick={() => onToggle(task)}>
        {task.status === 'completed' ? '✓' : ''}
      </button>
      <div className={styles.taskContent}>
        <span className={`${styles.taskTitle} ${task.status === 'completed' ? styles.completed : ''}`}>{task.title}</span>
        <div className={styles.taskMeta}>
          <span className={styles.priority} style={{ color: priorityColors[task.priority] }}>{task.priority}</span>
          {task.deadline && <span>{formatDate(task.deadline)}</span>}
          {task.tags?.map((t) => <span key={t} className={styles.tag}>{t}</span>)}
        </div>
      </div>
      <button onClick={() => onEdit(task)} className={styles.actionBtn}>Edit</button>
      <button onClick={() => onDelete(task._id)} className={styles.deleteBtn}>×</button>
    </div>
  );
});

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [aiPriority, setAiPriority] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', deadline: '', tags: '' });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchTasks = useCallback(async () => {
    try {
      const { data } = await taskAPI.getAll({ status: filter });
      setTasks(data.data);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Run carryForward once when page mounts, not on every list update
  useEffect(() => {
    taskAPI.carryForward().catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchTasks();
  }, [fetchTasks]);

  const handleSave = useCallback(async (e) => {
    e.preventDefault();
    const payload = { ...form, tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean), deadline: form.deadline || undefined };
    try {
      if (editing) {
        await taskAPI.update(editing._id, payload);
        toast.success('Task updated');
      } else {
        await taskAPI.create(payload);
        toast.success('Task created');
      }
      setShowModal(false);
      setEditing(null);
      setForm({ title: '', description: '', priority: 'medium', deadline: '', tags: '' });
      fetchTasks();
    } catch {
      toast.error('Failed to save task');
    }
  }, [form, editing, fetchTasks]);

  const handleToggle = useCallback(async (task) => {
    const prevTasks = [...tasks];
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';

    // Optimistically update local task status
    setTasks((prev) => prev.map((t) => t._id === task._id ? { ...t, status: newStatus } : t));

    try {
      await taskAPI.update(task._id, { status: newStatus });
      fetchTasks();
    } catch {
      toast.error('Failed to update task');
      // Rollback to previous state on failure
      setTasks(prevTasks);
    }
  }, [tasks, fetchTasks]);

  const handleDelete = useCallback(async (id) => {
    if (!confirm('Delete task?')) return;
    await taskAPI.delete(id);
    toast.success('Task deleted');
    fetchTasks();
  }, [fetchTasks]);

  const handleEdit = useCallback((t) => {
    setEditing(t);
    setForm({
      title: t.title,
      description: t.description,
      priority: t.priority,
      deadline: t.deadline ? format(new Date(t.deadline), 'yyyy-MM-dd') : '',
      tags: t.tags?.join(', ') || ''
    });
    setShowModal(true);
  }, []);

  const handleDragEnd = useCallback(async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = tasks.findIndex((t) => t._id === active.id);
    const newIndex = tasks.findIndex((t) => t._id === over.id);
    const reordered = arrayMove(tasks, oldIndex, newIndex);
    setTasks(reordered);
    await taskAPI.reorder(reordered.map((t, i) => ({ id: t._id, order: i })));
  }, [tasks]);

  const loadAIPriority = async () => {
    const { data } = await aiAPI.generate('task_prioritization');
    setAiPriority(data.data);
  };

  const completed = tasks.filter((t) => t.status === 'completed').length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  if (loading) return <TasksSkeleton />;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2>Tasks</h2>
          <p className={styles.sub}>Manage your priorities</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="outline" icon={<IoSparkles />} onClick={loadAIPriority}>AI Prioritize</Button>
          <Button icon={<IoAdd />} onClick={() => { setEditing(null); setShowModal(true); }}>Add Task</Button>
        </div>
      </div>

      {aiPriority && (
        <Card className={styles.aiCard}>
          <p style={{ whiteSpace: 'pre-line' }}>{aiPriority.content}</p>
          <Button variant="ghost" size="sm" onClick={() => setAiPriority(null)}>Dismiss</Button>
        </Card>
      )}

      <div className={styles.toolbar}>
        {['pending', 'completed', 'archived'].map((f) => (
          <button key={f} className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <ProgressBar value={progress} label="Completion" className={styles.progress} />
      </div>

      <Card padding={false}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
            {tasks.length === 0 ? (
              <p className={styles.empty}>No {filter} tasks</p>
            ) : (
              tasks.map((task) => (
                 <SortableTask key={task._id} task={task} onToggle={handleToggle} onEdit={handleEdit} onDelete={handleDelete} />
              ))
            )}
          </SortableContext>
        </DndContext>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Task' : 'Add Task'}>
        <form onSubmit={handleSave} className={styles.form}>
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <div className={styles.field}>
            <label>Description</label>
            <textarea className={styles.textarea} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </div>
          <div className={styles.field}>
            <label>Priority</label>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className={styles.select}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <Input label="Deadline" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          <Input label="Tags (comma separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          <Button type="submit" fullWidth>{editing ? 'Update' : 'Create'} Task</Button>
        </form>
      </Modal>
    </div>
  );
};

export default Tasks;
