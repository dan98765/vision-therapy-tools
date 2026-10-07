import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const root = import.meta.dirname;

// Every top-level folder with an index.html is a page, except ones that start
// with "_" (like _template) and tooling folders. The landing page is the root index.html.
const NOT_PAGES = new Set(['node_modules', 'dist', 'docs', 'shared', 'tests']);
const pages = { main: resolve(root, 'index.html') };
for (const entry of readdirSync(root, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name.startsWith('_')) continue;
  if (NOT_PAGES.has(entry.name)) continue;
  if (existsSync(resolve(root, entry.name, 'index.html'))) {
    pages[entry.name] = resolve(root, entry.name, 'index.html');
  }
}

// The pages ship a strict Content-Security-Policy. The dev server's hot reload
// needs a websocket, so only the dev server gets that one extra allowance.
const devWebsocket = {
  name: 'dev-csp-websocket',
  apply: 'serve',
  transformIndexHtml: html =>
    html.replace("base-uri 'none'", "connect-src ws://localhost:* ws://127.0.0.1:*; base-uri 'none'"),
};

export default defineConfig({
  // Relative asset paths, so the site works from any subpath (GitHub Pages uses /vision-therapy-tools/)
  base: './',
  plugins: [devWebsocket],
  build: {
    rollupOptions: { input: pages },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});
