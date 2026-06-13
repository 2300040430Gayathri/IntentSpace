import { format, startOfMonth, endOfMonth } from 'date-fns';

export const formatDate = (date, fmt = 'MMM d, yyyy') => {
  if (!date) return '';
  return format(new Date(date), fmt);
};

export const getMonthRange = (date) => ({
  start: startOfMonth(date).toISOString(),
  end: endOfMonth(date).toISOString(),
});

export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

export const priorityColors = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#10B981',
};

export const moodEmojis = {
  great: '😄',
  good: '🙂',
  okay: '😐',
  low: '😔',
  sad: '😢',
  happy: '😊',
  excited: '🤩',
  emotional: '🥹',
  angry: '😤',
  neutral: '😐',
};

export const exportData = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const readFileAsJSON = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        resolve(JSON.parse(e.target.result));
      } catch {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
