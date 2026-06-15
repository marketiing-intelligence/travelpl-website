export const prerender = false;
import type { APIRoute } from 'astro';
import { createToken, COOKIE } from '../../../lib/auth';

const AUTH_SECRET = process.env.AUTH_SECRET ?? import.meta.env.AUTH_SECRET;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? import.meta.env.ADMIN_PASSWORD;

export const POST: APIRoute = async ({ request, cookies }) => {
  let password = '';
  try {
    password = (await request.json())?.password ?? '';
  } catch {
    /* brak body */
  }

  if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Błędne hasło' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = await createToken(AUTH_SECRET);
  cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
