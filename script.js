// 1. Динамічний годинник
function updateClock() {
    const clockElement = document.getElementById('clock');
    if (clockElement) {
        const now = new Date();
        clockElement.textContent = now.toLocaleTimeString();
    }
}
setInterval(updateClock, 1000);
updateClock();

// 2. Перемикання екранів (SPA)
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));

    const selectedScreen = document.getElementById(`screen-${tabName}`);
    if (selectedScreen) {
        selectedScreen.classList.add('active');
    }
    
    // Активуємо натиснуту кнопку
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

// 3. Кастомний Toast замість alert
let toastTimeout;
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    toastMessage.textContent = message;
    toast.classList.remove('hidden');

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.add('hidden');
    }, 2500);
}

function handleMenuClick(actionName) {
    showToast(`Натиснуто: ${actionName}`);
}

// 4. Інтеграція з Telegram WebApp SDK
if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.expand(); // Розгортаємо на весь екран

    // Отримання імені з Telegram
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        const nameElement = document.getElementById('user-name');
        if (nameElement) {
            nameElement.textContent = `${user.first_name} ${user.last_name || ''}`;
        }
    }
}