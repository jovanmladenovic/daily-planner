import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { IconLoader2, IconEye, IconEyeOff } from '@tabler/icons-react';

export default function AuthGate({ children, session }) {
  if (session) return children;
  return <LoginScreen />;
}

function LoginScreen() {
  const [mode,     setMode]     = useState('signin'); // signin | signup
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [status,   setStatus]   = useState('idle');   // idle | loading | error
  const [error,    setError]    = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setStatus('loading');
    setError('');

    const { error } = mode === 'signin'
      ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
      : await supabase.auth.signUp({ email: email.trim(), password });

    if (error) {
      setError(error.message);
      setStatus('error');
    } else {
      setStatus('idle');
    }
  }

  function switchMode() {
    setMode(m => m === 'signin' ? 'signup' : 'signin');
    setError('');
    setStatus('idle');
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1 className="auth-title">Daily Planner</h1>
        <p className="auth-sub">
          {mode === 'signin' ? 'Sign in to sync your tasks.' : 'Create an account to get started.'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            className="auth-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoFocus
            autoComplete="email"
          />
          <div className="auth-pw-wrap">
            <input
              className="auth-input"
              type={showPw ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
            <button
              type="button"
              className="auth-pw-toggle"
              onClick={() => setShowPw(s => !s)}
              tabIndex={-1}
            >
              {showPw ? <IconEyeOff size={16} /> : <IconEye size={16} />}
            </button>
          </div>

          <button className="auth-btn" type="submit" disabled={status === 'loading'}>
            {status === 'loading'
              ? <IconLoader2 size={16} className="spin" />
              : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>

          {error && <p className="auth-error">{error}</p>}
        </form>

        <button className="auth-switch" type="button" onClick={switchMode}>
          {mode === 'signin'
            ? "Don't have an account? Sign up"
            : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
