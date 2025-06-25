import axios from 'axios';

// Set up axios instance with default configs
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include token in headers
api.interceptors.request.use(
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

// Campaign API methods
export const campaignService = {
  // Get all campaigns
  getAllCampaigns: async (filters = {}) => {
    try {
      const response = await api.get('/donations/campaigns', { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch campaigns' };
    }
  },
  
  // Get campaign by ID
  getCampaignById: async (id) => {
    try {
      const response = await api.get(`/donations/campaigns/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch campaign' };
    }
  },
  
  // Create new campaign
  createCampaign: async (formData) => {
    try {
      const response = await api.post('/donations/campaigns', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to create campaign' };
    }
  },
  
  // Update campaign
  updateCampaign: async (id, formData) => {
    try {
      const response = await api.put(`/donations/campaigns/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to update campaign' };
    }
  },
  
  // Get campaigns by organizer
  getOrganizerCampaigns: async (organizerId) => {
    try {
      const response = await api.get('/donations/campaigns', { 
        params: { organizer_id: organizerId } 
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch organizer campaigns' };
    }
  },
  
  // Add milestone to campaign
  addMilestone: async (campaignId, milestoneData) => {
    try {
      const response = await api.post(`/donations/campaigns/${campaignId}/milestones`, milestoneData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to add milestone' };
    }
  }
};

// Donation API methods
export const donationService = {
  // Make a donation
  makeDonation: async (donationData) => {
    try {
      const formData = new FormData();
      
      // Append form fields
      Object.keys(donationData).forEach(key => {
        if (key === 'transfer_proof' && donationData[key] instanceof File) {
          formData.append(key, donationData[key]);
        } else {
          formData.append(key, donationData[key]);
        }
      });
      
      const response = await api.post('/donations/donate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to make donation' };
    }
  },
  
  // Get user donations
  getUserDonations: async () => {
    try {
      const response = await api.get('/users/donations');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch user donations' };
    }
  },
  
  // Get pending donations for verification (organizer only)
  getPendingDonations: async (campaignId = null) => {
    try {
      const params = campaignId ? { campaign_id: campaignId } : {};
      const response = await api.get('/donations/pending', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch pending donations' };
    }
  },
  
  // Verify donation (organizer only)
  verifyDonation: async (donationId, status) => {
    try {
      const response = await api.put(`/donations/${donationId}/verify`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to verify donation' };
    }
  }
};

// User API methods
export const userService = {
  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch profile' };
    }
  },
  
  // Update user profile
  updateProfile: async (formData) => {
    try {
      const response = await api.put('/users/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to update profile' };
    }
  },
  
  // Get all organizers (for admin)
  getOrganizers: async () => {
    try {
      const response = await api.get('/users/organizers');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch organizers' };
    }
  },
  
  // Change user role (for admin)
  changeUserRole: async (userId, role) => {
    try {
      const response = await api.put(`/users/change-role/${userId}`, { role });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to change user role' };
    }
  }
};

// Authentication methods
export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    localStorage.setItem('token', response.data.access_token);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Login failed' };
  }
};

export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Registration failed' };
  }
};

export const logout = () => {
  localStorage.removeItem('token');
};

// User profile methods
export const getUserProfile = async () => {
  try {
    const response = await api.get('/users/profile');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch profile' };
  }
};

export const updateUserProfile = async (profileData) => {
  try {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to update profile' };
  }
};

// Campaign methods
export const getCampaigns = async (filters = {}) => {
  try {
    const response = await api.get('/donations/campaigns', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch campaigns' };
  }
};

export const getCampaignById = async (id) => {
  try {
    const response = await api.get(`/donations/campaigns/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch campaign' };
  }
};

export const createCampaign = async (campaignData) => {
  try {
    const response = await api.post('/donations/campaigns', campaignData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to create campaign' };
  }
};

export const updateCampaign = async (id, campaignData) => {
  try {
    const response = await api.put(`/donations/campaigns/${id}`, campaignData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to update campaign' };
  }
};

export const getCampaignDonations = async (campaignId) => {
  try {
    const response = await api.get(`/donations/campaigns/${campaignId}/donations`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch campaign donations' };
  }
};

export const updateMilestone = async (campaignId, milestoneId, milestoneData) => {
  try {
    const response = await api.put(`/donations/campaigns/${campaignId}/milestones/${milestoneId}`, milestoneData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to update milestone' };
  }
};

// Donation methods
export const makeDonation = async (donationData) => {
  try {
    const formData = new FormData();
    
    // Append form fields
    Object.keys(donationData).forEach(key => {
      if (key === 'proof_of_transfer' && donationData[key] instanceof File) {
        formData.append(key, donationData[key]);
      } else {
        formData.append(key, donationData[key]);
      }
    });
    
    const response = await api.post('/donations/donate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to make donation' };
  }
};

export const getAllDonations = async (filters = {}) => {
  try {
    const response = await api.get('/donations', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch donations' };
  }
};

export const verifyDonation = async (donationId) => {
  try {
    const response = await api.put(`/donations/${donationId}/verify`, { status: 'verified' });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to verify donation' };
  }
};

export const rejectDonation = async (donationId, rejectData) => {
  try {
    const response = await api.put(`/donations/${donationId}/verify`, { 
      status: 'rejected',
      rejection_reason: rejectData.reason
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to reject donation' };
  }
};

// User management methods
export const getAllUsers = async () => {
  try {
    const response = await api.get('/users');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch users' };
  }
};

export const updateUserRole = async (userId, roleData) => {
  try {
    const response = await api.put(`/users/${userId}/role`, roleData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to update user role' };
  }
};

export const deactivateUser = async (userId) => {
  try {
    const response = await api.put(`/users/${userId}/deactivate`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to deactivate user' };
  }
};

export const activateUser = async (userId) => {
  try {
    const response = await api.put(`/users/${userId}/activate`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to activate user' };
  }
};

// Dashboard data
export const getDashboardData = async () => {
  try {
    const response = await api.get('/users/dashboard');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch dashboard data' };
  }
};

export default {
  campaignService,
  donationService,
  userService,
  login,
  register,
  logout,
  getUserProfile,
  updateUserProfile,
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  getCampaignDonations,
  updateMilestone,
  makeDonation,
  getAllDonations,
  verifyDonation,
  rejectDonation,
  getAllUsers,
  updateUserRole,
  deactivateUser,
  activateUser,
  getDashboardData
};
