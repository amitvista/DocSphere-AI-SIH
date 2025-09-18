// src/auth/AuthProvider.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

/**
 * Simple AuthProvider
 * - login(user) sets the user object in context (and localStorage for persistence)
 * - logout() clears the user
 */

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("ds_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (user) localStorage.setItem("ds_user", JSON.stringify(user));
      else localStorage.removeItem("ds_user");
    } catch {
      // ignore storage errors
    }
  }, [user]);

  function login(userData) {
    setUser(userData);
  }

  function logout() {
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
