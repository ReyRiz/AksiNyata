import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { campaignService, donationService } from '../services/api';
import { getImageUrl } from '../utils/apiConfig';

const CampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  
  // Donation form state
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [donationForm, setDonationForm] = useState({
    amount: '',
    message: '',
    donor_name: '',
    is_anonymous: false
  });
  const [donationLoading, setDonationLoading] = useState(false);
  const [donationError, setDonationError] = useState('');

  const fetchCampaignDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await campaignService.getCampaignById(id);
      setCampaign(response);
      setError('');
    } catch (error) {
      console.error('Error fetching campaign:', error);
      setError('Failed to load campaign details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCampaignDetails();
  }, [fetchCampaignDetails]);

  const handleFollowCampaign = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      setFollowLoading(true);
      const response = await campaignService.followCampaign(id);
      setIsFollowing(response.is_following);
      // Update followers count in campaign
      setCampaign(prev => ({
        ...prev,
        followers_count: response.followers_count
      }));
    } catch (error) {
      console.error('Error following campaign:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleDonationSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateDonation()) {
      return;
    }

    try {
      setDonationLoading(true);
      setDonationError('');
      
      const donationData = {
        campaign_id: parseInt(id),
        amount: parseFloat(donationForm.amount),
        message: donationForm.message,
        donor_name: donationForm.is_anonymous ? null : (donationForm.donor_name || currentUser?.name),
        is_anonymous: donationForm.is_anonymous
      };

      await donationService.makeDonation(donationData);
      
      // Close modal and refresh campaign data
      setShowDonationModal(false);
      setDonationForm({
        amount: '',
        message: '',
        donor_name: '',
        is_anonymous: false
      });
      
      // Refresh campaign to show new donation
      fetchCampaignDetails();
      
      alert('Thank you for your donation! Your contribution makes a difference.');
      
    } catch (error) {
      console.error('Error making donation:', error);
      setDonationError(error.error || 'Failed to process donation. Please try again.');
    } finally {
      setDonationLoading(false);
    }
  };

  const validateDonation = () => {
    if (!donationForm.amount || parseFloat(donationForm.amount) <= 0) {
      setDonationError('Please enter a valid donation amount');
      return false;
    }
    
    if (parseFloat(donationForm.amount) < 10000) {
      setDonationError('Minimum donation amount is Rp 10,000');
      return false;
    }
    
    if (!donationForm.is_anonymous && !donationForm.donor_name && !currentUser?.name) {
      setDonationError('Please enter your name or choose to donate anonymously');
      return false;
    }
    
    return true;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysRemaining = (deadline) => {
    if (!deadline) return null;
    const now = new Date();
    const end = new Date(deadline);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading campaign details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <div className="text-center">
          <div className="text-danger mb-3" style={{ fontSize: '4rem' }}>⚠️</div>
          <h2 className="h3 fw-bold text-dark mb-3">Error</h2>
          <p className="text-muted mb-4">{error}</p>
          <button
            onClick={() => navigate('/campaigns')}
            className="btn btn-primary px-4 py-2"
          >
            Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <div className="text-center">
          <div className="text-muted mb-3" style={{ fontSize: '4rem' }}>🔍</div>
          <h2 className="h3 fw-bold text-dark mb-3">Campaign Not Found</h2>
          <p className="text-muted mb-4">The campaign you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/campaigns')}
            className="btn btn-primary px-4 py-2"
          >
            Browse Campaigns
          </button>
        </div>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining(campaign.deadline);

  return (
    <div className="bg-light min-vh-100">
      {/* Hero Section */}
      <div className="campaign-hero shadow-sm">
        <div className="container py-5">
          <div className="row g-5">
            {/* Campaign Image */}
            <div className="col-lg-6">
              <div className="position-relative">
                <img
                  src={getImageUrl(campaign.image_url) || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDYwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRTVFN0VCIi8+Cjx0ZXh0IHg9IjMwMCIgeT0iMjAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM2QjcyODAiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K'}
                  alt={campaign.title}
                  className="campaign-image img-fluid rounded-3 w-100"
                  style={{ height: '400px', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDYwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRTVFN0VCIi8+Cjx0ZXh0IHg9IjMwMCIgeT0iMjAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM2QjcyODAiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K';
                  }}
                />
                {campaign.is_featured && (
                  <span className="badge-featured position-absolute top-0 start-0 m-3 badge text-dark fw-bold">
                    ⭐ Featured
                  </span>
                )}
                {campaign.is_urgent && (
                  <span className="badge-urgent position-absolute top-0 end-0 m-3 badge text-white fw-bold">
                    ⚠️ Urgent
                  </span>
                )}
              </div>
            </div>

            {/* Campaign Info */}
            <div className="col-lg-6">
              <div className="d-flex flex-column gap-4">
                {/* Category */}
                {campaign.category && (
                  <div>
                    <span className="badge bg-primary fs-6 px-3 py-2">
                      {campaign.category.name}
                    </span>
                  </div>
                )}

                {/* Title */}
                <h1 className="display-5 fw-bold text-dark">{campaign.title}</h1>

                {/* Creator */}
                <div className="d-flex align-items-center gap-3">
                  <div className="creator-avatar rounded-circle d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                    <span className="text-white fw-bold fs-5">
                      {campaign.creator.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <small className="text-muted">Campaign by</small>
                    <p className="fw-bold mb-0 text-dark">{campaign.creator.name}</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="stats-card border rounded-3 p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="h3 fw-bold text-success mb-0">
                      {formatCurrency(campaign.current_amount)}
                    </span>
                    <span className="text-muted">
                      of {formatCurrency(campaign.goal_amount)}
                    </span>
                  </div>
                  
                  <div className="progress mb-3" style={{ height: '12px' }}>
                    <div
                      className="progress-bar bg-success progress-animated"
                      style={{ width: `${Math.min(campaign.progress_percentage, 100)}%` }}
                    ></div>
                  </div>
                  
                  <div className="d-flex justify-content-between small text-muted">
                    <span>{campaign.progress_percentage.toFixed(1)}% funded</span>
                    <span>{campaign.donations_count} donors</span>
                  </div>
                </div>

                {/* Timeline */}
                <div className="row g-3">
                  <div className="col-6">
                    <small className="text-muted">Created</small>
                    <p className="fw-semibold mb-0">{formatDate(campaign.created_at)}</p>
                  </div>
                  {daysRemaining !== null && (
                    <div className="col-6">
                      <small className="text-muted">Days left</small>
                      <p className={`fw-semibold mb-0 ${daysRemaining < 7 ? 'text-danger' : 'text-dark'}`}>
                        {daysRemaining === 0 ? 'Campaign ended' : `${daysRemaining} days`}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="d-flex flex-column flex-sm-row gap-3">
                  <button
                    onClick={() => {
                      if (!currentUser) {
                        navigate('/login');
                        return;
                      }
                      setShowDonationModal(true);
                    }}
                    className="btn btn-donate btn-lg flex-fill fw-semibold text-white"
                    disabled={daysRemaining === 0}
                  >
                    {daysRemaining === 0 ? 'Campaign Ended' : '💝 Donate Now'}
                  </button>
                  
                  {currentUser && (
                    <button
                      onClick={handleFollowCampaign}
                      disabled={followLoading}
                      className={`btn btn-lg ${
                        isFollowing
                          ? 'btn-outline-primary'
                          : 'btn-outline-secondary'
                      }`}
                    >
                      {followLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Loading...
                        </>
                      ) : isFollowing ? (
                        '👁️ Following'
                      ) : (
                        '👁️ Follow'
                      )}
                    </button>
                  )}
                </div>

                {/* Followers Count */}
                <p className="small text-muted mb-0">
                  👥 {campaign.followers_count} people are following this campaign
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-5">
        <div className="row g-5">
          {/* Description and Updates */}
          <div className="col-lg-8">
            <div className="d-flex flex-column gap-4">
              {/* Description */}
              <div className="card card-enhanced">
                <div className="card-body p-4">
                  <h2 className="h3 fw-bold text-dark mb-4">📖 About This Campaign</h2>
                  <div className="text-muted lh-lg">
                    <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                      {campaign.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Updates */}
              {campaign.updates && campaign.updates.length > 0 && (
                <div className="card card-enhanced">
                  <div className="card-body p-4">
                    <h2 className="h3 fw-bold text-dark mb-4">📢 Campaign Updates</h2>
                    <div className="d-flex flex-column gap-4">
                      {campaign.updates.map((update) => (
                        <div key={update.id} className="border-start border-primary border-4 ps-4">
                          <h3 className="h5 fw-semibold text-dark mb-2">
                            {update.title}
                          </h3>
                          <p className="text-muted mb-2">{update.content}</p>
                          <p className="small text-muted mb-0">
                            <i className="bi bi-clock me-1"></i>
                            {formatDate(update.created_at)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-lg-4">
            <div className="d-flex flex-column gap-4">
              {/* Recent Donations */}
              <div className="card card-enhanced">
                <div className="card-body p-4">
                  <h3 className="h4 fw-bold text-dark mb-4">💖 Recent Donations</h3>
                  {campaign.recent_donations && campaign.recent_donations.length > 0 ? (
                    <div className="d-flex flex-column gap-3">
                      {campaign.recent_donations.map((donation) => (
                        <div key={donation.id} className="donation-item border-bottom pb-3 px-2">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <span className="fw-semibold text-dark">
                              👤 {donation.donor_name || 'Anonymous'}
                            </span>
                            <span className="fw-bold text-success">
                              {formatCurrency(donation.amount)}
                            </span>
                          </div>
                          {donation.message && (
                            <p className="small text-muted fst-italic mb-2">
                              💬 "{donation.message}"
                            </p>
                          )}
                          <p className="small text-muted mb-0">
                            🕒 {formatDate(donation.created_at)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-muted mb-2" style={{ fontSize: '2rem' }}>💝</div>
                      <p className="text-muted small mb-0">No donations yet. Be the first to donate!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Campaign Stats */}
              <div className="card card-enhanced">
                <div className="card-body p-4">
                  <h3 className="h4 fw-bold text-dark mb-4">📊 Campaign Stats</h3>
                  <div className="d-flex flex-column gap-3">
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">💰 Total Raised</span>
                      <span className="fw-semibold text-dark">{formatCurrency(campaign.current_amount)}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">🎯 Goal</span>
                      <span className="fw-semibold text-dark">{formatCurrency(campaign.goal_amount)}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">👥 Donors</span>
                      <span className="fw-semibold text-dark">{campaign.donations_count}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">👁️ Followers</span>
                      <span className="fw-semibold text-dark">{campaign.followers_count}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">📈 Progress</span>
                      <span className="fw-semibold text-success">{campaign.progress_percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Donation Modal */}
      {showDonationModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">💝 Make a Donation</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDonationModal(false)}
                ></button>
              </div>

              <form onSubmit={handleDonationSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    {/* Amount */}
                    <div className="col-12">
                      <label className="form-label fw-semibold">
                        Donation Amount (Rp) <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        className="form-control form-control-lg"
                        value={donationForm.amount}
                        onChange={(e) => setDonationForm(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="10,000"
                        min="10000"
                        step="1000"
                        required
                      />
                      <div className="form-text">Minimum donation amount is Rp 10,000</div>
                    </div>

                    {/* Anonymous Checkbox */}
                    <div className="col-12">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="anonymous"
                          checked={donationForm.is_anonymous}
                          onChange={(e) => setDonationForm(prev => ({ ...prev, is_anonymous: e.target.checked }))}
                        />
                        <label className="form-check-label" htmlFor="anonymous">
                          🔒 Donate anonymously
                        </label>
                      </div>
                    </div>

                    {/* Donor Name */}
                    {!donationForm.is_anonymous && (
                      <div className="col-12">
                        <label className="form-label fw-semibold">
                          Your Name {!currentUser && <span className="text-danger">*</span>}
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={donationForm.donor_name || (currentUser?.name || '')}
                          onChange={(e) => setDonationForm(prev => ({ ...prev, donor_name: e.target.value }))}
                          placeholder="Enter your name"
                          required={!currentUser && !donationForm.is_anonymous}
                        />
                      </div>
                    )}

                    {/* Message */}
                    <div className="col-12">
                      <label className="form-label fw-semibold">
                        Message of Support (optional)
                      </label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={donationForm.message}
                        onChange={(e) => setDonationForm(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Leave a message of support..."
                      />
                    </div>

                    {/* Error */}
                    {donationError && (
                      <div className="col-12">
                        <div className="alert alert-danger d-flex align-items-center" role="alert">
                          <span className="me-2">⚠️</span>
                          <div>{donationError}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowDonationModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={donationLoading}
                  >
                    {donationLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Processing...
                      </>
                    ) : (
                      '💝 Donate Now'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignDetail;
