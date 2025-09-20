// src/services/api.js
const API_BASE_URL = "/api";

// Helper function to handle API responses
async function handleResponse(response) {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (data && data.message) || response.statusText;
    return Promise.reject(error);
  }
  return data;
}

function getTokenFromStorage() {
  try {
    const raw = localStorage.getItem("ds_user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token ?? null;
  } catch {
    return null;
  }
}

export const authService = {
  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    const data = await handleResponse(response);
    try {
      localStorage.setItem("ds_user", JSON.stringify(data));
    } catch {}
    return data;
  },

  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const data = await handleResponse(response);
    try {
      localStorage.setItem("ds_user", JSON.stringify(data));
    } catch {}
    return data;
  },

  getCurrentUser: async () => {
    const token = getTokenFromStorage();
    if (!token) throw new Error("No token found");
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },

  logout: async () => {
    try {
      localStorage.removeItem("ds_user");
    } catch {}
    return Promise.resolve();
  },
};

// OCR service
export const ocrService = {
  upload: async (file) => {
    const token = getTokenFromStorage();
    if (!token) throw new Error("No token found");

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/ocr/process`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    return handleResponse(response);
  },
};

export default {
  auth: authService,
  ocr: ocrService,
};
