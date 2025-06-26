import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import jwtDecode from 'jwt-decode';
import apiClient from '../utils/apiConfig';

// Create context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Logout user
  const logout = useCallback(() => {
    // Remove tokens from local storage
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    
    // Reset state
    setCurrentUser(null);
    setError(null);
    setLoading(false);
  }, []);

  // Load user data from API
  const loadUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      const response = await apiClient.get('/auth/me');
      setCurrentUser(response.data.user);
      setError(null);
    } catch (err) {
      console.error('Error loading user', err);
      setError('Failed to load user data');
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  // Refresh token
  const refreshToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        logout();
        return;
      }
      
      const response = await apiClient.post('/auth/refresh');
      
      // Save new access token
      localStorage.setItem('token', response.data.access_token);
      
      // Load user data
      await loadUser();
    } catch (err) {
      console.error('Error refreshing token', err);
      logout();
    }
  }, [loadUser, logout]);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        // Check if token is expired
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        if (decodedToken.exp < currentTime) {
          // Token is expired, try to refresh
          refreshToken();
        } else {
          // Token is valid, load user data
          loadUser();
        }
      } catch (err) {
        console.error('Invalid token', err);
        logout();
      }
    } else {
      setLoading(false);
    }
  }, [loadUser, refreshToken, logout]);

  // Register a new user
  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/auth/register', userData);
      
      // Save tokens
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('refreshToken', response.data.refresh_token);
      
      // Set user data
      setCurrentUser(response.data.user);
      setError(null);
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/auth/login', credentials);
      
      // Save tokens
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('refreshToken', response.data.refresh_token);
      
      // Set user data
      setCurrentUser(response.data.user);
      setError(null);
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (formData) => {
    try {
      setLoading(true);
      const response = await apiClient.put('/users/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setCurrentUser(response.data.user);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Check if user has specific role
  const hasRole = (role) => {
    if (!currentUser) return false;
    return currentUser.role === role;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    if (!currentUser) return false;
    return Array.isArray(roles) ? roles.includes(currentUser.role) : currentUser.role === roles;
  };

  // Check if user is admin
  const isAdmin = () => {
    return currentUser && currentUser.role === 'admin';
  };

  // Check if user is regular user
  const isUser = () => {
    return currentUser && currentUser.role === 'user';
  };

  const value = {
    currentUser,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile,
    hasRole,
    hasAnyRole,
    isAdmin,
    isUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
