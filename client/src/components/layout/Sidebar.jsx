import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router';
import { ChevronDown, ChevronUp, PanelLeft } from 'lucide-react';
import { NAV_SECTIONS } from '../../config/navigation.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { usePersistentState } from '../../hooks/usePersistentState.js';
import UserMenu from './UserMenu.jsx';

export const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || '?';

export default function Sidebar({ collapsed, onToggleCollapsed }) {
  const { user } = useAuth();
  const [openSections, setOpenSections] = usePersistentState('lifesheet:nav-sections', { prep: true, spaces: true });
  const [menuOpen, setMenuOpen] = useState(false);
  const footRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onPointerDown = (e) => {
      if (!footRef.current?.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const toggleSection = (id) => setOpenSections((s) => ({ ...s, [id]: !(s[id] ?? true) }));
  const displayName = user?.name || user?.username || '';

  return (
    <aside className={`sidebar${collapsed ? ' is-collapsed' : ''}`} aria-label="Main navigation">
      <div className="sidebar-head">
        <span className="brand nav-label">LifeSheet</span>
        <button
          type="button"
          className="icon-btn"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <PanelLeft size={17} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {NAV_SECTIONS.map((section) => {
          const open = openSections[section.id] ?? true;
          return (
            <div key={section.id} className="nav-section">
              <button
                type="button"
                className="nav-section-toggle"
                onClick={() => toggleSection(section.id)}
                aria-expanded={open}
              >
                <span>{section.label}</span>
                {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {(open || collapsed) && (
                <ul>
                  {section.items.map(({ to, label, icon: Icon, hasSubmenu }) => (
                    <li key={to}>
                      <NavLink
                        to={to}
                        className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                        title={collapsed ? label : undefined}
                      >
                        <Icon size={17} strokeWidth={1.8} />
                        <span className="nav-label">{label}</span>
                        {hasSubmenu && <ChevronDown size={15} className="nav-trail nav-label" />}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-foot" ref={footRef}>
        {menuOpen && <UserMenu onDone={() => setMenuOpen(false)} />}
        <button
          type="button"
          className="user-chip"
          onClick={() => setMenuOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <span className="avatar">{initials(displayName)}</span>
          <span className="user-name nav-label">{displayName}</span>
        </button>
      </div>
    </aside>
  );
}
