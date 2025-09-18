// src/auth/RequireAuth.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function RequireAuth({ children, role }) {
  const { user } = useAuth();

  if (!user) {
    // not logged in -> back to landing
    return <Navigate to="/" replace />;
  }
  if (role && user.role !== role) {
    // wrong role -> landing (or add other logic)
    return <Navigate to="/" replace />;
  }
  return children;
}
