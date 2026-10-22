import { useNavigate } from 'react-router';
import { ChevronRight, LogOut, Moon, Palette } from 'lucide-react';
import { USER_MENU } from '../../config/navigation.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function UserMenu({ onDone }) {
  const { logout } = useAuth();
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

      {/* FUTURE: light theme. The app is dark-only for now, so the switch is shown on and inert. */}
      <div className="menu-item is-static">
        <Palette size={16} strokeWidth={1.8} />
        <span>Theme</span>
        <span className="theme-switch" aria-hidden="true">
          <span className="theme-knob">
            <Moon size={11} />
          </span>
        </span>
      </div>

      <div className="menu-sep" />

      <button type="button" role="menuitem" className="menu-item is-danger" onClick={logout}>
        <LogOut size={16} strokeWidth={1.8} />
        <span>Logout</span>
      </button>
    </div>
  );
}
