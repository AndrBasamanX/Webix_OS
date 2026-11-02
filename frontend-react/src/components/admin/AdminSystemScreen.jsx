// Системна інформація для адміністратора
import { APP_VERSION, BOT_USERNAME, ADMIN_IDS } from '../../config';

export default function AdminSystemScreen() {
  const info = [
    { label: 'Версія застосунку', value: APP_VERSION },
    { label: 'Бот', value: `@${BOT_USERNAME}` },
    { label: 'Тип бази даних', value: 'PostgreSQL (Neon)' },
    { label: 'Фронтенд', value: 'React 19 + Vite' },
    { label: 'Хостинг WebApp', value: 'GitHub Pages' },
    { label: 'Admin ID(s)', value: ADMIN_IDS.join(', ') },
  ];

  const botCmds = [
    { cmd: '/start', desc: 'Запустити або перезапустити бота' },
    { cmd: '/profile', desc: 'Показати профіль і рівень' },
    { cmd: '/top', desc: 'Топ 10 гравців' },
    { cmd: '/help', desc: 'Допомога та система рівнів' },
    { cmd: '/daily', desc: 'Щоденний бонус (Рів. 2+)' },
    { cmd: '/roulette', desc: 'Рулетка (Рів. 2+)' },
    { cmd: '/mine', desc: 'Майнінг EP (Рів. 3+)' },
    { cmd: '/promo CODE', desc: 'Активувати промокод (Рів. 3+)' },
    { cmd: '/stats', desc: '👑 Статистика системи' },
    { cmd: '/users', desc: '👑 Список користувачів' },
    { cmd: '/give ID EP', desc: '👑 Видати EP' },
    { cmd: '/broadcast TEXT', desc: '👑 Розсилка всім' },
    { cmd: '/admin', desc: '👑 Адмін-панель (inline)' },
  ];

  return (
    <div className="admin-screen">
      <div className="admin-screen-header">
        <h2>⚙️ Системна інформація</h2>
      </div>

      <div className="admin-sys-grid">
        {info.map((i) => (
          <div key={i.label} className="admin-sys-row">
            <span className="admin-sys-label">{i.label}</span>
            <span className="admin-sys-value">{i.value}</span>
          </div>
        ))}
      </div>

      <h3 className="admin-section-title" style={{ marginTop: '1.5rem' }}>
        Всі команди бота
      </h3>
      <div className="admin-commands">
        {botCmds.map(({ cmd, desc }) => (
          <div key={cmd} className="admin-command-row">
            <code className="admin-cmd">{cmd}</code>
            <span className="admin-cmd-desc">{desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
