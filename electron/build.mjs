import { build } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.resolve(root, "dist-electron");

if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true });

// Place index.html at project root so Vite emits asset paths as ./assets/*
const tmpHtml = path.resolve(root, "electron-index.html");
fs.copyFileSync(path.resolve(__dirname, "index.html"), tmpHtml);

try {
  await build({
    configFile: false,
    root,
    base: "./",
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { "@": path.resolve(root, "src") },
      dedupe: ["react", "react-dom"],
    },
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: tmpHtml },
    },
  });
  // Rename emitted html to index.html
  const emitted = path.join(outDir, "electron-index.html");
  if (fs.existsSync(emitted)) {
    fs.renameSync(emitted, path.join(outDir, "index.html"));
  }
} finally {
  if (fs.existsSync(tmpHtml)) fs.unlinkSync(tmpHtml);
}

console.log("Electron bundle built at:", outDir);
