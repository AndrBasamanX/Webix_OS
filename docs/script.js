// Telegram WebApp SDK Instance
const tg = window.Telegram?.WebApp;
const BOT_USERNAME = "Webixbot_app_bot";

// 1. Ініціалізація додатка
document.addEventListener('DOMContentLoaded', () => {
    if (tg) {
        tg.ready();
        tg.expand();
        initTelegramUser();
        setupTelegramMainButton();
        
        // Встановлюємо колір верхньої панелі Telegram
        if (tg.setHeaderColor) {
            tg.setHeaderColor('#090d16');
        }

        // Налаштовуємо нативну кнопку "Назад" один раз
        if (tg.BackButton) {
            tg.BackButton.onClick(() => {
                switchTab('home');
            });
        }
    }
    
    updateClock();
    setInterval(updateClock, 1000);
    startSystemStatsSimulation();
    updateEnergyUI();
    renderTasks();
});

// 2. Динамічний годинник
function updateClock() {
    const clockElement = document.getElementById('clock');
    if (clockElement) {
        const now = new Date();
        clockElement.textContent = now.toLocaleTimeString('uk-UA');
    }
}

// 3. Симуляція навантаження системи (CPU & RAM)
function startSystemStatsSimulation() {
    setInterval(() => {
        const cpu = Math.floor(Math.random() * 25) + 5;
        const ram = Math.floor(Math.random() * 50) + 400;
        
        const cpuEl = document.getElementById('cpu-usage');
        const ramEl = document.getElementById('ram-usage');
        if (cpuEl) cpuEl.textContent = `${cpu}%`;
        if (ramEl) ramEl.textContent = `${ram} MB`;
    }, 3000);
}

// 4. SPA Перемикання Вкладок + Управління tg.BackButton
function switchTab(tabName) {
    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');

    document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));

    const selectedScreen = document.getElementById(`screen-${tabName}`);
    if (selectedScreen) selectedScreen.classList.add('active');

    const activeNavBtn = document.querySelector(`.nav-tab[data-tab="${tabName}"]`);
    if (activeNavBtn) activeNavBtn.classList.add('active');

    // Робота з нативною кнопкою "Назад" у Telegram
    if (tg?.BackButton) {
        if (tabName === 'home') {
            tg.BackButton.hide();
        } else {
            tg.BackButton.show();
        }
    }
}

// 5. Telegram SDK та Профіль
function initTelegramUser() {
    if (tg?.initDataUnsafe?.user) {
        const user = tg.initDataUnsafe.user;
        
        const nameEl = document.getElementById('user-name');
        const unameEl = document.getElementById('user-username');
        const idEl = document.getElementById('user-id');
        const langEl = document.getElementById('user-lang');
        const platEl = document.getElementById('user-platform');

        if (nameEl) nameEl.textContent = `${user.first_name} ${user.last_name || ''}`;
        if (unameEl) unameEl.textContent = user.username ? `@${user.username}` : '@no_username';
        if (idEl) idEl.textContent = user.id;
        if (langEl) langEl.textContent = user.language_code || 'uk';
        if (platEl) platEl.textContent = tg.platform || 'WebApp';

        if (user.photo_url) {
            const photoEl = document.getElementById('user-photo');
            const fallbackEl = document.getElementById('avatar-fallback');
            if (photoEl) {
                photoEl.src = user.photo_url;
                photoEl.classList.remove('hidden');
            }
            if (fallbackEl) fallbackEl.classList.add('hidden');
        }
    } else {
        const nameEl = document.getElementById('user-name');
        if (nameEl) nameEl.textContent = 'Оператор Webix';
    }
}

// Сканер QR-кодів через Telegram SDK
function openQrScanner() {
    if (tg?.showScanQrPopup) {
        tg.showScanQrPopup({ text: 'Зіскануйте QR-код для Webix OS' }, (text) => {
            showToast(`QR Зчитано: ${text}`);
            return true; // закрити сканер після зчитування
        });
    } else {
        showToast('Сканер QR доступний тільки в мобільному Telegram');
    }
}

// Telegram Native Popup
function handleNativePopup() {
    if (tg?.showPopup) {
        tg.showPopup({
            title: 'Webix OS System',
            message: 'Бажаєте зберегти поточні налаштування системи?',
            buttons: [
                { id: 'save', type: 'default', text: 'Так, зберегти' },
                { id: 'cancel', type: 'destructive', text: 'Скасувати' }
            ]
        }, (buttonId) => {
            if (buttonId === 'save') showToast('Налаштування збережено! 💾');
        });
    } else {
        showToast('Native Popup доступний лише в Telegram');
    }
}

// Telegram MainButton SDK
let mainButtonActive = false;
function setupTelegramMainButton() {
    if (tg?.MainButton) {
        tg.MainButton.setText("Зберегти та закрити WebApp");
        tg.MainButton.onClick(() => {
            showToast("Дані збережено!");
            tg.close();
        });
    }
}

function toggleMainButton() {
    if (!tg?.MainButton) {
        showToast("MainButton не підтримується у браузері");
        return;
    }

    if (mainButtonActive) {
        tg.MainButton.hide();
        mainButtonActive = false;
        showToast("MainButton приховано");
    } else {
        tg.MainButton.show();
        mainButtonActive = true;
        showToast("MainButton активовано");
    }
}

