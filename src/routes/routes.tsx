import { Navigate, createBrowserRouter } from "react-router-dom";

import App from "../App";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import AppErrorBoundary from "./AppErrorBoundary";
import {
  appShellLoader,
  gameRouteLoader,
  historyRouteLoader,
  settingsRouteLoader,
} from "./routeLoaders";

const appRouteError = <AppErrorBoundary />;

export const router = createBrowserRouter([
  { path: "/", element: <App />, loader: appShellLoader, errorElement: appRouteError },
  { path: "/login", element: <App />, loader: appShellLoader, errorElement: appRouteError },
  { path: "/rules", element: <App />, loader: appShellLoader, errorElement: appRouteError },
  { path: "/champions", element: <App />, loader: appShellLoader, errorElement: appRouteError },
  { path: "/settings", element: <App />, loader: settingsRouteLoader, errorElement: appRouteError },
  {
    path: "/admin",
    loader: appShellLoader,
    errorElement: appRouteError,
    element: (
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    ),
  },
  { path: "/history", element: <App />, loader: historyRouteLoader, errorElement: appRouteError },
  { path: "/game/:gameId", element: <App />, loader: gameRouteLoader, errorElement: appRouteError },
  { path: "*", element: <Navigate to="/" replace /> },
]);
