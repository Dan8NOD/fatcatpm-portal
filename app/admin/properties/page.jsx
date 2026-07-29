'use client';
// ponytail: admin add property form
import { useEffect, useState } from 'react';
import { sb } from '../../../lib/supabase';
import { adminApi } from '../../../lib/admin';

export default function NewProperty() {
  const [session, setSession] = useState(null);
  const [props, setProps] = useState([]);
  const [form, setForm] = useState({ owner_email: '', address: '', units: 1, monthly_rent: '', status: 'active' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    sb.auth.getSession().then(async ({ data }) => {
      if (!data.session) { location.href = '/'; return; }
      setSession(data.session);
      const r = await adminApi('list_all_properties', {});
      if (r.error === 'unauthorized') { location.href = '/'; return; }
      setProps(r.data || []);
    });
  }, []);

  async function submit(e) {
    e.preventDefault();
    setMsg('Saving…');
    const r = await adminApi('create_property', {
      ...form,
      monthly_rent: form.monthly_rent ? parseFloat(form.monthly_rent) : null,
    });
    if (r.error) setMsg('Error: ' + r.error.message);
    else {
      setMsg('✓ Saved');
      setProps([r.data[0], ...props]);
      setForm({ owner_email: '', address: '', units: 1, monthly_rent: '', status: 'active' });
    }
  }

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: 24, color: '#f4f1ea', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ borderBottom: '1px solid #26262e', paddingBottom: 16 }}>
        <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#d4a853' }}>FatCat PM · Admin</div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontWeight: 300, fontSize: 28, margin: 0 }}>Add Property</h1>
      </div>
      <a href="/admin" style={{ color: '#d4a853', fontSize: 13, textDecoration: 'none', display: 'inline-block', marginTop: 16 }}>← Admin dashboard</a>

      <form onSubmit={submit} style={{ display: 'grid', gap: 12, marginTop: 24 }}>
        <Field label="Owner email (the magic link goes here)" req>
          <input required type="email" value={form.owner_email} onChange={e => setForm({ ...form, owner_email: e.target.value })}
            style={inputStyle} placeholder="owner@example.com" />
        </Field>
        <Field label="Property address" req>
          <input required value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
            style={inputStyle} placeholder="123 Main St, Chicago, IL" />
        </Field>
        <Field label="Units">
          <input type="number" min="1" value={form.units} onChange={e => setForm({ ...form, units: parseInt(e.target.value) || 1 })}
            style={inputStyle} />
        </Field>
        <Field label="Monthly rent ($)">
          <input type="number" value={form.monthly_rent} onChange={e => setForm({ ...form, monthly_rent: e.target.value })}
            style={inputStyle} placeholder="2400" />
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={inputStyle}>
            <option value="active">Active</option>
            <option value="onboarding">Onboarding</option>
            <option value="offboard">Off-boarding</option>
          </select>
        </Field>
        <button type="submit" style={{ ...inputStyle, background: '#d4a853', color: '#0a0a0c', fontWeight: 600, letterSpacing: 1, cursor: 'pointer', textTransform: 'uppercase' }}>
          Add Property
        </button>
        {msg && <div style={{ color: msg.startsWith('Error') ? '#e57373' : '#d4a853', fontSize: 13 }}>{msg}</div>}
      </form>

      <h2 style={{ fontFamily: 'Georgia, serif', fontWeight: 300, fontSize: 20, marginTop: 40, marginBottom: 16 }}>Existing ({props.length})</h2>
      <div style={{ display: 'grid', gap: 8 }}>
        {props.map(p => (
          <div key={p.id} style={{ background: '#14141a', border: '1px solid #26262e', borderRadius: 8, padding: 14, fontSize: 14 }}>
            <span style={{ color: '#d4a853' }}>{p.address}</span> · {p.owner_email} · ${p.monthly_rent ?? '—'}/mo
          </div>
        ))}
      </div>
    </main>
  );
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
