// src/auth/AuthProvider.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/api";

const AuthContext = createContext();

/* ---------- provider ---------- */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("ds_user");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return normalizeUser(parsed);
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(Boolean(!user));

  // Keep localStorage in sync
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem("ds_user", JSON.stringify(user));
      } else {
        localStorage.removeItem("ds_user");
      }
    } catch {
      // ignore quota/storage errors
    }
  }, [user]);

  // On mount, check session/server for current user (defensive)
  useEffect(() => {
    let mounted = true;
    async function check() {
      setLoading(true);
      try {
        if (authService && typeof authService.getCurrentUser === "function") {
          const res = await authService.getCurrentUser();
          // res may be null, user-object, or { user: {...} }, or a Response-like object
          if (!res) {
            if (mounted) setUser(null);
          } else {
            const normalized = normalizeUser(res);
            if (mounted) setUser(normalized);
          }
        }
      } catch (err) {
        // don't crash on parse errors; leave user as-is (maybe persisted)
        console.warn("AuthProvider: getCurrentUser failed:", err);
        if (mounted && !user) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    // only call if we don't already have a persisted user
    if (!user) check();
    else setLoading(false);

    return () => (mounted = false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- login: returns normalized result ---------- */
  async function login(credentials) {
    try {
      const userData = await authService.login(credentials);
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      console.error("Login failed:", error);
      return { success: false, error };
    }
  }

  /* ---------- logout ---------- */
  async function logout() {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
    }
  }

  // Validate token & get user on initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const raw = localStorage.getItem("ds_user");
        if (!raw) return; // no user saved, skip

        const current = await authService.getCurrentUser();
        if (current) {
          setUser((prev) => ({ ...prev, ...current }));
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("ds_user");
        setUser(null);
      }
    };

    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ---------- hook ---------- */
export function useAuth() {
  return useContext(AuthContext);
}
