import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router-dom";

function getErrorMessage(error: unknown): string {
  if (isRouteErrorResponse(error)) {
    return `${error.status} ${error.statusText}`.trim();
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Error inesperado";
}

export default function AppErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();
  const errorMessage = getErrorMessage(error);
  const showDetails = import.meta.env.DEV && errorMessage;

  return (
    <main className="route-error-page" role="alert">
      <section className="route-error-card">
        <div className="route-error-mark" aria-hidden="true">!</div>
        <div className="route-error-copy">
          <h1>Algo salió mal</h1>
          <p>La app encontró un error inesperado. Podés volver al inicio o recargar la pantalla.</p>
        </div>
        <div className="route-error-actions">
          <button className="btnpri route-error-primary" onClick={() => navigate("/", { replace: true })}>
            Volver al inicio
          </button>
          <button className="btnsec route-error-secondary" onClick={() => window.location.reload()}>
            Reintentar
          </button>
        </div>
        {showDetails ? (
          <details className="route-error-details">
            <summary>Detalle técnico</summary>
            <pre>{errorMessage}</pre>
          </details>
        ) : null}
      </section>
    </main>
  );
}
