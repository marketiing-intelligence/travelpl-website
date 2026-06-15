import { defineMiddleware } from 'astro:middleware';
import { verifyToken, COOKIE } from './lib/auth';

const AUTH_SECRET = process.env.AUTH_SECRET ?? import.meta.env.AUTH_SECRET;

// Ścieżki dostępne bez logowania (logowanie + odzyskiwanie hasła).
const PUBLIC_PATHS = new Set([
  '/admin/login',
  '/admin/reset',
  '/api/admin/login',
  '/api/admin/reset-request',
  '/api/admin/reset-confirm',
]);

export const onRequest = defineMiddleware(async (ctx, next) => {
  const path = ctx.url.pathname;
  const isAdminPage = path === '/admin' || path.startsWith('/admin/');
  const isAdminApi = path.startsWith('/api/admin/');

  if ((isAdminPage || isAdminApi) && !PUBLIC_PATHS.has(path)) {
    const ok = await verifyToken(ctx.cookies.get(COOKIE)?.value, AUTH_SECRET);
    if (!ok) {
      if (isAdminApi) {
        return new Response(JSON.stringify({ error: 'unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return ctx.redirect('/admin/login');
    }
  }
  return next();
});
