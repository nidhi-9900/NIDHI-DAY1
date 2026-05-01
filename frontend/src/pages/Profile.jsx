import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Mail, Lock, Save, AlertCircle, CheckCircle } from 'lucide-react';

export default function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();

  const [nameForm,     setNameForm]     = useState({ name: user?.name || '' });
  const [passForm,     setPassForm]     = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [nameLoading,  setNameLoading]  = useState(false);
  const [passLoading,  setPassLoading]  = useState(false);
  const [nameError,    setNameError]    = useState('');
  const [passError,    setPassError]    = useState('');
  const [stats,        setStats]        = useState(null);

  useEffect(() => {
    Promise.all([
      axios.get('/api/expenses'),
      axios.get('/api/groups'),
    ]).then(([eRes, gRes]) => {
      const myExpenses = eRes.data.filter(
        e => e.paidBy?._id === user?.id || e.paidBy?.id === user?.id
      );
      const totalSpent = eRes.data.reduce((s, e) => s + e.amount, 0);
      setStats({
        groups:     gRes.data.length,
        expenses:   eRes.data.length,
        youPaid:    myExpenses.length,
        totalSpent,
      });
    }).catch(console.error);
  }, [user]);

  const handleNameSave = async e => {
    e.preventDefault();
    setNameError('');
    if (!nameForm.name.trim()) { setNameError('Name cannot be empty.'); return; }
    setNameLoading(true);
    try {
      const { data } = await axios.put('/api/auth/me', { name: nameForm.name });
      setUser(prev => ({ ...prev, name: data.name }));
      toast('Name updated successfully!');
    } catch (err) {
      setNameError(err.response?.data?.message || 'Failed to update name.');
    } finally {
      setNameLoading(false);
    }
  };

  const handlePassSave = async e => {
    e.preventDefault();
    setPassError('');
    if (passForm.newPassword !== passForm.confirm) {
      setPassError('New passwords do not match.');
      return;
    }
    setPassLoading(true);
    try {
      await axios.put('/api/auth/me', {
        currentPassword: passForm.currentPassword,
        newPassword:     passForm.newPassword,
      });
      setPassForm({ currentPassword: '', newPassword: '', confirm: '' });
      toast('Password updated successfully!');
    } catch (err) {
      setPassError(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setPassLoading(false);
    }
  };

  const fmt = n => '₹' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  return (
    <div>
      <div className="page-header">
        <h1>Profile</h1>
        <p>Manage your account settings</p>
      </div>

      <div className="grid-2" style={{ marginBottom: '1.5rem', alignItems: 'start' }}>

        {/* Left column — edit forms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Name card */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={avatarStyle}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text)' }}>{user?.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user?.email}</div>
              </div>
            </div>

            {nameError && (
              <div className="alert alert-error">
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                {nameError}
              </div>
            )}

            <form onSubmit={handleNameSave}>
              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input
                  className="form-control"
                  value={nameForm.name}
                  onChange={e => setNameForm({ name: e.target.value })}
                  placeholder="Your name"
                />
              </div>
              <button className="btn btn-primary" type="submit" disabled={nameLoading}>
                <Save size={14} />
                {nameLoading ? 'Saving...' : 'Save Name'}
              </button>
            </form>
          </div>

          {/* Password card */}
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Change Password</div>

            {passError && (
              <div className="alert alert-error">
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                {passError}
              </div>
            )}

            <form onSubmit={handlePassSave}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  className="form-control" type="password"
                  placeholder="••••••••"
                  value={passForm.currentPassword}
                  onChange={e => setPassForm(f => ({ ...f, currentPassword: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  className="form-control" type="password"
                  placeholder="••••••••"
                  value={passForm.newPassword}
                  onChange={e => setPassForm(f => ({ ...f, newPassword: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  className="form-control" type="password"
                  placeholder="••••••••"
                  value={passForm.confirm}
                  onChange={e => setPassForm(f => ({ ...f, confirm: e.target.value }))}
                />
                <div className="form-hint">At least 6 characters</div>
              </div>
              <button className="btn btn-primary" type="submit" disabled={passLoading}>
                <Lock size={14} />
                {passLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>

        {/* Right column — stats */}
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Your Activity</div>
          {stats ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { label: 'Groups Joined',       value: stats.groups },
                { label: 'Total Expenses',       value: stats.expenses },
                { label: 'Expenses You Paid',    value: stats.youPaid },
                { label: 'Total Group Spending', value: fmt(stats.totalSpent) },
              ].map(row => (
                <div key={row.label} style={statRowStyle}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{row.label}</span>
                  <span style={{ fontWeight: 700, color: 'var(--gold-light)', fontSize: '1rem' }}>{row.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="loading-section"><div className="spinner" /></div>
          )}
        </div>
      </div>
    </div>
  );
}

const avatarStyle = {
  width: 48, height: 48,
  borderRadius: '50%',
  background: 'var(--gold-alpha)',
  border: '1px solid var(--gold)',
  color: 'var(--gold-light)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontWeight: 800, fontSize: '1.1rem',
  flexShrink: 0,
};

const statRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.75rem 0',
  borderBottom: '1px solid var(--border)',
};
