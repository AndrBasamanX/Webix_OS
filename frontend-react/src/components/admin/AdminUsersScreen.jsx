// Список користувачів для адміністратора
import { useState } from 'react';
import { BOT_USERNAME } from '../../config';

const LEVEL_LABELS = {
  1: '🌱 Новачок',
  2: '⚡ Стажер',
  3: '🔷 Оператор',
  4: '🌀 Технік',
  5: '🔥 Майстер',
  6: '💎 Елітний',
  7: '👑 Легенда',
};

// Демонстраційні дані (реальні — через бот /users)
const DEMO_USERS = [
  { id: 8741071265, name: 'Андрій Басаман', ep: 612, level: 7, isAdmin: true },
  { id: 7661119888, name: '𝒜𝓃𝒶𝓈𝓽𝒾', ep: 24, level: 1, isAdmin: false },
];

export default function AdminUsersScreen() {
  const [copied, setCopied] = useState('');

  const copyCmd = (cmd) => {
    navigator.clipboard.writeText(cmd).then(() => {
      setCopied(cmd);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  return (
    <div className="admin-screen">
      <div className="admin-screen-header">
        <h2>👥 Користувачі</h2>
        <p className="admin-screen-desc">
          Актуальний список — у боті. Нижче відображено дані з останньої сесії.
        </p>
      </div>

      {/* Таблиця відомих гравців */}
      <div className="admin-users-table">
        <div className="admin-users-header">
          <span>Гравець</span>
          <span>EP</span>
          <span>Рівень</span>
        </div>
        {DEMO_USERS.map((u) => (
          <div key={u.id} className="admin-user-row">
            <div className="admin-user-info">
              {u.isAdmin && <span className="admin-mini-crown">👑</span>}
              <div>
                <p className="admin-user-name">{u.name}</p>
                <p className="admin-user-id">ID: {u.id}</p>
              </div>
            </div>
            <span className="admin-user-ep">⚡ {u.ep}</span>
            <span className="admin-user-level">{LEVEL_LABELS[u.level] || `Рівень ${u.level}`}</span>
          </div>
        ))}
      </div>

      {/* Команди */}
      <div className="admin-action-section">
        <h3>Команди бота</h3>
        {['/users', '/top'].map((cmd) => (
          <div key={cmd} className="admin-copy-row">
            <code>{cmd}</code>
            <button className="admin-copy-btn" onClick={() => copyCmd(cmd)}>
              {copied === cmd ? '✅ Скопійовано' : '📋 Копіювати'}
            </button>
          </div>
        ))}

        <a
          href={`https://t.me/${BOT_USERNAME}`}
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

