import { useState } from 'react';
import { getTelegramUser, triggerHaptic } from '../telegram';

const THEME_COLORS = ['#0088cc', '#8a2be2', '#ff9e00', '#10b981', '#ef4444'];

export default function ProfileScreen({ showToast }) {
  const user = getTelegramUser();
  const [themeIdx, setThemeIdx] = useState(0);

  const handleCopyId = async () => {
    if (!user.id || user.id === '---') return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(String(user.id));
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = String(user.id);
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      triggerHaptic('medium');
      showToast('Telegram ID скопійовано!');
    } catch {
      showToast('Не вдалося скопіювати ID');
    }
  };

  const handleToggleTheme = () => {
    const nextIdx = (themeIdx + 1) % THEME_COLORS.length;
    setThemeIdx(nextIdx);
    document.documentElement.style.setProperty('--accent-blue', THEME_COLORS[nextIdx]);
    triggerHaptic('selection');
    showToast('Колірну гаму змінено!');
  };

  return (
    <div className="screen-container">
      <div className="os-card profile-card">
        <div className="avatar-container">
          {user.photoUrl ? (
            <img className="avatar-img" src={user.photoUrl} alt="User Avatar" />
          ) : (
            <div className="avatar-fallback">
              <i className="fa-solid fa-user-astronaut"></i>
            </div>
          )}
        </div>

        <h3 style={{ fontSize: '18px', fontWeight: 800 }}>{user.name}</h3>
        <span className="user-handle">{user.username}</span>

        <div className="profile-info-grid">
          <div className="p-item" onClick={handleCopyId}>
            <span>Telegram ID</span>
            <strong>{user.id}</strong>
          </div>
          <div className="p-item">
            <span>Мова</span>
            <strong>{user.language}</strong>
          </div>
          <div className="p-item">
            <span>Платформа</span>
            <strong>{user.platform}</strong>
          </div>
        </div>

        <button
          type="button"
          className="theme-change-btn"
          onClick={handleToggleTheme}
        >
          <i className="fa-solid fa-palette"></i> Змінити колірну гаму
        </button>
      </div>
    </div>
  );
}

