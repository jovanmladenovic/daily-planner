import { IconFlame, IconCheck, IconMoon, IconChevronRight } from '@tabler/icons-react';
import { calcStreak, getLast7Days } from '../hooks/useStreak';
import { dateStr } from '../utils/dates';

export default function ReviewTab({ tasks, meta, onKeepPostponed, onMovePostponedToSomeday }) {
  const done      = tasks.filter(t => t.done).length;
  const postponed = tasks.filter(t => t.postponed && !t.done).length;
  const stepsDone = tasks.flatMap(t => t.subtasks).filter(s => s.done).length;
  const streak    = calcStreak(meta.streakDates);
  const last7     = getLast7Days();
  const today     = dateStr();

  const postponedTasks = tasks.filter(t => t.postponed && !t.done);

  return (
    <div className="review-tab">
      <div className="review-stats">
        <div className="stat-card">
          <span className="stat-number">{done}</span>
          <span className="stat-label">Tasks done</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{stepsDone}</span>
          <span className="stat-label">Steps done</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{postponed}</span>
          <span className="stat-label">Postponed</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{meta.longestStreak}</span>
          <span className="stat-label">Best streak</span>
        </div>
      </div>

      {/* Streak */}
      <div className="review-streak">
        <div className="review-streak__header">
          <IconFlame size={16} />
          <span>{streak} day streak</span>
        </div>
        <div className="streak-dots">
          {last7.map(day => {
            const hit   = meta.streakDates.includes(day);
            const isToday = day === today;
            return (
              <div
                key={day}
                className={`streak-dot${hit ? ' streak-dot--hit' : ''}${isToday ? ' streak-dot--today' : ''}`}
                title={day}
              />
            );
          })}
        </div>
      </div>

      {/* Postponed tasks review */}
      {postponedTasks.length > 0 && (
        <div className="review-postponed">
          <p className="review-postponed__title">Postponed tasks</p>
          <ul className="review-postponed__list">
            {postponedTasks.map(t => (
              <li key={t.id} className="review-postponed__item">
                <span>{t.title}</span>
              </li>
            ))}
          </ul>
          <div className="review-postponed__actions">
            <button className="rollover-btn rollover-btn--primary" onClick={onKeepPostponed}>
              Keep for tomorrow
            </button>
            <button className="rollover-btn" onClick={onMovePostponedToSomeday}>
              Move to Someday
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
