export default function SubtaskList({ subtasks, onToggle, onDelete }) {
  if (!subtasks || subtasks.length === 0) return null;

  return (
    <ul className="subtask-list">
      {subtasks.map(st => (
        <li key={st.id} className={`subtask-item${st.done ? ' subtask-item--done' : ''}`}>
          <button
            className={`subtask-check${st.done ? ' subtask-check--done' : ''}`}
            onClick={() => onToggle(st.id)}
            aria-label={st.done ? 'Mark incomplete' : 'Mark complete'}
          />
          <span className="subtask-text">{st.text}</span>
        </li>
      ))}
    </ul>
  );
}
