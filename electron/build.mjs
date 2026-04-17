// Build a standalone static SPA bundle for Electron.
// We use a minimal Vite config that builds src/electron-entry.tsx as a regular
// client-side React app (no SSR), so it can be loaded via file://.
const { build } = require("vite");
const react = require("@vitejs/plugin-react");
const tailwindcss = require("@tailwindcss/vite");
const path = require("path");
const fs = require("fs");

(async () => {
  const outDir = path.resolve(__dirname, "..", "dist-electron");
  if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true });

  await build({
    configFile: false,
    root: path.resolve(__dirname, ".."),
    base: "./",
    plugins: [react.default(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "..", "src"),
      },
      dedupe: ["react", "react-dom"],
    },
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: {
        input: path.resolve(__dirname, "index.html"),
      },
    },
  });

  console.log("Electron bundle built at:", outDir);
})();
