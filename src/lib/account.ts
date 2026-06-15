import { list, put, del } from '@vercel/blob';
import { scrypt as _scrypt, randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(_scrypt) as (pw: string | Buffer, salt: string | Buffer, keylen: number) => Promise<Buffer>;

// Konto admina trzymane w Vercel Blob (wersjonowane, jak trips — silnie spójny odczyt
// po zmianie hasła). Nazwa z mocnym losowym sufiksem → publiczny URL jest niezgadywalny.
// W pliku NIE ma hasła jawnego — tylko hash scrypt + sól. Token resetu też jest hashowany.
const PREFIX = 'account-v-';

export interface Account {
  email: string;
  salt: string;
  passwordHash: string;
  resetTokenHash?: string;
  resetTokenExp?: number; // ms epoch
}

function seq(pathname: string): number {
  const m = pathname.match(/account-v-(\d+)-[0-9a-f]+\.json$/);
  return m ? Number(m[1]) : 0;
}

export async function readAccount(): Promise<Account | null> {
  try {
    const { blobs } = await list({ prefix: PREFIX, limit: 1000 });
    if (!blobs.length) return null;
    const latest = blobs.sort((a, b) => seq(b.pathname) - seq(a.pathname))[0];
    const res = await fetch(latest.url, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as Account;
  } catch {
    return null;
  }
}

export async function writeAccount(acc: Account): Promise<void> {
  const pathname = `${PREFIX}${Date.now()}-${randomBytes(10).toString('hex')}.json`;
  await put(pathname, JSON.stringify(acc), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
  });
  try {
    const { blobs } = await list({ prefix: PREFIX, limit: 1000 });
    const toDelete = blobs
      .filter((b) => b.pathname !== pathname)
      .sort((a, b) => seq(b.pathname) - seq(a.pathname))
      .slice(1);
    await Promise.all(toDelete.map((b) => del(b.url).catch(() => {})));
  } catch {
    /* cleanup nie jest krytyczny */
  }
}

export function newSalt(): string {
  return randomBytes(16).toString('hex');
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  return (await scrypt(password, salt, 64)).toString('hex');
}

export async function verifyPassword(password: string, account: Account): Promise<boolean> {
  const h = await hashPassword(password, account.salt);
  const a = Buffer.from(h, 'hex');
  const b = Buffer.from(account.passwordHash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

export function sha256(s: string): string {
  return createHash('sha256').update(s).digest('hex');
}

/**
 * Weryfikuje hasło logowania.
 * Jeśli konto istnieje w Blob — sprawdza względem niego.
 * Jeśli nie istnieje (świeży system) — fallback do env ADMIN_PASSWORD (bootstrap).
 */
export async function checkLoginPassword(password: string): Promise<boolean> {
  if (!password) return false;
  const account = await readAccount();
  if (account?.passwordHash) return verifyPassword(password, account);
  const envPw = process.env.ADMIN_PASSWORD ?? import.meta.env.ADMIN_PASSWORD;
  return !!envPw && password === envPw;
}

/** Hasło początkowe do zaszycia w koncie przy pierwszym zapisie (gdy konto jeszcze nie istnieje). */
export function bootstrapPassword(): string {
  return (process.env.ADMIN_PASSWORD ?? import.meta.env.ADMIN_PASSWORD) ?? '';
}
