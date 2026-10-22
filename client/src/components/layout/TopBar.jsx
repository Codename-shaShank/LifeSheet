import { Flame, Search } from 'lucide-react';

export default function TopBar() {
  return (
    <header className="topbar">
      {/* FUTURE: global search (Ctrl/Cmd + K) across problem titles and your notes. */}
      <button type="button" className="icon-btn" aria-label="Search">
        <Search size={17} />
      </button>

      {/* FUTURE: streak = consecutive days with at least one problem marked done,
          computed server-side from completedAt. */}
      <div className="streak" title="Daily streak">
        <Flame size={18} className="streak-flame" />
        <span>0</span>
      </div>
    </header>
  );
}
