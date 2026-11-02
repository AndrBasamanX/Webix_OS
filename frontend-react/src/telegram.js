// Обгортка для Telegram WebApp SDK
import { BOT_USERNAME } from './config';

export const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;

export function initTelegram() {
  if (!tg) return;

  try {
    tg.ready();
    tg.expand();

    if (tg.setHeaderColor) {
      tg.setHeaderColor('#090d16');
    }
    if (tg.setBackgroundColor) {
      tg.setBackgroundColor('#090d16');
    }
  } catch (err) {
    console.warn("Помилка ініціалізації Telegram WebApp SDK:", err);
  }
}

// Отримання даних користувача Telegram
export function getTelegramUser() {
  const user = tg?.initDataUnsafe?.user;
  if (!user) {
    return {
      id: '---',
      name: 'Гість (поза Telegram)',
      username: '@guest',
      language: 'uk',
      platform: tg?.platform || 'Browser',
      photoUrl: null,
      isTelegram: false,
    };
  }

  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.first_name || 'Користувач';
  const handle = user.username ? `@${user.username}` : `@id${user.id}`;

  return {
    id: user.id,
    name: fullName,
    username: handle,
    language: user.language_code || 'uk',
    platform: tg?.platform || 'WebApp',
    photoUrl: user.photo_url || null,
    isTelegram: true,
  };
}

// Вібрація (тактильний відгук)
export function triggerHaptic(type = 'light') {
  if (tg?.HapticFeedback) {
    try {
      tg.HapticFeedback.impactOccurred(type);
    } catch {
      // Ігноруємо якщо недоступно на десктопі
    }
  }
}

// Надіслати енергію / ядра в бот
export function sendEnergyToTelegramBot(energyAmount, onComplete) {
  if (energyAmount <= 0) return false;

  // 1. Спроба sendData (працює якщо WebApp відкрито через KeyboardButton)
  try {
    if (tg && typeof tg.sendData === 'function') {
      tg.sendData(
        JSON.stringify({
          action: "energy_transfer",
          energy: energyAmount,
        })
      );
    }
  } catch (e) {
    console.warn("sendData недоступний у поточному режимі:", e);
  }

  // 2. Deep link — універсальний метод (працює з Menu Button, Inline кнопкою, посиланнями)
  const deepLink = `https://t.me/${BOT_USERNAME}?start=energy_${energyAmount}`;

  if (tg && typeof tg.openTelegramLink === 'function') {
    tg.openTelegramLink(deepLink);

    // Закриваємо вікно WebApp через 300мс, щоб Telegram перемкнув на чат із ботом
    setTimeout(() => {
      if (tg && typeof tg.close === 'function') {
        tg.close();
      }
    }, 300);
  } else {
    // Режим тестування у браузері
    window.open(deepLink, '_blank');
  }

  if (onComplete) onComplete();
  return true;
}

// Нативний діалог Telegram
export function showTelegramPopup(title, message, callback) {
  if (tg?.showPopup) {
    tg.showPopup(
      {
        title,
        message,
        buttons: [
          { id: "ok", type: "default", text: "Так" },
          { id: "cancel", type: "cancel", text: "Скасувати" },
        ],
      },
      (buttonId) => {
        if (callback) callback(buttonId === 'ok');
      }
    );
  } else {
    const ok = window.confirm(`${title}\n\n${message}`);
    if (callback) callback(ok);
  }
}

// Сканер QR
export function openTelegramQrScanner(callback) {
  if (tg?.showScanQrPopup) {
    tg.showScanQrPopup({ text: "Скануйте QR-код системи Webix" }, (text) => {
      if (callback) callback(text);
      return true;
    });
  } else {
    alert("Нативний QR-сканер доступний лише у мобільному Telegram.");
  }
}

