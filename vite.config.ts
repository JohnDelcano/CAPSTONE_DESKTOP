import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      input: {
        first: path.resolve(__dirname, 'first.html'),
        second: path.resolve(__dirname, 'second.html'),
      },
    },
  },
});
