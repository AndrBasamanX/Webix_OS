import { useState, useEffect } from 'react';
import { triggerHaptic } from '../telegram';

const STORAGE_KEY = 'webix_os_tasks';

export default function TasksScreen({ showToast }) {
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [inputVal, setInputVal] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.warn("Помилка збереження задач:", e);
    }
  }, [tasks]);

  const handleAddTask = () => {
    const text = inputVal.trim();
    if (!text) return;

    setTasks((prev) => [...prev, { id: Date.now(), text, completed: false }]);
    setInputVal('');
    triggerHaptic('light');
    showToast('Завдання додано');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAddTask();
    }
  };

  const handleToggle = (id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
    triggerHaptic('selection');
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    setTasks((prev) => prev.filter((t) => t.id !== id));
    triggerHaptic('medium');
    showToast('Видалено');
  };

  return (
    <div className="screen-container">
      <div className="os-card task-input-card">
        <input
          type="text"
          placeholder="Нова задача..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className="add-btn"
          onClick={handleAddTask}
          aria-label="Додати завдання"
        >
          <i className="fa-solid fa-plus"></i>
        </button>
      </div>

      <div className="todo-list">
        {tasks.length === 0 ? (
          <div className="os-card todo-empty">
            <i className="fa-solid fa-clipboard-check" style={{ fontSize: '28px', opacity: 0.5, marginBottom: '8px', display: 'block' }}></i>
            Список порожній. Додайте перше завдання вище!
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`todo-item ${task.completed ? 'completed' : ''}`}
              onClick={() => handleToggle(task.id)}
            >
              <span>{task.text}</span>
              <button
                type="button"
                className="delete-btn"
                onClick={(e) => handleDelete(task.id, e)}
                aria-label="Видалити"
              >
                <i className="fa-solid fa-trash"></i>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

