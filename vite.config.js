import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/karaokeroom-operational-dashboard/',
  build: {
    outDir: 'docs',
  },
});
