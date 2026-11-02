import { useState, useEffect, useCallback } from 'react';

function getWeatherMeta(code) {
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
    95: { desc: 'Гроза', icon: 'fa-bolt' },
  };
  return weatherCodes[code] || { desc: 'Ясно', icon: 'fa-sun' };
}

export default function WeatherScreen({ showToast }) {
  const [cityInput, setCityInput] = useState('Київ');
  const [weather, setWeather] = useState({
    city: 'Київ, Україна',
    temp: '+18°C',
    desc: 'Завантаження...',
    wind: '3.5 км/г',
    humidity: '55%',
    icon: 'fa-sun',
  });
  const [loading, setLoading] = useState(false);

  const fetchWeatherForCity = useCallback(async (name) => {
    const targetCity = name.trim();
    if (!targetCity) return;

    setLoading(true);
    showToast('Шукаємо погоду...');

    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          targetCity
        )}&count=1&language=uk`
      );
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        showToast('Місто не знайдено');
        setLoading(false);
        return;
      }

      const { latitude, longitude, name: foundName, country } = geoData.results[0];
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relativehumidity_2m`
      );
      const weatherData = await weatherRes.json();

      const current = weatherData.current_weather;
      const t = Math.round(current.temperature);
      const windSpeed = current.windspeed;
      
      const humidityList = weatherData.hourly?.relativehumidity_2m;
      const hum = humidityList && humidityList.length > 0 ? humidityList[0] : 50;
      
      const meta = getWeatherMeta(current.weathercode);

      setWeather({
        city: country ? `${foundName}, ${country}` : foundName,
        temp: `${t > 0 ? '+' : ''}${t}°C`,
        desc: meta.desc,
        wind: `${windSpeed} км/г`,
        humidity: `${hum}%`,
        icon: meta.icon,
      });

      showToast(`Погоду оновлено: ${foundName}`);
    } catch {
      showToast('Помилка отримання погоди');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchWeatherForCity('Київ');
  }, [fetchWeatherForCity]);

  const handleSearch = () => {
    fetchWeatherForCity(cityInput);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="screen-container">
      <div className="weather-search">
        <input
          type="text"
          placeholder="Введіть місто (напр. Львів, Київ, Одеса)"
          value={cityInput}
          onChange={(e) => setCityInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading}
          aria-label="Шукати погоду"
        >
          <i className="fa-solid fa-magnifying-glass"></i>
        </button>
      </div>

      <div className="os-card weather-card">
        <div className="weather-header">
          <i className={`fa-solid ${weather.icon} sun`}></i>
          <span className="weather-city">{weather.city}</span>
        </div>
        <div className="weather-temp">{weather.temp}</div>
        <div className="weather-desc">{weather.desc}</div>
        <div className="weather-metrics">
          <div>
            <i className="fa-solid fa-wind" style={{ marginRight: '6px' }}></i>
            <span>{weather.wind}</span>
          </div>
          <div>
            <i className="fa-solid fa-droplet" style={{ marginRight: '6px' }}></i>
            <span>{weather.humidity}</span>
          </div>
        </div>
      </div>
    </div>
  );
}