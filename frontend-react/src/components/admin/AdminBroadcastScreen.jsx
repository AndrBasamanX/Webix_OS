// Розсилка повідомлень — екран для адміністратора
import { useState } from 'react';
import { BOT_USERNAME } from '../../config';
import { triggerHaptic } from '../../telegram';

const TEMPLATES = [
  { label: '🎉 Оновлення', text: '🎉 Нове оновлення Webix OS! Заходь і досліджуй нові можливості системи.' },
  { label: '⚡ Бонус', text: '⚡ Спеціальний бонус для активних гравців! Увійди сьогодні та отримай подарунок.' },
  { label: '🏆 Подія', text: '🏆 Стартує нова подія у Webix OS! Збирай ядра та змагайся за першість у рейтингу.' },
  { label: '🔧 ТО', text: '🔧 Планове технічне обслуговування. Деякі функції можуть бути тимчасово недоступні.' },
];

export default function AdminBroadcastScreen() {
  const [text, setText] = useState('');
  const [generated, setGenerated] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = () => {
    if (!text.trim()) return;
    const cmd = `/broadcast ${text.trim()}`;
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

  const applyTemplate = (tmpl) => {
    setText(tmpl);
    setGenerated('');
    setCopied(false);
  };

  return (
    <div className="admin-screen">
      <div className="admin-screen-header">
        <h2>📢 Розсилка</h2>
        <p className="admin-screen-desc">
          Склади текст — отримаєш команду для бота. Бот надішле повідомлення всім гравцям.
        </p>
      </div>

      {/* Шаблони */}
      <div className="admin-action-section">
        <h3>Шаблони повідомлень</h3>
        <div className="admin-templates">
          {TEMPLATES.map((t) => (
            <button
              key={t.label}
              className="admin-template-btn"
              onClick={() => applyTemplate(t.text)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Редактор */}
      <div className="admin-form">
        <label className="admin-form-label">
          Текст повідомлення
          <textarea
            className="admin-form-textarea"
            placeholder="Введи текст розсилки..."
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <span className="admin-char-count">{text.length} символів</span>
        </label>

        <button
          className="admin-generate-btn"
          onClick={generate}
          disabled={!text.trim()}
        >
          📢 Згенерувати команду
        </button>
      </div>

      {generated && (
        <div className="admin-result-block">
          <p className="admin-result-label">Команда для бота:</p>
          <code className="admin-result-code broadcast-code">{generated}</code>
          <div className="admin-result-actions">
            <button className="admin-copy-btn large" onClick={copyToClipboard}>
              {copied ? '✅ Скопійовано!' : '📋 Копіювати'}
            </button>
            <a
              href={`https://t.me/${BOT_USERNAME}`}
              className="admin-open-bot-btn"
              target="_blank"
              rel="noreferrer"
            >
              🤖 Відкрити бот
            </a>
          </div>
          <p className="admin-result-hint">
            ℹ️ Скопіюй команду і відправ у чат з ботом @{BOT_USERNAME}
          </p>
        </div>
      )}
    </div>
  );
}
