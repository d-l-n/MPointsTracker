import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import { router } from "./routes/routes";
import "./index.css";

// Register the service worker only in production so Vite HMR keeps working locally.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        console.log("[SW] Registrado:", registration.scope);

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              window.dispatchEvent(
                new CustomEvent("sw-update-available", {
                  detail: { registration },
                }),
              );
              console.log("[SW] Nueva versión disponible");
            }
          });
        });
      })
      .catch((err) => {
        console.warn("[SW] No se pudo registrar:", err);
      });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (window.__swPendingReload) {
        window.location.reload();
      }
    });
  });
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Root element "#root" not found');
}

createRoot(rootElement).render(<RouterProvider router={router} />);
