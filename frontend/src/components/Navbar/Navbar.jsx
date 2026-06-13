import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoMenu, IoSearch, IoNotifications, IoMoon, IoSunny, IoPerson, IoLogOut, IoSettings } from 'react-icons/io5';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { notificationAPI } from '../../services/api';
import Logo from '../Logo/Logo';
import styles from './Navbar.module.css';

const Navbar = ({ onMenuClick, title }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    notificationAPI.getAll().then(({ data }) => {
      setNotifications(data.data);
      setUnreadCount(data.unreadCount);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <header className={styles.navbar}>
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onMenuClick} aria-label="Menu">
          <IoMenu size={22} />
        </button>
        <div className={styles.mobileLogo}>
          <Logo size="sm" showText={false} />
        </div>
        <div className={styles.titleWrap}>
          <h1 className={styles.greeting}>{greeting()}, {user?.name?.split(' ')[0]}</h1>
          {title && <span className={styles.pageTitle}>{title}</span>}
        </div>
      </div>

      <div className={styles.search}>
        <IoSearch className={styles.searchIcon} />
        <input type="text" placeholder="Search..." className={styles.searchInput} />
      </div>

      <div className={styles.actions}>
        <button className={styles.actionBtn} onClick={toggleTheme} aria-label="Toggle theme">
          {isDark ? <IoSunny size={18} /> : <IoMoon size={18} />}
        </button>

        <div className={styles.dropdown} ref={notifRef}>
          <button className={styles.actionBtn} onClick={() => setShowNotifications(!showNotifications)} aria-label="Notifications">
            <IoNotifications size={18} />
            {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
          </button>
          {showNotifications && (
            <div className={styles.dropdownMenu}>
              <div className={styles.dropdownHeader}>Notifications</div>
              {notifications.length === 0 ? (
                <p className={styles.emptyNotif}>No notifications yet</p>
              ) : (
                notifications.slice(0, 5).map((n) => (
                  <div key={n._id} className={`${styles.notifItem} ${!n.read ? styles.unread : ''}`}>
                    <strong>{n.title}</strong>
                    <p>{n.message}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className={styles.dropdown} ref={profileRef}>
          <button className={styles.profileBtn} onClick={() => setShowProfile(!showProfile)}>
            <div className={styles.avatar}>{user?.name?.[0]?.toUpperCase()}</div>
          </button>
          {showProfile && (
            <div className={styles.dropdownMenu}>
              <div className={styles.profileInfo}>
                <strong>{user?.name}</strong>
                <span>{user?.email}</span>
              </div>
              <button className={styles.menuItem} onClick={() => { navigate('/settings'); setShowProfile(false); }}>
                <IoSettings /> Settings
              </button>
              <button className={styles.menuItem} onClick={handleLogout}>
                <IoLogOut /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
