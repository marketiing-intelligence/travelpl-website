import { list, put, del } from '@vercel/blob';
import type { Trip } from './types';
import { trips as seedTrips } from '../data/trips';

// Dane trzymamy w WERSJONOWANYCH plikach: trips-v-<ms>-<rand>.json.
// Dlaczego nie jeden stały plik: publiczny URL Bloba jest cache'owany na CDN (min. 60s,
// query string ignorowany), więc nadpisywanie tej samej ścieżki daje stale read-after-write.
// Każdy zapis tworzy NOWĄ ścieżkę (nigdy wcześniej nie cache'owaną → zawsze świeży odczyt),
// a list() (API store'a, nie CDN) jest silnie spójny i od razu widzi nową wersję.
const PREFIX = 'trips-v-';

/** Porządkowanie wersji po ms-timestampie zaszytym w nazwie (uploadedAt ma tylko precyzję sekundową). */
function seq(pathname: string): number {
  const m = pathname.match(/trips-v-(\d+)-(\d+)\.json$/);
  return m ? Number(m[1]) * 1e7 + Number(m[2]) : 0;
}

export async function getTrips(): Promise<Trip[]> {
  try {
    const { blobs } = await list({ prefix: PREFIX, limit: 1000 });
    if (!blobs.length) return seedTrips;
    const latest = blobs.sort((a, b) => seq(b.pathname) - seq(a.pathname))[0];
    const res = await fetch(latest.url, { cache: 'no-store' });
    if (!res.ok) return seedTrips;
    const data = await res.json();
    return Array.isArray(data) && data.length ? (data as Trip[]) : seedTrips;
  } catch {
    return seedTrips;
  }
}

export async function saveTrips(trips: Trip[]): Promise<void> {
  const pathname = `${PREFIX}${Date.now()}-${Math.round(Math.random() * 1e6)}.json`;
  await put(pathname, JSON.stringify(trips, null, 2), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
  });
  // Sprzątanie: zostaw najnowszą (właśnie zapisaną) + 1 poprzednią (bufor na równoległy odczyt).
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

/** Kasuje zdjęcie z Blob (tylko jeśli to URL Blob — stare zdjęcia z /public zostają). */
export async function deleteImage(url: string | undefined): Promise<void> {
  if (!url || !url.includes('blob.vercel-storage.com')) return;
  try {
    await del(url);
  } catch {
    /* nie blokuj operacji jeśli kasowanie zdjęcia padnie */
  }
}
