import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Plus, Trash2, Pencil, Receipt, AlertCircle, Utensils, Plane, ShoppingBag, Tv, Zap, Package } from 'lucide-react';

const CAT_ICON = { food: Utensils, travel: Plane, shopping: ShoppingBag, entertainment: Tv, utilities: Zap, other: Package };
const CATS = ['food', 'travel', 'shopping', 'entertainment', 'utilities', 'other'];
const fmt = n => '₹' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
const EMPTY_FORM = { description: '', amount: '', category: 'other', groupId: '', splitType: 'equal', customSplits: [] };

export default function Expenses() {
  const { user } = useAuth();
  const toast = useToast();
  const [expenses, setExpenses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selGroup, setSelGroup] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState({ description: '', amount: '', category: 'other' });

  useEffect(() => {
    axios.get('/api/groups').then(r => {
      setGroups(r.data);
      if (r.data.length) setForm(f => ({ ...f, groupId: r.data[0]._id }));
    }).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = selGroup ? `/api/expenses?groupId=${selGroup}` : '/api/expenses';
    axios.get(url).then(r => setExpenses(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [selGroup]);

  useEffect(() => {
    if (form.splitType !== 'custom' || !form.groupId) return;
    const grp = groups.find(g => g._id === form.groupId);
    if (!grp) return;
    const perPerson = form.amount ? parseFloat((parseFloat(form.amount) / grp.members.length).toFixed(2)) : 0;
    setForm(f => ({ ...f, customSplits: grp.members.map(m => ({ userId: m._id, name: m.name, amount: perPerson })) }));
  }, [form.splitType, form.groupId]);

  const handleAdd = async e => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const payload = {
        description: form.description, amount: parseFloat(form.amount),
        category: form.category, groupId: form.groupId, splitType: form.splitType,
        customSplits: form.splitType === 'custom'
          ? form.customSplits.map(s => ({ userId: s.userId, amount: parseFloat(s.amount) })) : undefined
      };
      const { data } = await axios.post('/api/expenses', payload);
      setExpenses(prev => [data, ...prev]);
      setShowAdd(false);
      setForm(f => ({ ...EMPTY_FORM, groupId: f.groupId }));
      toast('Expense added successfully!');
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add expense.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = e => {
    setEditTarget(e);
    setEditForm({ description: e.description, amount: e.amount, category: e.category });
    setFormError('');
  };

  const handleEdit = async ev => {
    ev.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const { data } = await axios.put(`/api/expenses/${editTarget._id}`, {
        description: editForm.description, amount: parseFloat(editForm.amount), category: editForm.category,
      });
      setExpenses(prev => prev.map(e => e._id === data._id ? data : e));
      setEditTarget(null);
      toast('Expense updated!');
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update expense.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await axios.delete(`/api/expenses/${id}`);
      setExpenses(prev => prev.filter(e => e._id !== id));
      toast('Expense deleted.');
    } catch (err) {
      toast(err.response?.data?.message || 'Could not delete.', 'error');
    }
  };

  const selectedGroupData = groups.find(g => g._id === form.groupId);

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h1>Expenses</h1>
          <p>Track and split expenses with your groups</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowAdd(true); setFormError(''); }}>
          <Plus size={15} /> Add Expense
        </button>
      </div>

      <div className="group-select-bar">
        <label>Filter by Group</label>
        <select className="form-control" value={selGroup} onChange={e => setSelGroup(e.target.value)} style={{ maxWidth: 280 }}>
          <option value="">All Expenses</option>
          {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loading-section"><div className="spinner" /></div>
      ) : expenses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Receipt size={24} /></div>
          <h3>No expenses yet</h3>
          <p>Add your first expense using the button above</p>
        </div>
      ) : expenses.map(e => {
        const CatIcon = CAT_ICON[e.category] || Package;
        const isMyPayment = e.paidBy?._id === user?.id || e.paidBy?.id === user?.id;
        const mySplit = e.splits?.find(s => s.user?._id === user?.id || s.user?.id === user?.id);
        return (
          <div key={e._id} className="expense-item">
            <div className="expense-cat-icon"><CatIcon size={18} /></div>
            <div className="expense-info">
              <div className="expense-desc">{e.description}</div>
              <div className="expense-meta">
                {e.paidBy?.name} paid &bull; {e.group?.name} &bull; {new Date(e.createdAt).toLocaleDateString('en-IN')}
              </div>
              {mySplit && !isMyPayment && (
                <span className="badge badge-error" style={{ marginTop: '0.25rem' }}>Your share: {fmt(mySplit.amount)}</span>
              )}
              {isMyPayment && <span className="badge badge-gold" style={{ marginTop: '0.25rem' }}>You paid</span>}
            </div>
            <div className="text-right">
              <div className="expense-amount">{fmt(e.amount)}</div>
              {isMyPayment && (
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(e)} title="Edit"><Pencil size={13} /></button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(e._id)} title="Delete"><Trash2 size={13} /></button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {showAdd && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div className="modal">
            <div className="modal-header">
              <h2>Add Expense</h2>
              <button className="modal-close" onClick={() => setShowAdd(false)}><Plus size={18} style={{ transform: 'rotate(45deg)' }} /></button>
            </div>
            {formError && <div className="alert alert-error"><AlertCircle size={15} style={{ flexShrink: 0 }} />{formError}</div>}
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <input className="form-control" placeholder="e.g. Dinner at restaurant"
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input className="form-control" type="number" min="0.01" step="0.01" placeholder="500"
                    value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-control" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Group *</label>
                <select className="form-control" value={form.groupId} onChange={e => setForm(f => ({ ...f, groupId: e.target.value }))} required>
                  <option value="">Select a group</option>
                  {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Split Type</label>
                <div className="flex gap-1">
                  {['equal', 'custom'].map(type => (
                    <button key={type} type="button"
                      className={`btn ${form.splitType === type ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1 }} onClick={() => setForm(f => ({ ...f, splitType: type }))}>
                      {type === 'equal' ? 'Equal Split' : 'Custom Split'}
                    </button>
                  ))}
                </div>
              </div>
              {form.splitType === 'custom' && selectedGroupData && (
                <div className="form-group">
                  <label className="form-label">Custom Amounts</label>
                  {(form.customSplits.length ? form.customSplits : selectedGroupData.members.map(m => ({ userId: m._id, name: m.name, amount: 0 }))).map((split, i) => (
                    <div key={split.userId} className="flex gap-1" style={{ marginBottom: '0.5rem', alignItems: 'center' }}>
                      <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)' }}>{split.name}</span>
                      <input type="number" min="0" step="0.01" className="form-control" style={{ maxWidth: 120 }} value={split.amount}
                        onChange={e => setForm(f => {
                          const cs = [...f.customSplits];
                          if (!cs[i]) cs[i] = { ...split };
                          cs[i] = { ...cs[i], amount: e.target.value };
                          return { ...f, customSplits: cs };
                        })} />
                    </div>
                  ))}
                  <div className="form-hint">Total: {fmt(form.customSplits.reduce((s, c) => s + parseFloat(c.amount || 0), 0))} / {fmt(form.amount || 0)}</div>
                </div>
              )}
              <div className="flex gap-1">
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>{submitting ? 'Adding...' : 'Add Expense'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editTarget && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setEditTarget(null); }}>
          <div className="modal">
            <div className="modal-header">
              <h2>Edit Expense</h2>
              <button className="modal-close" onClick={() => setEditTarget(null)}><Plus size={18} style={{ transform: 'rotate(45deg)' }} /></button>
            </div>
            {formError && <div className="alert alert-error"><AlertCircle size={15} style={{ flexShrink: 0 }} />{formError}</div>}
            <form onSubmit={handleEdit}>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <input className="form-control" value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} required />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input className="form-control" type="number" min="0.01" step="0.01" value={editForm.amount}
                    onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-control" value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}>
                    {CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-hint" style={{ marginBottom: '1rem' }}>Equal splits will be recalculated automatically.</div>
              <div className="flex gap-1">
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditTarget(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
