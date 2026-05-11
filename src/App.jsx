import { useState, useEffect, useCallback, useRef } from 'react';
import { IconFlame, IconPlus, IconLogout } from '@tabler/icons-react';

import { useStorage, loadAll } from './hooks/useStorage';
import { addStreakDate, calcStreak } from './hooks/useStreak';
import { checkRollover } from './hooks/useRollover';
import { dateStr, formatHeaderDate } from './utils/dates';
import { CATEGORIES } from './utils/categories';
import { fetchAISuggestions } from './api/aiSuggestions';
import { supabase } from './lib/supabase';
import { loadFromCloud, saveToCloud } from './lib/db';

import ProgressBar    from './components/ProgressBar';
import CategoryFilter from './components/CategoryFilter';
import TaskCard       from './components/TaskCard';
import RolloverBanner from './components/RolloverBanner';
import SomedayTab     from './components/SomedayTab';
import AuthGate       from './components/AuthGate';
import ReviewTab      from './components/ReviewTab';

let _nid = 1;
function nextId() { return _nid++; }

function initNid(tasks, someday) {
  const ids = [
    ...tasks.map(t => t.id),
    ...tasks.flatMap(t => t.subtasks.map(s => s.id)),
    ...someday.map(s => s.id),
  ];
  _nid = ids.length > 0 ? Math.max(...ids) + 1 : 1;
}

