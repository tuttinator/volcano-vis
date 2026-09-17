import { defineConfig } from 'vite';
export default defineConfig({
  optimizeDeps:{exclude:['maplibre-gl']},
  server:{port:4178,strictPort:true},
});
