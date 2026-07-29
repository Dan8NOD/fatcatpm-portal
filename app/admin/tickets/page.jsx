'use client';
// ponytail: admin tickets kanban — drag-handle-free, click-to-change-status
import { useEffect, useState } from 'react';
import { sb } from '../../../lib/supabase';
import { adminApi } from '../../../lib/admin';

const COLUMNS = [
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const r = await adminApi('list_all_tickets', {});
    if (r.error === 'unauthorized') { location.href = '/'; return; }
    setTickets(r.data || []);
    setLoading(false);
  }

  useEffect(() => {
    sb.auth.getSession().then(async ({ data }) => {
      if (!data.session) { location.href = '/'; return; }
      load();
    });
  }, []);

  async function setStatus(id, status) {
    await adminApi('update_ticket_status', { id, status });
    load();
  }

  async function del(id) {
    if (!confirm('Delete this ticket?')) return;
    await adminApi('delete_ticket', { id });
    load();
  }

  if (loading) return <main style={{ padding: 48, color: '#8e8a7d', textAlign: 'center' }}>Loading…</main>;

  const priorityColor = (p) =>
    p === 'urgent' ? '#e57373' :
    p === 'high' ? '#e8a050' :
    p === 'low' ? '#8e8a7d' : '#d4a853';

  return (
    <main style={{ maxWidth: 1300, margin: '0 auto', padding: 24, color: '#f4f1ea', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #26262e', paddingBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#d4a853' }}>FatCat PM · Admin</div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontWeight: 300, fontSize: 28, margin: 0 }}>Maintenance Tickets</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/admin" style={{ color: '#8e8a7d', padding: '8px 14px', border: '1px solid #26262e', borderRadius: 6, textDecoration: 'none', fontSize: 12 }}>← Admin</a>
          <button onClick={() => sb.auth.signOut().then(() => location.href = '/')}
            style={{ background: 'none', border: '1px solid #26262e', color: '#8e8a7d', padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
            Sign out
          </button>
        </div>
      </div>

      {/* Kanban board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 24 }}>
        {COLUMNS.map(col => {
          const inCol = tickets.filter(t => t.status === col.key);
          return (
            <div key={col.key} style={{ background: '#0f0f12', border: '1px solid #26262e', borderRadius: 10, padding: 12, minHeight: 400 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 8, borderBottom: '1px solid #26262e', marginBottom: 12 }}>
                <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#d4a853' }}>{col.label}</div>
                <div style={{ color: '#8e8a7d', fontSize: 12 }}>{inCol.length}</div>
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {inCol.length === 0 && <div style={{ color: '#8e8a7d', fontSize: 12, fontStyle: 'italic' }}>—</div>}
                {inCol.map(t => (
                  <div key={t.id} style={{ background: '#14141a', border: '1px solid #26262e', borderRadius: 8, padding: 12, borderLeft: `3px solid ${priorityColor(t.priority)}` }}>
                    <div style={{ fontSize: 14, color: '#f4f1ea', marginBottom: 4 }}>{t.title}</div>
                    <div style={{ color: '#8e8a7d', fontSize: 12 }}>
                      {t.properties?.address || `Property #${t.property_id}`}
                    </div>
                    {t.description && <p style={{ color: '#8e8a7d', fontSize: 12, marginTop: 6, marginBottom: 8, lineHeight: 1.4 }}>{t.description.slice(0, 80)}{t.description.length > 80 ? '…' : ''}</p>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <span style={{ color: priorityColor(t.priority), fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>{t.priority}</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {COLUMNS.filter(c => c.key !== col.key).map(c => (
                          <button key={c.key} onClick={() => setStatus(t.id, c.key)}
                            title={`Move to ${c.label}`}
                            style={{ width: 18, height: 18, padding: 0, fontSize: 10, background: 'transparent', border: '1px solid #26262e', color: '#8e8a7d', borderRadius: 3, cursor: 'pointer' }}>
                            →
                          </button>
                        ))}
                        <button onClick={() => del(t.id)} title="Delete"
                          style={{ width: 18, height: 18, padding: 0, fontSize: 12, background: 'transparent', border: 'none', color: '#8e8a7d', cursor: 'pointer' }}>
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
