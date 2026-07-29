'use client';
// ponytail: owner dashboard — reads their properties + latest statement via RLS
import { useEffect, useState } from 'react';
import { sb } from '../../lib/supabase';

export default function Portal() {
  const [session, setSession] = useState(null);
  const [props, setProps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) { location.href = '/'; return; }
      sb.from('properties').select('*').then(({ data: rows }) => { setProps(rows || []); setLoading(false); });
    });
  }, []);

  if (loading) return <main style={{ padding: 48, textAlign: 'center', color: '#8e8a7d' }}>Loading…</main>;

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #26262e', paddingBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#d4a853' }}>FatCat PM</div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontWeight: 300, fontSize: 28, margin: 0 }}>Your Properties</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/portal/tickets" style={{ color: '#8e8a7d', padding: '8px 14px', border: '1px solid #26262e', borderRadius: 6, textDecoration: 'none', fontSize: 12 }}>Tickets</a>
          <button onClick={() => { sb.auth.signOut(); location.href = '/'; }}
            style={{ background: 'none', border: '1px solid #26262e', color: '#8e8a7d', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>
            Sign out
          </button>
        </div>
      </div>
      {props.length === 0 && (
        <p style={{ color: '#8e8a7d', marginTop: 32 }}>No properties linked to {session?.user?.email} yet — contact FatCat PM to get connected.</p>
      )}
      <div style={{ display: 'grid', gap: 16, marginTop: 24 }}>
        {props.map(p => (
          <div key={p.id} style={{ background: '#14141a', border: '1px solid #26262e', borderRadius: 10, padding: 20 }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#d4a853' }}>{p.address}</div>
            <div style={{ color: '#8e8a7d', fontSize: 14, marginTop: 4 }}>
              {p.units_count} unit{p.units_count === 1 ? '' : 's'} · Rent: ${p.monthly_rent ?? '—'}/mo · Status: {p.status ?? 'active'}
            </div>
            <a href={`/portal/reports/${p.id}`} style={{ display: 'inline-block', marginTop: 12, color: '#d4a853', fontSize: 13, textDecoration: 'none' }}>
              View weekly reports →
            </a>
          </div>
        ))}
      </div>
    </main>
  );
}
