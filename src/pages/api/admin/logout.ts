export const prerender = false;
import type { APIRoute } from 'astro';
import { COOKIE } from '../../../lib/auth';

export const POST: APIRoute = async ({ cookies }) => {
  cookies.delete(COOKIE, { path: '/' });
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
