export const prerender = false;
import type { APIRoute } from 'astro';
import type { Trip } from '../../../lib/types';
import { getTrips, saveTrips, deleteImage } from '../../../lib/trips';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

const TYPES = ['wczasy', 'wycieczka'];
const REGIONS = ['morze', 'gory', 'miasto', 'zagranica'];

function cleanList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x).trim()).filter(Boolean);
}

/** Buduje czysty obiekt Trip z danych formularza lub zwraca błąd walidacji. */
function normalize(input: any): Trip | { error: string } {
  const slug = String(input?.slug ?? '').trim().toLowerCase();
  const name = String(input?.name ?? '').trim();
  const fullName = String(input?.fullName ?? '').trim();
  const type = String(input?.type ?? '');
  const region = String(input?.region ?? '');
  const dates = String(input?.dates ?? '').trim();
  const duration = String(input?.duration ?? '').trim();
  const price = Number(input?.price);
  const image = String(input?.image ?? '').trim();
  const shortDescription = String(input?.shortDescription ?? '').trim();
  const fullDescription = String(input?.fullDescription ?? '').trim();
  const included = cleanList(input?.included);
  const highlights = cleanList(input?.highlights);

  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return { error: 'Nieprawidłowy adres (slug): dozwolone małe litery, cyfry i myślniki.' };
  if (!name) return { error: 'Podaj krótką nazwę.' };
  if (!fullName) return { error: 'Podaj pełną nazwę.' };
  if (!TYPES.includes(type)) return { error: 'Wybierz typ (wczasy / wycieczka).' };
  if (!REGIONS.includes(region)) return { error: 'Wybierz region.' };
  if (!dates) return { error: 'Podaj daty.' };
  if (!duration) return { error: 'Podaj czas trwania.' };
  if (!Number.isFinite(price) || price <= 0) return { error: 'Podaj poprawną cenę.' };
  if (!image) return { error: 'Dodaj zdjęcie.' };
  if (!shortDescription) return { error: 'Podaj krótki opis.' };
  if (!fullDescription) return { error: 'Podaj pełny opis.' };
  if (!included.length) return { error: 'Dodaj co najmniej jedną pozycję „Co w cenie".' };
  if (!highlights.length) return { error: 'Dodaj co najmniej jedną atrakcję (highlight).' };

  const trip: Trip = {
    slug, name, fullName,
    type: type as Trip['type'],
    region: region as Trip['region'],
    dates, duration, price, image,
    shortDescription, fullDescription,
    included, highlights,
  };

  const notIncluded = cleanList(input?.notIncluded);
  const itinerary = cleanList(input?.itinerary);
  const program = cleanList(input?.program);
  const specialAttractions = cleanList(input?.specialAttractions);
  const beachDistance = String(input?.beachDistance ?? '').trim();
  const importantInfo = String(input?.importantInfo ?? '').trim();
  const badge = String(input?.badge ?? '').trim();
  const urgencyBadge = String(input?.urgencyBadge ?? '').trim();

  if (notIncluded.length) trip.notIncluded = notIncluded;
  if (itinerary.length) trip.itinerary = itinerary;
  if (program.length) trip.program = program;
  if (specialAttractions.length) trip.specialAttractions = specialAttractions;
  if (beachDistance) trip.beachDistance = beachDistance;
  if (importantInfo) trip.importantInfo = importantInfo;
  if (badge) trip.badge = badge;
  if (urgencyBadge) trip.urgencyBadge = urgencyBadge;
  if (input?.featured) trip.featured = true;

  return trip;
}

export const GET: APIRoute = async () => json(await getTrips());

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  const result = normalize(body);
  if ('error' in result) return json(result, 400);
  const trips = await getTrips();
  if (trips.some((t) => t.slug === result.slug)) {
    return json({ error: 'Wycieczka z tym adresem (slug) już istnieje.' }, 409);
  }
  await saveTrips([...trips, result]);
  return json({ ok: true, slug: result.slug }, 201);
};

export const PUT: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  const originalSlug = String(body?.originalSlug ?? '').trim().toLowerCase();
  const result = normalize(body?.trip);
  if ('error' in result) return json(result, 400);
  const trips = await getTrips();
  const idx = trips.findIndex((t) => t.slug === originalSlug);
  if (idx < 0) return json({ error: 'Nie znaleziono wycieczki do edycji.' }, 404);
  if (result.slug !== originalSlug && trips.some((t) => t.slug === result.slug)) {
    return json({ error: 'Inna wycieczka już używa tego adresu (slug).' }, 409);
  }
  const oldImage = trips[idx].image;
  const next = [...trips];
  next[idx] = result;
  await saveTrips(next);
  if (oldImage && oldImage !== result.image) await deleteImage(oldImage);
  return json({ ok: true, slug: result.slug });
};

export const DELETE: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  const slug = String(body?.slug ?? '').trim().toLowerCase();
  const trips = await getTrips();
  const target = trips.find((t) => t.slug === slug);
  if (!target) return json({ error: 'Nie znaleziono.' }, 404);
  await saveTrips(trips.filter((t) => t.slug !== slug));
  await deleteImage(target.image);
  return json({ ok: true });
};
