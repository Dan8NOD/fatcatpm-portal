// ponytail: admin API — uses service role key, validates caller is admin
import { createClient } from '@supabase/supabase-js';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

async function isAdmin(token) {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: 'Bearer ' + token } } }
  );
  const { data: { user } } = await sb.auth.getUser(token);
  if (!user) return null;
  const { data } = await adminClient()
    .from('admin_emails').select('email').eq('email', user.email).maybeSingle();
  return data ? user : null;
}

export async function POST(request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  const user = await isAdmin(token);
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const body = await request.json();
  const { action, payload } = body;
  const sb = adminClient();

  // ponytail: action switch — single endpoint, one-line per action
  if (action === 'create_property') {
    const { data, error } = await sb.from('properties').insert(payload).select();
    return Response.json({ data, error });
  }
  if (action === 'update_property') {
    const { id, ...rest } = payload;
    const { data, error } = await sb.from('properties').update(rest).eq('id', id).select();
    return Response.json({ data, error });
  }
  if (action === 'create_report') {
    const { data, error } = await sb.from('reports').insert(payload).select();
    return Response.json({ data, error });
  }
  if (action === 'create_referral') {
    const { data, error } = await sb.from('referrals').insert(payload).select();
    return Response.json({ data, error });
  }
  if (action === 'update_referral') {
    const { id, ...rest } = payload;
    const { data, error } = await sb.from('referrals').update(rest).eq('id', id).select();
    return Response.json({ data, error });
  }
  if (action === 'list_all_properties') {
    const { data, error } = await sb.from('properties').select('*').order('created_at', { ascending: false });
    return Response.json({ data, error });
  }
  if (action === 'list_all_referrals') {
    const { data, error } = await sb.from('referrals').select('*').order('created_at', { ascending: false });
    return Response.json({ data, error });
  }
  if (action === 'list_reports_for_property') {
    const { property_id } = payload;
    const { data, error } = await sb.from('reports').select('*').eq('property_id', property_id).order('week_of', { ascending: false });
    return Response.json({ data, error });
  }
  return Response.json({ error: 'unknown action' }, { status: 400 });
}
