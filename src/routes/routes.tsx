import { Navigate, createBrowserRouter } from "react-router-dom";

import App from "../App";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import AppErrorBoundary from "./AppErrorBoundary";
import { routeLoader } from "./routeLoaders";

const appRouteError = <AppErrorBoundary />;

export const router = createBrowserRouter([
  { path: "/", element: <App />, loader: routeLoader, errorElement: appRouteError },
  { path: "/login", element: <App />, loader: routeLoader, errorElement: appRouteError },
  { path: "/rules", element: <App />, loader: routeLoader, errorElement: appRouteError },
  { path: "/champions", element: <App />, loader: routeLoader, errorElement: appRouteError },
  { path: "/settings", element: <App />, loader: routeLoader, errorElement: appRouteError },
  { path: "/admin", element: <ProtectedRoute><App /></ProtectedRoute>, loader: routeLoader, errorElement: appRouteError },
  { path: "/history", element: <App />, loader: routeLoader, errorElement: appRouteError },
  { path: "/game/:gameId", element: <App />, loader: routeLoader, errorElement: appRouteError },
  { path: "*", element: <Navigate to="/" replace /> },
]);
