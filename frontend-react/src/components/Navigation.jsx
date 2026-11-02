export default function Navigation({ activeTab, onSelectTab }) {
  const tabs = [
    { id: 'home', label: 'Дашборд', icon: 'fa-house' },
    { id: 'clicker', label: 'Ядро', icon: 'fa-bolt' },
    { id: 'tasks', label: 'Завдання', icon: 'fa-list-check' },
    { id: 'weather', label: 'Погода', icon: 'fa-cloud-bolt' },
    { id: 'profile', label: 'Профіль', icon: 'fa-sliders' },
  ];

  return (
    <nav className="os-nav">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onSelectTab(tab.id)}
        >
          <i className={`fa-solid ${tab.icon}`}></i>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

