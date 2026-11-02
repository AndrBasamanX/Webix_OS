// Управління промокодами — екран для адміністратора
import { useState } from 'react';
import { BOT_USERNAME } from '../../config';

const KNOWN_PROMOS = [
  { code: 'WEBIX2026', ep: 100, desc: 'Стартовий промокод 2026' },
  { code: 'START', ep: 50, desc: 'Промокод для нових гравців' },
];

export default function AdminPromoScreen() {
  const [copied, setCopied] = useState('');

  const copyCode = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(code);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  return (
    <div className="admin-screen">
      <div className="admin-screen-header">
        <h2>🎟 Промокоди</h2>
        <p className="admin-screen-desc">
          Активні промокоди системи. Щоб додати новий промокод — зверни до бази даних напряму або додай у code.
        </p>
      </div>

      <div className="admin-promo-list">
        {KNOWN_PROMOS.map((p) => (
          <div key={p.code} className="admin-promo-row">
            <div className="admin-promo-info">
              <code className="admin-promo-code">{p.code}</code>
              <p className="admin-promo-desc">{p.desc}</p>
            </div>
            <div className="admin-promo-right">
              <span className="admin-promo-ep">+{p.ep} EP</span>
              <button
                className="admin-copy-btn"
                onClick={() => copyCode(p.code)}
              >
                {copied === p.code ? '✅' : '📋'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-action-section">
        <h3>Як гравець активує промокод</h3>
        <div className="admin-copy-row">
          <code>/promo WEBIX2026</code>
          <button className="admin-copy-btn" onClick={() => copyCode('/promo WEBIX2026')}>
            {copied === '/promo WEBIX2026' ? '✅' : '📋'}
          </button>
        </div>
        <p className="admin-result-hint">
          ℹ️ Промокод можна активувати лише один раз. Доступний з Рівня 3.
        </p>

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
