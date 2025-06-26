import apiClient from '../utils/apiConfig';

// Campaign API methods
export const campaignService = {
  // Get all campaigns
  getAllCampaigns: async (filters = {}) => {
    try {
      const response = await apiClient.get('/campaigns', { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch campaigns' };
    }
  },
  
  // Get campaign by ID
  getCampaignById: async (id) => {
    try {
      const response = await apiClient.get(`/campaigns/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch campaign' };
    }
  },
  
  // Create new campaign
  createCampaign: async (campaignData) => {
    try {
      const response = await apiClient.post('/campaigns', campaignData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to create campaign' };
    }
  },
  
  // Update campaign
  updateCampaign: async (id, campaignData) => {
    try {
      const response = await apiClient.put(`/campaigns/${id}`, campaignData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to update campaign' };
    }
  },
  
  // Get user's campaigns
  getMyCampaigns: async (filters = {}) => {
    try {
      const response = await apiClient.get('/campaigns/my-campaigns', { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch user campaigns' };
    }
  },
  
  // Follow/unfollow campaign
  followCampaign: async (campaignId) => {
    try {
      const response = await apiClient.post(`/campaigns/${campaignId}/follow`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to follow/unfollow campaign' };
    }
  },
  
  // Create campaign update
  createCampaignUpdate: async (campaignId, updateData) => {
    try {
      const response = await apiClient.post(`/campaigns/${campaignId}/updates`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to create campaign update' };
    }
  },
  
  // Get categories
  getCategories: async () => {
    try {
      const response = await apiClient.get('/campaigns/categories');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch categories' };
    }
  },
  
  // Upload campaign image
  uploadCampaignImage: async (imageFile) => {
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      const response = await apiClient.post('/campaigns/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to upload image' };
    }
  },
  
  // Legacy methods for backward compatibility - will be removed
  getOrganizerCampaigns: async (organizerId) => {
    try {
      const response = await apiClient.get('/campaigns', { 
        params: { creator_id: organizerId } 
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch organizer campaigns' };
    }
  },
  
  // Add milestone to campaign - kept for backward compatibility
  addMilestone: async (campaignId, milestoneData) => {
    try {
      const response = await apiClient.post(`/donations/campaigns/${campaignId}/milestones`, milestoneData);
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
      
      const response = await apiClient.post('/donations/donate', formData, {
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
      const response = await apiClient.get('/users/donations');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch user donations' };
    }
  },
  
  // Get pending donations for verification (organizer only)
  getPendingDonations: async (campaignId = null) => {
    try {
      const params = campaignId ? { campaign_id: campaignId } : {};
      const response = await apiClient.get('/donations/pending', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch pending donations' };
    }
  },
  
  // Verify donation (organizer only)
  verifyDonation: async (donationId, status) => {
    try {
      const response = await apiClient.put(`/donations/${donationId}/verify`, { status });
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
      const response = await apiClient.get('/users/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch profile' };
    }
  },
  
  // Update user profile
  updateProfile: async (formData) => {
    try {
      const response = await apiClient.put('/users/profile', formData, {
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
      const response = await apiClient.get('/users/organizers');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch organizers' };
    }
  },
  
  // Change user role (for admin)
  changeUserRole: async (userId, role) => {
    try {
      const response = await apiClient.put(`/users/change-role/${userId}`, { role });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to change user role' };
    }
  }
};

// Authentication methods
export const login = async (credentials) => {
  try {
    const response = await apiClient.post('/auth/login', credentials);
    localStorage.setItem('token', response.data.access_token);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Login failed' };
  }
};

export const register = async (userData) => {
  try {
    const response = await apiClient.post('/auth/register', userData);
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
    const response = await apiClient.get('/users/profile');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch profile' };
  }
};

export const updateUserProfile = async (profileData) => {
  try {
    const response = await apiClient.put('/users/profile', profileData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to update profile' };
  }
};

// Campaign methods
export const getCampaigns = async (filters = {}) => {
  try {
    const response = await apiClient.get('/donations/campaigns', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch campaigns' };
  }
};

export const getCampaignById = async (id) => {
  try {
    const response = await apiClient.get(`/donations/campaigns/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch campaign' };
  }
};

export const createCampaign = async (campaignData) => {
  try {
    const response = await apiClient.post('/donations/campaigns', campaignData, {
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
    const response = await apiClient.put(`/donations/campaigns/${id}`, campaignData, {
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
    const response = await apiClient.get(`/donations/campaigns/${campaignId}/donations`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch campaign donations' };
  }
};

export const updateMilestone = async (campaignId, milestoneId, milestoneData) => {
  try {
    const response = await apiClient.put(`/donations/campaigns/${campaignId}/milestones/${milestoneId}`, milestoneData);
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
    
    const response = await apiClient.post('/donations/donate', formData, {
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
    const response = await apiClient.get('/donations', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch donations' };
  }
};

export const verifyDonation = async (donationId) => {
  try {
    const response = await apiClient.put(`/donations/${donationId}/verify`, { status: 'verified' });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to verify donation' };
  }
};

export const rejectDonation = async (donationId, rejectData) => {
  try {
    const response = await apiClient.put(`/donations/${donationId}/verify`, { 
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
    const response = await apiClient.get('/users');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch users' };
  }
};

export const updateUserRole = async (userId, roleData) => {
  try {
    const response = await apiClient.put(`/users/${userId}/role`, roleData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to update user role' };
  }
};

export const deactivateUser = async (userId) => {
  try {
    const response = await apiClient.put(`/users/${userId}/deactivate`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to deactivate user' };
  }
};

export const activateUser = async (userId) => {
  try {
    const response = await apiClient.put(`/users/${userId}/activate`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to activate user' };
  }
};

// Admin API methods
export const adminService = {
  // Get admin dashboard data
  getDashboard: async () => {
    try {
      const response = await apiClient.get('/admin/dashboard');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch admin dashboard' };
    }
  },

  // Get pending campaigns
  getPendingCampaigns: async () => {
    try {
      const response = await apiClient.get('/admin/campaigns/pending');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch pending campaigns' };
    }
  },

  // Approve campaign
  approveCampaign: async (campaignId) => {
    try {
      const response = await apiClient.put(`/admin/campaigns/${campaignId}/approve`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to approve campaign' };
    }
  },

  // Reject campaign
  rejectCampaign: async (campaignId, reason) => {
    try {
      const response = await apiClient.put(`/admin/campaigns/${campaignId}/reject`, { reason });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to reject campaign' };
    }
  },

  // Toggle featured campaign
  toggleFeaturedCampaign: async (campaignId) => {
    try {
      const response = await apiClient.put(`/admin/campaigns/${campaignId}/feature`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to toggle featured status' };
    }
  },

  // Get all users
  getAllUsers: async (params = {}) => {
    try {
      const response = await apiClient.get('/admin/users', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch users' };
    }
  },

  // Toggle user active status
  toggleUserActive: async (userId) => {
    try {
      const response = await apiClient.put(`/admin/users/${userId}/toggle-active`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to toggle user status' };
    }
  },

  // Get categories
  getCategories: async () => {
    try {
      const response = await apiClient.get('/admin/categories');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch categories' };
    }
  },

  // Create category
  createCategory: async (categoryData) => {
    try {
      const response = await apiClient.post('/admin/categories', categoryData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to create category' };
    }
  }
};

// Dashboard data
export const getDashboardData = async () => {
  try {
    const response = await apiClient.get('/users/dashboard');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch dashboard data' };
  }
};

const apiServices = {
  campaignService,
  donationService,
  userService,
  adminService,
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

export default apiServices;
