export const prerender = false;
import type { APIRoute } from 'astro';
import { getTrips } from '../lib/trips';

const SITE = 'https://travelpl.pl';
const STATIC = ['/', '/o-nas', '/aplikacja', '/wycieczki-szkolne'];

export const GET: APIRoute = async () => {
  const trips = await getTrips();
  const urls = [
    ...STATIC.map((p) => `${SITE}${p}`),
    ...trips.map((t) => `${SITE}/wycieczka/${t.slug}`),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>`;
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
