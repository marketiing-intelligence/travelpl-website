export const prerender = false;
import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { randomBytes } from 'node:crypto';
import { readAccount, writeAccount, sha256 } from '../../../lib/account';

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });
const resend = new Resend(process.env.RESEND_API_KEY ?? import.meta.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request, url }) => {
  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? '').trim().toLowerCase();
  const account = await readAccount();

  // Nie ujawniamy, czy email pasuje — zawsze zwracamy ok.
  if (account?.email && account.email.toLowerCase() === email) {
    const token = randomBytes(32).toString('hex');
    account.resetTokenHash = sha256(token);
    account.resetTokenExp = Date.now() + 60 * 60 * 1000; // 1 godzina
    await writeAccount(account);
    const link = `${url.origin}/admin/reset?token=${token}`;
    try {
      await resend.emails.send({
        from: 'TravelPL <kontakt@travelpl-wieruszow.pl>',
        to: [account.email],
        subject: 'Reset hasła do panelu TravelPL',
        html: `<p>Otrzymaliśmy prośbę o reset hasła do panelu TravelPL.</p>
<p>Aby ustawić nowe hasło, kliknij poniższy link (ważny 1 godzinę):</p>
<p><a href="${link}">${link}</a></p>
<p>Jeśli to nie Ty prosiłeś o reset — zignoruj tę wiadomość, hasło pozostanie bez zmian.</p>`,
      });
    } catch (e) {
      console.error('reset email error', e);
    }
  }

  return json({ ok: true });
};
