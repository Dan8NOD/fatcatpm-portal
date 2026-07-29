'use client';
// ponytail: maintenance tickets — owner creates, sees status. RLS scopes them.
import { useEffect, useState } from 'react';
import { sb } from '../../../lib/supabase';

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [props, setProps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ property_id: '', title: '', description: '', priority: 'normal' });
  const [msg, setMsg] = useState('');

  async function load() {
    const [t, p] = await Promise.all([
      sb.from('tickets').select('*, properties(address)').order('created_at', { ascending: false }),
      sb.from('properties').select('id, address').order('address'),
    ]);
    setTickets(t.data || []);
    setProps(p.data || []);
    setLoading(false);
  }

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      if (!data.session) { location.href = '/'; return; }
      load();
    });
  }, []);

  async function submit(e) {
    e.preventDefault();
    setMsg('Saving…');
    const { error } = await sb.from('tickets').insert({
      property_id: parseInt(form.property_id),
      title: form.title,
      description: form.description,
      priority: form.priority,
      created_by: sb.auth.getUser ? null : null, // ponytail: simple — server resolves via session
    });
    if (error) setMsg('Error: ' + error.message);
    else {
      setMsg('✓ Ticket opened');
      setForm({ property_id: '', title: '', description: '', priority: 'normal' });
      load();
    }
  }

  const statusColor = (s) =>
    s === 'resolved' ? '#7ec8a0' :
    s === 'in_progress' ? '#d4a853' :
    s === 'cancelled' ? '#8e8a7d' : '#e57373';

  const priorityColor = (p) =>
    p === 'urgent' ? '#e57373' :
    p === 'high' ? '#e8a050' :
    p === 'low' ? '#8e8a7d' : '#d4a853';

  if (loading) return <main style={{ padding: 48, color: '#8e8a7d', textAlign: 'center' }}>Loading…</main>;

  const open = tickets.filter(t => t.status === 'open' || t.status === 'in_progress');
  const done = tickets.filter(t => t.status === 'resolved' || t.status === 'cancelled');

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 24, color: '#f4f1ea', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #26262e', paddingBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#d4a853' }}>FatCat PM</div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontWeight: 300, fontSize: 28, margin: 0 }}>Maintenance Tickets</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/portal" style={{ color: '#8e8a7d', padding: '8px 14px', border: '1px solid #26262e', borderRadius: 6, textDecoration: 'none', fontSize: 12 }}>Properties</a>
          <button onClick={() => sb.auth.signOut().then(() => location.href = '/')}
            style={{ background: 'none', border: '1px solid #26262e', color: '#8e8a7d', padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
            Sign out
          </button>
        </div>
      </div>

      {/* Open ticket form */}
      <h2 style={{ fontFamily: 'Georgia, serif', fontWeight: 300, fontSize: 20, marginTop: 24, marginBottom: 12 }}>Open a new ticket</h2>
      <form onSubmit={submit} style={{ display: 'grid', gap: 10, background: '#14141a', border: '1px solid #26262e', borderRadius: 10, padding: 20 }}>
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#8e8a7d' }}>Property</span>
          <select required value={form.property_id} onChange={e => setForm({ ...form, property_id: e.target.value })}
            style={{ padding: 10, background: '#0a0a0c', border: '1px solid #26262e', color: '#f4f1ea', borderRadius: 6, fontSize: 14 }}>
            <option value="">Select property…</option>
            {props.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
          </select>
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#8e8a7d' }}>What's the issue?</span>
          <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
            style={{ padding: 10, background: '#0a0a0c', border: '1px solid #26262e', color: '#f4f1ea', borderRadius: 6, fontSize: 14 }}
            placeholder="Leak under kitchen sink" />
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#8e8a7d' }}>Details (optional)</span>
          <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            style={{ padding: 10, background: '#0a0a0c', border: '1px solid #26262e', color: '#f4f1ea', borderRadius: 6, fontSize: 14, fontFamily: 'Inter, system-ui, sans-serif', resize: 'vertical' }} />
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#8e8a7d' }}>How urgent?</span>
          <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
            style={{ padding: 10, background: '#0a0a0c', border: '1px solid #26262e', color: '#f4f1ea', borderRadius: 6, fontSize: 14 }}>
            <option value="low">Low — when convenient</option>
            <option value="normal">Normal</option>
            <option value="high">High — within a few days</option>
            <option value="urgent">Urgent — same day</option>
          </select>
        </label>
        <button type="submit" style={{ padding: 12, background: '#d4a853', color: '#0a0a0c', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 1 }}>
          Open Ticket
        </button>
        {msg && <div style={{ color: msg.startsWith('Error') ? '#e57373' : '#d4a853', fontSize: 13 }}>{msg}</div>}
      </form>

      {/* Open tickets */}
      <h2 style={{ fontFamily: 'Georgia, serif', fontWeight: 300, fontSize: 20, marginTop: 32, marginBottom: 12 }}>Open ({open.length})</h2>
      <div style={{ display: 'grid', gap: 8 }}>
        {open.length === 0 && <p style={{ color: '#8e8a7d', fontSize: 14 }}>No open tickets.</p>}
        {open.map(t => (
          <div key={t.id} style={{ background: '#14141a', border: '1px solid #26262e', borderRadius: 10, padding: 16, borderLeft: `3px solid ${priorityColor(t.priority)}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <div style={{ fontSize: 16, color: '#f4f1ea' }}>{t.title}</div>
              <div style={{ color: statusColor(t.status), fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>{t.status.replace('_', ' ')}</div>
            </div>
            <div style={{ color: '#8e8a7d', fontSize: 13 }}>
              {t.properties?.address || `Property #${t.property_id}`} · <span style={{ color: priorityColor(t.priority) }}>{t.priority}</span> · opened {new Date(t.created_at).toLocaleDateString()}
            </div>
            {t.description && <p style={{ color: '#f4f1ea', fontSize: 14, marginTop: 8 }}>{t.description}</p>}
          </div>
        ))}
      </div>

      {/* Resolved */}
      <h2 style={{ fontFamily: 'Georgia, serif', fontWeight: 300, fontSize: 20, marginTop: 32, marginBottom: 12 }}>Resolved ({done.length})</h2>
      <div style={{ display: 'grid', gap: 8 }}>
        {done.length === 0 && <p style={{ color: '#8e8a7d', fontSize: 14 }}>No resolved tickets yet.</p>}
        {done.map(t => (
          <div key={t.id} style={{ background: '#14141a', border: '1px solid #26262e', borderRadius: 10, padding: 14, opacity: 0.75 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontSize: 15, color: '#f4f1ea' }}>{t.title}</div>
              <div style={{ color: statusColor(t.status), fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>{t.status}</div>
            </div>
            <div style={{ color: '#8e8a7d', fontSize: 12, marginTop: 4 }}>
              {t.properties?.address || `Property #${t.property_id}`} {t.resolved_at && `· resolved ${new Date(t.resolved_at).toLocaleDateString()}`}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
