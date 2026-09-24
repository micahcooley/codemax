import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
export default defineConfig({
  plugins: [svelte()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: '127.0.0.1',
    watch: {
      // Generated native build trees can exceed constrained watcher limits.
      ignored: ['**/src-tauri/target/**', '**/integrations/koryphaios/evidence/**']
    }
  },
  envPrefix: ['VITE_'],
  build: { target: 'es2022', sourcemap: true }
});
