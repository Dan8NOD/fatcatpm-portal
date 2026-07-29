'use client';
// ponytail: magic-link auth — no passwords to manage
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function Login() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  async function send(e) {
    e.preventDefault();
    setMsg('Sending…');
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + '/portal' } });
    setMsg(error ? 'Error: ' + error.message : '✓ Check your email for the login link.');
  }
  return (
    <main style={{ maxWidth: 400, margin: '15vh auto', padding: 24 }}>
      <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#d4a853', marginBottom: 8 }}>FatCat PM</div>
      <h1 style={{ fontFamily: 'Georgia, serif', fontWeight: 300, fontSize: 32 }}>Owner Portal</h1>
      <p style={{ color: '#8e8a7d', fontSize: 14 }}>Enter your email — we'll send a sign-in link. No password to remember.</p>
      <form onSubmit={send} style={{ display: 'grid', gap: 12, marginTop: 24 }}>
        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com"
          style={{ padding: 12, background: '#14141a', border: '1px solid #26262e', color: '#f4f1ea', borderRadius: 6, fontSize: 16 }} />
        <button style={{ padding: 14, background: '#d4a853', color: '#0a0a0c', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
          Send Login Link
        </button>
        <div style={{ fontSize: 13, color: '#8e8a7d', textAlign: 'center' }}>{msg}</div>
      </form>
    </main>
  );
}
