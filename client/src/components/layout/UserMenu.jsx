import { useNavigate } from 'react-router';
import { ChevronRight, LogOut, Moon, Palette, Sun } from 'lucide-react';
import { USER_MENU } from '../../config/navigation.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../lib/theme.js';

export default function UserMenu({ onDone }) {
  const { logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const handleItem = (item) => {
    if (item.to) navigate(item.to);
    onDone();
  };

  return (
    <div className="user-menu" role="menu">
      {USER_MENU.map((item) => (
        <button key={item.label} type="button" role="menuitem" className="menu-item" onClick={() => handleItem(item)}>
          <item.icon size={16} strokeWidth={1.8} />
          <span>{item.label}</span>
          {item.hasSubmenu && <ChevronRight size={15} className="menu-trail" />}
        </button>
      ))}

      <div className="menu-sep" />

      <button
        type="button"
        role="menuitemcheckbox"
        aria-checked={theme === 'dark'}
        className="menu-item"
        onClick={toggle}
      >
        <Palette size={16} strokeWidth={1.8} />
        <span>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
        <span className={`theme-switch${theme === 'dark' ? ' is-on' : ''}`} aria-hidden="true">
          <span className="theme-knob">{theme === 'dark' ? <Moon size={11} /> : <Sun size={11} />}</span>
        </span>
      </button>

      <div className="menu-sep" />

      <button type="button" role="menuitem" className="menu-item is-danger" onClick={logout}>
        <LogOut size={16} strokeWidth={1.8} />
        <span>Logout</span>
      </button>
    </div>
  );
}
