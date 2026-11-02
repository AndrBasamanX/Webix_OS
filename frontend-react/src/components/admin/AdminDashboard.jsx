// Головна панель адміністратора
import { useState, useEffect } from 'react';
import { APP_VERSION } from '../../config';

export default function AdminDashboard({ user, onNavigate }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const cards = [
    {
      icon: '📊',
      label: 'Статистика',
      desc: 'Кількість користувачів, EP, активність',
      tab: 'stats',
      color: '#3b82f6',
    },
    {
      icon: '👥',
      label: 'Користувачі',
      desc: 'Список гравців, рівні, EP',
      tab: 'users',
      color: '#8b5cf6',
    },
    {
      icon: '⚡️',
      label: 'Видати EP',
      desc: 'Нарахувати енергетичні ядра',
      tab: 'give',
      color: '#f59e0b',
    },
    {
      icon: '📢',
      label: 'Розсилка',
      desc: 'Надіслати повідомлення всім',
      tab: 'broadcast',
      color: '#10b981',
    },
    {
      icon: '🎟',
      label: 'Промокоди',
      desc: 'Керування промокодами',
      tab: 'promo',
      color: '#ef4444',
    },
    {
      icon: '⚙️',
      label: 'Система',
      desc: 'Налаштування та команди',
      tab: 'system',
      color: '#6b7280',
    },
  ];

  return (
    <div className="admin-dashboard">
      {/* Вітання адміна */}
      <div className="admin-welcome">
        <div className="admin-welcome-left">
          <div className="admin-crown">👑</div>
          <div>
            <h2 className="admin-name">{user.name}</h2>
            <p className="admin-role">Головний адміністратор</p>
          </div>
        </div>
        <div className="admin-time">
          {time.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>

      {/* Версія системи */}
      <div className="admin-version-bar">
        <span>🖥 Webix OS {APP_VERSION}</span>
        <span className="admin-badge-online">● ONLINE</span>
      </div>

      {/* Швидкий доступ */}
      <h3 className="admin-section-title">Швидкий доступ</h3>
      <div className="admin-cards-grid">
        {cards.map((card) => (
          <button
            key={card.tab}
            className="admin-card"
            style={{ '--card-color': card.color }}
            onClick={() => onNavigate(card.tab)}
          >
            <span className="admin-card-icon">{card.icon}</span>
            <span className="admin-card-label">{card.label}</span>
            <span className="admin-card-desc">{card.desc}</span>
          </button>
        ))}
      </div>

      {/* Швидкі команди */}
      <h3 className="admin-section-title">Команди бота</h3>
      <div className="admin-commands">
        {[
          { cmd: '/stats', desc: 'Статистика системи' },
          { cmd: '/users', desc: 'Список 15 останніх гравців' },
          { cmd: '/give ID EP', desc: 'Видати EP користувачу' },
          { cmd: '/broadcast TEXT', desc: 'Розсилка всім' },
          { cmd: '/top', desc: 'Топ 10 гравців' },
          { cmd: '/admin', desc: 'Адмін-панель (inline)' },
        ].map(({ cmd, desc }) => (
          <div key={cmd} className="admin-command-row">
            <code className="admin-cmd">{cmd}</code>
            <span className="admin-cmd-desc">{desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
