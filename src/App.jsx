// src/App.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./auth/AuthProvider";
import LandingPage from "./components/LandingPage";

/**
 * App: landing shell. When user requests auth, navigate to /auth.
 * If already logged-in HR user exists in context, redirect to /hr.
 */
export default function App() {
  const navigate = useNavigate();
  const { user } = useAuth();

  React.useEffect(() => {
    if (user?.role === "hr") {
      navigate("/hr", { replace: true });
    }
  }, [user, navigate]);

  return <LandingPage onOpenAuth={() => navigate("/auth")} />;
}
