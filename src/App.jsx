// src/App.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./auth/AuthProvider";
import LandingPage from "./components/LandingPage";

/**
 * App: landing shell.
 * - If a logged-in user exists, redirect to /dashboard.
 * - LandingPage calls onOpenAuth to navigate to /auth.
 */
export default function App() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  React.useEffect(() => {
    if (loading) return;
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) return null;

  return <LandingPage onOpenAuth={() => navigate("/auth")} />;
}
