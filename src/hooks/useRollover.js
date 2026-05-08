import { dateStr, daysBetween } from '../utils/dates';

export function checkRollover(meta) {
  const today = dateStr();
  if (!meta.lastActiveDate || meta.lastActiveDate === today) {
    return { needsRollover: false, today, diffDays: 0 };
  }
  const diffDays = daysBetween(meta.lastActiveDate, today);
  return { needsRollover: true, today, diffDays };
}
