// Lekki, bezbiblioteczny auth: podpisany token w HttpOnly cookie (HMAC-SHA256 z AUTH_SECRET).
// Jeden wspólny login dla biura — hasło sprawdzane w /api/admin/login.

const enc = new TextEncoder();

async function hmac(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return Buffer.from(new Uint8Array(sig)).toString('base64url');
}

export const COOKIE = 'tpl_admin';
const TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 dni

/** token = "<expMs>.<hmac(expMs)>" */
export async function createToken(secret: string): Promise<string> {
  const exp = String(Date.now() + TTL_MS);
  return `${exp}.${await hmac(exp, secret)}`;
}

export async function verifyToken(token: string | undefined, secret: string): Promise<boolean> {
  if (!token || !secret) return false;
  const idx = token.indexOf('.');
  if (idx < 0) return false;
  const exp = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  const expected = await hmac(exp, secret);
  // porównanie stałoczasowe
  if (sig.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
