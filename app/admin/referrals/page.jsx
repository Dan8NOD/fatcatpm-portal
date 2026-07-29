'use client';
// ponytail: out-of-state referral pipeline — admin only
import { useEffect, useState } from 'react';
import { sb } from '../../../lib/supabase';
import { adminApi } from '../../../lib/admin';

export default function Referrals() {
  const [refs, setRefs] = useState([]);
  const [form, setForm] = useState({ owner_name: '', owner_email: '', state: '', partner_broker: '', partner_email: '', property_address: '', estimated_value: '', notes: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    sb.auth.getSession().then(async ({ data }) => {
      if (!data.session) { location.href = '/'; return; }
      const r = await adminApi('list_all_referrals', {});
      if (r.error === 'unauthorized') { location.href = '/'; return; }
      setRefs(r.data || []);
    });
  }, []);

  async function submit(e) {
    e.preventDefault();
    setMsg('Saving…');
    const r = await adminApi('create_referral', {
      ...form,
      estimated_value: form.estimated_value ? parseFloat(form.estimated_value) : null,
    });
    if (r.error) setMsg('Error: ' + r.error.message);
    else {
      setMsg('✓ Saved');
      setRefs([r.data[0], ...refs]);
      setForm({ owner_name: '', owner_email: '', state: '', partner_broker: '', partner_email: '', property_address: '', estimated_value: '', notes: '' });
    }
  }

  async function setStatus(id, status) {
    await adminApi('update_referral', { id, status });
    const r = await adminApi('list_all_referrals', {});
    setRefs(r.data || []);
  }

  const statusColor = (s) => s === 'closed' ? '#d4a853' : s === 'accepted' ? '#7ec8a0' : '#8e8a7d';

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 24, color: '#f4f1ea', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <a href="/admin" style={{ color: '#d4a853', fontSize: 13, textDecoration: 'none' }}>← Admin</a>
      <div style={{ borderBottom: '1px solid #26262e', paddingBottom: 16, marginTop: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#d4a853' }}>Out-of-State Referrals</div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontWeight: 300, fontSize: 28, margin: 0 }}>Partner Pipeline</h1>
      </div>

      <h2 style={{ fontFamily: 'Georgia, serif', fontWeight: 300, fontSize: 18, marginTop: 24, marginBottom: 12 }}>Add Referral</h2>
      <form onSubmit={submit} style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <input required value={form.owner_name} onChange={e => setForm({ ...form, owner_name: e.target.value })} style={inputStyle} placeholder="Owner name" />
        <input required type="email" value={form.owner_email} onChange={e => setForm({ ...form, owner_email: e.target.value })} style={inputStyle} placeholder="Owner email" />
        <input required value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} style={inputStyle} placeholder="State (TX, FL, etc.)" />
        <input value={form.partner_broker} onChange={e => setForm({ ...form, partner_broker: e.target.value })} style={inputStyle} placeholder="Partner broker" />
        <input type="email" value={form.partner_email} onChange={e => setForm({ ...form, partner_email: e.target.value })} style={inputStyle} placeholder="Partner email" />
        <input value={form.property_address} onChange={e => setForm({ ...form, property_address: e.target.value })} style={inputStyle} placeholder="Property address" />
        <input type="number" value={form.estimated_value} onChange={e => setForm({ ...form, estimated_value: e.target.value })} style={inputStyle} placeholder="Est. value $" />
        <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={inputStyle} placeholder="Notes" />
        <button type="submit" style={{ ...inputStyle, background: '#d4a853', color: '#0a0a0c', fontWeight: 600, letterSpacing: 1, cursor: 'pointer', textTransform: 'uppercase' }}>+ Add</button>
        {msg && <div style={{ gridColumn: '1/-1', color: msg.startsWith('Error') ? '#e57373' : '#d4a853', fontSize: 13 }}>{msg}</div>}
      </form>

      <h2 style={{ fontFamily: 'Georgia, serif', fontWeight: 300, fontSize: 18, marginTop: 32, marginBottom: 12 }}>Pipeline ({refs.length})</h2>
      <div style={{ display: 'grid', gap: 8 }}>
        {refs.length === 0 && <p style={{ color: '#8e8a7d' }}>No referrals yet.</p>}
        {refs.map(r => (
          <div key={r.id} style={{ background: '#14141a', border: '1px solid #26262e', borderRadius: 8, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <div>
                <span style={{ color: '#d4a853', fontSize: 16 }}>{r.owner_name}</span>
                <span style={{ color: '#8e8a7d', fontSize: 13, marginLeft: 8 }}>({r.state}) → {r.partner_broker || 'unassigned'}</span>
              </div>
              <div style={{ color: statusColor(r.status), fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>{r.status}</div>
            </div>
            {r.property_address && <div style={{ color: '#8e8a7d', fontSize: 13 }}>{r.property_address} {r.estimated_value && `· ~$${parseInt(r.estimated_value).toLocaleString()}`}</div>}
            {r.notes && <div style={{ color: '#f4f1ea', fontSize: 13, marginTop: 6 }}>{r.notes}</div>}
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              {['pending', 'sent', 'accepted', 'closed'].map(s => (
                <button key={s} onClick={() => setStatus(r.id, s)}
                  style={{ padding: '4px 10px', background: r.status === s ? '#d4a853' : 'transparent', color: r.status === s ? '#0a0a0c' : '#8e8a7d', border: '1px solid ' + (r.status === s ? '#d4a853' : '#26262e'), borderRadius: 4, cursor: 'pointer', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

const inputStyle = { padding: 10, background: '#14141a', border: '1px solid #26262e', color: '#f4f1ea', borderRadius: 6, fontSize: 14, fontFamily: 'Inter, system-ui, sans-serif' };
