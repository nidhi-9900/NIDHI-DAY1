import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, Receipt,
  ArrowLeftRight, Coins, LogOut, UserCircle
} from 'lucide-react';

const NAV = [
  { path: '/',            label: 'Dashboard',   Icon: LayoutDashboard },
  { path: '/groups',      label: 'Groups',      Icon: Users },
  { path: '/expenses',    label: 'Expenses',    Icon: Receipt },
  { path: '/settlements', label: 'Settlements', Icon: ArrowLeftRight },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <nav className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Coins size={18} />
          </div>
          <h2 style={{ fontWeight: 600, letterSpacing: '0.3px' }}>
            <span style={{ color: '#F4F4F5' }}>Split</span><span style={{ color: '#D4AF37' }}>Ledger</span>
          </h2>
        </div>

        <div className="nav-links">
          {NAV.map(({ path, label, Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon"><Icon size={16} /></span>
              <span>{label}</span>
            </NavLink>
          ))}
        </div>

        <div className="sidebar-footer">
          <NavLink to="/profile" className={({ isActive }) => `user-info ${isActive ? 'user-info-active' : ''}`}
            style={{ textDecoration: 'none', borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s' }}>
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="user-name">{user?.name}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </NavLink>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </nav>

      <nav className="bottom-nav">
        {NAV.map(({ path, label, Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
        <NavLink to="/profile" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <UserCircle size={20} />
          <span>Profile</span>
        </NavLink>
      </nav>
    </>
  );
}
