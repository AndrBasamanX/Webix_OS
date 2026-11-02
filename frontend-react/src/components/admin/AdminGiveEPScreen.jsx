// Видача EP — екран для адміністратора
import { useState } from 'react';
import { BOT_USERNAME } from '../../config';
import { triggerHaptic } from '../../telegram';

export default function AdminGiveEPScreen() {
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [generated, setGenerated] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = () => {
    if (!userId || !amount) return;
    const cmd = `/give ${userId.trim()} ${amount.trim()}`;
    setGenerated(cmd);
    setCopied(false);
    triggerHaptic('medium');
  };

  const copyToClipboard = () => {
    if (!generated) return;
    navigator.clipboard.writeText(generated).then(() => {
      setCopied(true);
      triggerHaptic('success');
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const openInBot = () => {
    if (!generated) return;
    // Відправляємо команду через deep link
    const link = `https://t.me/${BOT_USERNAME}`;
    window.open(link, '_blank');
  };

  const quickAmounts = [50, 100, 250, 500, 1000];

  return (
    <div className="admin-screen">
      <div className="admin-screen-header">
        <h2>⚡️ Видати EP</h2>
        <p className="admin-screen-desc">
          Заповни форму — отримаєш команду для бота. Скопіюй і відправ у чат з ботом.
        </p>
      </div>

      <div className="admin-form">
        <label className="admin-form-label">
          Telegram ID користувача
          <input
            className="admin-form-input"
            type="number"
            placeholder="Наприклад: 7661119888"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </label>

        <label className="admin-form-label">
          Кількість EP
          <input
            className="admin-form-input"
            type="number"
            placeholder="Наприклад: 100"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>

        {/* Швидкий вибір кількості */}
        <div className="admin-quick-amounts">
          {quickAmounts.map((q) => (
            <button
              key={q}
              className={`admin-quick-btn ${amount === String(q) ? 'active' : ''}`}
              onClick={() => setAmount(String(q))}
            >
              +{q}
            </button>
          ))}
        </div>

        <button className="admin-generate-btn" onClick={generate}>
          ⚡ Згенерувати команду
        </button>
      </div>

      {generated && (
        <div className="admin-result-block">
          <p className="admin-result-label">Команда для бота:</p>
          <code className="admin-result-code">{generated}</code>
          <div className="admin-result-actions">
            <button className="admin-copy-btn large" onClick={copyToClipboard}>
              {copied ? '✅ Скопійовано!' : '📋 Копіювати'}
            </button>
            <button className="admin-open-bot-btn" onClick={openInBot}>
              🤖 Відкрити бот
            </button>
          </div>
          <p className="admin-result-hint">
            ℹ️ Скопіюй команду і відправ її в чат з ботом @{BOT_USERNAME}
          </p>
        </div>
      )}
    </div>
  );
}
