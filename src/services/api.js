// src/services/api.js
const API_BASE_URL = '/api';

// Helper function to handle API responses
async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    const error = (data && data.message) || response.statusText;
    return Promise.reject(error);
  }
  return data;
}

// Authentication API calls
export const authService = {
  // Register a new user
  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  // Login user
  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  // Logout user
  logout: async () => {
    // Note: This is a client-side logout. The server should invalidate the token.
    // You might want to add a server-side logout endpoint if needed.
    return Promise.resolve();
  },
};

// Add more API services as needed
export default {
  auth: authService,
};
