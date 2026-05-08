import { IconSparkles, IconLoader2, IconPlus } from '@tabler/icons-react';

export default function AISuggestions({ loading, suggestions, onAdd, onDismiss }) {
  if (loading) {
    return (
      <div className="ai-panel">
        <div className="ai-panel__loading">
          <IconLoader2 size={16} className="spin" />
          <span>Generating steps…</span>
        </div>
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="ai-panel">
      <div className="ai-panel__header">
        <IconSparkles size={14} />
        <span>Suggested steps</span>
      </div>
      <ul className="ai-panel__list">
        {suggestions.map((s, i) => (
          <li key={i} className="ai-panel__item">
            <span>{s}</span>
            <button className="ai-panel__add" onClick={() => onAdd(s)} title="Add step">
              <IconPlus size={14} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
