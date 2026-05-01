import { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MessageSquare, FileText, ArrowRight, CheckCircle, AlertCircle, ArrowLeftRight } from 'lucide-react';

const fmt = n => '₹' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

export default function Settlements() {
  const [groups,     setGroups]     = useState([]);
  const [selGroup,   setSelGroup]   = useState('');
  const [settlement, setSettlement] = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [grpLoading, setGrpLoading] = useState(true);
  const [error,      setError]      = useState('');

  useEffect(() => {
    axios.get('/api/groups')
      .then(r => {
        setGroups(r.data);
        if (r.data.length) setSelGroup(r.data[0]._id);
      })
      .catch(console.error)
      .finally(() => setGrpLoading(false));
  }, []);

  useEffect(() => {
    if (!selGroup) return;
    setLoading(true);
    setError('');
    axios.get(`/api/settlements?groupId=${selGroup}`)
      .then(r => setSettlement(r.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load settlements.'))
      .finally(() => setLoading(false));
  }, [selGroup]);

  const shareOnWhatsApp = () => {
    if (!settlement) return;
    let msg = `*${settlement.groupName} - Settlement Summary*\n`;
    msg += `Total expenses: ${fmt(settlement.totalExpense)}\n\n`;

    if (settlement.settlements.length === 0) {
      msg += 'All settled up! No payments needed.';
    } else {
      msg += '*Payments needed:*\n';
      settlement.settlements.forEach(s => {
        msg += `• ${s.from.name} → ${s.to.name}: ${fmt(s.amount)}\n`;
      });
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const exportPDF = () => {
    if (!settlement) return;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(201, 162, 39);
    doc.text('Expense Settlement Report', 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(244, 244, 245);
    doc.text('Group: ' + settlement.groupName, 14, 32);
    doc.text('Total Expense: ' + fmt(settlement.totalExpense), 14, 40);
    doc.text('Generated: ' + new Date().toLocaleDateString('en-IN'), 14, 48);

    autoTable(doc, {
      startY: 58,
      head: [['Member', 'Total Paid', 'Total Owed', 'Net Balance']],
      body: settlement.balances.map(b => [
        b.name,
        fmt(b.totalPaid),
        fmt(b.totalOwed),
        (b.net >= 0 ? '+' : '') + fmt(b.net)
      ]),
      headStyles: { fillColor: [201, 162, 39], textColor: [11, 11, 12] }
    });

    const y = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(13);
    doc.text('Transactions', 14, y);

    if (settlement.settlements.length === 0) {
      doc.setFontSize(11);
      doc.text('All settled! No transactions needed.', 14, y + 10);
    } else {
      autoTable(doc, {
        startY: y + 5,
        head: [['From', 'To', 'Amount']],
        body: settlement.settlements.map(s => [s.from.name, s.to.name, fmt(s.amount)]),
        headStyles: { fillColor: [34, 197, 94], textColor: [11, 11, 12] }
      });
    }

    doc.save('settlement-' + settlement.groupName + '-' + Date.now() + '.pdf');
  };

  if (grpLoading) return (
    <div className="loading-page"><div className="spinner" /></div>
  );

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h1>Settlements</h1>
          <p>Settle up with minimum transactions</p>
        </div>
        {settlement && (
          <div className="flex gap-1">
            <button className="btn btn-whatsapp" onClick={shareOnWhatsApp}>
              <MessageSquare size={15} />
              WhatsApp
            </button>
            <button className="btn btn-success" onClick={exportPDF}>
              <FileText size={15} />
              Export PDF
            </button>
          </div>
        )}
      </div>

      <div className="group-select-bar">
        <label>Select Group</label>
        <select className="form-control" value={selGroup}
          onChange={e => setSelGroup(e.target.value)} style={{ maxWidth: 300 }}>
          {groups.length === 0 && <option value="">No groups found</option>}
          {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
        </select>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-section"><div className="spinner" /></div>
      ) : !settlement ? (
        <div className="empty-state">
          <div className="empty-icon"><ArrowLeftRight size={24} /></div>
          <h3>Select a group above</h3>
          <p>Settlement details will appear here</p>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="flex-between flex-wrap gap-2">
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>Group Total</div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--gold-light)' }}>{fmt(settlement.totalExpense)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>Transactions Needed</div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: settlement.settlements.length === 0 ? 'var(--success)' : 'var(--text)' }}>
                  {settlement.settlements.length === 0 ? 'All Clear' : settlement.settlements.length}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div className="section-title">Member Balances</div>
            <div className="card-white">
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Total Paid</th>
                      <th>Total Owed</th>
                      <th>Net Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlement.balances.map(b => (
                      <tr key={b.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%',
                              background: 'var(--gold-alpha)', border: '1px solid var(--gold)',
                              color: 'var(--gold-light)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 700, fontSize: '0.8rem', flexShrink: 0
                            }}>
                              {b.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text)' }}>{b.name}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{b.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>{fmt(b.totalPaid)}</td>
                        <td>{fmt(b.totalOwed)}</td>
                        <td className={b.net >= 0 ? 'balance-positive' : 'balance-negative'}>
                          {b.net >= 0 ? '+' : ''}{fmt(b.net)}
                          <span style={{ marginLeft: '0.4rem', fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                            {b.net > 0.01 ? '(gets back)' : b.net < -0.01 ? '(owes)' : '(settled)'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div>
            <div className="section-title">Minimum Transactions</div>
            {settlement.settlements.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                  <CheckCircle size={40} color="var(--success)" />
                </div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)' }}>All settled up!</div>
                <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.875rem' }}>No payments needed between members</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {settlement.settlements.map((s, i) => (
                  <div key={i} className="settlement-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: 'var(--error-alpha)', color: 'var(--error)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '0.9rem'
                      }}>
                        {s.from.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>{s.from.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Pays</div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <ArrowRight size={14} color="var(--text-dim)" />
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--gold-light)' }}>{fmt(s.amount)}</div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>{s.to.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Receives</div>
                      </div>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: 'var(--success-alpha)', color: 'var(--success)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '0.9rem'
                      }}>
                        {s.to.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
