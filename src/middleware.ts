import { defineMiddleware } from 'astro:middleware';
import { verifyToken, COOKIE } from './lib/auth';

const AUTH_SECRET = process.env.AUTH_SECRET ?? import.meta.env.AUTH_SECRET;

export const onRequest = defineMiddleware(async (ctx, next) => {
  const path = ctx.url.pathname;
  const isAdminPage = path === '/admin' || path.startsWith('/admin/');
  const isAdminApi = path.startsWith('/api/admin/');
  const isLoginPage = path === '/admin/login';
  const isLoginApi = path === '/api/admin/login';

  if ((isAdminPage && !isLoginPage) || (isAdminApi && !isLoginApi)) {
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
