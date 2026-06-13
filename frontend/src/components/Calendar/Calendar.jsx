import { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from 'date-fns';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
import styles from './Calendar.module.css';

const Calendar = ({ selectedDate, onSelectDate, markedDates = {}, onMonthChange }) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = monthStart.getDay();

  const prevMonth = () => {
    const newMonth = subMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const nextMonth = () => {
    const newMonth = addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const getDateKey = (date) => format(date, 'yyyy-MM-dd');

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <button onClick={prevMonth} className={styles.navBtn} aria-label="Previous month">
          <IoChevronBack />
        </button>
        <span className={styles.monthLabel}>{format(currentMonth, 'MMMM yyyy')}</span>
        <button onClick={nextMonth} className={styles.navBtn} aria-label="Next month">
          <IoChevronForward />
        </button>
      </div>
      <div className={styles.weekdays}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <span key={d} className={styles.weekday}>{d}</span>
        ))}
      </div>
      <div className={styles.grid}>
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} className={styles.empty} />
        ))}
        {days.map((day) => {
          const key = getDateKey(day);
          const mark = markedDates[key];
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          return (
            <button
              key={key}
              className={`${styles.day} ${!isSameMonth(day, currentMonth) ? styles.otherMonth : ''} ${isToday(day) ? styles.today : ''} ${isSelected ? styles.selected : ''} ${mark ? styles[mark] : ''}`}
              onClick={() => onSelectDate?.(day)}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
