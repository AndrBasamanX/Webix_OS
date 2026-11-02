// ==========================================
// 1. ІНІЦІАЛІЗАЦІЯ TELEGRAM WEBSDK ТА ПРОФІЛЮ
// ==========================================
const tg = window.Telegram?.WebApp;
const BOT_USERNAME = "Webixbot_app_bot"; // username вашого бота

document.addEventListener('DOMContentLoaded', () => {
    if (tg) {
        try {
            tg.ready();
            tg.expand(); // Розгортає WebApp на весь екран
            if (tg.setHeaderColor) {
                tg.setHeaderColor('#0a0d14');
            }
            if (tg.setBackgroundColor) {
                tg.setBackgroundColor('#0a0d14');
            }
        } catch (e) {
            console.warn("Помилка ініціалізації WebApp SDK:", e);
        }

        // Отримання даних користувача з Telegram
        const user = tg.initDataUnsafe?.user;

        if (user) {
            const userNameEl = document.getElementById('user-name');
            const userUsernameEl = document.getElementById('user-username');
            const userIdEl = document.getElementById('user-id');
            const userLangEl = document.getElementById('user-lang');
            const userPlatformEl = document.getElementById('user-platform');
            const userPhotoEl = document.getElementById('user-photo');
            const avatarFallbackEl = document.getElementById('avatar-fallback');

            if (userNameEl) {
                userNameEl.textContent = user.first_name + (user.last_name ? ` ${user.last_name}` : '');
            }
            if (userUsernameEl) {
                userUsernameEl.textContent = user.username ? `@${user.username}` : `@id${user.id}`;
            }
            if (userIdEl) {
                userIdEl.textContent = user.id;
            }
            if (userLangEl) {
                userLangEl.textContent = user.language_code || 'uk';
            }
            if (userPlatformEl) {
                userPlatformEl.textContent = tg.platform || 'WebApp';
            }
            if (user.photo_url && userPhotoEl && avatarFallbackEl) {
                userPhotoEl.src = user.photo_url;
                userPhotoEl.classList.remove('hidden');
                avatarFallbackEl.classList.add('hidden');
            }
        } else {
            const userNameEl = document.getElementById('user-name');
            if (userNameEl) userNameEl.textContent = "Гість (поза Telegram)";
        }

        // Налаштовуємо нативну кнопку BackButton у верхній панелі Telegram
        if (tg.BackButton) {
            tg.BackButton.onClick(() => {
                switchTab('home');
            });
        }
    }

    // Прив'язка події для клікера (енергетичного ядра)
    const coreBtn = document.getElementById('core-btn');
    if (coreBtn) {
        coreBtn.addEventListener('click', clickEnergyCore);
    }

    // Запуск динамічних показників
    startSystemStatsSimulation();
    renderTasks();
});

// ==========================================
// 2. НАВІГАЦІЯ МІЖ ВКЛАДКАМИ (ТАБАМИ)
// ==========================================
function switchTab(tabId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    const targetScreen = document.getElementById(`screen-${tabId}`);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }

    const targetTab = document.querySelector(`.nav-tab[data-tab="${tabId}"]`);
    if (targetTab) {
        targetTab.classList.add('active');
    }

    // Керування кнопкою "Назад" у Telegram WebApp
    if (tg && tg.BackButton) {
        if (tabId === 'home') {
            tg.BackButton.hide();
        } else {
            tg.BackButton.show();
        }
    }
}

// ==========================================
// 3. ГОДИННИК ТА СИМУЛЯЦІЯ СИСТЕМИ
// ==========================================
function updateClock() {
    const clockEl = document.getElementById('clock');
    if (clockEl) {
        const now = new Date();
        clockEl.textContent = now.toTimeString().split(' ')[0];
    }
}
setInterval(updateClock, 1000);
updateClock();

function startSystemStatsSimulation() {
    setInterval(() => {
        const cpuEl = document.getElementById('cpu-usage');
        const ramEl = document.getElementById('ram-usage');
        if (cpuEl) {
            const cpu = Math.floor(Math.random() * 15) + 8;
            cpuEl.textContent = `${cpu}%`;
        }
        if (ramEl) {
            const ram = Math.floor(Math.random() * 35) + 400;
            ramEl.textContent = `${ram} MB`;
        }
    }, 4000);
}

// ==========================================
// 4. КЛІКЕР (ЕНЕРГЕТИЧНЕ ЯДРО)
// ==========================================
let energyCount = 0;

