import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { IconLoader2, IconEye, IconEyeOff } from '@tabler/icons-react';

export default function AuthGate({ children, session }) {
  if (session) return children;
  return <LoginScreen />;
}

function LoginScreen() {
  const [mode,     setMode]     = useState('signin'); // signin | signup | reset
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [status,   setStatus]   = useState('idle');   // idle | loading | sent | error
  const [error,    setError]    = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    setError('');

    if (mode === 'reset') {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });
      if (error) { setError(error.message); setStatus('error'); }
      else        { setStatus('sent'); }
      return;
    }

    if (!password) return;
    const { error } = mode === 'signin'
      ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
      : await supabase.auth.signUp({ email: email.trim(), password });

    if (error) { setError(error.message); setStatus('error'); }
    else        { setStatus('idle'); }
  }

  function switchMode(next) {
    setMode(next);
    setError('');
    setStatus('idle');
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1 className="auth-title">Daily Planner</h1>
        <p className="auth-sub">
          {mode === 'signin' ? 'Sign in to sync your tasks.'
            : mode === 'signup' ? 'Create an account to get started.'
            : 'Enter your email to reset your password.'}
        </p>

        {status === 'sent' ? (
          <p className="auth-sub" style={{ color: 'var(--green)', marginTop: 8 }}>
            Check your email for a reset link.
          </p>
        ) : (
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
            {mode !== 'reset' && (
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
            )}

            <button className="auth-btn" type="submit" disabled={status === 'loading'}>
              {status === 'loading'
                ? <IconLoader2 size={16} className="spin" />
                : mode === 'signin' ? 'Sign in'
                : mode === 'signup' ? 'Create account'
                : 'Send reset link'}
            </button>

            {error && <p className="auth-error">{error}</p>}
          </form>
        )}

        <div className="auth-links">
          {mode === 'signin' && <>
            <button className="auth-switch" onClick={() => switchMode('signup')}>
              Don't have an account? Sign up
            </button>
            <button className="auth-switch" onClick={() => switchMode('reset')}>
              Forgot password?
            </button>
          </>}
          {mode !== 'signin' && (
            <button className="auth-switch" onClick={() => switchMode('signin')}>
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
