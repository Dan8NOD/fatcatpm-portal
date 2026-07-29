'use client';
// ponytail: weekly report upload — auto-calculates totals
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { sb } from '../../../../lib/supabase';
import { adminApi } from '../../../../lib/admin';

export default function UploadReport() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [form, setForm] = useState({
    week_of: getMonday(new Date()),
    rent_in: '',
    expenses: '',
    occupancy_pct: '',
    notes: '',
    work_orders: '',
  });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    sb.auth.getSession().then(async ({ data }) => {
      if (!data.session) { location.href = '/'; return; }
      const r = await adminApi('list_all_properties', {});
      if (r.error === 'unauthorized') { location.href = '/'; return; }
      const prop = (r.data || []).find(p => String(p.id) === String(id));
      if (!prop) { location.href = '/admin'; return; }
      setProperty(prop);
    });
  }, [id]);

  async function submit(e) {
    e.preventDefault();
    setMsg('Saving…');
    const rentIn = parseFloat(form.rent_in) || 0;
    const rentOut = parseFloat(form.expenses) || 0;
    const net = rentIn - rentOut;
    const r = await adminApi('create_report', {
      property_id: parseInt(id),
      week_of: form.week_of,
      body: {
        notes: form.notes,
        work_orders: form.work_orders.split('\n').map(s => s.trim()).filter(Boolean),
      },
      totals: {
        rent_in: rentIn,
        rent_out: rentOut,
        net,
        occupancy_pct: parseInt(form.occupancy_pct) || 0,
      },
    });
    if (r.error) setMsg('Error: ' + r.error.message);
    else setMsg('✓ Report saved. Email owner at ' + property?.owner_email + '?');
  }

  return (
    <main style={{ maxWidth: 700, margin: '0 auto', padding: 24, color: '#f4f1ea', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <a href="/admin" style={{ color: '#d4a853', fontSize: 13, textDecoration: 'none' }}>← Admin</a>

      <div style={{ borderBottom: '1px solid #26262e', paddingBottom: 16, marginTop: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#d4a853' }}>Weekly Report</div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontWeight: 300, fontSize: 28, margin: 0 }}>{property?.address || 'Loading…'}</h1>
        <div style={{ color: '#8e8a7d', fontSize: 13, marginTop: 4 }}>Owner: {property?.owner_email}</div>
      </div>

      <form onSubmit={submit} style={{ display: 'grid', gap: 12, marginTop: 24 }}>
        <Field label="Week of (Monday)" req>
          <input required type="date" value={form.week_of} onChange={e => setForm({ ...form, week_of: e.target.value })} style={inputStyle} />
        </Field>
        <Field label="Rent collected ($)">
          <input type="number" value={form.rent_in} onChange={e => setForm({ ...form, rent_in: e.target.value })} style={inputStyle} placeholder="2400" />
        </Field>
        <Field label="Expenses paid ($)">
          <input type="number" value={form.expenses} onChange={e => setForm({ ...form, expenses: e.target.value })} style={inputStyle} placeholder="150" />
        </Field>
        <Field label="Occupancy (%)">
          <input type="number" min="0" max="100" value={form.occupancy_pct} onChange={e => setForm({ ...form, occupancy_pct: e.target.value })} style={inputStyle} placeholder="100" />
        </Field>
        <Field label="Work orders (one per line)">
          <textarea rows={3} value={form.work_orders} onChange={e => setForm({ ...form, work_orders: e.target.value })}
            style={{ ...inputStyle, fontFamily: 'Inter, system-ui, sans-serif', resize: 'vertical' }}
            placeholder="HVAC tune-up scheduled Tuesday" />
        </Field>
        <Field label="Owner-facing notes">
          <textarea rows={4} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
            style={{ ...inputStyle, fontFamily: 'Inter, system-ui, sans-serif', resize: 'vertical' }}
            placeholder="What the owner needs to know this week…" />
        </Field>
        <button type="submit" style={{ ...inputStyle, background: '#d4a853', color: '#0a0a0c', fontWeight: 600, letterSpacing: 1, cursor: 'pointer', textTransform: 'uppercase' }}>
          Save Report
        </button>
        {msg && <div style={{ color: msg.startsWith('Error') ? '#e57373' : '#d4a853', fontSize: 13 }}>{msg}</div>}
      </form>
    </main>
  );
}

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return date.toISOString().split('T')[0];
}

const inputStyle = { padding: 12, background: '#14141a', border: '1px solid #26262e', color: '#f4f1ea', borderRadius: 6, fontSize: 15, fontFamily: 'Inter, system-ui, sans-serif', width: '100%' };

function Field({ label, children, req }) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#8e8a7d' }}>{label}{req && ' *'}</span>
      {children}
    </label>
  );
}
