import { defineConfig } from "vite";
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts(),
  ],
  build: {
    emptyOutDir: false,
    lib: {
      entry: './dist/frontend/index.js',
      fileName: 'frontend/index',
      name: "client",
    },
  },
});
