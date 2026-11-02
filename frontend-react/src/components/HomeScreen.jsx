import { useState, useEffect } from 'react';
import { tg, showTelegramPopup, openTelegramQrScanner } from '../telegram';

export default function HomeScreen({ energyCount, onNavigate, showToast }) {
  const [cpu, setCpu] = useState(12);
  const [ram, setRam] = useState(420);
  const [mainBtnActive, setMainBtnActive] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCpu(Math.floor(Math.random() * 15) + 8);
      setRam(Math.floor(Math.random() * 35) + 400);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handlePopup = () => {
    showTelegramPopup(
      "Webix OS Notice",
      "Бажаєте продовжити роботу з системою?",
      (confirmed) => {
        if (confirmed) {
          showToast("Дію підтверджено!");
        } else {
          showToast("Скасовано");
        }
      }
    );
  };

  const handleToggleMainButton = () => {
    if (!tg?.MainButton) {
      showToast("MainButton не підтримується на цьому пристрої");
      return;
    }

    if (!mainBtnActive) {
      tg.MainButton.text = "ЗБЕРЕГТИ ДАНІ В BOT";
      tg.MainButton.show();
      tg.MainButton.onClick(() => {
        showToast("MainButton активовано!");
      });
      setMainBtnActive(true);
      showToast("MainButton активовано внизу Telegram");
    } else {
      tg.MainButton.hide();
      setMainBtnActive(false);
      showToast("MainButton приховано");
    }
  };

  const handleQrScan = () => {
    openTelegramQrScanner((result) => {
      showToast(`QR розпізнано: ${result}`);
    });
  };

  const energyPercent = Math.min(energyCount, 100);

  return (
    <div className="screen-container">
      {/* Статистика процесора та пам'яті */}
      <div className="quick-stats">
        <div className="stat-card">
          <i className="fa-solid fa-cpu icon-blue"></i>
          <span className="stat-value">{cpu}%</span>
          <span className="stat-label">Завантаження CPU</span>
        </div>
        <div className="stat-card">
          <i className="fa-solid fa-memory icon-purple"></i>
          <span className="stat-value">{ram} MB</span>
          <span className="stat-label">Пам'ять RAM</span>
        </div>
      </div>

      {/* Прогрес-бар генератора */}
      <div className="os-card progress-card">
        <div className="p-header">
          <span>Заряд генератора Webix</span>
          <strong>{energyPercent}%</strong>
        </div>
        <div className="progress-bar-bg">
          <div
            className="progress-bar-fill"
            style={{ width: `${energyPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Меню швидких дій */}
      <div className="menu-list">
        <button
          type="button"
          className="action-card"
          onClick={() => onNavigate('clicker')}
        >
          <div className="card-icon orange">
            <i className="fa-solid fa-gamepad"></i>
          </div>
          <div className="card-info">
            <span className="title">Міні-гра «Енерго-Ядро»</span>
            <span className="subtitle">Генеруй енергію для Telegram бота</span>
          </div>
          <i className="fa-solid fa-chevron-right arrow"></i>
        </button>

        <button
          type="button"
          className="action-card"
          onClick={handlePopup}
        >
          <div className="card-icon blue">
            <i className="fa-solid fa-window-restore"></i>
          </div>
          <div className="card-info">
            <span className="title">Telegram Native Popup</span>
            <span className="subtitle">Діалогове вікно з кнопками</span>
          </div>
          <i className="fa-solid fa-chevron-right arrow"></i>
        </button>

        <button
          type="button"
          className="action-card"
          onClick={handleToggleMainButton}
        >
          <div className="card-icon green">
            <i className="fa-solid fa-toggle-on"></i>
          </div>
          <div className="card-info">
            <span className="title">Тест MainButton SDK</span>
            <span className="subtitle">
              {mainBtnActive ? "Приховати нижню кнопку" : "Показати нижню кнопку"}
            </span>
          </div>
          <i className="fa-solid fa-chevron-right arrow"></i>
        </button>

        <button
          type="button"
          className="action-card"
          onClick={handleQrScan}
        >
          <div className="card-icon purple">
            <i className="fa-solid fa-qrcode"></i>
          </div>
          <div className="card-info">
            <span className="title">Сканер QR-кодів</span>
            <span className="subtitle">Нативний сканер Telegram</span>
          </div>
          <i className="fa-solid fa-chevron-right arrow"></i>
        </button>
      </div>
    </div>
  );
}

