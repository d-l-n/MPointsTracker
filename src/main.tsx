import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import { router } from "./routes/routes";
import "./index.css";

// Signal the inline boot watchdog (index.html) that the app mounted,
// so its error card never shows on normal loads.
function markAppReady() {
  document.documentElement.setAttribute("data-mp-ready", "1");
}

// Register the service worker only in production so Vite HMR keeps working locally.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        console.log("[SW] Registrado:", registration.scope);

        // Keep a handle to the registration so the update button can signal
        // the *waiting* worker directly. Posting SKIP_WAITING to the current
        // controller is a no-op for the newly installed worker, which left the
        // update button unable to apply the new version until a manual reload.
        window.__swRegistration = registration;

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

// The inline boot watchdog (index.html) shows an error card if the app does
// not signal readiness in time. Mark it via multiple paths so it never fires
// on normal loads:
//  - right after render (render commits synchronously for the initial mount),
//  - on the next frame (first paint),
//  - via a timeout, which still runs in background tabs where rAF is paused.
markAppReady();
requestAnimationFrame(markAppReady);
window.setTimeout(markAppReady, 0);
