// Головний роутер: адмін vs. користувач
import { useEffect } from 'react';
import { getTelegramUser, initTelegram } from './telegram';
import { isAdmin } from './config';
import AdminApp from './AdminApp';
import UserApp from './UserApp';

export default function App() {
  // Ініціалізація Telegram WebApp при старті
  useEffect(() => {
    initTelegram();
  }, []);

  const user = getTelegramUser();

  // Маршрутизація: адмін → AdminApp, решта → UserApp
  if (isAdmin(user.id)) {
    return <AdminApp user={user} />;
  }

  return <UserApp user={user} />;
}
