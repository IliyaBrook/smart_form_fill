import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path, { resolve } from "path";
import makeManifest from "./src/utils/plugins/make-manifest";
import customDynamicImport from "./src/utils/plugins/custom-dynamic-import";
import addHmr from "./src/utils/plugins/add-hmr";
import watchRebuild from "./src/utils/plugins/watch-rebuild";
import manifest from "./manifest";

const rootDir = resolve(__dirname);
const srcDir = resolve(rootDir, "src");
const pagesDir = resolve(srcDir, "pages");
const assetsDir = resolve(srcDir, "assets");
const outDir = resolve(rootDir, "dist");
const publicDir = resolve(rootDir, "public");
const nodeModulesDir = resolve(rootDir, "node_modules");

const isDev = process.env.__DEV__ === "true";
const isProduction = !isDev;

// ENABLE HMR IN BACKGROUND SCRIPT
const enableHmrInBackgroundScript = true;

export default defineConfig({
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
  resolve: {
    alias: {
      "@src": srcDir,
      "@assets": assetsDir,
      "@pages": pagesDir,
    },
  },
  plugins: [
    react(),
    makeManifest(manifest, {
      isDev,
      contentScriptCssKey: regenerateCacheInvalidationKey(),
    }),
    customDynamicImport(),
    addHmr({ background: enableHmrInBackgroundScript, view: true }),
    watchRebuild(),
    
  ],
  publicDir,
  build: {
    outDir,
    /** Can slowDown build speed. */
    // sourcemap: isDev,
    minify: isProduction,
    reportCompressedSize: isProduction,
    rollupOptions: {
      input: {
        content: resolve(pagesDir, "content", "index.ts"),
        background: resolve(pagesDir, "background", "index.ts"),
        settings: resolve(pagesDir, "settings", "index.html"),
        popup: resolve(pagesDir, "popup", "index.html"),
        darkThem: resolve(nodeModulesDir, "antd/dist/antd.dark.css"),
        lightThem: resolve(nodeModulesDir, "antd/dist/antd.css"),
        contentStyle: resolve(pagesDir, "content", "style.scss"),
      },
      output: {
        entryFileNames: "src/pages/[name]/index.js",
        chunkFileNames: isDev
          ? "assets/js/[name].js"
          : "assets/js/[name].[hash].js",
        assetFileNames: (assetInfo) => {
          /**
           * Name: Always capitalize the first letter and make the rest of the word lowercase.
           * Example: if contentStyle is replaced with Contentstyle
           */
          const fileName = (assetInfo.names && assetInfo.names[0]) || (assetInfo.originalFileNames && assetInfo.originalFileNames[0]) || '';
          const parsedPath = path.parse(fileName);
          const baseName = parsedPath.base;
          const assetFolder = parsedPath.dir.split("/").at(-1);
          const name = assetFolder + firstUpperCase(baseName.replace(parsedPath.ext, ""));
          if (name === "Contentstyle") {
            return `assets/css/contentStyle${cacheInvalidationKey}.chunk.css`;
          }
          return `assets/[ext]/${name}.chunk.[ext]`;
        }
      },
    },
  },
});

function firstUpperCase(str: string) {
  const firstAlphabet = new RegExp(/( |^)[a-z]/, "g");
  return str.toLowerCase().replace(firstAlphabet, (L) => L.toUpperCase());
}

let cacheInvalidationKey: string = generateKey();
function regenerateCacheInvalidationKey() {
  cacheInvalidationKey = generateKey();
  return cacheInvalidationKey;
}

function generateKey(): string {
  return `${(Date.now() / 100).toFixed()}`;
}
