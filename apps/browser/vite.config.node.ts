import path from 'node:path';
import { defineConfig } from "vite";
import dts from 'vite-plugin-dts';
import { VitePluginNode } from 'vite-plugin-node';


export default defineConfig({
  plugins: [
    dts(),
    ...VitePluginNode({
      adapter: 'express',
      appPath: path.join(__dirname, "./src/backend/main.ts"),
      swcOptions: {
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true
        }
      },
      outputFormat: "es"
    })
  ],
});
