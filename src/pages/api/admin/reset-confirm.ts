export const prerender = false;
import type { APIRoute } from 'astro';
import { readAccount, writeAccount, hashPassword, newSalt, sha256 } from '../../../lib/account';

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  const token = String(body?.token ?? '');
  const newPassword = String(body?.newPassword ?? '');

  if (newPassword.length < 8) return json({ error: 'Hasło musi mieć min. 8 znaków.' }, 400);

  const account = await readAccount();
  const valid =
    account?.resetTokenHash &&
    account.resetTokenExp &&
    account.resetTokenExp > Date.now() &&
    token &&
    sha256(token) === account.resetTokenHash;

  if (!valid || !account) {
    return json({ error: 'Link jest nieprawidłowy lub wygasł. Poproś o nowy.' }, 400);
  }

  account.salt = newSalt();
  account.passwordHash = await hashPassword(newPassword, account.salt);
  delete account.resetTokenHash;
  delete account.resetTokenExp;
  await writeAccount(account);
  return json({ ok: true });
};
