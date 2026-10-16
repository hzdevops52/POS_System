import { useState } from 'react';
import { Store, LockKeyhole, Mail, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import './login.css';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Enter your email address and password.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error?.message || 'Unable to sign in. Please try again.'
        );
      }

      setPassword('');
      onLogin(result.data.user);
    } catch (err) {
      setError(err.message || 'Unable to reach the server. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-screen">
      <section className="login-card">
        <div className="login-brand-mark"><Store size={27} /></div>
        <p className="login-eyebrow">HZ TECH CLOUD</p>
        <h1>Welcome back</h1>
        <p className="login-subtitle">
          Sign in to access your retail workspace.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="login-email">Email address</label>
          <div className="login-input-wrap">
            <Mail size={17} aria-hidden="true" />
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              placeholder="you@store.com"
              value={email}
              onChange={event => setEmail(event.target.value)}
              maxLength={254}
              required
              disabled={loading}
            />
          </div>

          <label htmlFor="login-password">Password</label>
          <div className="login-input-wrap">
            <LockKeyhole size={17} aria-hidden="true" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              maxLength={200}
              required
              disabled={loading}
            />
            <button
              type="button"
              className="login-password-toggle"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword(value => !value)}
              disabled={loading}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>

          {error && (
            <p className="login-error" role="alert">{error}</p>
          )}

          <button className="login-submit" type="submit" disabled={loading}>
            {loading
              ? <><LoaderCircle size={17} className="login-spinner" /> Signing in…</>
              : 'Sign in to workspace'}
          </button>
        </form>

        <p className="login-security">
          <LockKeyhole size={13} />
          Secure access for authorized staff
        </p>
      </section>

      <footer className="login-footer">
        © {new Date().getFullYear()} HZ Tech Cloud · Retail operations, made simpler.
      </footer>
    </main>
  );
}
