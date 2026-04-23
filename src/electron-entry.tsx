// Standalone client-only entry for the Electron / single-file HTML build.
// Bypasses TanStack Start SSR and renders the home page directly while still
// providing the I18nProvider that the calculators rely on.
import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { I18nProvider } from "./lib/i18n/context";

// Import the page component directly. This avoids the Start router/SSR shell.
import { Route as IndexRoute } from "./routes/index";

const Page = (IndexRoute as unknown as { options: { component: React.ComponentType } })
  .options.component;

const container = document.getElementById("root")!;
createRoot(container).render(
  <React.StrictMode>
    <I18nProvider>
      <Page />
    </I18nProvider>
  </React.StrictMode>,
);
