import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Mapping-driven so adding a signup field is one entry here plus the server's zod schema.
const FIELDS = [
  { key: 'name', label: 'Name', autoComplete: 'name' },
  { key: 'username', label: 'Username', autoComplete: 'username', hint: '3–30 characters: letters, numbers, underscore' },
  { key: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { key: 'password', label: 'Password', type: 'password', autoComplete: 'new-password', hint: 'At least 8 characters' },
  { key: 'inviteCode', label: 'Invite code', autoComplete: 'off', optional: true, hint: 'Ask the owner of this LifeSheet' },
];

export default function SignupPage() {
  const { signup } = useAuth();
  const [form, setForm] = useState(() => Object.fromEntries(FIELDS.map((f) => [f.key, ''])));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signup(form);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={handleSubmit}>
        <span className="brand">LifeSheet</span>
        <h1>Create your account</h1>

        {FIELDS.map((f) => (
          <div key={f.key} className="field">
            <label htmlFor={f.key}>{f.label}</label>
            <input
              id={f.key}
              type={f.type ?? 'text'}
              autoComplete={f.autoComplete}
              required={!f.optional}
              value={form[f.key]}
              onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
              aria-describedby={f.hint ? `${f.key}-hint` : undefined}
            />
            {f.hint && (
              <span id={`${f.key}-hint`} className="field-hint">
                {f.hint}
              </span>
            )}
          </div>
        ))}

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
