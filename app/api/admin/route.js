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
  // ponytail: tickets admin actions — single switch, append when needed
  if (action === 'list_all_tickets') {
    const { data, error } = await sb.from('tickets').select('*, properties(address, owner_email)').order('created_at', { ascending: false });
    return Response.json({ data, error });
  }
  if (action === 'update_ticket_status') {
    const { id, status } = payload;
    const update = { status };
    if (status === 'resolved') update.resolved_at = new Date().toISOString();
    const { data, error } = await sb.from('tickets').update(update).eq('id', id).select();
    return Response.json({ data, error });
  }
  if (action === 'delete_ticket') {
    const { id } = payload;
    const { error } = await sb.from('tickets').delete().eq('id', id);
    return Response.json({ error });
  }
  // ponytail: monthly revenue ledger (admin-only)
  if (action === 'save_monthly_ledger') {
    const { month, revenue, expenses } = payload;
    const rev = await sb.from('revenue_entries').upsert(
      revenue.map(r => ({ ...r, month })), { onConflict: 'month,vertical' }
    );
    if (rev.error) return Response.json({ error: rev.error });
    const exp = await sb.from('expense_entries').upsert(
      expenses.map(e => ({ ...e, month })), { onConflict: 'month,category' }
    );
    if (exp.error) return Response.json({ error: exp.error });
    return Response.json({ ok: true });
  }
  if (action === 'list_revenue_for_month') {
    const { month } = payload;
    const { data, error } = await sb.from('revenue_entries').select('*').eq('month', month);
    return Response.json({ data, error });
  }
  if (action === 'list_expenses_for_month') {
    const { month } = payload;
    const { data, error } = await sb.from('expense_entries').select('*').eq('month', month);
    return Response.json({ data, error });
  }
  if (action === 'list_revenue_history') {
    const { data, error } = await sb.from('revenue_entries').select('month, amount');
    if (error) return Response.json({ error });
    const { data: expData, error: expErr } = await sb.from('expense_entries').select('month, amount');
    if (expErr) return Response.json({ error: expErr });
    const byMonth = {};
    for (const r of data || []) byMonth[r.month] = { month: r.month, revenue: 0, expenses: 0 };
    for (const e of expData || []) byMonth[e.month] = { month: e.month, revenue: 0, expenses: 0, ...byMonth[e.month] };
    for (const r of data || []) byMonth[r.month].revenue += Number(r.amount);
    for (const e of expData || []) byMonth[e.month].expenses += Number(e.amount);
    const out = Object.values(byMonth).map(m => ({ ...m, net: m.revenue - m.expenses })).sort((a, b) => b.month.localeCompare(a.month));
    return Response.json({ data: out });
  }
  return Response.json({ error: 'unknown action' }, { status: 400 });
}
