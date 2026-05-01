import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { Plus, Trash2, UserPlus, Users, DollarSign, AlertCircle, CheckCircle, Search } from 'lucide-react';

const fmt = n => '₹' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

export default function Groups() {
  const toast = useToast();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showAddMember, setShowAddMember] = useState(null);
  const [createForm, setCreateForm] = useState({ name: '', description: '', memberEmails: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  // member search state
  const [memberSearch, setMemberSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => { fetchGroups(); }, []);

  async function fetchGroups() {
    try {
      const { data } = await axios.get('/api/groups');
      setGroups(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load groups.');
    } finally {
      setLoading(false);
    }
  }

  const handleCreate = async e => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const emails = createForm.memberEmails.split(',').map(s => s.trim()).filter(Boolean);
      const { data } = await axios.post('/api/groups', { ...createForm, memberEmails: emails });
      setGroups(prev => [data, ...prev]);
      setShowCreate(false);
      setCreateForm({ name: '', description: '', memberEmails: '' });
      toast('Group created!');
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not create group.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearch = async val => {
    setMemberSearch(val);
    setSelectedMember(null);
    if (val.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const { data } = await axios.get(`/api/auth/users?search=${encodeURIComponent(val)}`);
      setSearchResults(data);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = async e => {
    e.preventDefault();
    setFormError('');
    if (!selectedMember) { setFormError('Please select a user from the search results.'); return; }
    setSubmitting(true);
    try {
      const { data } = await axios.post(`/api/groups/${showAddMember}/members`, { email: selectedMember.email });
      setGroups(prev => prev.map(g => g._id === data._id ? data : g));
      setShowAddMember(null);
      setMemberSearch('');
      setSearchResults([]);
      setSelectedMember(null);
      toast(`${selectedMember.name} added to group!`);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not add member.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this group? This cannot be undone.')) return;
    try {
      await axios.delete(`/api/groups/${id}`);
      setGroups(prev => prev.filter(g => g._id !== id));
      toast('Group deleted.');
    } catch (err) {
      toast(err.response?.data?.message || 'Delete failed.', 'error');
    }
  };

  const openAddMember = id => {
    setShowAddMember(id);
    setFormError('');
    setMemberSearch('');
    setSearchResults([]);
    setSelectedMember(null);
  };

  if (loading) return <div className="loading-section"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h1>Groups</h1>
          <p>Manage your expense groups</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowCreate(true); setFormError(''); }}>
          <Plus size={15} /> New Group
        </button>
      </div>

      {error && <div className="alert alert-error"><AlertCircle size={15} style={{ flexShrink: 0 }} />{error}</div>}

      {groups.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Users size={24} /></div>
          <h3>No groups yet</h3>
          <p>Create a group to start splitting expenses</p>
        </div>
      ) : (
        <div className="grid-3">
          {groups.map(group => (
            <div key={group._id} className="group-card">
              <div className="group-card-header">
                <div>
                  <div className="group-name">{group.name}</div>
                  {group.description && <div className="group-desc">{group.description}</div>}
                </div>
                <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(group._id)} title="Delete group">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="group-meta">
                <span className="group-meta-item"><Users size={13} />{group.members.length} members</span>
                <span className="group-meta-item"><DollarSign size={13} />{fmt(group.totalExpense)}</span>
              </div>
              <div className="group-members" style={{ margin: '0.75rem 0' }}>
                {group.members.slice(0, 5).map((m, i) => (
                  <div key={m._id} className="member-chip" title={m.name} style={{ zIndex: 5 - i }}>
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                ))}
                {group.members.length > 5 && (
                  <div className="member-chip member-chip-more">+{group.members.length - 5}</div>
                )}
              </div>
              <button className="btn btn-secondary btn-sm w-full" style={{ marginTop: '0.5rem' }}
                onClick={() => openAddMember(group._id)}>
                <UserPlus size={13} /> Add Member
              </button>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="modal">
            <div className="modal-header">
              <h2>Create New Group</h2>
              <button className="modal-close" onClick={() => setShowCreate(false)}>
                <Plus size={18} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>
            {formError && <div className="alert alert-error"><AlertCircle size={15} style={{ flexShrink: 0 }} />{formError}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Group Name *</label>
                <input className="form-control" placeholder="e.g. Goa Trip, Roommates"
                  value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <input className="form-control" placeholder="What is this group for?"
                  value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Member Emails</label>
                <input className="form-control" placeholder="friend1@gmail.com, friend2@gmail.com"
                  value={createForm.memberEmails} onChange={e => setCreateForm(f => ({ ...f, memberEmails: e.target.value }))} />
                <div className="form-hint">Comma separated — only registered users will be added</div>
              </div>
              <div className="flex gap-1">
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddMember && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowAddMember(null); }}>
          <div className="modal">
            <div className="modal-header">
              <h2>Add Member</h2>
              <button className="modal-close" onClick={() => setShowAddMember(null)}>
                <Plus size={18} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>
            {formError && <div className="alert alert-error"><AlertCircle size={15} style={{ flexShrink: 0 }} />{formError}</div>}
            <form onSubmit={handleAddMember}>
              <div className="form-group">
                <label className="form-label">Search by Email or Name</label>
                <div style={{ position: 'relative' }}>
                  <input className="form-control" placeholder="Type to search users..."
                    value={memberSearch} onChange={e => handleSearch(e.target.value)} autoComplete="off" />
                  {searching && (
                    <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}>
                      <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                    </div>
                  )}
                </div>

                {searchResults.length > 0 && !selectedMember && (
                  <div style={dropdownStyle}>
                    {searchResults.map(u => (
                      <div key={u._id} style={dropdownItemStyle}
                        onClick={() => { setSelectedMember(u); setMemberSearch(u.email); setSearchResults([]); }}>
                        <div style={dropdownAvatarStyle}>{u.name.charAt(0).toUpperCase()}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)' }}>{u.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedMember && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={14} color="var(--success)" />
                    <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>
                      Selected: {selectedMember.name} ({selectedMember.email})
                    </span>
                    <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: 'auto' }}
                      onClick={() => { setSelectedMember(null); setMemberSearch(''); }}>
                      Change
                    </button>
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddMember(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting || !selectedMember}>
                  {submitting ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const dropdownStyle = {
  position: 'absolute', zIndex: 50,
  background: 'var(--card)', border: '1px solid var(--border)',
  borderRadius: 8, marginTop: 4, width: '100%',
  maxHeight: 200, overflowY: 'auto',
  boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
};

const dropdownItemStyle = {
  display: 'flex', alignItems: 'center', gap: '0.75rem',
  padding: '0.75rem 1rem', cursor: 'pointer',
  borderBottom: '1px solid var(--border)',
  transition: 'background 0.1s',
};

const dropdownAvatarStyle = {
  width: 32, height: 32, borderRadius: '50%',
  background: 'var(--gold-alpha)', border: '1px solid var(--gold)',
  color: 'var(--gold-light)', display: 'flex',
  alignItems: 'center', justifyContent: 'center',
  fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
};
