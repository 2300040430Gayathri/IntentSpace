import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { moodAPI } from '../../services/api';
import Button from '../Button/Button';
import styles from './DailyCheckIn.module.css';

const moods = [
  { value: 'great', emoji: '😄', label: 'Great' },
  { value: 'good', emoji: '🙂', label: 'Good' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'low', emoji: '😔', label: 'Low' },
];

const DailyCheckIn = () => {
  const [show, setShow] = useState(false);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    moodAPI.today().then(({ data }) => {
      if (data.needsCheckIn) setShow(true);
    }).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await moodAPI.checkIn({ mood: selected });
      setShow(false);
    } catch {
      setShow(false);
    } finally {
      setLoading(false);
    }
  };

  const greeting = () => {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={styles.modal}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            <h2>{greeting()}!</h2>
            <p>How are you feeling today?</p>
            <div className={styles.moods}>
              {moods.map((m) => (
                <button
                  key={m.value}
                  className={`${styles.moodBtn} ${selected === m.value ? styles.selected : ''}`}
                  onClick={() => setSelected(m.value)}
                >
                  <span className={styles.emoji}>{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
            <div className={styles.actions}>
              <Button variant="ghost" onClick={() => setShow(false)}>Skip</Button>
              <Button onClick={handleSubmit} disabled={!selected} loading={loading}>Continue</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DailyCheckIn;
