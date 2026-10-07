import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { findExerciseFolders } from './scripts/pages.js';

const root = import.meta.dirname;

// The landing page is the root index.html; every exercise folder is a page too (see scripts/pages.js).
const pages = { main: resolve(root, 'index.html') };
for (const name of findExerciseFolders(root)) {
  pages[name] = resolve(root, name, 'index.html');
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
