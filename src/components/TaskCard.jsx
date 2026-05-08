import { useState } from 'react';
import {
  IconCheck, IconMoon, IconSun, IconChevronDown, IconChevronUp,
  IconSparkles, IconTrash, IconPencil, IconX, IconCheck as IconCheckSmall, IconPlus,
} from '@tabler/icons-react';
import { getCat } from '../utils/categories';
import SubtaskList from './SubtaskList';
import AISuggestions from './AISuggestions';

export default function TaskCard({
  task,
  aiLoading,
  onToggleDone,
  onTogglePostpone,
  onToggleExpand,
  onToggleAI,
  onTriggerAI,
  onAddAISuggestion,
  onAddSubtask,
  onToggleSubtask,
  onDelete,
  onEditTitle,
}) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(task.title);
  const [newStep, setNewStep] = useState('');
  const cat = getCat(task.cat);

  const doneCount  = task.subtasks.filter(s => s.done).length;
  const totalCount = task.subtasks.length;
  const subPct     = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  function commitEdit() {
    if (editVal.trim()) onEditTitle(task.id, editVal.trim());
    setEditing(false);
  }

  return (
    <div
      className={`task-card${task.done ? ' task-card--done' : ''}${task.postponed ? ' task-card--postponed' : ''}`}
    >
      <div className="task-card__main">
        {/* Done checkbox */}
        <button
          className={`task-check${task.done ? ' task-check--done' : ''}`}
          onClick={() => onToggleDone(task.id)}
          aria-label={task.done ? 'Mark incomplete' : 'Mark complete'}
        >
          {task.done && <IconCheck size={12} strokeWidth={3} />}
        </button>

        {/* Title / edit */}
        <div className="task-card__body">
          {editing ? (
            <div className="task-edit">
              <input
                className="task-edit__input"
                value={editVal}
                autoFocus
                onChange={e => setEditVal(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitEdit();
                  if (e.key === 'Escape') setEditing(false);
                }}
              />
              <button className="task-edit__ok" onClick={commitEdit}><IconCheckSmall size={14} /></button>
              <button className="task-edit__cancel" onClick={() => setEditing(false)}><IconX size={14} /></button>
            </div>
          ) : (
            <span className="task-title">{task.title}</span>
          )}

          <div className="task-card__meta">
            <span className="cat-badge" style={{ background: cat.bg, color: cat.text }}>
              {cat.label}
            </span>
            {task.postponed && (
              <span className="postponed-badge">Not today</span>
            )}
            {totalCount > 0 && !task.expanded && (
              <div className="subtask-mini-bar">
                <div className="subtask-mini-fill" style={{ width: `${subPct}%` }} />
                <span className="subtask-mini-label">{doneCount}/{totalCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="task-card__actions">
          <button
            className="task-action task-action--ai"
            onClick={() => onTriggerAI(task.id)}
            title="Suggest steps"
          >
            <IconSparkles size={15} />
          </button>
          <button
            className="task-action"
            onClick={() => onTogglePostpone(task.id)}
            title={task.postponed ? 'Restore task' : 'Postpone'}
          >
            {task.postponed ? <IconSun size={15} /> : <IconMoon size={15} />}
          </button>
          <button
            className="task-action"
            onClick={() => setEditing(true)}
            title="Edit"
          >
            <IconPencil size={14} />
          </button>
          <button
            className="task-action task-action--danger"
            onClick={() => onDelete(task.id)}
            title="Delete"
          >
            <IconTrash size={14} />
          </button>
          <button
            className="task-action"
            onClick={() => onToggleExpand(task.id)}
            title={task.expanded ? 'Collapse' : 'Expand'}
          >
            {task.expanded ? <IconChevronUp size={15} /> : <IconChevronDown size={15} />}
          </button>
        </div>
      </div>

      {task.expanded && (
        <div className="task-card__expanded">
          <SubtaskList
            subtasks={task.subtasks}
            onToggle={stId => onToggleSubtask(task.id, stId)}
          />
          <form
            className="subtask-add-form"
            onSubmit={e => {
              e.preventDefault();
              if (newStep.trim()) {
                onAddSubtask(task.id, newStep.trim());
                setNewStep('');
              }
            }}
          >
            <input
              className="subtask-add-input"
              placeholder="Add a step…"
              value={newStep}
              onChange={e => setNewStep(e.target.value)}
            />
            <button className="subtask-add-btn" type="submit">
              <IconPlus size={13} />
            </button>
          </form>
          <AISuggestions
            loading={aiLoading}
            suggestions={task.aiSuggestions}
            onAdd={text => onAddAISuggestion(task.id, text)}
          />
        </div>
      )}
    </div>
  );
}
