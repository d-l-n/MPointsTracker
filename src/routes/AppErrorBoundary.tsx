import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router-dom";
import { getGlobalT } from "../data/translations";

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

  return getGlobalT()("errorUnexpected");
}

export default function AppErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();
  const errorMessage = getErrorMessage(error);
  const showDetails = import.meta.env.DEV && errorMessage;
  const t = getGlobalT();

  return (
    <main className="route-error-page" role="alert">
      <section className="route-error-card">
        <div className="route-error-mark" aria-hidden="true">!</div>
        <div className="route-error-copy">
          <h1>{t("errorTitle")}</h1>
          <p>{t("errorDesc")}</p>
        </div>
        <div className="route-error-actions">
          <button className="btnpri route-error-primary" onClick={() => navigate("/", { replace: true })}>
            {t("errorBack")}
          </button>
          <button className="btnsec route-error-secondary" onClick={() => window.location.reload()}>
            {t("errorRetry")}
          </button>
        </div>
        {showDetails ? (
          <details className="route-error-details">
            <summary>{t("errorDetails")}</summary>
            <pre>{errorMessage}</pre>
          </details>
        ) : null}
      </section>
    </main>
  );
}
