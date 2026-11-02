// Екран статистики для адміністратора
import { useState } from 'react';
import { BOT_USERNAME } from '../../config';

export default function AdminStatsScreen({ user }) {
  const [copied, setCopied] = useState('');

  const copyCmd = (cmd) => {
    navigator.clipboard.writeText(cmd).then(() => {
      setCopied(cmd);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  const stats = [
    { icon: '👥', label: 'Всього користувачів', value: '—', hint: 'Перевір у боті' },
    { icon: '⚡️', label: 'Загальна кількість EP', value: '—', hint: 'Перевір у боті' },
    { icon: '🏆', label: 'Макс. EP у гравця', value: '—', hint: 'Перевір у боті' },
    { icon: '🎟', label: 'Активацій промокодів', value: '—', hint: 'Перевір у боті' },
  ];

  return (
    <div className="admin-screen">
      <div className="admin-screen-header">
        <h2>📊 Статистика системи</h2>
        <p className="admin-screen-desc">
          Дані зберігаються у PostgreSQL. Для актуальних цифр — відправ команду в бот.
        </p>
      </div>

      <div className="admin-stats-grid">
        {stats.map((s) => (
          <div key={s.label} className="admin-stat-card">
            <span className="admin-stat-icon">{s.icon}</span>
            <span className="admin-stat-label">{s.label}</span>
            <span className="admin-stat-value">{s.value}</span>
            <span className="admin-stat-hint">{s.hint}</span>
          </div>
        ))}
      </div>

      <div className="admin-action-section">
        <h3>Отримати реальні дані</h3>

        <div className="admin-copy-row">
          <code>/stats</code>
          <button
            className="admin-copy-btn"
            onClick={() => copyCmd('/stats')}
          >
            {copied === '/stats' ? '✅ Скопійовано' : '📋 Копіювати'}
          </button>
        </div>

        <a
          href={`https://t.me/${BOT_USERNAME}?start=admin`}
          className="admin-open-bot-btn"
          target="_blank"
          rel="noreferrer"
        >
          🤖 Відкрити бот
        </a>
      </div>
    </div>
  );
}
