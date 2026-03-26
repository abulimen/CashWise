'use client';

import { Home, MessageSquare, Landmark, User, ShieldCheck, Settings, ReceiptText } from 'lucide-react';
import { ReactNode } from 'react';

type Screen = 'home' | 'copilot' | 'stash' | 'bills' | 'profile' | 'audit';

interface NavItem {
  id: Screen;
  icon: ReactNode;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home',    icon: <Home size={22} />, label: 'Home' },
  { id: 'copilot', icon: <MessageSquare size={22} />, label: 'Copilot' },
  { id: 'stash',   icon: <Landmark size={22} />, label: 'Stash' },
  { id: 'bills',   icon: <ReceiptText size={22} />, label: 'Bills' },
  { id: 'profile', icon: <User size={22} />, label: 'Profile' },
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
  { id: 'home',    icon: <Home size={20} />, label: 'Dashboard' },
  { id: 'copilot', icon: <MessageSquare size={20} />, label: 'Chat' },
  { id: 'stash',   icon: <Landmark size={20} />, label: 'Stash' },
  { id: 'bills',   icon: <ReceiptText size={20} />, label: 'Bills' },
  { id: 'audit',   icon: <ShieldCheck size={20} />, label: 'Score' },
  { id: 'profile', icon: <Settings size={20} />,  label: 'Settings' },
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
