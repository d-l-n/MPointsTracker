import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { fbAuth } from "../../lib/firebase";

interface ProtectedRouteProps {
  children: ReactNode;
}

function hasStoredSessionHint(): boolean {
  try {
    return Boolean(localStorage.getItem("bgt_last_uid")) && !localStorage.getItem("bgt_guest_mode");
  } catch {
    return false;
  }
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  if (fbAuth.currentUser || hasStoredSessionHint()) {
    return <>{children}</>;
  }

  return <Navigate to="/login" replace />;
}
