import { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';
import { Wallet, TrendingDown, TrendingUp, Users, Utensils, Plane, ShoppingBag, Tv, Zap, Package, Receipt, Clock } from 'lucide-react';

const CAT_ICON  = { food: Utensils, travel: Plane, shopping: ShoppingBag, entertainment: Tv, utilities: Zap, other: Package };
const CAT_LABEL = { food: 'Food', travel: 'Travel', shopping: 'Shopping', entertainment: 'Entertainment', utilities: 'Utilities', other: 'Other' };
const PIE_COLORS = ['#C9A227', '#22C55E', '#EF4444', '#E6C76E', '#A1A1AA', '#71717A'];
const fmt = n => '₹' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const tooltipStyle = { background: '#18181B', border: '1px solid #27272A', borderRadius: 8, color: '#F4F4F5', fontSize: '0.8rem' };

export default function Dashboard() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [groups,   setGroups]   = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([axios.get('/api/expenses'), axios.get('/api/groups')])
      .then(([eRes, gRes]) => { setExpenses(eRes.data); setGroups(gRes.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  const myId = user?.id;
  const paidExpenses = expenses.filter(e => e.paidBy?._id === myId || e.paidBy?.id === myId);
  const totalPaid    = paidExpenses.reduce((s, e) => s + e.amount, 0);

  const totalOwed = expenses
    .filter(e => e.paidBy?._id !== myId && e.paidBy?.id !== myId)
    .reduce((s, e) => {
      const split = e.splits?.find(sp => sp.user?._id === myId || sp.user?.id === myId);
      return s + (split?.amount || 0);
    }, 0);

  const totalToGet = paidExpenses.reduce((s, e) => {
    const others = e.splits?.filter(sp => sp.user?._id !== myId && sp.user?.id !== myId)
      .reduce((ss, sp) => ss + sp.amount, 0) || 0;
    return s + others;
  }, 0);

  const catMap = expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; }, {});
  const catData = Object.entries(catMap).map(([name, value]) => ({ name: CAT_LABEL[name] || name, value: parseFloat(value.toFixed(2)) }));

  const spenderMap = {};
  expenses.forEach(e => { const name = e.paidBy?.name || 'Unknown'; spenderMap[name] = (spenderMap[name] || 0) + e.amount; });
  const spenderData = Object.entries(spenderMap)
    .map(([name, amount]) => ({ name, amount: parseFloat(amount.toFixed(2)) }))
    .sort((a, b) => b.amount - a.amount).slice(0, 6);

  const recentActivity = expenses.slice(0, 8);

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Hello, {user?.name}! Here&apos;s your financial overview.</p>
      </div>

      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <StatCard Icon={Wallet}       label="You Paid"      value={fmt(totalPaid)}  color="#C9A227" />
        <StatCard Icon={TrendingDown} label="You Owe"       value={fmt(totalOwed)}  color="#EF4444" />
        <StatCard Icon={TrendingUp}   label="Owed to You"   value={fmt(totalToGet)} color="#22C55E" />
        <StatCard Icon={Users}        label="Active Groups" value={groups.length}   color="#E6C76E" sub="total" />
      </div>

      {catData.length > 0 && (
        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          <div className="chart-section">
            <div className="chart-title">Spending by Category</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {catData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => fmt(v)} contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-section">
            <div className="chart-title">Top Spenders</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={spenderData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#A1A1AA' }} />
                <YAxis tick={{ fontSize: 11, fill: '#A1A1AA' }} />
                <Tooltip formatter={v => fmt(v)} contentStyle={tooltipStyle} />
                <Bar dataKey="amount" fill="#C9A227" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid-2">
        {/* Recent Expenses */}
        <div>
          <div className="section-title">Recent Expenses</div>
          {expenses.slice(0, 5).length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Receipt size={24} /></div>
              <h3>No expenses yet</h3>
              <p>Go to Expenses to add your first one</p>
            </div>
          ) : expenses.slice(0, 5).map(e => {
            const CatIcon = CAT_ICON[e.category] || Package;
            return (
              <div key={e._id} className="expense-item">
                <div className="expense-cat-icon"><CatIcon size={18} /></div>
                <div className="expense-info">
                  <div className="expense-desc">{e.description}</div>
                  <div className="expense-meta">
                    {e.paidBy?.name} &bull; {e.group?.name} &bull; {new Date(e.createdAt).toLocaleDateString('en-IN')}
                  </div>
                </div>
                <div className="expense-amount">{fmt(e.amount)}</div>
              </div>
            );
          })}
        </div>

        {/* Activity Feed */}
        <div>
          <div className="section-title">Activity Feed</div>
          {recentActivity.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Clock size={24} /></div>
              <h3>No activity yet</h3>
              <p>Activity from your groups will show here</p>
            </div>
          ) : (
            <div className="card" style={{ padding: '0.5rem 0' }}>
              {recentActivity.map((e, i) => {
                const CatIcon  = CAT_ICON[e.category] || Package;
                const isPaidByMe = e.paidBy?._id === myId || e.paidBy?.id === myId;
                const timeAgo  = getTimeAgo(e.createdAt);
                return (
                  <div key={e._id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.75rem 1.25rem',
                    borderBottom: i < recentActivity.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                      background: isPaidByMe ? 'var(--gold-alpha)' : 'rgba(239,68,68,0.1)',
                      border: `1px solid ${isPaidByMe ? 'var(--gold)' : '#EF4444'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isPaidByMe ? 'var(--gold-light)' : '#EF4444',
                    }}>
                      <CatIcon size={14} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {isPaidByMe ? 'You paid' : e.paidBy?.name + ' paid'} for {e.description}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                        {e.group?.name} &bull; {timeAgo}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: isPaidByMe ? 'var(--gold-light)' : 'var(--text)', flexShrink: 0 }}>
                      {fmt(e.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
