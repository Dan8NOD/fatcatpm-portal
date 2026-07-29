'use client';
// ponytail: owner views reports for ONE property. RLS scopes them to their email.
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const C = { bg: '#0a0a0c', panel: '#14141a', line: '#26262e', text: '#f4f1ea', muted: '#8e8a7d', gold: '#d4a853' };

export default function ReportsPage() {
  const { id } = useParams();
  const [reports, setReports] = useState([]);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sb.auth.getSession().then(async ({ data }) => {
      if (!data.session) { location.href = '/'; return; }
      const [propRes, repRes] = await Promise.all([
        sb.from('properties').select('*').eq('id', id).maybeSingle(),
        sb.from('reports').select('*').eq('property_id', id).order('week_of', { ascending: false })
      ]);
      setProperty(propRes.data);
      setReports(repRes.data || []);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <main style={{ padding: 48, color: C.muted, textAlign: 'center' }}>Loading…</main>;
  if (!property) return <main style={{ padding: 48, color: C.muted, textAlign: 'center' }}>Property not found.</main>;

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: 24, color: C.text, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.line}`, paddingBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: C.gold }}>FatCat PM</div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontWeight: 300, fontSize: 28, margin: 0 }}>{property.address}</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>{property.units} unit{property.units === 1 ? '' : 's'} · ${property.monthly_rent ?? '—'}/mo</div>
        </div>
        <button onClick={() => sb.auth.signOut().then(() => location.href = '/')}
          style={{ background: 'none', border: `1px solid ${C.line}`, color: C.muted, padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
          Sign out
        </button>
      </div>

      <div style={{ marginTop: 24 }}>
        <a href="/portal" style={{ color: C.gold, fontSize: 13, textDecoration: 'none' }}>← Back to properties</a>
      </div>

      <h2 style={{ fontFamily: 'Georgia, serif', fontWeight: 300, fontSize: 22, marginTop: 24, marginBottom: 16 }}>Weekly Reports</h2>

      {reports.length === 0 ? (
        <p style={{ color: C.muted }}>No reports yet — Dan will post weekly updates here.</p>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {reports.map(r => (
            <div key={r.id} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: C.gold }}>Week of {r.week_of}</div>
                {r.totals?.net !== undefined && (
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: r.totals.net >= 0 ? C.gold : '#e57373' }}>
                    ${r.totals.net.toLocaleString()}
                  </div>
                )}
              </div>
              {r.totals && (
                <div style={{ display: 'flex', gap: 24, padding: '12px 0', borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, marginBottom: 12, fontSize: 13 }}>
                  <div><span style={{ color: C.muted }}>Rent in: </span><span style={{ color: C.gold }}>${r.totals.rent_in || 0}</span></div>
                  <div><span style={{ color: C.muted }}>Expenses: </span><span style={{ color: '#e57373' }}>${r.totals.rent_out || 0}</span></div>
                  <div><span style={{ color: C.muted }}>Occupancy: </span><span>{r.totals.occupancy_pct || 0}%</span></div>
                </div>
              )}
              {r.body?.notes && <p style={{ color: C.text, fontSize: 14, lineHeight: 1.6, margin: '12px 0' }}>{r.body.notes}</p>}
              {r.body?.work_orders && r.body.work_orders.length > 0 && (
                <details style={{ marginTop: 8 }}>
                  <summary style={{ color: C.muted, fontSize: 12, cursor: 'pointer', letterSpacing: 1 }}>{r.body.work_orders.length} work order{r.body.work_orders.length === 1 ? '' : 's'}</summary>
                  <ul style={{ marginTop: 8, paddingLeft: 20, color: C.muted, fontSize: 13 }}>
                    {r.body.work_orders.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
