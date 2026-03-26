'use client';

type Screen = 'home' | 'copilot' | 'stash' | 'profile' | 'audit';

interface NavItem {
  id: Screen;
  icon: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home',    icon: '🏠', label: 'Home' },
  { id: 'copilot', icon: '💬', label: 'Copilot' },
  { id: 'stash',   icon: '🏦', label: 'Stash' },
  { id: 'profile', icon: '👤', label: 'Profile' },
];

interface BottomNavProps {
  active: string;
  onNavigate: (id: Screen) => void;
}

export function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          className={`nav-item ${active === item.id ? 'active' : ''}`}
          onClick={() => onNavigate(item.id)}
          aria-current={active === item.id ? 'page' : undefined}
          id={`nav-${item.id}`}
        >
          <span className="nav-icon">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  );
}

const SIDEBAR_ITEMS: NavItem[] = [
  { id: 'home',    icon: '🏠', label: 'Dashboard' },
  { id: 'copilot', icon: '💬', label: 'Chat' },
  { id: 'stash',   icon: '🏦', label: 'Stash' },
  { id: 'audit',   icon: '📋', label: 'Score' },
  { id: 'profile', icon: '⚙️',  label: 'Settings' },
];

interface SidebarProps {
  active: string;
  onNavigate: (id: Screen) => void;
}

export function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">C</div>
        <div className="sidebar-logo-text">
          <div className="sidebar-logo-name">CashWise</div>
          <div className="sidebar-logo-sub">Private Banking</div>
        </div>
      </div>
      {SIDEBAR_ITEMS.map((item) => (
        <button
          key={item.id}
          className={`sidebar-nav-item ${active === item.id ? 'active' : ''}`}
          onClick={() => onNavigate(item.id)}
          id={`sidebar-${item.id}`}
        >
          <span className="sidebar-nav-icon">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </aside>
  );
}
