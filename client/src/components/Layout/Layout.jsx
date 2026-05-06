import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, FileText, Code2, Trophy, Settings,
  LogOut, BookOpen, BarChart3, Shield, Upload, Menu, MessageSquareText
} from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: <LayoutDashboard />, label: 'Dashboard' },
    { to: '/test', icon: <FileText />, label: 'Assessment' },
    { to: '/practice', icon: <BookOpen />, label: 'Practice' },
    { to: '/core', icon: <BookOpen />, label: 'Core Subjects' },
    { to: '/coding', icon: <Code2 />, label: 'Code Editor' },
    { to: '/results', icon: <BarChart3 />, label: 'Results' },
    { to: '/leaderboard', icon: <Trophy />, label: 'Leaderboard' },
    { to: '/resume', icon: <Upload />, label: 'Resume' },
    { to: '/interview', icon: <MessageSquareText />, label: 'Interview' },
  ];

  const adminItems = [
    { to: '/admin', icon: <Shield />, label: 'Admin Panel' },
  ];

  return (
    <div className={`app-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <img src="/logo.png" alt="PrepNinja" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
          <div className="sidebar-logo-text">Prep<span>Ninja</span></div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section">Main</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <>
              <div className="sidebar-section">Admin</div>
              {adminItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={handleLogout}>
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="navbar">
        <button className="navbar-menu" onClick={() => setSidebarOpen(true)}>
          <Menu size={20} />
        </button>
        <div className="navbar-title"></div>
        <div className="navbar-user">
          <div className="navbar-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{user?.name || 'User'}</span>
        </div>
      </div>

      <main className="app-main">
        {children}
      </main>
    </div>
  );
}
