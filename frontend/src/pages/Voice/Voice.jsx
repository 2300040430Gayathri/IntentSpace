import { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { IoMic, IoMicOff, IoCall, IoClose, IoVolumeHigh, IoVolumeMute } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { voiceAPI } from '../../services/api';
import Card from '../../components/Card/Card';
import Loader from '../../components/Loader/Loader';
import styles from './Voice.module.css';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const Voice = () => {
  const [inCall, setInCall] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [callStart, setCallStart] = useState(null);

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const transcriptRef = useRef(null);

  useEffect(() => {
    voiceAPI.getHistory().then(({ data }) => setHistory(data.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages]);

  const speak = useCallback((text) => {
    if (!speakerOn || !text) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    synthRef.current.speak(utterance);
  }, [speakerOn]);

  const sendToAI = useCallback(async (text) => {
    if (!sessionId || !text.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    try {
      const { data } = await voiceAPI.sendMessage(sessionId, text);
      const reply = data.data.reply;
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      speak(reply);
    } catch {
      toast.error('Failed to get response');
    }
  }, [sessionId, speak]);

  const startListening = useCallback(() => {
    if (!SpeechRecognition || muted || !inCall) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const last = event.results[event.results.length - 1];
      if (last.isFinal) {
        sendToAI(last[0].transcript.trim());
      }
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => {
      if (inCall && !muted) {
        try { recognition.start(); } catch { /* already started */ }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [inCall, muted, sendToAI]);

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const startCall = async () => {
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported in this browser. Try Chrome.');
      return;
    }
    try {
      const { data } = await voiceAPI.startSession();
      setSessionId(data.data._id);
      setMessages(data.data.messages || []);
      setInCall(true);
      setCallStart(Date.now());
      const greeting = data.data.messages?.[0]?.content;
      if (greeting) speak(greeting);
      setTimeout(startListening, 500);
    } catch {
      toast.error('Failed to start call');
    }
  };

  const endCall = async () => {
    stopListening();
    synthRef.current.cancel();
    setSpeaking(false);

    if (sessionId) {
      const duration = callStart ? Math.round((Date.now() - callStart) / 1000) : 0;
      try {
        await voiceAPI.endSession(sessionId, { duration });
        const { data } = await voiceAPI.getHistory();
        setHistory(data.data);
      } catch { /* ignore */ }
    }

    setInCall(false);
    setSessionId(null);
    setMessages([]);
    setCallStart(null);
    toast.success('Call ended');
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    if (next) stopListening();
    else if (inCall) startListening();
  };

  if (loading) return <Loader fullPage />;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2>AI Voice Assistant</h2>
        <p className={styles.sub}>Real-time voice conversation with your AI coach</p>
      </div>

      <Card className={styles.callScreen}>
        <div className={`${styles.avatar} ${listening ? styles.listening : ''} ${speaking ? styles.speaking : ''}`}>
          🤖
        </div>
        <span className={styles.status}>
          {!inCall && 'Ready to connect'}
          {inCall && speaking && 'Speaking...'}
          {inCall && listening && !speaking && 'Listening...'}
          {inCall && !listening && !speaking && 'Connected'}
        </span>

        <div className={styles.controls}>
          {!inCall ? (
            <button className={`${styles.controlBtn} ${styles.startBtn}`} onClick={startCall} aria-label="Start call">
              <IoCall />
            </button>
          ) : (
            <>
              <button className={`${styles.controlBtn} ${styles.muteBtn} ${muted ? styles.active : ''}`} onClick={toggleMute} aria-label="Toggle mute">
                {muted ? <IoMicOff /> : <IoMic />}
              </button>
              <button className={`${styles.controlBtn} ${styles.endBtn}`} onClick={endCall} aria-label="End call">
                <IoClose />
              </button>
              <button
                className={`${styles.controlBtn} ${styles.speakerBtn} ${!speakerOn ? styles.off : ''}`}
                onClick={() => { synthRef.current.cancel(); setSpeakerOn((s) => !s); }}
                aria-label="Toggle speaker"
              >
                {speakerOn ? <IoVolumeHigh /> : <IoVolumeMute />}
              </button>
            </>
          )}
        </div>

        {messages.length > 0 && (
          <div className={styles.transcript} ref={transcriptRef}>
            {messages.map((msg, i) => (
              <div key={i} className={`${styles.message} ${msg.role === 'user' ? styles.userMsg : styles.assistantMsg}`}>
                {msg.content}
              </div>
            ))}
          </div>
        )}
      </Card>

      {history.length > 0 && (
        <Card className={styles.history}>
          <h3>Conversation History</h3>
          {history.map((conv) => (
            <div key={conv._id} className={styles.historyItem}>
              {conv.title} · {format(new Date(conv.createdAt), 'MMM d, yyyy HH:mm')} · {conv.messages?.length || 0} messages
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

export default Voice;
