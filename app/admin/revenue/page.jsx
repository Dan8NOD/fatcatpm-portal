'use client';
// ponytail: Monthly Revenue Tracker — admin-only fill-in (matches the .docx template)
// one row per vertical per month, one row per expense per month. Saves to Supabase.
import { useEffect, useState } from 'react';
import { sb } from '../../../lib/supabase';
import { adminApi } from '../../../lib/admin';

const REVENUE_VERTICALS = [
  { id: 'token_broker',       label: 'Token Broker ($5/mo subscriptions)' },
  { id: 'nod_academy',        label: 'NOD Academy ($29/mo memberships)' },
  { id: 'coaching',           label: '1-on-1 Coaching ($500/hr)' },
  { id: 'manual_kindle',      label: 'NOD Training Manual (Kindle $10)' },
  { id: 'manual_gumroad',     label: 'NOD Training Manual (Gumroad $50)' },
  { id: 'agent_script',       label: '$99 Agent Script' },
  { id: 'negotiator_challenge', label: 'Negotiator Challenge (events)' },
  { id: 'real_estate',        label: 'Real estate commissions' },
  { id: 'other',              label: 'Other / misc' },
];

const EXPENSE_CATEGORIES = [
  { id: 'supabase',     label: 'Supabase (DB + Auth + Storage)' },
  { id: 'vercel',       label: 'Vercel (hosting)' },
  { id: 'github',       label: 'GitHub (Pro plan)' },
  { id: 'domain',       label: 'Domain renewals' },
  { id: 'stripe_fees',  label: 'Stripe fees' },
  { id: 'zoom',         label: 'Zoom (coaching/events)' },
  { id: 'video_editor', label: 'Video editor (contractor)' },
  { id: 'va',           label: 'Virtual assistant (contractor)' },
  { id: 'bookkeeper',   label: 'Bookkeeper (contractor)' },
  { id: 'software',     label: 'Equipment / software' },
  { id: 'marketing',    label: 'Marketing / ads' },
  { id: 'other',        label: 'Other / misc' },
];

