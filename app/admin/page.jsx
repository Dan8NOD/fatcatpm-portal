'use client';
// ponytail: admin home — lists all properties + recent referrals + quick actions
import { useEffect, useState } from 'react';
import { sb } from '../../lib/supabase';
import { adminApi } from '../../lib/admin';

export default function Admin() {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [data, setData] = useState({ properties: [], referrals: [], tickets: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sb.auth.getSession().then(async ({ data }) => {
      if (!data.session) { location.href = '/'; return; }
      setSession(data.session);
      // ponytail: probe admin status via first admin API call
      const probe = await adminApi('list_all_properties', {});
      if (probe.error === 'unauthorized') { location.href = '/'; return; }
      setIsAdmin(true);
      const refs = await adminApi('list_all_referrals', {});
      const tickets = await adminApi('list_all_tickets', {});
      setData({ properties: probe.data || [], referrals: refs.data || [], tickets: tickets.data || [] });
      setLoading(false);
    });
  }, []);

  if (loading) return <main style={{ padding: 48, textAlign: 'center', color: '#8e8a7d' }}>Loading…</main>;

  const stats = {
    active: data.properties.filter(p => p.status === 'active').length,
    totalRent: data.properties.reduce((sum, p) => sum + (parseFloat(p.monthly_rent) || 0), 0),
    refsPending: data.referrals.filter(r => r.status === 'pending').length,
    refsClosed: data.referrals.filter(r => r.status === 'closed').length,
    ticketsOpen: data.tickets ? data.tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length : 0,
  };

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 24, color: '#f4f1ea', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #26262e', paddingBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#d4a853' }}>FatCat PM · Admin</div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontWeight: 300, fontSize: 32, margin: 0 }}>Dashboard</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/admin/properties" style={{ color: '#8e8a7d', padding: '8px 14px', border: '1px solid #26262e', borderRadius: 6, textDecoration: 'none', fontSize: 12 }}>Properties</a>
          <a href="/admin/tickets" style={{ color: '#8e8a7d', padding: '8px 14px', border: '1px solid #26262e', borderRadius: 6, textDecoration: 'none', fontSize: 12 }}>Tickets</a>
          <a href="/admin/referrals" style={{ color: '#8e8a7d', padding: '8px 14px', border: '1px solid #26262e', borderRadius: 6, textDecoration: 'none', fontSize: 12 }}>Referrals</a>
          <a href="/admin/revenue" style={{ color: '#8e8a7d', padding: '8px 14px', border: '1px solid #26262e', borderRadius: 6, textDecoration: 'none', fontSize: 12 }}>Revenue</a>
          <button onClick={() => sb.auth.signOut().then(() => location.href = '/')}
            style={{ background: 'none', border: '1px solid #26262e', color: '#8e8a7d', padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
            Sign out
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 0, border: '1px solid #26262e', marginTop: 24, borderRadius: 10, overflow: 'hidden' }}>
        <Stat n={stats.active} label="Active Properties" />
        <Stat n={'$' + stats.totalRent.toLocaleString()} label="Total Monthly Rent" />
        <Stat n={stats.ticketsOpen} label="Tickets Open" />
        <Stat n={stats.refsClosed + '/' + (stats.refsPending + stats.refsClosed)} label="Referrals" />
      </div>

      {/* Properties list */}
      <h2 style={{ fontFamily: 'Georgia, serif', fontWeight: 300, fontSize: 22, marginTop: 32, marginBottom: 16 }}>Properties</h2>
      <div style={{ display: 'grid', gap: 12 }}>
        {data.properties.length === 0 && <p style={{ color: '#8e8a7d' }}>No properties yet — <a href="/admin/properties" style={{ color: '#d4a853' }}>add one</a>.</p>}
        {data.properties.map(p => (
          <div key={p.id} style={{ background: '#14141a', border: '1px solid #26262e', borderRadius: 10, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#d4a853' }}>{p.address}</div>
              <div style={{ color: '#8e8a7d', fontSize: 13, marginTop: 4 }}>
                Owner: {p.owner_email} · {p.units} unit{p.units === 1 ? '' : 's'} · ${p.monthly_rent ?? '—'}/mo · {p.status}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <a href={`/admin/upload-report/${p.id}`} style={{ background: '#d4a853', color: '#0a0a0c', padding: '8px 14px', borderRadius: 6, textDecoration: 'none', fontSize: 12, fontWeight: 600, letterSpacing: 1 }}>+ Report</a>
              <a href={`/statement/${p.id}`} style={{ color: '#8e8a7d', padding: '8px 14px', border: '1px solid #26262e', borderRadius: 6, textDecoration: 'none', fontSize: 12 }}>Statement</a>
              <a href={`/portal/reports/${p.id}`} style={{ color: '#8e8a7d', padding: '8px 14px', border: '1px solid #26262e', borderRadius: 6, textDecoration: 'none', fontSize: 12 }}>View</a>
            </div>
          </div>
        ))}
      </div>

      {/* Recent referrals */}
      <h2 style={{ fontFamily: 'Georgia, serif', fontWeight: 300, fontSize: 22, marginTop: 32, marginBottom: 16 }}>Recent Referrals</h2>
      <div style={{ display: 'grid', gap: 8 }}>
        {data.referrals.length === 0 && <p style={{ color: '#8e8a7d' }}>No referrals yet.</p>}
        {data.referrals.slice(0, 5).map(r => (
          <div key={r.id} style={{ background: '#14141a', border: '1px solid #26262e', borderRadius: 10, padding: 14, fontSize: 14, display: 'flex', justifyContent: 'space-between' }}>
            <div><span style={{ color: '#d4a853' }}>{r.owner_name}</span> → <span style={{ color: '#8e8a7d' }}>{r.partner_broker || 'no partner yet'}</span></div>
            <div style={{ color: r.status === 'closed' ? '#d4a853' : '#8e8a7d', fontSize: 12 }}>{r.status}</div>
          </div>
        ))}
      </div>
    </main>
  );
}

function Stat({ n, label }) {
  return (
    <div style={{ padding: 20, borderRight: '1px solid #26262e', textAlign: 'center' }}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: '#d4a853', fontWeight: 300 }}>{n}</div>
      <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#8e8a7d', marginTop: 4 }}>{label}</div>
    </div>
  );
}
