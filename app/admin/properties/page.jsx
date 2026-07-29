'use client';
// ponytail: admin add property form + inline notes editor
import { useEffect, useState } from 'react';
import { sb } from '../../../lib/supabase';
import { adminApi } from '../../../lib/admin';

export default function NewProperty() {
  const [session, setSession] = useState(null);
  const [props, setProps] = useState([]);
  const [form, setForm] = useState({ owner_email: '', address: '', units: 1, monthly_rent: '', status: 'active', notes: '' });
  const [msg, setMsg] = useState('');
  const [editingNotes, setEditingNotes] = useState(null);  // { id, notes }

  async function load() {
    const r = await adminApi('list_all_properties', {});
    if (r.error === 'unauthorized') { location.href = '/'; return; }
    setProps(r.data || []);
  }

  useEffect(() => {
    sb.auth.getSession().then(async ({ data }) => {
      if (!data.session) { location.href = '/'; return; }
      setSession(data.session);
      load();
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
      setForm({ owner_email: '', address: '', units: 1, monthly_rent: '', status: 'active', notes: '' });
    }
  }

  async function saveNotes() {
    if (!editingNotes) return;
    const r = await adminApi('update_property', { id: editingNotes.id, notes: editingNotes.notes });
    if (r.error) { alert('Error: ' + r.error.message); return; }
    setEditingNotes(null);
    load();
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
        <Field label="Admin notes (handyman codes, lockbox combo, etc.)">
          <textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
            style={{ ...inputStyle, fontFamily: 'Inter, system-ui, sans-serif', resize: 'vertical' }}
            placeholder="Lockbox 4477, basement key under mat…" />
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div>
                <span style={{ color: '#d4a853' }}>{p.address}</span> · {p.owner_email} · ${p.monthly_rent ?? '—'}/mo
              </div>
              <button onClick={() => setEditingNotes({ id: p.id, notes: p.notes || '' })}
                style={{ background: 'none', border: '1px solid #26262e', color: '#8e8a7d', padding: '4px 10px', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}>
                Notes
              </button>
            </div>
            {p.notes && !editingNotes && (
              <div style={{ color: '#8e8a7d', fontSize: 12, marginTop: 6, whiteSpace: 'pre-wrap' }}>{p.notes}</div>
            )}
          </div>
        ))}
      </div>

      {/* Notes editor modal */}
      {editingNotes && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#14141a', border: '1px solid #26262e', borderRadius: 10, padding: 24, maxWidth: 600, width: '100%' }}>
            <h3 style={{ fontFamily: 'Georgia, serif', fontWeight: 300, fontSize: 20, margin: '0 0 12px' }}>Admin Notes</h3>
            <p style={{ color: '#8e8a7d', fontSize: 12, marginBottom: 12 }}>Owner never sees this. Lockbox codes, handyman access, key locations.</p>
            <textarea autoFocus rows={8} value={editingNotes.notes}
              onChange={e => setEditingNotes({ ...editingNotes, notes: e.target.value })}
              style={{ ...inputStyle, fontFamily: 'Inter, system-ui, sans-serif', resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={saveNotes} style={{ ...inputStyle, background: '#d4a853', color: '#0a0a0c', fontWeight: 600, letterSpacing: 1, cursor: 'pointer', textTransform: 'uppercase' }}>Save</button>
              <button onClick={() => setEditingNotes(null)} style={{ ...inputStyle, background: 'transparent', border: '1px solid #26262e', color: '#8e8a7d', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
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
