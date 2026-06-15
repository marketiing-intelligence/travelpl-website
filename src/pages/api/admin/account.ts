export const prerender = false;
import type { APIRoute } from 'astro';
import {
  readAccount,
  writeAccount,
  hashPassword,
  newSalt,
  checkLoginPassword,
  bootstrapPassword,
  type Account,
} from '../../../lib/account';

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });
const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? '').trim();
  const currentPassword = String(body?.currentPassword ?? '');
  const newPassword = String(body?.newPassword ?? '');

  if (!isEmail(email)) return json({ error: 'Podaj poprawny adres email.' }, 400);
  if (!(await checkLoginPassword(currentPassword))) return json({ error: 'Błędne aktualne hasło.' }, 401);
  if (newPassword && newPassword.length < 8) return json({ error: 'Nowe hasło musi mieć min. 8 znaków.' }, 400);

  const existing = await readAccount();
  let salt = existing?.salt ?? newSalt();
  let passwordHash = existing?.passwordHash ?? '';
  if (newPassword) {
    salt = newSalt();
    passwordHash = await hashPassword(newPassword, salt);
  } else if (!passwordHash) {
    // pierwszy zapis konta bez zmiany hasła → zaszyj obecne (bootstrap) hasło
    passwordHash = await hashPassword(bootstrapPassword(), salt);
  }

  const acc: Account = { email, salt, passwordHash };
  // zachowaj ewentualny aktywny token resetu? Nie — zmiana z panelu unieważnia stare tokeny.
  await writeAccount(acc);
  return json({ ok: true });
};
