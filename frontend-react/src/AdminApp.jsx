// Головний компонент для адміністратора
import './admin.css';
import { useState, useEffect, useRef } from 'react';
import Toast from './components/Toast';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminStatsScreen from './components/admin/AdminStatsScreen';
import AdminUsersScreen from './components/admin/AdminUsersScreen';
import AdminGiveEPScreen from './components/admin/AdminGiveEPScreen';
import AdminBroadcastScreen from './components/admin/AdminBroadcastScreen';
import AdminPromoScreen from './components/admin/AdminPromoScreen';
import AdminSystemScreen from './components/admin/AdminSystemScreen';
import { tg } from './telegram';

// Вкладки адміністратора
const ADMIN_TABS = [
  { id: 'dashboard', icon: '🏠', label: 'Головна' },
  { id: 'stats',     icon: '📊', label: 'Статистика' },
  { id: 'users',     icon: '👥', label: 'Гравці' },
  { id: 'give',      icon: '⚡️', label: 'EP' },
  { id: 'broadcast', icon: '📢', label: 'Розсилка' },
  { id: 'promo',     icon: '🎟', label: 'Промо' },
  { id: 'system',    icon: '⚙️', label: 'Система' },
];

export default function AdminApp({ user }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState({ message: '', visible: false });
  const toastTimeoutRef = useRef(null);

  // BackButton для адмін-панелі
  useEffect(() => {
    if (!tg?.BackButton) return;

    if (activeTab === 'dashboard') {
      tg.BackButton.hide();
    } else {
      tg.BackButton.show();
      const handleBack = () => setActiveTab('dashboard');
      tg.BackButton.onClick(handleBack);
      return () => tg.BackButton.offClick(handleBack);
    }
  }, [activeTab]);

  const showToast = (message) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, visible: true });
    toastTimeoutRef.current = setTimeout(
      () => setToast((prev) => ({ ...prev, visible: false })),
      2500
    );
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard': return <AdminDashboard user={user} onNavigate={setActiveTab} />;
      case 'stats':     return <AdminStatsScreen user={user} showToast={showToast} />;
      case 'users':     return <AdminUsersScreen showToast={showToast} />;
      case 'give':      return <AdminGiveEPScreen showToast={showToast} />;
      case 'broadcast': return <AdminBroadcastScreen showToast={showToast} />;
      case 'promo':     return <AdminPromoScreen showToast={showToast} />;
      case 'system':    return <AdminSystemScreen />;
      default:          return <AdminDashboard user={user} onNavigate={setActiveTab} />;
    }
  };

  return (
    <>
      <div className="bg-glow admin-glow"></div>
      <div className="app-container admin-container">

        {/* Адмін-шапка */}
        <header className="admin-header">
          <div className="admin-header-brand">
            <span className="admin-header-crown">👑</span>
            <span className="admin-header-title">ADMIN PANEL</span>
          </div>
          <div className="admin-header-user">
            <span className="admin-header-name">{user.name}</span>
          </div>
        </header>

        {/* Адмін-навігація (горизонтальний скрол) */}
        <nav className="admin-nav">
          {ADMIN_TABS.map((tab) => (
            <button
              key={tab.id}
              className={`admin-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="admin-nav-icon">{tab.icon}</span>
              <span className="admin-nav-label">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Вміст */}
        <main className="content admin-content">
          {renderScreen()}
        </main>

        <Toast message={toast.message} visible={toast.visible} />
      </div>
    </>
  );
}
