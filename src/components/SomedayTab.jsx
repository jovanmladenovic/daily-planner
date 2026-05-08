import { useState } from 'react';
import { IconArrowUp, IconTrash, IconPlus } from '@tabler/icons-react';
import { CATEGORIES, getCat } from '../utils/categories';

export default function SomedayTab({ items, onAdd, onPromote, onDelete }) {
  const [title, setTitle] = useState('');
  const [cat, setCat] = useState('personal');

  function handleAdd(e) {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim(), cat);
    setTitle('');
  }

  return (
    <div className="someday-tab">
      <form className="add-form" onSubmit={handleAdd}>
        <input
          className="add-form__input"
          placeholder="Park an idea for someday…"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <select
          className="add-form__select"
          value={cat}
          onChange={e => setCat(e.target.value)}
        >
          {CATEGORIES.map(c => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
        <button className="add-form__btn" type="submit">
          <IconPlus size={16} />
        </button>
      </form>

      {items.length === 0 ? (
        <p className="empty-state">No ideas yet. Park something here to revisit later.</p>
      ) : (
        <ul className="someday-list">
          {items.map(item => {
            const c = getCat(item.cat);
            return (
              <li key={item.id} className="someday-item">
                <span className="cat-badge" style={{ background: c.bg, color: c.text }}>
                  {c.label}
                </span>
                <span className="someday-item__title">{item.title}</span>
                <div className="someday-item__actions">
                  <button
                    className="task-action"
                    onClick={() => onPromote(item.id)}
                    title="Move to today"
                  >
                    <IconArrowUp size={15} />
                  </button>
                  <button
                    className="task-action task-action--danger"
                    onClick={() => onDelete(item.id)}
                    title="Delete"
                  >
                    <IconTrash size={14} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
