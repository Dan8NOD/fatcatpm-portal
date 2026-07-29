// ponytail: shared admin helpers — auth + API call
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export async function getAdminSession() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return null;
  // ponytail: check admin_emails via service key (use api route instead — see adminApi())
  return session;
}

export async function adminApi(action, payload) {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) throw new Error('not authenticated');
  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.access_token },
    body: JSON.stringify({ action, payload })
  });
  return res.json();
}
