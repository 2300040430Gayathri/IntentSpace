import { useState, useEffect, useRef, useCallback } from 'react';
import { IoPlay, IoPause, IoRefresh, IoExpand, IoSparkles } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { focusAPI } from '../../services/api';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import Loader from '../../components/Loader/Loader';
import styles from './Focus.module.css';

const STORAGE_KEY = 'intentspace_focus_timer';

const MODES = [
  { key: 'study', label: 'Study', icon: '📚' },
  { key: 'coding', label: 'Coding', icon: '💻' },
  { key: 'reading', label: 'Reading', icon: '📖' },
  { key: 'deep_work', label: 'Deep Work', icon: '🎯' },
  { key: 'custom', label: 'Custom', icon: '⚙️' },
];

const PRESETS = [
  { label: '25/5', work: 25, break: 5 },
  { label: '50/10', work: 50, break: 10 },
];

const SOUNDS = ['none', 'rain', 'forest', 'cafe'];

const loadStoredState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const Focus = () => {
  const stored = loadStoredState();
  const [mode, setMode] = useState(stored?.mode || 'study');
  const [workMin, setWorkMin] = useState(stored?.workMin || 25);
  const [breakMin, setBreakMin] = useState(stored?.breakMin || 5);
  const [seconds, setSeconds] = useState(stored?.seconds ?? 25 * 60);
  const [isRunning, setIsRunning] = useState(stored?.isRunning || false);
  const [isPaused, setIsPaused] = useState(stored?.isPaused || false);
  const [isBreak, setIsBreak] = useState(stored?.isBreak || false);
  const [sessionId, setSessionId] = useState(stored?.sessionId || null);
  const [sessionStarted, setSessionStarted] = useState(stored?.sessionStarted || false);
  const [notes, setNotes] = useState(stored?.notes || '');
  const [sound, setSound] = useState(stored?.sound || 'none');
  const [fullscreen, setFullscreen] = useState(false);
  const [stats, setStats] = useState(null);
  const [aiCoach, setAiCoach] = useState(null);
  const [loading, setLoading] = useState(true);

  const secondsRef = useRef(seconds);
  const isBreakRef = useRef(isBreak);
  const intervalRef = useRef(null);
  const endTimeRef = useRef(stored?.endTime || null);

  useEffect(() => {
    secondsRef.current = seconds;
  }, [seconds]);

  useEffect(() => {
    isBreakRef.current = isBreak;
  }, [isBreak]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        mode,
        workMin,
        breakMin,
        seconds,
        isRunning,
        isPaused,
        isBreak,
        sessionId,
        sessionStarted,
        notes,
        sound,
        endTime: endTimeRef.current,
      })
    );
  }, [mode, workMin, breakMin, seconds, isRunning, isPaused, isBreak, sessionId, sessionStarted, notes, sound]);

  useEffect(() => {
    focusAPI.stats().then(({ data }) => setStats(data.data)).finally(() => setLoading(false));
  }, []);

  const completeSession = useCallback(async () => {
    if (sessionId) {
      try {
        await focusAPI.complete(sessionId, { notes });
        const { data } = await focusAPI.stats();
        setStats(data.data);
        toast.success('Focus session completed! 🎉');
      } catch {
        toast.error('Failed to save session');
      }
    }
    setSessionId(null);
    setSessionStarted(false);
    setIsRunning(false);
    setIsPaused(false);
    setIsBreak(false);
    setSeconds(workMin * 60);
    endTimeRef.current = null;
    localStorage.removeItem(STORAGE_KEY);
  }, [sessionId, notes, workMin]);

  const tick = useCallback(() => {
    if (endTimeRef.current) {
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setSeconds(remaining);
      if (remaining <= 0) {
        if (!isBreakRef.current) {
          setIsBreak(true);
          endTimeRef.current = Date.now() + breakMin * 60 * 1000;
          setSeconds(breakMin * 60);
          toast('Break time! ☕', { icon: '⏸️' });
        } else {
          completeSession();
        }
      }
    }
  }, [breakMin, completeSession]);

  useEffect(() => {
    if (isRunning && !isPaused) {
      if (!endTimeRef.current) {
        endTimeRef.current = Date.now() + secondsRef.current * 1000;
      }
      intervalRef.current = setInterval(tick, 250);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, isPaused, tick]);

  useEffect(() => {
    if (stored?.isRunning && stored?.endTime) {
      endTimeRef.current = stored.endTime;
      tick();
    }
  }, []);

  const startSession = async () => {
    if (sessionStarted && isPaused) {
      endTimeRef.current = Date.now() + secondsRef.current * 1000;
      setIsPaused(false);
      setIsRunning(true);
      return;
    }

    if (sessionStarted) return;

    try {
      const { data } = await focusAPI.create({
        mode,
        duration: workMin,
        breakDuration: breakMin,
        backgroundSound: sound,
        startedAt: new Date().toISOString(),
      });
      setSessionId(data.data._id);
      setSessionStarted(true);
      setIsRunning(true);
      setIsPaused(false);
      setIsBreak(false);
      setSeconds(workMin * 60);
      endTimeRef.current = Date.now() + workMin * 60 * 1000;
    } catch {
      toast.error('Failed to start session');
    }
  };

  const pauseSession = () => {
    if (!isRunning) return;
    setIsPaused(true);
    setIsRunning(false);
    if (endTimeRef.current) {
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setSeconds(remaining);
      endTimeRef.current = null;
    }
  };

  const resetSession = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setIsPaused(false);
    setIsBreak(false);
    setSessionStarted(false);
    setSessionId(null);
    setSeconds(workMin * 60);
    endTimeRef.current = null;
    localStorage.removeItem(STORAGE_KEY);
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const loadAICoach = async () => {
    const { data } = await focusAPI.aiCoaching();
    setAiCoach(data.data);
  };

  if (loading) return <Loader fullPage />;

  const timerContent = (
    <div className={`${styles.timerSection} ${fullscreen ? styles.fullscreen : ''}`}>
      {fullscreen && <button className={styles.exitFullscreen} onClick={() => setFullscreen(false)}>Exit Fullscreen</button>}
      <div className={styles.modes}>
        {MODES.map((m) => (
          <button
            key={m.key}
            className={`${styles.modeBtn} ${mode === m.key ? styles.active : ''}`}
            onClick={() => !sessionStarted && setMode(m.key)}
            disabled={sessionStarted}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      <div className={styles.timer}>
        <span className={styles.timerLabel}>{isBreak ? 'Break' : 'Focus'}</span>
        <span className={styles.timerDisplay}>{formatTime(seconds)}</span>
        <div className={styles.presets}>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              className={styles.presetBtn}
              disabled={sessionStarted}
              onClick={() => {
                setWorkMin(p.work);
                setBreakMin(p.break);
                setSeconds(p.work * 60);
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.controls}>
        {!isRunning ? (
          <Button size="lg" icon={<IoPlay />} onClick={startSession}>
            {sessionStarted && isPaused ? 'Resume' : 'Start'}
          </Button>
        ) : (
          <Button size="lg" variant="outline" icon={<IoPause />} onClick={pauseSession}>Pause</Button>
        )}
        <Button variant="ghost" icon={<IoRefresh />} onClick={resetSession}>Reset</Button>
        <Button variant="ghost" icon={<IoExpand />} onClick={() => setFullscreen(!fullscreen)}>Fullscreen</Button>
      </div>

      <div className={styles.soundSelect}>
        {SOUNDS.map((s) => (
          <button key={s} className={`${styles.soundBtn} ${sound === s ? styles.active : ''}`} onClick={() => setSound(s)}>
            {s === 'none' ? '🔇' : s === 'rain' ? '🌧️' : s === 'forest' ? '🌲' : '☕'} {s}
          </button>
        ))}
      </div>

      <textarea className={styles.notes} placeholder="Session notes..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2>Focus Timer</h2>
          <p className={styles.sub}>Deep work, one session at a time</p>
        </div>
        <Button variant="outline" icon={<IoSparkles />} onClick={loadAICoach}>AI Coach</Button>
      </div>

      {aiCoach && (
        <Card className={styles.aiCard}>
          <p style={{ whiteSpace: 'pre-line' }}>{aiCoach.content}</p>
          <Button variant="ghost" size="sm" onClick={() => setAiCoach(null)}>Dismiss</Button>
        </Card>
      )}

      <div className={styles.layout}>
        <Card className={styles.timerCard}>{timerContent}</Card>

        <div className={styles.statsPanel}>
          <Card>
            <h3>Statistics</h3>
            <div className={styles.statGrid}>
              <div className={styles.stat}>
                <span className={styles.statNum}>{stats?.totalMinutes || 0}</span>
                <span className={styles.statLabel}>Total Minutes</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNum}>{stats?.totalSessions || 0}</span>
                <span className={styles.statLabel}>Sessions</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNum}>🔥 {stats?.focusStreak || 0}</span>
                <span className={styles.statLabel}>Day Streak</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Focus;
