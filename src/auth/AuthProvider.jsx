// src/auth/AuthProvider.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/api";

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

  // Keep localStorage in sync
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem("ds_user", JSON.stringify(user));
      } else {
        localStorage.removeItem("ds_user");
      }
    } catch {
      // ignore storage errors
    }
  }, [user]);

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

export function useAuth() {
  return useContext(AuthContext);
}
