// ponytail: small fetch helpers for statement aggregation
import { sb } from './supabase';

export async function fetchStatement(propertyId, year) {
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  const [prop, reports] = await Promise.all([
    sb.from('properties').select('*').eq('id', propertyId).maybeSingle(),
    sb.from('reports').select('*').eq('property_id', propertyId)
      .gte('week_of', start).lte('week_of', end)
      .order('week_of', { ascending: true }),
  ]);
  if (!prop.data) return null;
  const totals = aggregate(reports.data || []);
  return { property: prop.data, reports: reports.data || [], totals, year };
}

function aggregate(reports) {
  const t = { rent_in: 0, rent_out: 0, net: 0, weeks: 0, avg_occupancy: 0, work_orders: 0 };
  for (const r of reports) {
    if (r.totals) {
      t.rent_in += r.totals.rent_in || 0;
      t.rent_out += r.totals.rent_out || 0;
      t.net += r.totals.net || 0;
      t.avg_occupancy += r.totals.occupancy_pct || 0;
    }
    if (r.body?.work_orders) t.work_orders += r.body.work_orders.length;
    t.weeks++;
  }
  if (t.weeks) t.avg_occupancy = Math.round(t.avg_occupancy / t.weeks);
  return t;
}
