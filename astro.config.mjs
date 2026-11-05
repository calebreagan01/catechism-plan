import { defineConfig } from 'astro/config';

// BASE_PATH is "/" for a custom domain or Cloudflare Pages, and "/repo-name" for a
// GitHub Pages project site. The deploy workflow sets it for you.
const base = process.env.BASE_PATH || '/';
export default defineConfig({
  site: process.env.SITE_URL || 'http://localhost:4321',
  base,
  trailingSlash: 'always',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
});
