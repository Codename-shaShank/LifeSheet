import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useProgress } from '../context/ProgressContext.jsx';
import { initials } from '../components/layout/Sidebar.jsx';

/**
 * Dashboard = your profile, for now.
 * FUTURE: streak and activity heatmap (from completedAt), per-module strength,
 *         difficulty split from your notes, recently solved, revision due.
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const { byId } = useProgress();

  const counts = useMemo(() => {
    const entries = Object.values(byId);
    return [
      { label: 'Problems done', value: entries.filter((e) => e.done).length },
      { label: 'Saved', value: entries.filter((e) => e.saved).length },
      { label: 'With notes', value: entries.filter((e) => e.hasNotes).length },
    ];
  }, [byId]);

  return (
    <div className="page">
      <header className="profile-head">
        <span className="avatar avatar-lg">{initials(user.name || user.username)}</span>
        <div>
          <h1>{user.name || user.username}</h1>
          <p className="muted">
            @{user.username} · {user.email}
            {user.role === 'admin' && <span className="role-badge">Admin</span>}
          </p>
        </div>
      </header>

      <ul className="stat-grid">
        {counts.map((c) => (
          <li key={c.label} className="stat-tile">
            <strong>{c.value}</strong>
            <span>{c.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
