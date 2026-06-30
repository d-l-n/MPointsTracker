import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, describe, expect, test } from "vitest";

import { setGlobalT } from "../data/translations";
import AppErrorBoundary from "./AppErrorBoundary";

describe("AppErrorBoundary", () => {
  afterEach(() => {
    setGlobalT((key) => key);
  });

  test("renders the custom route error screen", async () => {
    const labels = {
      errorTitle: "Algo salió mal",
      errorDesc: "La app encontró un error inesperado. Podés volver al inicio o recargar la pantalla.",
      errorBack: "Volver al inicio",
      errorRetry: "Reintentar",
      errorDetails: "Detalles",
    };
    setGlobalT((key) => labels[key] || key);

    const router = createMemoryRouter([
      {
        path: "/",
        element: <div>OK</div>,
        errorElement: <AppErrorBoundary />,
        loader: () => {
          throw new Error("boom");
        },
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Algo salió mal" })).toBeInTheDocument();
    expect(screen.getByText("La app encontró un error inesperado. Podés volver al inicio o recargar la pantalla.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Volver al inicio" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
  });
});
