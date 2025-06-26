import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { campaignService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { getImageUrl } from '../utils/apiConfig';

const CampaignList = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    category_id: '',
    featured: null,
    urgent: null,
    page: 1,
    per_page: 12
  });
  const [pagination, setPagination] = useState({});

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const response = await campaignService.getAllCampaigns(filters);
      setCampaigns(response.campaigns || []);
      setPagination(response.pagination || {});
      setError('');
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setError('Failed to load campaigns. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await campaignService.getCategories();
      setCategories(response.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
    fetchCategories();
  }, [fetchCampaigns, fetchCategories]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCampaigns();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getDaysRemaining = (deadline) => {
    if (!deadline) return null;
    const now = new Date();
    const end = new Date(deadline);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const CampaignCard = ({ campaign }) => {
    const daysRemaining = getDaysRemaining(campaign.deadline);
    
    return (
      <div className="col-lg-4 col-md-6 mb-4">
        <div className="card modern-card h-100 shadow-lg border-0">
          <div className="position-relative overflow-hidden">
            <img
              src={getImageUrl(campaign.image_url) || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRTVFN0VCIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2QjcyODAiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K'}
              alt={campaign.title}
              className="card-img-top"
              style={{height: '250px', objectFit: 'cover'}}
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRTVFN0VCIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2QjcyODAiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K';
              }}
            />
            
            {/* Badges */}
            <div className="position-absolute top-0 start-0 p-3">
              {campaign.is_featured && (
                <span className="badge bg-warning text-dark fw-bold mb-2 d-block animate-glow">
                  ⭐ Featured
                </span>
              )}
              {campaign.is_urgent && (
                <span className="badge bg-danger fw-bold">
                  ⚠️ Urgent
                </span>
              )}
            </div>

            {/* Progress overlay */}
            <div className="position-absolute bottom-0 start-0 end-0 p-3" style={{background: 'linear-gradient(transparent, rgba(0,0,0,0.7))'}}>
              <div className="d-flex justify-content-between text-white small mb-2">
                <span>Progress</span>
                <span className="fw-bold">{campaign.progress_percentage?.toFixed(1) || 0}%</span>
              </div>
              <div className="progress" style={{height: '8px'}}>
                <div 
                  className="progress-bar bg-success" 
                  style={{width: `${Math.min(campaign.progress_percentage || 0, 100)}%`}}
                ></div>
              </div>
            </div>
          </div>

          <div className="card-body d-flex flex-column">
            {/* Category */}
            {campaign.category && (
              <div className="mb-3">
                <span className="category-pill">{campaign.category.name}</span>
              </div>
            )}

            {/* Title */}
            <h5 className="card-title fw-bold mb-3 line-clamp-2">{campaign.title}</h5>

            {/* Description */}
            <p className="card-text text-muted mb-3 line-clamp-3">{campaign.description}</p>

            {/* Stats */}
            <div className="row g-2 mb-3">
              <div className="col-6">
                <div className="text-center p-3 bg-light rounded-3">
                  <div className="fw-bold text-success">{formatCurrency(campaign.current_amount || 0)}</div>
                  <small className="text-muted">Raised</small>
                </div>
              </div>
              <div className="col-6">
                <div className="text-center p-3 bg-light rounded-3">
                  <div className="fw-bold text-primary">{formatCurrency(campaign.goal_amount || 0)}</div>
                  <small className="text-muted">Goal</small>
                </div>
              </div>
            </div>

            {/* Additional info */}
            <div className="d-flex justify-content-between align-items-center mb-3 text-muted small">
              <span>
                👥 {campaign.donations_count || 0} donors
              </span>
              {daysRemaining !== null && (
                <span className={daysRemaining < 7 ? 'text-danger fw-bold' : 'text-muted'}>
                  ⏰ {daysRemaining === 0 ? 'Ended' : `${daysRemaining} days left`}
                </span>
              )}
            </div>

            {/* Creator */}
            <div className="d-flex align-items-center mb-3 p-3 bg-light rounded-3">
              <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3" style={{width: '45px', height: '45px'}}>
                <strong>{campaign.creator?.name?.charAt(0)?.toUpperCase() || 'U'}</strong>
              </div>
              <div>
                <small className="text-muted">Campaign by</small>
                <div className="fw-semibold">{campaign.creator?.name || 'Unknown'}</div>
              </div>
            </div>

            {/* Action button */}
            <Link
              to={`/campaigns/${campaign.id}`}
              className="btn btn-primary mt-auto fw-bold"
              style={{borderRadius: '12px', padding: '12px'}}
            >
              Support Campaign →
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="campaign-list-container">
      {/* Modern Hero Section */}
      <div className="modern-hero text-white">
        <div className="container position-relative" style={{zIndex: 2}}>
          <div className="row align-items-center min-vh-50">
            <div className="col-lg-8 mx-auto text-center">
              <div className="badge bg-light text-primary px-4 py-2 rounded-pill mb-4 animate-float">
                ⭐ Trusted by thousands of donors
              </div>
              <h1 className="display-3 fw-bold mb-4">
                <span className="d-block">Campaigns for</span>
                <span className="gradient-text">Change</span>
              </h1>
              <p className="lead mb-5 fs-4">
                Discover meaningful campaigns and make a difference in communities worldwide
              </p>
              <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
                {currentUser && (
                  <button
                    onClick={() => navigate('/campaigns/create')}
                    className="btn btn-light btn-lg px-5 py-3 fw-bold shadow-lg"
                    style={{borderRadius: '15px'}}
                  >
                    ➕ Start Your Campaign
                  </button>
                )}
                <button className="btn btn-outline-light btn-lg px-5 py-3 fw-bold" style={{borderRadius: '15px'}}>
                  ℹ️ Learn More
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="container my-5">
        <div className="modern-card shadow-lg border-0 mb-5">
          <div className="card-body p-4">
            <div className="row align-items-center mb-4">
              <div className="col-lg-8">
                <h2 className="h3 mb-2 fw-bold">🎯 Find Your Cause</h2>
                <p className="text-muted mb-0">Filter campaigns by category, search terms, or special features</p>
              </div>
              <div className="col-lg-4 text-lg-end">
                <div className="badge bg-primary text-white px-3 py-2 rounded-pill">
                  {campaigns.length} campaigns found
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSearch}>
              <div className="row g-3">
                <div className="col-lg-6">
                  <div className="input-group input-group-lg">
                    <span className="input-group-text bg-light border-end-0">🔍</span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Search campaigns by title or keyword..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </div>
                </div>

                <div className="col-lg-3">
                  <select
                    value={filters.category_id}
                    onChange={(e) => handleFilterChange('category_id', e.target.value)}
                    className="form-select form-select-lg"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-lg-3">
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleFilterChange('featured', filters.featured ? null : true)}
                      className={`btn flex-fill ${filters.featured ? 'btn-warning' : 'btn-outline-warning'} fw-bold`}
                    >
                      ⭐ Featured
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFilterChange('urgent', filters.urgent ? null : true)}
                      className={`btn flex-fill ${filters.urgent ? 'btn-danger' : 'btn-outline-danger'} fw-bold`}
                    >
                      ⚠️ Urgent
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="alert alert-danger d-flex align-items-center mb-4 shadow-sm" style={{borderRadius: '12px'}}>
            <div className="me-3 fs-4">❌</div>
            <div>{error}</div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="row">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="col-lg-4 col-md-6 mb-4">
                <div className="card modern-card shadow-lg">
                  <div className="placeholder-glow">
                    <div className="placeholder bg-light" style={{height: '250px', borderRadius: '12px 12px 0 0'}}></div>
                  </div>
                  <div className="card-body">
                    <div className="placeholder-glow">
                      <span className="placeholder col-6 mb-3"></span>
                      <span className="placeholder col-8 mb-3"></span>
                      <span className="placeholder col-12 mb-3"></span>
                      <span className="placeholder col-4"></span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-5">
            <div style={{fontSize: '5rem'}} className="text-muted mb-4">📁</div>
            <h3 className="h3 mb-3 fw-bold">No campaigns found</h3>
            <p className="text-muted mb-4 fs-5">
              {filters.search || filters.category_id || filters.featured !== null || filters.urgent !== null
                ? 'Try adjusting your filters to see more results.'
                : 'Be the first to create a campaign and make a difference!'}
            </p>
            {currentUser && (
              <button
                onClick={() => navigate('/campaigns/create')}
                className="btn btn-primary btn-lg px-5 py-3 fw-bold shadow-lg"
                style={{borderRadius: '15px'}}
              >
                ➕ Create First Campaign
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Campaign Grid */}
            <div className="row">
              {campaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <nav className="d-flex justify-content-center mt-5">
                <ul className="pagination pagination-lg shadow-sm">
                  <li className={`page-item ${!pagination.has_prev ? 'disabled' : ''}`}>
                    <button
                      className="page-link fw-bold"
                      onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
                      disabled={!pagination.has_prev}
                      style={{borderRadius: '12px 0 0 12px'}}
                    >
                      ← Previous
                    </button>
                  </li>
                  
                  {[...Array(Math.min(5, pagination.pages))].map((_, index) => {
                    const page = index + 1;
                    const isActive = page === filters.page;
                    return (
                      <li key={page} className={`page-item ${isActive ? 'active' : ''}`}>
                        <button
                          className="page-link fw-bold"
                          onClick={() => handleFilterChange('page', page)}
                        >
                          {page}
                        </button>
                      </li>
                    );
                  })}
                  
                  <li className={`page-item ${!pagination.has_next ? 'disabled' : ''}`}>
                    <button
                      className="page-link fw-bold"
                      onClick={() => handleFilterChange('page', Math.min(pagination.pages, filters.page + 1))}
                      disabled={!pagination.has_next}
                      style={{borderRadius: '0 12px 12px 0'}}
                    >
                      Next →
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CampaignList;