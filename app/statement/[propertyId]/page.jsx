'use client';
// ponytail: annual owner statement — print-friendly HTML, user hits Cmd+P → Save as PDF
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { fetchStatement } from '../../../lib/statement';

export default function Statement() {
  const { propertyId } = useParams();
  const search = useSearchParams();
  const year = parseInt(search.get('year')) || new Date().getFullYear();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatement(propertyId, year).then(d => { setData(d); setLoading(false); });
  }, [propertyId, year]);

  if (loading) return <main style={{ padding: 48, textAlign: 'center', color: '#666' }}>Loading…</main>;
  if (!data) return <main style={{ padding: 48, textAlign: 'center', color: '#666' }}>Property not found.</main>;

  const { property, reports, totals } = data;
  const generated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <main style={{ maxWidth: 920, margin: '0 auto', padding: 32, fontFamily: 'Georgia, "Times New Roman", serif', color: '#000', background: '#fff' }}>
      {/* ponytail: screen-only controls — hidden in print */}
      <div className="no-print" style={{ marginBottom: 24, padding: 12, background: '#f5f0e6', border: '1px solid #d4cdb8', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontSize: 14, color: '#333' }}>Annual statement · {property.address}, {year}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={year} onChange={e => location.search = '?year=' + e.target.value}
            style={{ padding: 6, fontSize: 13, border: '1px solid #d4cdb8', borderRadius: 4 }}>
            {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => window.print()}
            style={{ padding: '8px 16px', background: '#9a7d2e', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            🖨 Save as PDF
          </button>
        </div>
      </div>

      {/* header */}
      <header style={{ borderBottom: '2px solid #000', paddingBottom: 16, marginBottom: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#9a7d2e', marginBottom: 4 }}>FatCat Property Management</div>
        <h1 style={{ fontWeight: 300, fontSize: 32, margin: 0 }}>Annual Owner Statement</h1>
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 13 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#666' }}>Property</div>
            <div style={{ fontWeight: 600 }}>{property.address}</div>
            <div style={{ color: '#666' }}>{property.units} unit{property.units === 1 ? '' : 's'} · ${property.monthly_rent?.toLocaleString() || '—'}/mo</div>
          </div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#666' }}>Owner</div>
            <div style={{ fontWeight: 600 }}>{property.owner_email}</div>
            <div style={{ color: '#666' }}>Reporting period: {year}</div>
          </div>
        </div>
      </header>

      {/* summary */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontWeight: 400, fontSize: 18, marginBottom: 16, paddingBottom: 6, borderBottom: '1px solid #000' }}>Year summary</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, border: '1px solid #000' }}>
          <Cell label="Rent collected" value={`$${totals.rent_in.toLocaleString()}`} />
          <Cell label="Expenses" value={`$${totals.rent_out.toLocaleString()}`} />
          <Cell label="Net to owner" value={`$${totals.net.toLocaleString()}`} bold net={totals.net >= 0 ? 'pos' : 'neg'} />
          <Cell label="Avg occupancy" value={`${totals.avg_occupancy}%`} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: '#666' }}>
          <span>Reports filed: {totals.weeks}</span>
          <span>Work orders logged: {totals.work_orders}</span>
        </div>
      </section>

      {/* weekly detail */}
      <section>
        <h2 style={{ fontWeight: 400, fontSize: 18, marginBottom: 16, paddingBottom: 6, borderBottom: '1px solid #000' }}>Weekly detail</h2>
        {reports.length === 0 ? (
          <p style={{ color: '#666', fontSize: 13 }}>No reports filed for {year}.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #000' }}>
                <th style={{ textAlign: 'left', padding: 8, fontWeight: 600 }}>Week of</th>
                <th style={{ textAlign: 'right', padding: 8, fontWeight: 600 }}>Rent in</th>
                <th style={{ textAlign: 'right', padding: 8, fontWeight: 600 }}>Expenses</th>
                <th style={{ textAlign: 'right', padding: 8, fontWeight: 600 }}>Net</th>
                <th style={{ textAlign: 'right', padding: 8, fontWeight: 600 }}>Occupancy</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: 8 }}>{r.week_of}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>${r.totals?.rent_in || 0}</td>
                  <td style={{ padding: 8, textAlign: 'right', color: '#a00' }}>${r.totals?.rent_out || 0}</td>
                  <td style={{ padding: 8, textAlign: 'right', fontWeight: 600, color: (r.totals?.net >= 0) ? '#006a3a' : '#a00' }}>${r.totals?.net || 0}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{r.totals?.occupancy_pct || 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* footer */}
      <footer style={{ marginTop: 48, paddingTop: 16, borderTop: '1px solid #000', fontSize: 11, color: '#666', display: 'flex', justifyContent: 'space-between' }}>
        <span>FatCat PM · dancruzhomes@gmail.com</span>
        <span>Generated {generated}</span>
      </footer>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          main { padding: 0; max-width: 100%; }
          body { background: #fff; }
          section { page-break-inside: avoid; }
          thead { display: table-header-group; }
        }
      `}</style>
    </main>
  );
}

function Cell({ label, value, bold, net }) {
  let color = '#000';
  if (net === 'pos') color = '#006a3a';
  if (net === 'neg') color = '#a00';
  return (
    <div style={{ padding: 14, borderRight: '1px solid #000' }}>
      <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#666' }}>{label}</div>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: bold ? 700 : 400, color, marginTop: 4 }}>{value}</div>
    </div>
  );
}
