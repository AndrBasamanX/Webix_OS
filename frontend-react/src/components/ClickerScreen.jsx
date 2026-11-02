import { triggerHaptic, sendEnergyToTelegramBot } from '../telegram';

export default function ClickerScreen({ energyCount, onAddEnergy, onResetEnergy, showToast }) {
  const handleClickCore = () => {
    onAddEnergy(1);
    triggerHaptic('light');
  };

  const handleSendToBot = () => {
    if (energyCount <= 0) {
      showToast('Спочатку назбирайте енергію!');
      return;
    }

    const sent = energyCount;
    showToast(`Надсилаємо ${sent} EP в чат-бот...`);

    sendEnergyToTelegramBot(sent, () => {
      onResetEnergy();
    });
  };

  return (
    <div className="screen-container">
      <div className="os-card clicker-card">
        <h3>Енергетичне Ядро</h3>
        <p className="clicker-desc">
          Клікай по ядру, збирай енергію та відправляй боту!
        </p>

        <div className="energy-score">
          <span>{energyCount}</span>
          <small>EP (Energy Points)</small>
        </div>

        <div className="core-button-wrapper">
          <button
            type="button"
            className="core-btn"
            id="core-btn"
            onClick={handleClickCore}
            aria-label="Клікнути ядро"
          >
            <i className="fa-solid fa-atom" style={{ pointerEvents: 'none' }}></i>
          </button>
        </div>

        <button
          type="button"
          className="send-bot-btn"
          onClick={handleSendToBot}
        >
          <i className="fa-solid fa-paper-plane"></i>
          Надіслати енергію в Бот
        </button>
      </div>
    </div>
  );
}

