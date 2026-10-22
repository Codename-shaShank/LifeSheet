import { Outlet, useMatch } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';
import DailyPlanner from './DailyPlanner.jsx';
import { usePersistentState } from '../../hooks/usePersistentState.js';

export default function AppShell() {
  const [collapsed, setCollapsed] = usePersistentState('lifesheet:sidebar-collapsed', false);
  // The problem page needs the right column for the AI chat panel, so the planner steps aside.
  const onProblemPage = useMatch('/prep/:sheetId/problem/:problemId');

  return (
    <div className={`shell${collapsed ? ' is-collapsed' : ''}`}>
      <Sidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((c) => !c)} />
      <div className="shell-right">
        <TopBar />
        <main className={`main${onProblemPage ? ' no-planner' : ''}`}>
          <Outlet />
          {!onProblemPage && <DailyPlanner />}
        </main>
      </div>
    </div>
  );
}
