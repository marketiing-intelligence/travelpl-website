// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://travelpl.pl',
  output: 'server',
  adapter: vercel(),
  integrations: [tailwind()],
});
