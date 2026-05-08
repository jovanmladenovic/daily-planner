import { IconSunrise } from '@tabler/icons-react';

export default function RolloverBanner({ diffDays, onKeepAll, onClearDone, onMovePostponed }) {
  return (
    <div className="rollover-banner">
      <div className="rollover-banner__icon">
        <IconSunrise size={20} />
      </div>
      <div className="rollover-banner__body">
        <p className="rollover-banner__title">
          {diffDays === 1 ? 'Good morning! New day.' : `It's been ${diffDays} days. New day.`}
        </p>
        <p className="rollover-banner__sub">What would you like to do with yesterday's tasks?</p>
        <div className="rollover-banner__actions">
          <button className="rollover-btn rollover-btn--primary" onClick={onKeepAll}>
            Keep all for today
          </button>
          <button className="rollover-btn" onClick={onClearDone}>
            Clear completed
          </button>
          <button className="rollover-btn" onClick={onMovePostponed}>
            Move postponed to Someday
          </button>
        </div>
      </div>
    </div>
  );
}
