import { defineConfig } from "vite";
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts(),
  ],
  build: {
    lib: {
      entry: './dist/index.js',
      fileName: 'index',
      name: "@gpk/browser",
    },
  },
});
