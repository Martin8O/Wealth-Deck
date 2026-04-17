// Standalone client-only entry for the Electron desktop build.
// Bypasses TanStack Start SSR and renders the home page directly.
import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

// Import the page component directly. This avoids the Start router/SSR shell.
import { Route as IndexRoute } from "./routes/index";

// `Route` exposes the component in `.options.component`
const Page = (IndexRoute as unknown as { options: { component: React.ComponentType } })
  .options.component;

const container = document.getElementById("root")!;
createRoot(container).render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>,
);
