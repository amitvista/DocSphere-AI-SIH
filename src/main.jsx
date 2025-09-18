// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import AuthFlow from "./components/AuthFlow";
import HRDashboard from "./components/HRDashboard";
import { AuthProvider } from "./auth/AuthProvider";
import RequireAuth from "./auth/RequireAuth";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Landing route */}
          <Route path="/" element={<App />} />

          {/* Auth route (AuthFlow mounted inside Router context) */}
          <Route path="/auth" element={<AuthFlow />} />

          {/* Protected HR dashboard */}
          <Route
            path="/hr"
            element={
              <RequireAuth role="hr">
                <HRDashboard />
              </RequireAuth>
            }
          />

          {/* fallback to landing */}
          <Route path="*" element={<App />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
