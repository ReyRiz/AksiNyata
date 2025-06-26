import axios from 'axios';

// Configure axios instance with base URL
const API_BASE_URL = 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include token in headers
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Token expired or invalid, remove from storage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// Utility function to build full image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath || imagePath.trim() === '') {
    return null;
  }
  
  let fullUrl;
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) {
    fullUrl = imagePath;
  }
  // If it's a relative path, build full URL
  else if (imagePath.startsWith('/')) {
    fullUrl = `http://localhost:5000${imagePath}`;
  }
  // If it doesn't start with /, add it
  else {
    fullUrl = `http://localhost:5000/${imagePath}`;
  }
  
  return fullUrl;
};
