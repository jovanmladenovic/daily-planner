import { dateStr } from '../utils/dates';

export function calcStreak(streakDates) {
  if (!streakDates.length) return 0;
  let streak = 0;
  const check = new Date();
  while (true) {
    const s = dateStr(check);
    if (streakDates.includes(s)) {
      streak++;
      check.setDate(check.getDate() - 1);
    } else break;
  }
  return streak;
}

export function addStreakDate(meta, today = dateStr()) {
  if (meta.streakDates.includes(today)) return meta;
  const dates = [...meta.streakDates, today].sort().slice(-60);
  const streak = calcStreak(dates);
  const longestStreak = Math.max(meta.longestStreak, streak);
  return { ...meta, streakDates: dates, longestStreak };
}

export function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(dateStr(d));
  }
  return days;
}
