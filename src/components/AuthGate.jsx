import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { IconMail, IconLoader2, IconCheck } from '@tabler/icons-react';

export default function AuthGate({ children, session }) {
  if (session) return children;
  return <LoginScreen />;
}

function LoginScreen() {
  const [email,  setEmail]  = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | sent | error
  const [error,  setError]  = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      setError(error.message);
      setStatus('error');
    } else {
      setStatus('sent');
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1 className="auth-title">Daily Planner</h1>
        <p className="auth-sub">Sign in with your email to sync across devices.</p>

        {status === 'sent' ? (
          <div className="auth-sent">
            <IconCheck size={24} />
            <p>Check your email for a magic link.</p>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <input
              className="auth-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
            />
            <button className="auth-btn" type="submit" disabled={status === 'loading'}>
              {status === 'loading'
                ? <IconLoader2 size={16} className="spin" />
                : <><IconMail size={16} /> Send magic link</>}
            </button>
            {error && <p className="auth-error">{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