export default function Revenue() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`);
  const [revenue, setRevenue] = useState({});   // { vertical_id: { amount, transactions, notes } }
  const [expenses, setExpenses] = useState({}); // { category_id: { amount, notes } }
  const [msg, setMsg] = useState('');
  const [history, setHistory] = useState([]);   // previous months totals

  async function load() {
    const [revRes, expRes, histRes] = await Promise.all([
      adminApi('list_revenue_for_month', { month }),
      adminApi('list_expenses_for_month', { month }),
      adminApi('list_revenue_history', {}),
    ]);
    if (revRes.error === 'unauthorized' || expRes.error === 'unauthorized') { location.href = '/'; return; }
    const r = {};
    for (const row of revRes.data || []) r[row.vertical] = { amount: row.amount, transactions: row.transactions, notes: row.notes || '' };
    for (const v of REVENUE_VERTICALS) if (!r[v.id]) r[v.id] = { amount: 0, transactions: 0, notes: '' };
    setRevenue(r);
    const e = {};
    for (const row of expRes.data || []) e[row.category] = { amount: row.amount, notes: row.notes || '' };
    for (const c of EXPENSE_CATEGORIES) if (!e[c.id]) e[c.id] = { amount: 0, notes: '' };
    setExpenses(e);
    setHistory(histRes.data || []);
    setLoading(false);
  }

  useEffect(() => {
    sb.auth.getSession().then(async ({ data }) => {
      if (!data.session) { location.href = '/'; return; }
      setSession(data.session);
      load();
    });
  }, [month]);

  async function save() {
    setMsg('Saving…');
    const revRows = REVENUE_VERTICALS.map(v => ({
      vertical: v.id,
      amount: parseFloat(revenue[v.id].amount) || 0,
      transactions: parseInt(revenue[v.id].transactions) || 0,
      notes: revenue[v.id].notes || null,
    }));
    const expRows = EXPENSE_CATEGORIES.map(c => ({
      category: c.id,
      amount: parseFloat(expenses[c.id].amount) || 0,
      notes: expenses[c.id].notes || null,
    }));
    const r = await adminApi('save_monthly_ledger', { month, revenue: revRows, expenses: expRows });
    if (r.error) setMsg('Error: ' + r.error.message);
    else { setMsg('✓ Saved'); load(); }
  }

  if (loading) return <main style={{ padding: 48, color: '#8e8a7d', textAlign: 'center' }}>Loading…</main>;

  const totalRev = Object.values(revenue).reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const totalExp = Object.values(expenses).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const net = totalRev - totalExp;
  const margin = totalRev > 0 ? (net / totalRev * 100) : 0;

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 24, color: '#f4f1ea', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #26262e', paddingBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#d4a853' }}>FatCat PM · Admin</div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontWeight: 300, fontSize: 28, margin: 0 }}>Monthly Revenue Tracker</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/admin" style={{ color: '#8e8a7d', padding: '8px 14px', border: '1px solid #26262e', borderRadius: 6, textDecoration: 'none', fontSize: 12 }}>← Admin</a>
          <button onClick={() => sb.auth.signOut().then(() => location.href = '/')}
            style={{ background: 'none', border: '1px solid #26262e', color: '#8e8a7d', padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
            Sign out
          </button>
        </div>
      </div>

      {/* Month picker */}
      <div style={{ marginTop: 24, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#8e8a7d' }}>Month</span>
        <input type="month" value={month.slice(0, 7)} onChange={e => setMonth(e.target.value + '-01')}
          style={{ padding: 8, background: '#14141a', border: '1px solid #26262e', color: '#f4f1ea', borderRadius: 6, fontSize: 14, colorScheme: 'dark' }} />
        <button onClick={save}
          style={{ marginLeft: 'auto', padding: '10px 24px', background: '#d4a853', color: '#0a0a0c', border: 'none', borderRadius: 6, fontWeight: 600, letterSpacing: 1, cursor: 'pointer', textTransform: 'uppercase' }}>
          Save Month
        </button>
      </div>
      {msg && <div style={{ color: msg.startsWith('Error') ? '#e57373' : '#d4a853', fontSize: 13, marginBottom: 16 }}>{msg}</div>}

      {/* Revenue by Vertical */}
      <section>
        <h2 style={{ fontFamily: 'Georgia, serif', fontWeight: 300, fontSize: 20, marginBottom: 12 }}>Revenue by Vertical</h2>
        <div style={{ border: '1px solid #26262e', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr', background: '#1e2f40', padding: '10px 16px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#c9a84c' }}>
            <span>Source</span><span style={{ textAlign: 'right' }}>Amount</span><span style={{ textAlign: 'right' }}>Transactions</span><span>Notes</span>
          </div>
          {REVENUE_VERTICALS.map((v, i) => (
            <div key={v.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr', padding: '8px 16px', borderTop: i ? '1px solid #26262e' : 'none', background: '#14141a' }}>
              <span style={{ color: '#f4f1ea', fontSize: 14 }}>{v.label}</span>
              <span style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 8, top: 8, color: '#8e8a7d' }}>$</span>
                <input type="number" step="0.01" value={revenue[v.id].amount} onChange={e => setRevenue({ ...revenue, [v.id]: { ...revenue[v.id], amount: e.target.value }})}
                  style={{ width: '100%', padding: '6px 6px 6px 22px', background: '#0a0a0c', border: '1px solid #26262e', color: '#f4f1ea', borderRadius: 4, fontSize: 13, textAlign: 'right' }} />
              </span>
              <input type="number" value={revenue[v.id].transactions} onChange={e => setRevenue({ ...revenue, [v.id]: { ...revenue[v.id], transactions: e.target.value }})}
                style={{ padding: 6, margin: '0 8px', background: '#0a0a0c', border: '1px solid #26262e', color: '#f4f1ea', borderRadius: 4, fontSize: 13, textAlign: 'right' }} />
              <input value={revenue[v.id].notes} onChange={e => setRevenue({ ...revenue, [v.id]: { ...revenue[v.id], notes: e.target.value }})}
                style={{ padding: 6, background: '#0a0a0c', border: '1px solid #26262e', color: '#f4f1ea', borderRadius: 4, fontSize: 13 }} />
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr', padding: '12px 16px', background: '#1e2f40', borderTop: '2px solid #c9a84c' }}>
            <span style={{ fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontSize: 12 }}>Total Revenue</span>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#d4a853', textAlign: 'right' }}>${totalRev.toFixed(2)}</span>
            <span></span><span></span>
          </div>
        </div>
      </section>

      {/* Expenses */}
      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontWeight: 300, fontSize: 20, marginBottom: 12 }}>Expenses</h2>
        <div style={{ border: '1px solid #26262e', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', background: '#7a2e2e', padding: '10px 16px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#fff' }}>
            <span>Category</span><span style={{ textAlign: 'right' }}>Amount</span><span>Notes</span>
          </div>
          {EXPENSE_CATEGORIES.map((c, i) => (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', padding: '8px 16px', borderTop: i ? '1px solid #26262e' : 'none', background: '#14141a' }}>
              <span style={{ color: '#f4f1ea', fontSize: 14 }}>{c.label}</span>
              <span style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 8, top: 8, color: '#8e8a7d' }}>$</span>
                <input type="number" step="0.01" value={expenses[c.id].amount} onChange={e => setExpenses({ ...expenses, [c.id]: { ...expenses[c.id], amount: e.target.value }})}
                  style={{ width: '100%', padding: '6px 6px 6px 22px', background: '#0a0a0c', border: '1px solid #26262e', color: '#f4f1ea', borderRadius: 4, fontSize: 13, textAlign: 'right' }} />
              </span>
              <input value={expenses[c.id].notes} onChange={e => setExpenses({ ...expenses, [c.id]: { ...expenses[c.id], notes: e.target.value }})}
                style={{ padding: 6, marginLeft: 8, background: '#0a0a0c', border: '1px solid #26262e', color: '#f4f1ea', borderRadius: 4, fontSize: 13 }} />
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', padding: '12px 16px', background: '#1e2f40', borderTop: '2px solid #c9a84c' }}>
            <span style={{ fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontSize: 12 }}>Total Expenses</span>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#e57373', textAlign: 'right' }}>${totalExp.toFixed(2)}</span>
            <span></span>
          </div>
        </div>
      </section>

      {/* Profit Summary */}
      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontWeight: 300, fontSize: 20, marginBottom: 12 }}>Profit Summary</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 0, border: '1px solid #26262e', borderRadius: 10, overflow: 'hidden' }}>
          <Stat label="Net Profit" value={`$${net.toFixed(2)}`} color={net >= 0 ? '#d4a853' : '#e57373'} big />
          <Stat label="Margin" value={`${margin.toFixed(1)}%`} color={margin >= 30 ? '#7ec8a0' : margin >= 0 ? '#d4a853' : '#e57373'} />
          <Stat label="Recurring MRR (Token Broker + NOD Academy)" value={`$${((parseFloat(revenue.token_broker?.amount) || 0) + (parseFloat(revenue.nod_academy?.amount) || 0)).toFixed(2)}`} />
          <Stat label="Months Tracked" value={history.length || 1} />
        </div>
      </section>

      {/* History */}
      {history.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontWeight: 300, fontSize: 20, marginBottom: 12 }}>History</h2>
          <div style={{ display: 'grid', gap: 4 }}>
            {history.slice(0, 12).map(h => (
              <a key={h.month} href={`?month=${h.month.slice(0, 7)}`}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '10px 16px', background: '#14141a', border: '1px solid #26262e', borderRadius: 6, color: '#f4f1ea', textDecoration: 'none', fontSize: 13 }}>
                <span>{h.month}</span>
                <span style={{ textAlign: 'right', color: '#d4a853' }}>${(h.revenue || 0).toFixed(2)}</span>
                <span style={{ textAlign: 'right', color: '#e57373' }}>${(h.expenses || 0).toFixed(2)}</span>
                <span style={{ textAlign: 'right', color: h.net >= 0 ? '#d4a853' : '#e57373', fontWeight: 600 }}>${(h.net || 0).toFixed(2)}</span>
              </a>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function Stat({ label, value, color, big }) {
  return (
    <div style={{ padding: big ? 24 : 16, borderRight: '1px solid #26262e', textAlign: 'center' }}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: big ? 32 : 20, color: color || '#f4f1ea', fontWeight: big ? 700 : 400 }}>{value}</div>
      <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#8e8a7d', marginTop: 4 }}>{label}</div>
    </div>
  );
}