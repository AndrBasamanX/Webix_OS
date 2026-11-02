// Головний компонент для звичайних користувачів
import { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import HomeScreen from './components/HomeScreen';
import ClickerScreen from './components/ClickerScreen';
import TasksScreen from './components/TasksScreen';
import WeatherScreen from './components/WeatherScreen';
import ProfileScreen from './components/ProfileScreen';
import Toast from './components/Toast';
import { tg } from './telegram';

export default function UserApp({ user }) {
  const [activeTab, setActiveTab] = useState('home');
  const [energyCount, setEnergyCount] = useState(0);
  const [toast, setToast] = useState({ message: '', visible: false });
  const toastTimeoutRef = useRef(null);

  // Керування нативною кнопкою Telegram "BackButton"
  useEffect(() => {
    if (!tg?.BackButton) return;

    if (activeTab === 'home') {
      tg.BackButton.hide();
    } else {
      tg.BackButton.show();
      const handleBack = () => setActiveTab('home');
      tg.BackButton.onClick(handleBack);
      return () => {
        tg.BackButton.offClick(handleBack);
      };
    }
  }, [activeTab]);

  const showToast = (message) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, visible: true });
    toastTimeoutRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2500);
  };

  const handleAddEnergy = (amount = 1) => {
    setEnergyCount((prev) => prev + amount);
  };

  const handleResetEnergy = () => {
    setEnergyCount(0);
  };

  return (
    <>
      <div className="bg-glow"></div>
      <div className="app-container">
        {/* Шапка з годинником та брендингом */}
        <Header user={user} />

        {/* Навігація між модулями */}
        <Navigation activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* Вміст обраного модуля */}
        <main className="content">
          {activeTab === 'home' && (
            <HomeScreen
              energyCount={energyCount}
              onNavigate={setActiveTab}
              showToast={showToast}
            />
          )}

          {activeTab === 'clicker' && (
            <ClickerScreen
              energyCount={energyCount}
              onAddEnergy={handleAddEnergy}
              onResetEnergy={handleResetEnergy}
              showToast={showToast}
            />
          )}

          {activeTab === 'tasks' && <TasksScreen showToast={showToast} />}

          {activeTab === 'weather' && <WeatherScreen showToast={showToast} />}

          {activeTab === 'profile' && <ProfileScreen user={user} showToast={showToast} />}
        </main>

        {/* Сповіщення Toast */}
        <Toast message={toast.message} visible={toast.visible} />
      </div>
    </>
  );
}

