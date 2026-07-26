// ponytail: Supabase DB webhook → Resend. Set RESEND_API_KEY + NOTIFY_EMAIL in Vercel env.
export async function POST(request) {
  const secret = request.headers.get('x-webhook-secret');
  if (secret !== process.env.WEBHOOK_SECRET) return Response.json({ ok: false }, { status: 401 });

  const { record } = await request.json();
  const lines = Object.entries(record || {})
    .filter(([k]) => !['id', 'created_at'].includes(k))
    .map(([k, v]) => `${k}: ${v}`).join('\n');

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'FatCat PM <portal@fatcatpm.com>',
      to: process.env.NOTIFY_EMAIL,
      subject: `New intake: ${record?.address || record?.property_address || 'submission'}`,
      text: lines,
    }),
  });
  return Response.json({ ok: r.ok });
}
