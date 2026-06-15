/**
 * Jednorazowy seed: wgrywa obecne wycieczki (src/data/trips.ts) do trips.json w Vercel Blob.
 * Uruchom: node --env-file=.env.local --import tsx scripts/seed-blob.ts
 */
import { trips } from '../src/data/trips';
import { saveTrips, getTrips } from '../src/lib/trips';

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('✗ Brak BLOB_READ_WRITE_TOKEN. Uruchom: vercel env pull .env.local');
  process.exit(1);
}

await saveTrips(trips);
const check = await getTrips();
console.log(`✓ Wgrano ${trips.length} wycieczek do trips.json. Odczyt zwrócił ${check.length}.`);
