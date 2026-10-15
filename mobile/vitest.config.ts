import path from 'node:path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: 'react-native', replacement: path.resolve(__dirname, 'test/react-native-stub.js') },
      // .svg imports are components via react-native-svg-transformer in Metro
      { find: /^.+\.svg$/, replacement: path.resolve(__dirname, 'test/svg-stub.js') },
    ],
  },
  test: {
    globals: true, // RNTL matchers call expect.extend at import time
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
