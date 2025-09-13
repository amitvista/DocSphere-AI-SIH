// src/context/AuthContext.jsx
import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [mockDatabase, setMockDatabase] = useState({ admin: null, officers: [], orgName: '', domain: '' });
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: '' });

  const showAlert = (message) => {
    setAlert({ show: true, message });
    setTimeout(() => setAlert({ show: false, message: '' }), 2500);
  };

  const logout = () => {
    setLoggedInUser(null);
    // You might want to navigate the user to the homepage here
  };

  const value = {
    mockDatabase,
    setMockDatabase,
    loggedInUser,
    setLoggedInUser,
    showAlert,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {alert.show && <Alert message={alert.message} />}
    </AuthContext.Provider>
  );
};

// We can define the Alert component right here or in its own file
const Alert = ({ message }) => {
  return (
    <div className="custom-alert" style={{ top: '20px' }}>
      <span>{message}</span>
    </div>
  );
};