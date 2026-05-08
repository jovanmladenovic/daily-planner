import { supabase } from './supabase';

// ── Load all data for the current user ────────────────────────────────────
export async function loadFromCloud(userId) {
  const [tasksRes, somedayRes, metaRes] = await Promise.all([
    supabase.from('tasks').select('*').eq('user_id', userId),
    supabase.from('someday').select('*').eq('user_id', userId),
    supabase.from('meta').select('*').eq('user_id', userId).maybeSingle(),
  ]);

  if (tasksRes.error)   throw tasksRes.error;
  if (somedayRes.error) throw somedayRes.error;
  if (metaRes.error)    throw metaRes.error;

  const tasks   = (tasksRes.data   ?? []).map(dbToTask);
  const someday = (somedayRes.data ?? []).map(dbToSomeday);
  const meta    = metaRes.data
    ? dbToMeta(metaRes.data)
    : { lastActiveDate: null, streakDates: [], longestStreak: 0 };

  return { tasks, someday, meta };
}

// ── Save all data (full replace) ─────────────────────────────────────────
export async function saveToCloud(userId, tasks, someday, meta) {
  const [t, s, m] = await Promise.all([
    saveTasks(userId, tasks),
    saveSomeday(userId, someday),
    saveMeta(userId, meta),
  ]);
  if (t.error) throw t.error;
  if (s.error) throw s.error;
  if (m.error) throw m.error;
}

async function saveTasks(userId, tasks) {
  await supabase.from('tasks').delete().eq('user_id', userId);
  if (!tasks.length) return { error: null };
  return supabase.from('tasks').insert(tasks.map(t => taskToDb(t, userId)));
}

async function saveSomeday(userId, someday) {
  await supabase.from('someday').delete().eq('user_id', userId);
  if (!someday.length) return { error: null };
  return supabase.from('someday').insert(someday.map(s => somedayToDb(s, userId)));
}

async function saveMeta(userId, meta) {
  return supabase.from('meta').upsert({
    user_id:          userId,
    last_active_date: meta.lastActiveDate,
    streak_dates:     meta.streakDates,
    longest_streak:   meta.longestStreak,
    updated_at:       new Date().toISOString(),
  }, { onConflict: 'user_id' });
}

// ── Shape converters ──────────────────────────────────────────────────────
function taskToDb(t, userId) {
  return {
    id:             t.id,
    user_id:        userId,
    title:          t.title,
    cat:            t.cat,
    done:           t.done,
    postponed:      t.postponed,
    expanded:       t.expanded,
    show_ai:        t.showAI,
    ai_suggestions: t.aiSuggestions,
    subtasks:       t.subtasks,
  };
}

function dbToTask(r) {
  return {
    id:             r.id,
    title:          r.title,
    cat:            r.cat,
    done:           r.done,
    postponed:      r.postponed,
    expanded:       r.expanded,
    showAI:         r.show_ai,
    aiSuggestions:  r.ai_suggestions ?? [],
    subtasks:       r.subtasks ?? [],
  };
}

function somedayToDb(s, userId) {
  return { id: s.id, user_id: userId, title: s.title, cat: s.cat };
}

function dbToSomeday(r) {
  return { id: r.id, title: r.title, cat: r.cat };
}

function dbToMeta(r) {
  return {
    lastActiveDate: r.last_active_date,
    streakDates:    r.streak_dates ?? [],
    longestStreak:  r.longest_streak ?? 0,
  };
}
