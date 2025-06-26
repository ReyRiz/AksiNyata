import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { campaignService } from '../services/api';

const CreateCampaign = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal_amount: '',
    category_id: '',
    deadline: '',
    image_url: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    fetchCategories();
  }, [currentUser, navigate]);

  const fetchCategories = async () => {
    try {
      const response = await campaignService.getCategories();
      setCategories(response.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors(prev => ({
          ...prev,
          image: 'Image size must be less than 5MB'
        }));
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Clear image error
      if (errors.image) {
        setErrors(prev => ({
          ...prev,
          image: ''
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Campaign title is required';
    } else if (formData.title.length < 10) {
      newErrors.title = 'Title must be at least 10 characters long';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Campaign description is required';
    } else if (formData.description.length < 50) {
      newErrors.description = 'Description must be at least 50 characters long';
    }
    
    if (!formData.goal_amount) {
      newErrors.goal_amount = 'Goal amount is required';
    } else if (parseInt(formData.goal_amount) < 100000) {
      newErrors.goal_amount = 'Goal amount must be at least IDR 100,000';
    }
    
    if (!formData.category_id) {
      newErrors.category_id = 'Please select a category';
    }
    
    if (!formData.deadline) {
      newErrors.deadline = 'Campaign deadline is required';
    } else {
      const selectedDate = new Date(formData.deadline);
      const minDate = new Date();
      minDate.setDate(minDate.getDate() + 7); // Minimum 7 days from now
      
      if (selectedDate < minDate) {
        newErrors.deadline = 'Deadline must be at least 7 days from now';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const submitData = {
        ...formData,
        goal_amount: parseInt(formData.goal_amount)
      };
      
      const response = await campaignService.createCampaign(submitData, imageFile);
      
      if (response.success) {
        navigate(`/campaigns/${response.campaign.id}`, {
          state: { message: 'Campaign created successfully!' }
        });
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      setErrors({ submit: error.response?.data?.message || 'Failed to create campaign. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="create-campaign-container">
      {/* Hero Section */}
      <div className="modern-hero text-white">
        <div className="container position-relative" style={{zIndex: 2}}>
          <div className="row align-items-center min-vh-50">
            <div className="col-lg-8 mx-auto text-center">
              <div className="badge bg-light text-primary px-4 py-2 rounded-pill mb-4 animate-float">
                ✨ Create Impact
              </div>
              <h1 className="display-3 fw-bold mb-4">
                <span className="d-block">Start Your</span>
                <span className="gradient-text">Campaign</span>
              </h1>
              <p className="lead mb-5 fs-4">
                Turn your vision into reality and make a difference in the world
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="container my-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="modern-card shadow-lg border-0">
              <div className="card-body p-5">
                <div className="text-center mb-5">
                  <h2 className="h3 fw-bold mb-2">📝 Campaign Details</h2>
                  <p className="text-muted">Fill in the information below to create your campaign</p>
                </div>

                {errors.submit && (
                  <div className="alert alert-danger d-flex align-items-center mb-4">
                    <div className="me-3 fs-4">❌</div>
                    <div>{errors.submit}</div>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Campaign Title */}
                  <div className="mb-4">
                    <label htmlFor="title" className="form-label fw-semibold">
                      Campaign Title <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control form-control-lg ${errors.title ? 'is-invalid' : ''}`}
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Enter a compelling campaign title..."
                      maxLength="100"
                    />
                    {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                    <div className="form-text">
                      {formData.title.length}/100 characters
                    </div>
                  </div>

                  {/* Campaign Description */}
                  <div className="mb-4">
                    <label htmlFor="description" className="form-label fw-semibold">
                      Campaign Description <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                      id="description"
                      name="description"
                      rows="6"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe your campaign, its goals, and why people should support it..."
                      maxLength="2000"
                    />
                    {errors.description && <div className="invalid-feedback">{errors.description}</div>}
                    <div className="form-text">
                      {formData.description.length}/2000 characters (minimum 50)
                    </div>
                  </div>

                  <div className="row">
                    {/* Goal Amount */}
                    <div className="col-md-6 mb-4">
                      <label htmlFor="goal_amount" className="form-label fw-semibold">
                        Goal Amount (IDR) <span className="text-danger">*</span>
                      </label>
                      <div className="input-group input-group-lg">
                        <span className="input-group-text">💰</span>
                        <input
                          type="number"
                          className={`form-control ${errors.goal_amount ? 'is-invalid' : ''}`}
                          id="goal_amount"
                          name="goal_amount"
                          value={formData.goal_amount}
                          onChange={handleInputChange}
                          placeholder="1000000"
                          min="100000"
                        />
                        {errors.goal_amount && <div className="invalid-feedback">{errors.goal_amount}</div>}
                      </div>
                      {formData.goal_amount && (
                        <div className="form-text text-success fw-semibold">
                          Target: {formatCurrency(formData.goal_amount)}
                        </div>
                      )}
                    </div>

                    {/* Category */}
                    <div className="col-md-6 mb-4">
                      <label htmlFor="category_id" className="form-label fw-semibold">
                        Category <span className="text-danger">*</span>
                      </label>
                      <select
                        className={`form-select form-select-lg ${errors.category_id ? 'is-invalid' : ''}`}
                        id="category_id"
                        name="category_id"
                        value={formData.category_id}
                        onChange={handleInputChange}
                      >
                        <option value="">Select a category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      {errors.category_id && <div className="invalid-feedback">{errors.category_id}</div>}
                    </div>
                  </div>

                  {/* Deadline */}
                  <div className="mb-4">
                    <label htmlFor="deadline" className="form-label fw-semibold">
                      Campaign Deadline <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className={`form-control form-control-lg ${errors.deadline ? 'is-invalid' : ''}`}
                      id="deadline"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleInputChange}
                      min={getMinDate()}
                    />
                    {errors.deadline && <div className="invalid-feedback">{errors.deadline}</div>}
                    <div className="form-text">
                      Campaign must run for at least 7 days
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      Campaign Image
                    </label>
                    <div className="card bg-light">
                      <div className="card-body text-center">
                        {imagePreview ? (
                          <div className="position-relative d-inline-block">
                            <img
                              src={imagePreview}
                              alt="Campaign preview"
                              className="img-fluid rounded shadow"
                              style={{maxHeight: '300px'}}
                            />
                            <button
                              type="button"
                              className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2"
                              onClick={() => {
                                setImageFile(null);
                                setImagePreview(null);
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="py-5">
                            <div className="mb-3" style={{fontSize: '3rem'}}>📸</div>
                            <h5 className="mb-3">Upload Campaign Image</h5>
                            <p className="text-muted mb-4">
                              Add an image to make your campaign more appealing
                            </p>
                            <input
                              type="file"
                              className="form-control d-none"
                              id="image"
                              accept="image/*"
                              onChange={handleImageUpload}
                            />
                            <label htmlFor="image" className="btn btn-outline-primary btn-lg">
                              Choose Image
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                    {errors.image && (
                      <div className="text-danger small mt-2">{errors.image}</div>
                    )}
                    <div className="form-text">
                      Supported formats: JPG, PNG, GIF. Maximum size: 5MB
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="d-grid gap-2">
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg fw-bold py-3"
                      disabled={loading}
                      style={{borderRadius: '12px'}}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Creating Campaign...
                        </>
                      ) : (
                        <>
                          🚀 Create Campaign
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-lg"
                      onClick={() => navigate('/campaigns')}
                      style={{borderRadius: '12px'}}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaign;
