import { useCallback, useRef, useState } from 'react';
import { saveToCloud } from '../lib/db';

const KEYS = {
  tasks:   'planner_tasks',
  someday: 'planner_someday',
  meta:    'planner_meta',
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function loadAll() {
  return {
    tasks:   read(KEYS.tasks,   []),
    someday: read(KEYS.someday, []),
    meta:    read(KEYS.meta,    { lastActiveDate: null, streakDates: [], longestStreak: 0 }),
  };
}

export function useStorage(userId) {
  const [saveStatus, setSaveStatus] = useState('idle');
  const timerRef = useRef(null);

  const save = useCallback((tasks, someday, meta) => {
    // Write to localStorage immediately
    try {
      localStorage.setItem(KEYS.tasks,   JSON.stringify(tasks));
      localStorage.setItem(KEYS.someday, JSON.stringify(someday));
      localStorage.setItem(KEYS.meta,    JSON.stringify(meta));
    } catch (e) {
      console.error('localStorage write failed', e);
    }

    // Debounced cloud sync
    setSaveStatus('saving');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      if (!userId) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 1500);
        return;
      }
      try {
        await saveToCloud(userId, tasks, someday, meta);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 1500);
      } catch (e) {
        console.error('Cloud save failed', e);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 4000);
      }
    }, 400);
  }, [userId]);

  return { save, saveStatus };
}
