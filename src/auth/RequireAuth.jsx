// src/auth/RequireAuth.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

/**
 * RequireAuth
 *
 * Props:
 * - children: React node(s)
 * - role: single allowed role (string) OR
 * - allowedRoles: array of allowed roles (strings)
 * - redirectTo: path to redirect when not authenticated/authorized (default: "/login")
 *
 * Behavior:
 * - while auth is loading, renders null (or you can render a spinner)
 * - if not authenticated -> redirect to `redirectTo`
 * - if authenticated but not authorized -> redirect to `redirectTo`
 * - compares against user.roleSlug if available, otherwise user.role
 */
export default function RequireAuth({ children, role, allowedRoles, redirectTo = "/login" }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // while auth is verifying, optionally render nothing (or a loader)
  if (loading) {
    return null; // or return <div>Checking authentication...</div>
  }

  // not logged in
  if (!user) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  // normalize prop inputs to an array of allowed slugs/roles
  let allowed = null;
  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) allowed = allowedRoles;
  else if (typeof role === "string" && role.length > 0) allowed = [role];

  if (allowed && allowed.length > 0) {
    // prefer roleSlug on user (provided by AuthProvider), fallback to role text
    const userRole = (user.roleSlug || user.role || "").toString().toLowerCase();
    const normalizedAllowed = allowed.map((r) => (r || "").toString().toLowerCase());

    const isAllowed = normalizedAllowed.includes(userRole) || normalizedAllowed.includes((user.role || "").toLowerCase());

    if (!isAllowed) {
      // unauthorized for this route
      return <Navigate to={redirectTo} replace state={{ from: location }} />;
    }
  }

  // authorized
  return children;
}
