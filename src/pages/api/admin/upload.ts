export const prerender = false;
import type { APIRoute } from 'astro';
import { put } from '@vercel/blob';

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB (limit body funkcji Vercel)

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'Nieprawidłowe dane formularza.' }, 400);
  }

  const file = form.get('image');
  if (!(file instanceof File) || file.size === 0) return json({ error: 'Nie wybrano pliku.' }, 400);
  if (!file.type.startsWith('image/')) return json({ error: 'Plik musi być obrazem (JPG, PNG, WebP).' }, 400);
  if (file.size > MAX_BYTES) return json({ error: 'Maksymalny rozmiar zdjęcia to 4 MB.' }, 400);

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const base =
    String(form.get('slug') ?? 'wycieczka')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'wycieczka';

  try {
    const blob = await put(`images/trips/${base}-${Date.now()}.${ext}`, file, {
      access: 'public',
      addRandomSuffix: false,
      contentType: file.type,
    });
    return json({ url: blob.url }, 200);
  } catch (e) {
    console.error('upload error', e);
    return json({ error: 'Nie udało się wgrać zdjęcia.' }, 500);
  }
};
