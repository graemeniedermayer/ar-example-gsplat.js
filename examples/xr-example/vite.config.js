// vite.config.js

import { defineConfig } from 'vite'
// must be served with ssl for xr to be active
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
  server: { https: true }, // Not needed for Vite 5+
  plugins: [ mkcert() ]
})