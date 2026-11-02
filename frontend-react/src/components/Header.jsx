import { useState, useEffect } from 'react';
import { APP_VERSION } from '../config';

export default function Header() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toTimeString().split(' ')[0]);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="os-card header-card">
      <div className="brand">
        <div className="logo-badge">
          <i className="fa-solid fa-microchip"></i>
        </div>
        <div>
          <h1>
            Webix OS <span className="version-tag">{APP_VERSION}</span>
          </h1>
          <span className="status-online">
            <span className="dot"></span> System Ready
          </span>
        </div>
      </div>
      <div className="clock-badge">{time || '00:00:00'}</div>
    </header>
  );
}

