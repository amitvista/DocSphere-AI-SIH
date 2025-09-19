// src/auth/AuthProvider.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/api";

/**
 * AuthProvider (replacement)
 * - Normalized API: login(credentials) => { success, user, error }
 * - Exposes: user, login, logout, loginAs (dev-only), setUser, isAuthenticated
 * - Persists user to localStorage (key: ds_user)
 * - Calls authService.getCurrentUser() on mount (defensive)
 */

/* ---------- role normalization ---------- */
function normalizeRoleLabel(label) {
  if (!label) return "";
  const v = String(label).trim().toLowerCase();
  if (v.includes("hr")) return "hr";
  if (v.includes("finance")) return "finance";
  if (v.includes("engineer")) return "engineer";
  if (v.includes("safety")) return "safety";
  if (v.includes("legal")) return "legal";
  if (v.includes("operation") || v.includes("operations") || v.includes("station") || v.includes("depot")) return "operations";
  // fallback: first token
  const words = v.split(/\s+/);
  return words[0] || v;
}

function normalizeUser(raw) {
  if (!raw) return null;
  // Some backends return { user: {...} } others return {...}
  const u = raw.user ? raw.user : raw;
  const role = (u.role || u.post || "").toString();
  const roleSlug = normalizeRoleLabel(role);
  return {
    ...u,
    role: role || "",
    roleSlug,
  };
}

/* ---------- context ---------- */
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

  useEffect(() => {
    try {
      if (user) localStorage.setItem("ds_user", JSON.stringify(user));
      else localStorage.removeItem("ds_user");
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
      if (!authService || typeof authService.login !== "function") {
        throw new Error("No authService.login available");
      }

      const res = await authService.login(credentials);
      // res might be: user object OR { success, user, token } OR { success: true, user: {...} }
      // Normalize:
      let success = false;
      let userObj = null;
      let error = null;

      if (res == null) {
        success = false;
        error = "Empty response from auth service";
      } else if (typeof res === "object") {
        // If service returns { success: boolean, user: {...}, error: '...' }
        if ("success" in res) {
          success = !!res.success;
          userObj = res.user || res;
          error = res.error || null;
        } else {
          // assume raw user object
          success = true;
          userObj = res;
        }
      } else {
        success = false;
        error = "Unexpected authService.login response";
      }

      if (success && userObj) {
        const normalized = normalizeUser(userObj);
        setUser(normalized);
        return { success: true, user: normalized };
      } else {
        return { success: false, error: error || "Login failed" };
      }
    } catch (err) {
      console.error("AuthProvider.login error:", err);
      return { success: false, error: err?.message || String(err) };
    }
  }

  /* ---------- logout ---------- */
  async function logout() {
    try {
      if (authService && typeof authService.logout === "function") {
        await authService.logout();
      }
    } catch (err) {
      console.warn("AuthProvider.logout warning:", err);
    } finally {
      setUser(null);
    }
  }

  /* ---------- dev helper: loginAs(role) ---------- */
  function loginAs(roleLabel = "hr") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("loginAs is dev-only");
    }
    const roleSlug = normalizeRoleLabel(roleLabel);
    const devUser = {
      id: `dev-${roleSlug}`,
      name: `Dev ${roleSlug}`,
      email: `dev+${roleSlug}@example.com`,
      role: roleLabel,
      roleSlug,
      // permissions: you can expand this if needed for UI development
    };
    setUser(devUser);
    return devUser;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        login,
        logout,
        loginAs,
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
