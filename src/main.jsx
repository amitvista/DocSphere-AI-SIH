// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./auth/AuthProvider";
import RequireAuth from "./auth/RequireAuth";

import App from "./App"; // your landing shell (calls navigate("/auth"))
import AuthFlow from "./components/AuthFlow"; // login / registration modal/page
import Dashboard from "./components/Dashboard";
import LandingPage from "./components/LandingPage"; // optional direct import if App uses it

import "./index.css"; // your global styles (if any)

function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing / shell */}
        <Route path="/" element={<App />} />

        {/* Authentication page/modal */}
        <Route path="/auth" element={<AuthFlow />} />

        {/* Protected dashboard route */}
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />

        {/* Optionally keep a legacy /hr route that redirects to /dashboard */}
        <Route path="/hr" element={<Navigate to="/dashboard" replace />} />

        {/* Fallback / 404: redirect to landing or show a 404 component */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

const root = createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <Router />
    </AuthProvider>
  </React.StrictMode>
);