// 6. Міні-гра «Енерго-Ядро» (Energy Core Clicker)
let energyPoints = parseInt(localStorage.getItem('webix_energy')) || 0;

function updateEnergyUI() {
    const countEl = document.getElementById('click-count');
    if (countEl) countEl.textContent = energyPoints;
    
    const progressPercent = Math.min(Math.floor((energyPoints / 100) * 100), 100);
    const percentEl = document.getElementById('energy-percent');
    const barEl = document.getElementById('energy-bar');

    if (percentEl) percentEl.textContent = `${progressPercent}%`;
    if (barEl) barEl.style.width = `${progressPercent}%`;
}

function clickEnergyCore() {
    energyPoints += 1;
    updateEnergyUI();
    localStorage.setItem('webix_energy', energyPoints);

    if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('medium');
    }
}

function sendEnergyToBot() {
    if (energyPoints === 0) {
        showToast('Спочатку накопичіть енергію!');
        return;
    }

    const payload = {
        action: 'energy_transfer',
        energy: energyPoints,
        timestamp: new Date().toISOString()
    };

    const sentEnergy = energyPoints;
    energyPoints = 0;
    localStorage.setItem('webix_energy', 0);
    updateEnergyUI();

    // 1. Спробуємо надіслати через нативний sendData (працює, якщо відкрито через KeyboardButton)
    let sendDataCalled = false;
    if (tg?.sendData) {
        try {
            tg.sendData(JSON.stringify(payload));
            sendDataCalled = true;
        } catch (err) {
            console.log("sendData не підтримується для цього режиму відкриття");
        }
    }

    // 2. Для Main Web App, кнопки меню або прямих посилань Telegram вимагає deep link:
    // Якщо додаток не закрився миттєво через sendData, перенаправляємо в бот з параметром
    setTimeout(() => {
        if (tg?.openTelegramLink) {
            tg.openTelegramLink(`https://t.me/${BOT_USERNAME}?start=energy_${sentEnergy}`);
        } else {
            showToast(`[Dev Mode] Передано: ${sentEnergy} EP!`);
        }
    }, sendDataCalled ? 200 : 0);
}

// 7. Менеджер завдань (ToDo)
let tasks = JSON.parse(localStorage.getItem('webix_tasks')) || [
    { id: 1, text: 'Протестувати Webix OS', completed: true },
    { id: 2, text: 'Перевірити Haptic Feedback', completed: false }
];

function renderTasks() {
    const list = document.getElementById('todo-list');
    if (!list) return;

    list.innerHTML = '';

    tasks.forEach(task => {
        const item = document.createElement('div');
        item.className = `todo-item ${task.completed ? 'completed' : ''}`;
        item.innerHTML = `
            <span onclick="toggleTask(${task.id})">${task.text}</span>
            <i class="fa-solid fa-trash delete-btn" onclick="deleteTask(${task.id})"></i>
        `;
        list.appendChild(item);
    });

    localStorage.setItem('webix_tasks', JSON.stringify(tasks));
}

function addTask() {
    const input = document.getElementById('task-input');
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    tasks.push({ id: Date.now(), text, completed: false });
    input.value = '';
    renderTasks();
    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
}

function handleTaskKeyPress(e) {
    if (e.key === 'Enter') addTask();
}

function toggleTask(id) {
    tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    renderTasks();
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    renderTasks();
}

// 8. Пошук та запит погоди (Open-Meteo API)
function handleWeatherKeyPress(e) {
    if (e.key === 'Enter') fetchWeather();
}

function getWeatherDescription(code) {
    switch (code) {
        case 0: return { desc: 'Ясно ☀️', icon: 'fa-sun' };
        case 1:
        case 2:
        case 3: return { desc: 'Мінлива хмарність ⛅', icon: 'fa-cloud-sun' };
        case 45:
        case 48: return { desc: 'Туман 🌫️', icon: 'fa-smog' };
        case 51:
        case 53:
        case 55: return { desc: 'Мряка 🌧️', icon: 'fa-cloud-rain' };
        case 61:
        case 63:
        case 65: return { desc: 'Дощ 🌧️', icon: 'fa-cloud-showers-heavy' };
        case 71:
        case 73:
        case 75: return { desc: 'Сніг ❄️', icon: 'fa-snowflake' };
        case 80:
        case 81:
        case 82: return { desc: 'Злива 🌧️', icon: 'fa-cloud-showers-water' };
        case 95:
        case 96:
        case 99: return { desc: 'Гроза 🌩️', icon: 'fa-cloud-bolt' };
        default: return { desc: 'Хмарно ☁️', icon: 'fa-cloud' };
    }
}

async function fetchWeather() {
    const cityInput = document.getElementById('city-input');
    const inputVal = cityInput ? cityInput.value.trim() : 'Київ';
    showToast(`Пошук міста: ${inputVal}...`);

    try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(inputVal)}&count=1&language=uk`);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            showToast('Місто не знайдено!');
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
        showToast('Помилка даних погоди');
    }
}

// 9. Теми та Копіювання
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

// Custom Toast
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