function clickEnergyCore() {
    energyCount += 1;
    
    const clickCountEl = document.getElementById('click-count');
    if (clickCountEl) clickCountEl.textContent = energyCount;

    const energyBar = document.getElementById('energy-bar');
    const energyPercent = document.getElementById('energy-percent');
    const percent = Math.min(energyCount, 100);
    
    if (energyBar) energyBar.style.width = `${percent}%`;
    if (energyPercent) energyPercent.textContent = `${percent}%`;

    // Вібраційний відгук на телефоні
    if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
}

function sendEnergyToBot() {
    if (energyCount <= 0) {
        showToast('Спочатку назбирайте енергію!');
        return;
    }

    const sentEnergy = energyCount;

    // Скидаємо лічильник і UI
    energyCount = 0;
    const clickCountEl = document.getElementById('click-count');
    if (clickCountEl) clickCountEl.textContent = 0;
    const energyBar = document.getElementById('energy-bar');
    const energyPercent = document.getElementById('energy-percent');
    if (energyBar) energyBar.style.width = '0%';
    if (energyPercent) energyPercent.textContent = '0%';

    showToast(`Надсилаємо ${sentEnergy} EP в чат-бот...`);

    // 1. Спроба sendData (працює якщо WebApp відкритий через KeyboardButton)
    try {
        if (tg && typeof tg.sendData === 'function') {
            tg.sendData(JSON.stringify({
                action: "energy_transfer",
                energy: sentEnergy
            }));
        }
    } catch (e) {
        console.warn("sendData не підтримується у поточному вікні:", e);
    }

    // 2. Універсальний deep-link (працює при відкритті через Menu Button або Inline кнопку)
    const deepLink = `https://t.me/${BOT_USERNAME}?start=energy_${sentEnergy}`;

    if (tg && typeof tg.openTelegramLink === 'function') {
        tg.openTelegramLink(deepLink);

        // Закриваємо WebApp через 300мс, щоб Telegram перемкнув екран на чат бота
        setTimeout(() => {
            if (tg && typeof tg.close === 'function') {
                tg.close();
            }
        }, 300);
    } else {
        // Dev-режим (поза межами Telegram у звичайному браузері)
        window.open(deepLink, '_blank');
        showToast(`[Тест] Відкрито посилання: +${sentEnergy} EP`);
    }
}

// ==========================================
// 5. ТЕСТИ TELEGRAM SDK (Popup, MainButton, QR)
// ==========================================
function handleNativePopup() {
    if (tg && tg.showPopup) {
        tg.showPopup({
            title: "Webix OS Notice",
            message: "Бажаєте продовжити роботу з системою?",
            buttons: [
                { id: "ok", type: "default", text: "Так" },
                { id: "cancel", type: "cancel", text: "Скасувати" }
            ]
        }, (buttonId) => {
            if (buttonId === "ok") {
                showToast("Дію підтверджено!");
            }
        });
    } else {
        alert("Native Popup доступний лише всередині Telegram.");
    }
}

let mainButtonActive = false;
function toggleMainButton() {
    if (tg && tg.MainButton) {
        mainButtonActive = !mainButtonActive;
        if (mainButtonActive) {
            tg.MainButton.text = "ЗБЕРЕГТИ ДАНІ В BOT";
            tg.MainButton.show();
            tg.MainButton.onClick(() => {
                showToast("MainButton натиснуто!");
            });
            showToast("MainButton активовано внизу");
        } else {
            tg.MainButton.hide();
            showToast("MainButton приховано");
        }
    } else {
        showToast("MainButton не підтримується");
    }
}

function openQrScanner() {
    if (tg && tg.showScanQrPopup) {
        tg.showScanQrPopup({ text: "Скануйте QR-код системи" }, (text) => {
            showToast(`Знайдено: ${text}`);
            return true;
        });
    } else {
        showToast("QR сканер доступний у мобільному Telegram");
    }
}

// ==========================================
// 6. ЗАВДАННЯ (TODO LIST)
// ==========================================
let tasks = [];

function addTask() {
    const input = document.getElementById('task-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    tasks.push({ text: text, completed: false });
    input.value = '';
    renderTasks();
    showToast('Завдання додано');
}

function handleTaskKeyPress(event) {
    if (event.key === 'Enter') {
        addTask();
    }
}

function renderTasks() {
    const listEl = document.getElementById('todo-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    tasks.forEach((task, index) => {
        const item = document.createElement('div');
        item.className = `todo-item ${task.completed ? 'completed' : ''}`;
        item.innerHTML = `
            <span onclick="toggleTask(${index})">${task.text}</span>
            <button onclick="deleteTask(${index})"><i class="fa-solid fa-trash"></i></button>
        `;
        listEl.appendChild(item);
    });
}

