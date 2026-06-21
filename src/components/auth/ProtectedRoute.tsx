import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { fbAuth } from "../../lib/firebase";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  if (fbAuth.currentUser) {
    return <>{children}</>;
  }

  return <Navigate to="/login" replace />;
}
