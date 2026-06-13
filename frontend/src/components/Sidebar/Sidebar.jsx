import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  IoGrid, IoCheckbox, IoList, IoCalendar, IoBook, IoImages,
  IoSchool, IoTimer, IoAnalytics, IoSettings, IoClose,
  IoDocumentText, IoTrendingUp, IoShield, IoMic, IoChatboxEllipses,
} from 'react-icons/io5';
import Logo from '../Logo/Logo';
import { useAuth } from '../../context/AuthContext';
import styles from './Sidebar.module.css';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: IoGrid },
  { path: '/habits', label: 'Habits', icon: IoCheckbox },
  { path: '/tasks', label: 'Tasks', icon: IoList },
  { path: '/planner', label: 'Planner', icon: IoCalendar },
  { path: '/notepad', label: 'Notepad', icon: IoDocumentText },
  { path: '/diary', label: 'Diary', icon: IoBook },
  { path: '/progress', label: 'Progress', icon: IoTrendingUp },
  { path: '/memories', label: 'Memories', icon: IoImages },
  { path: '/skills', label: 'Skills', icon: IoSchool },
  { path: '/focus', label: 'Focus', icon: IoTimer },
  { path: '/voice', label: 'Voice AI', icon: IoMic },
  { path: '/insights', label: 'Insights', icon: IoAnalytics },
  { path: '/feedback', label: 'Feedback', icon: IoChatboxEllipses },
  { path: '/settings', label: 'Settings', icon: IoSettings },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const items = user?.role === 'admin'
    ? [...navItems, { path: '/admin', label: 'Admin', icon: IoShield }]
    : navItems;

  return (
    <>
      {isOpen && <div className={styles.overlay} onClick={onClose} />}
      <motion.aside
        className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}
        initial={false}
      >
        <div className={styles.header}>
          <Logo size="md" variant="sidebar" />
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close sidebar">
            <IoClose size={22} />
          </button>
        </div>
        <nav className={styles.nav}>
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
              onClick={onClose}
            >
              <item.icon className={styles.navIcon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </motion.aside>
    </>
  );
};

export default Sidebar;
