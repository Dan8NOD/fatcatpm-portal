// ponytail: send owner a digest email when a new report is posted
// Body: { owner_email, property_address, week_of, net, notes, photos_count }
// Env: RESEND_API_KEY, NOTIFY_FROM (e.g. "FatCat PM <portal@fatcatpm.com>")
export async function POST(request) {
  const { owner_email, property_address, week_of, net, notes, photos_count } = await request.json();
  if (!owner_email || !process.env.RESEND_API_KEY) {
    return Response.json({ ok: false, reason: 'missing config' }, { status: 200 });
  }
  const netLine = net !== undefined
    ? `<p style="font-size:18px;color:#d4a853;margin:16px 0"><strong>Net this week: $${net.toLocaleString()}</strong></p>`
    : '';
  const notesLine = notes ? `<p style="color:#444;line-height:1.6">${notes}</p>` : '';
  const photoLine = photos_count > 0 ? `<p style="color:#888;font-size:13px">${photos_count} photo${photos_count === 1 ? '' : 's'} attached — view in portal.</p>` : '';

  const html = `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:24px;background:#f5f0e6;color:#1a1a1a">
      <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#9a7d2e;margin-bottom:8px">FatCat PM</div>
      <h1 style="font-weight:300;font-size:28px;margin:0 0 12px">Weekly Update: ${property_address || 'your property'}</h1>
      <p style="color:#666;margin:0 0 8px">Week of ${week_of}</p>
      ${netLine}
      ${notesLine}
      ${photoLine}
      <p style="margin-top:24px"><a href="${process.env.PORTAL_URL || 'https://portal-fatcatpm.vercel.app'}/portal" style="display:inline-block;padding:12px 24px;background:#9a7d2e;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">View Full Report →</a></p>
      <p style="color:#888;font-size:12px;margin-top:24px">You're receiving this because you own a property managed by FatCat PM. <a href="${process.env.PORTAL_URL || 'https://portal-fatcatpm.vercel.app'}" style="color:#9a7d2e">Manage notifications</a></p>
    </div>`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.NOTIFY_FROM || 'FatCat PM <portal@fatcatpm.com>',
      to: owner_email,
      subject: `Weekly update — ${property_address || 'your property'} · ${week_of}`,
      html,
    }),
  });
  return Response.json({ ok: r.ok });
}
