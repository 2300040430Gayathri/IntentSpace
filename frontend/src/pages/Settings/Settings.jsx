import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { authAPI } from '../../services/api';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import { exportData, readFileAsJSON } from '../../utils/helpers';
import styles from './Settings.module.css';

const Settings = () => {
  const { user, updateUser, logout } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ name: user?.name || '', bio: user?.bio || '', timezone: user?.timezone || 'UTC' });
  const [notifications, setNotifications] = useState(user?.notifications || { habits: true, tasks: true, focus: true, planner: true, browser: true });
  const [saving, setSaving] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await authAPI.updateProfile({ ...profile, theme, notifications });
      updateUser({ ...profile, theme, notifications });
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    exportData({ user: profile, exportedAt: new Date().toISOString() }, `intentspace-backup-${Date.now()}.json`);
    toast.success('Data exported');
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await readFileAsJSON(file);
      if (data.user) setProfile(data.user);
      toast.success('Data imported');
    } catch {
      toast.error('Invalid backup file');
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure? This action cannot be undone.')) return;
    await authAPI.deleteAccount();
    await logout();
    navigate('/login');
    toast.success('Account deleted');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleNotif = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className={styles.page}>
      <h2>Settings</h2>
      <p className={styles.sub}>Manage your account and preferences</p>

      <div className={styles.sections}>
        <Card>
          <h3>Profile</h3>
          <div className={styles.form}>
            <Input label="Name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            <div className={styles.field}>
              <label>Bio</label>
              <textarea className={styles.textarea} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={3} />
            </div>
            <Input label="Timezone" value={profile.timezone} onChange={(e) => setProfile({ ...profile, timezone: e.target.value })} />
          </div>
        </Card>

        <Card>
          <h3>Appearance</h3>
          <div className={styles.themeOptions}>
            {['light', 'dark'].map((t) => (
              <button key={t} className={`${styles.themeBtn} ${theme === t ? styles.active : ''}`} onClick={() => setTheme(t)}>
                {t === 'light' ? '☀️ Light' : '🌙 Dark'}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h3>Notifications</h3>
          <div className={styles.toggles}>
            {Object.entries(notifications).map(([key, val]) => (
              <label key={key} className={styles.toggle}>
                <span>{key.charAt(0).toUpperCase() + key.slice(1)} Reminders</span>
                <input type="checkbox" checked={val} onChange={() => toggleNotif(key)} />
              </label>
            ))}
          </div>
        </Card>

        <Card>
          <h3>Data</h3>
          <div className={styles.dataActions}>
            <Button variant="outline" onClick={handleExport}>Export Data</Button>
            <label className={styles.importBtn}>
              Import Data
              <input type="file" accept=".json" onChange={handleImport} hidden />
            </label>
          </div>
        </Card>

        <div className={styles.actions}>
          <Button onClick={saveProfile} loading={saving}>Save Changes</Button>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
          <Button variant="danger" onClick={handleDeleteAccount}>Delete Account</Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