export default function App() {
  const [session,     setSession]     = useState(undefined); // undefined = loading
  const [recovering,  setRecovering]  = useState(false);    // true when clicked a password-reset link
  const [tasks,       setTasks]       = useState([]);
  const [someday,     setSomeday]     = useState([]);
  const [meta,        setMeta]        = useState({ lastActiveDate: null, streakDates: [], longestStreak: 0 });
  const [activeTab,   setActiveTab]   = useState('today');
  const [activeCat,   setActiveCat]   = useState('all');
  const [rollover,    setRollover]    = useState(null);
  const [newTitle,    setNewTitle]    = useState('');
  const [newCat,      setNewCat]      = useState('work');
  const [aiLoadingId, setAiLoadingId] = useState(null);

  const userId = session?.user?.id ?? null;
  const { save, saveStatus } = useStorage(userId);
  const hydratedRef = useRef(false);

  // Auth listener — onAuthStateChange fires with INITIAL_SESSION on load,
  // so getSession() is redundant and causes double hydration. Use one source only.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
      setSession(s ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Hydrate data: re-runs only when the user identity changes (not on token refresh).
  // Keyed on userId so session token refreshes don't re-trigger.
  useEffect(() => {
    if (session === undefined) return; // still resolving auth

    hydratedRef.current = false; // block saves while loading

    async function hydrate() {
      let stored;
      if (userId) {
        try {
          const cloud = await loadFromCloud(userId);
          const local = loadAll();

          // First-time login: if cloud is empty but local has data, migrate local → cloud
          const cloudIsEmpty = cloud.tasks.length === 0 && cloud.someday.length === 0;
          const localHasData = local.tasks.length > 0 || local.someday.length > 0;
          if (cloudIsEmpty && localHasData) {
            stored = local;
            await saveToCloud(userId, local.tasks, local.someday, local.meta);
          } else {
            stored = cloud;
          }

          // Persist to localStorage for offline use
          localStorage.setItem('planner_tasks',   JSON.stringify(stored.tasks));
          localStorage.setItem('planner_someday',  JSON.stringify(stored.someday));
          localStorage.setItem('planner_meta',     JSON.stringify(stored.meta));
        } catch (e) {
          console.warn('Cloud load failed, falling back to localStorage', e);
          stored = loadAll();
        }
      } else {
        stored = loadAll();
      }

      initNid(stored.tasks, stored.someday);
      setTasks(stored.tasks);
      setSomeday(stored.someday);

      const today = dateStr();
      const { needsRollover, diffDays } = checkRollover(stored.meta);
      if (needsRollover) {
        setRollover({ diffDays });
      } else {
        stored.meta.lastActiveDate = today;
      }
      setMeta(stored.meta);
      hydratedRef.current = true; // open saves only after data is loaded
    }

    hydrate();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist on every change — guard ensures this never fires before hydration
  useEffect(() => {
    if (!hydratedRef.current) return;
    save(tasks, someday, meta);
  }, [tasks, someday, meta, save]);

  // ── Rollover handlers ──────────────────────────────────────────────────────
  function handleRolloverKeepAll() {
    setTasks(ts => ts.map(t => ({ ...t, postponed: false })));
    setMeta(m => ({ ...m, lastActiveDate: dateStr() }));
    setRollover(null);
  }

  function handleRolloverClearDone() {
    setTasks(ts => ts.filter(t => !t.done).map(t => ({ ...t, postponed: false })));
    setMeta(m => ({ ...m, lastActiveDate: dateStr() }));
    setRollover(null);
  }

  function handleRolloverMovePostponed() {
    const newItems = [];
    setTasks(ts => {
      const remaining = [];
      for (const t of ts) {
        if (t.postponed && !t.done) {
          newItems.push({ id: nextId(), title: t.title, cat: t.cat });
        } else if (!t.done) {
          remaining.push({ ...t, postponed: false });
        }
      }
      return remaining;
    });
    setSomeday(ss => [...ss, ...newItems]);
    setMeta(m => ({ ...m, lastActiveDate: dateStr() }));
    setRollover(null);
  }

  // ── Task CRUD ─────────────────────────────────────────────────────────────
  function addTask(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const task = {
      id: nextId(), title: newTitle.trim(), cat: newCat,
      done: false, postponed: false, expanded: false, showAI: false,
      aiSuggestions: [], subtasks: [],
    };
    setTasks(ts => [...ts, task]);
    setNewTitle('');
  }

  function toggleDone(id) {
    setTasks(ts => ts.map(t => {
      if (t.id !== id) return t;
      const done     = !t.done;
      const subtasks = done ? t.subtasks.map(s => ({ ...s, done: true })) : t.subtasks;
      return { ...t, done, subtasks };
    }));
    setMeta(m => {
      const task = tasks.find(t => t.id === id);
      if (!task || task.done) return m;
      return addStreakDate(m, dateStr());
    });
  }

  function togglePostpone(id) {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, postponed: !t.postponed } : t));
  }

  function toggleExpand(id) {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, expanded: !t.expanded } : t));
  }

  function deleteTask(id) {
    setTasks(ts => ts.filter(t => t.id !== id));
  }

  function editTitle(id, title) {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, title } : t));
  }

  // ── Subtasks ───────────────────────────────────────────────────────────────
  function addSubtask(taskId, text) {
    setTasks(ts => ts.map(t =>
      t.id !== taskId ? t : { ...t, subtasks: [...t.subtasks, { id: nextId(), text, done: false }] }
    ));
  }

  function toggleSubtask(taskId, stId) {
    setTasks(ts => ts.map(t => {
      if (t.id !== taskId) return t;
      const subtasks = t.subtasks.map(s => s.id === stId ? { ...s, done: !s.done } : s);
      const allDone  = subtasks.length > 0 && subtasks.every(s => s.done);
      if (allDone && !t.done) {
        setMeta(m => addStreakDate(m, dateStr()));
      }
      return { ...t, subtasks, done: allDone || t.done };
    }));
  }

  // ── AI ─────────────────────────────────────────────────────────────────────
  async function triggerAI(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    setTasks(ts => ts.map(t =>
      t.id === id ? { ...t, expanded: true, showAI: true, aiSuggestions: [] } : t
    ));
    setAiLoadingId(id);
    try {
      const suggestions = await fetchAISuggestions(task.title);
      setTasks(ts => ts.map(t => t.id === id ? { ...t, aiSuggestions: suggestions } : t));
    } catch (err) {
      console.error('AI error', err);
      setTasks(ts => ts.map(t =>
        t.id === id ? { ...t, aiSuggestions: ['(AI unavailable — add steps manually)'] } : t
      ));
    } finally {
      setAiLoadingId(null);
    }
  }

  function addAISuggestion(taskId, text) {
    setTasks(ts => ts.map(t => {
      if (t.id !== taskId) return t;
      const subtasks      = [...t.subtasks, { id: nextId(), text, done: false }];
      const aiSuggestions = t.aiSuggestions.filter(s => s !== text);
      return { ...t, subtasks, aiSuggestions };
    }));
  }

  // ── Someday ────────────────────────────────────────────────────────────────
  function addSomeday(title, cat) {
    setSomeday(ss => [...ss, { id: nextId(), title, cat }]);
  }

  function promoteToToday(sdId) {
    const item = someday.find(s => s.id === sdId);
    if (!item) return;
    setTasks(ts => [...ts, {
      id: nextId(), title: item.title, cat: item.cat,
      done: false, postponed: false, expanded: false, showAI: false,
      aiSuggestions: [], subtasks: [],
    }]);
    setSomeday(ss => ss.filter(s => s.id !== sdId));
  }

  function deleteSomeday(sdId) {
    setSomeday(ss => ss.filter(s => s.id !== sdId));
  }

  // ── Review actions ─────────────────────────────────────────────────────────
  function reviewKeepPostponed() {
    setTasks(ts => ts.map(t => ({ ...t, postponed: false })));
  }

  function reviewMovePostponedToSomeday() {
    const newItems = [];
    setTasks(ts => {
      const remaining = [];
      for (const t of ts) {
        if (t.postponed && !t.done) {
          newItems.push({ id: nextId(), title: t.title, cat: t.cat });
        } else {
          remaining.push(t);
        }
      }
      return remaining;
    });
    setSomeday(ss => [...ss, ...newItems]);
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const countDone  = tasks.filter(t => t.done).length;
  const countTotal = tasks.filter(t => !t.postponed).length;
  const allDone    = countTotal > 0 && countDone === countTotal;
  const streak     = calcStreak(meta.streakDates);

  const visibleTasks = tasks.filter(t =>
    !t.postponed && (activeCat === 'all' || t.cat === activeCat)
  );

  const postponedTasks = tasks.filter(t => t.postponed && !t.done && (activeCat === 'all' || t.cat === activeCat));

  function streakClass() {
    if (streak === 0) return 'streak-pill streak-pill--neutral';
    if (streak < 7)   return 'streak-pill streak-pill--amber';
    return 'streak-pill streak-pill--coral';
  }

  if (session === undefined) return null; // auth loading

  return (
    <AuthGate session={session} recovering={recovering} onPasswordUpdated={() => setRecovering(false)}>
    <div className="app">
      <header className="app-header">
        <div className="app-header__top">
          <h1 className="app-header__date">{formatHeaderDate()}</h1>
          <div className="app-header__right">
            <span className="save-indicator" data-status={saveStatus}>
              {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'error' ? 'Save failed ✕' : 'Saved ✓'}
            </span>
            {streak > 0 && (
              <span className={streakClass()}>
                <IconFlame size={13} />
                {streak}d
              </span>
            )}
            {session && (
              <button
                className="task-action"
                onClick={() => supabase.auth.signOut()}
                title="Sign out"
              >
                <IconLogout size={15} />
              </button>
            )}
          </div>
        </div>
        <ProgressBar done={countDone} total={countTotal} />
      </header>

      <nav className="tab-bar">
        {['today', 'someday', 'review'].map(tab => (
          <button
            key={tab}
            className={`tab-btn${activeTab === tab ? ' tab-btn--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      {rollover && activeTab === 'today' && (
        <RolloverBanner
          diffDays={rollover.diffDays}
          onKeepAll={handleRolloverKeepAll}
          onClearDone={handleRolloverClearDone}
          onMovePostponed={handleRolloverMovePostponed}
        />
      )}

      <main className="app-main">
        {activeTab === 'today' && (
          <>
            <CategoryFilter active={activeCat} onChange={setActiveCat} />

            {allDone && (
              <div className="completion-banner">
                All done for today — great work!
              </div>
            )}

            <div className="task-list">
              {visibleTasks.length === 0 && !allDone && (
                <p className="empty-state">No tasks here. Add one below.</p>
              )}
              {visibleTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  aiLoading={aiLoadingId === task.id}
                  onToggleDone={toggleDone}
                  onTogglePostpone={togglePostpone}
                  onToggleExpand={toggleExpand}
                  onToggleAI={() => {}}
                  onTriggerAI={triggerAI}
                  onAddAISuggestion={addAISuggestion}
                  onAddSubtask={addSubtask}
                  onToggleSubtask={toggleSubtask}
                  onDelete={deleteTask}
                  onEditTitle={editTitle}
                />
              ))}
            </div>

            {postponedTasks.length > 0 && (
              <div className="postponed-section">
                <p className="postponed-section__label">Not today</p>
                {postponedTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    aiLoading={aiLoadingId === task.id}
                    onToggleDone={toggleDone}
                    onTogglePostpone={togglePostpone}
                    onToggleExpand={toggleExpand}
                    onToggleAI={() => {}}
                    onTriggerAI={triggerAI}
                    onAddAISuggestion={addAISuggestion}
                    onToggleSubtask={toggleSubtask}
                    onDelete={deleteTask}
                    onEditTitle={editTitle}
                  />
                ))}
              </div>
            )}

            <form className="add-form" onSubmit={addTask}>
              <input
                className="add-form__input"
                placeholder="Add a task…"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
              />
              <select
                className="add-form__select"
                value={newCat}
                onChange={e => setNewCat(e.target.value)}
              >
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
              <button className="add-form__btn" type="submit">
                <IconPlus size={16} />
              </button>
            </form>
          </>
        )}

        {activeTab === 'someday' && (
          <SomedayTab
            items={someday}
            onAdd={addSomeday}
            onPromote={promoteToToday}
            onDelete={deleteSomeday}
          />
        )}

        {activeTab === 'review' && (
          <ReviewTab
            tasks={tasks}
            meta={meta}
            onKeepPostponed={reviewKeepPostponed}
            onMovePostponedToSomeday={reviewMovePostponedToSomeday}
          />
        )}
      </main>
    </div>
    </AuthGate>
  );
}