function toggleTask(index) {
    tasks[index].completed = !tasks[index].completed;
    renderTasks();
}

function deleteTask(index) {
    tasks.splice(index, 1);
    renderTasks();
    showToast('Видалено');
}

// ==========================================
// 7. ПОГОДА (OPEN-METEO API)
// ==========================================
async function fetchWeather() {
    const cityInput = document.getElementById('city-input');
    const cityName = cityInput ? cityInput.value.trim() : "Київ";
    if (!cityName) return;

    try {
        showToast('Шукаємо погоду...');
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=uk`);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            showToast('Місто не знайдено');
            return;
        }

        const { latitude, longitude, name, country } = geoData.results[0];
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relativehumidity_2m`);
        const weatherData = await weatherRes.json();

        const currentWeather = weatherData.current_weather;
        const temp = Math.round(currentWeather.temperature);
        const wind = currentWeather.windspeed;
        const currentHour = new Date().getHours();
        const humidity = (weatherData.hourly && weatherData.hourly.relativehumidity_2m)
            ? (weatherData.hourly.relativehumidity_2m[currentHour] ?? weatherData.hourly.relativehumidity_2m[0])
            : 50;
        const weatherState = getWeatherDescription(currentWeather.weathercode);

        const cityEl = document.getElementById('weather-city');
        const tempEl = document.getElementById('weather-temp');
        const descEl = document.getElementById('weather-desc');
        const windEl = document.getElementById('weather-wind');
        const humEl = document.getElementById('weather-humidity');
        const iconEl = document.getElementById('weather-icon');

        if (cityEl) cityEl.textContent = country ? `${name}, ${country}` : name;
        if (tempEl) tempEl.textContent = `${temp > 0 ? '+' : ''}${temp}°C`;
        if (descEl) descEl.textContent = weatherState.desc;
        if (windEl) windEl.textContent = `${wind} км/г`;
        if (humEl) humEl.textContent = `${humidity}%`;
        if (iconEl) iconEl.className = `fa-solid ${weatherState.icon} sun`;

        showToast(`Погоду оновлено: ${name}`);
    } catch (err) {
        showToast('Помилка отримання погоди');
    }
}

function handleWeatherKeyPress(event) {
    if (event.key === 'Enter') {
        fetchWeather();
    }
}

function getWeatherDescription(code) {
    const weatherCodes = {
        0: { desc: 'Ясно', icon: 'fa-sun' },
        1: { desc: 'Переважно ясно', icon: 'fa-cloud-sun' },
        2: { desc: 'Мінлива хмарність', icon: 'fa-cloud-sun' },
        3: { desc: 'Хмарно', icon: 'fa-cloud' },
        45: { desc: 'Туман', icon: 'fa-smog' },
        48: { desc: 'Паморозь', icon: 'fa-smog' },
        51: { desc: 'Мряка', icon: 'fa-cloud-rain' },
        61: { desc: 'Невеликий дощ', icon: 'fa-cloud-rain' },
        63: { desc: 'Дощ', icon: 'fa-cloud-showers-heavy' },
        71: { desc: 'Сніг', icon: 'fa-snowflake' },
        95: { desc: 'Гроза', icon: 'fa-bolt' }
    };
    return weatherCodes[code] || { desc: 'Ясно', icon: 'fa-sun' };
}

// ==========================================
// 8. ТЕМИ ТА КОПІЮВАННЯ ID
// ==========================================
const themeColors = ['#0088cc', '#8a2be2', '#ff9e00', '#10b981', '#ef4444'];
let currentThemeIdx = 0;

function toggleThemeColor() {
    currentThemeIdx = (currentThemeIdx + 1) % themeColors.length;
    document.documentElement.style.setProperty('--accent-blue', themeColors[currentThemeIdx]);
    showToast('Тему змінено!');
}

async function copyToClipboard(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const text = el.textContent.trim();
    if (!text || text === '---') return;

    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        } else {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
        showToast('ID скопійовано!');
    } catch (e) {
        showToast('Не вдалося скопіювати');
    }
}

// ==========================================
// 9. TOAST СПОВІЩЕННЯ
// ==========================================
let toastTimeout;
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    if (!toast || !toastMessage) return;

    toastMessage.textContent = message;
    toast.classList.remove('hidden');

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.add('hidden');
    }, 2500);
}
