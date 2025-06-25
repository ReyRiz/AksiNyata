import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Nav, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardData } from '../services/api';

const Dashboard = () => {
  const { currentUser, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState({
    campaigns: [],
    donations: [],
    pendingDonations: [],
    recentMilestones: [],
    stats: {
      totalDonated: 0,
      totalCampaigns: 0,
      activeCampaigns: 0,
      totalRaised: 0,
      pendingDonationsCount: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all dashboard data
      const response = await getDashboardData();
      
      setDashboardData({
        campaigns: response.campaigns || [],
        donations: response.donations || [],
        pendingDonations: response.pending_donations || [],
        recentMilestones: response.recent_milestones || [],
        stats: {
          totalDonated: response.stats?.total_donated || 0,
          totalCampaigns: response.stats?.total_campaigns || 0,
          activeCampaigns: response.stats?.active_campaigns || 0,
          totalRaised: response.stats?.total_raised || 0,
          pendingDonationsCount: response.stats?.pending_donations_count || 0
        }
      });
      
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Gagal memuat data dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);
  
  // Helper function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };
  
  // Helper function to format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };
  
  // Calculate dashboard statistics
  const getStatistics = () => {
    const stats = {
      totalDonations: dashboardData.donations.length,
      totalDonated: dashboardData.stats.totalDonated,
      totalCampaigns: dashboardData.stats.totalCampaigns,
      activeCampaigns: dashboardData.stats.activeCampaigns,
      completedCampaigns: dashboardData.campaigns.filter(c => c.status === 'completed').length,
      pendingDonations: dashboardData.stats.pendingDonationsCount,
      verifiedDonations: dashboardData.donations.filter(d => d.status === 'verified').length,
      totalRaised: dashboardData.stats.totalRaised
    };
    
    return stats;
  };
  
  const stats = getStatistics();
  
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Memuat dashboard...</p>
      </Container>
    );
  }
  
  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fw-bold">Dashboard</h1>
        
        {(hasRole('organizer') || hasRole('creator')) && (
          <Button as={Link} to="/campaigns/create" variant="primary">
            Buat Kampanye Baru
          </Button>
        )}
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Row>
        <Col md={3} className="mb-4">
          <div className="dashboard-sidebar">
            <h5 className="fw-bold mb-3">Menu</h5>
            
            <Nav className="flex-column">
              <Nav.Link 
                className={activeTab === 'overview' ? 'active' : ''} 
                onClick={() => setActiveTab('overview')}
              >
                <i className="bi bi-grid-1x2-fill me-2"></i> Ringkasan
              </Nav.Link>
              
              {(hasRole('organizer') || hasRole('creator')) && (
                <Nav.Link 
                  className={activeTab === 'campaigns' ? 'active' : ''} 
                  onClick={() => setActiveTab('campaigns')}
                >
                  <i className="bi bi-megaphone-fill me-2"></i> Kampanye Saya
                </Nav.Link>
              )}
              
              <Nav.Link 
                className={activeTab === 'donations' ? 'active' : ''} 
                onClick={() => setActiveTab('donations')}
              >
                <i className="bi bi-heart-fill me-2"></i> Donasi Saya
              </Nav.Link>
              
              {hasRole('organizer') && (
                <Nav.Link 
                  className={activeTab === 'verification' ? 'active' : ''} 
                  onClick={() => setActiveTab('verification')}
                >
                  <i className="bi bi-check-circle-fill me-2"></i> Verifikasi Donasi
                </Nav.Link>
              )}
              
              <Nav.Link 
                className={activeTab === 'profile' ? 'active' : ''} 
                onClick={() => setActiveTab('profile')}
                as={Link} to="/profile"
              >
                <i className="bi bi-person-fill me-2"></i> Profil Saya
              </Nav.Link>
            </Nav>
          </div>
        </Col>
        
        <Col md={9}>
          {activeTab === 'overview' && (
            <>
              <div className="dashboard-card">
                <h3>Selamat Datang, {currentUser.full_name}!</h3>
                <p>
                  Sebagai <span className={`role-badge role-${currentUser.role}`}>{currentUser.role}</span>, 
                  Anda dapat {currentUser.role === 'donor' ? 'berdonasi ke berbagai kampanye' : 
                    currentUser.role === 'creator' ? 'membuat dan mengelola kampanye donasi' : 
                    'mengelola kampanye dan memverifikasi donasi'}.
                </p>
              </div>
              
              <Row>
                {(hasRole('organizer') || hasRole('creator')) && (
                  <>
                    <Col md={4} className="mb-4">
                      <Card className="h-100 border-0 shadow-sm text-center">
                        <Card.Body>
                          <div className="bg-light-green rounded-circle d-flex justify-content-center align-items-center mx-auto mb-3" style={{ width: '60px', height: '60px' }}>
                            <i className="bi bi-megaphone-fill text-primary fs-4"></i>
                          </div>
                          <h5 className="fw-bold">{stats.totalCampaigns}</h5>
                          <p className="text-muted mb-0">Total Kampanye</p>
                        </Card.Body>
                      </Card>
                    </Col>
                    
                    <Col md={4} className="mb-4">
                      <Card className="h-100 border-0 shadow-sm text-center">
                        <Card.Body>
                          <div className="bg-light-green rounded-circle d-flex justify-content-center align-items-center mx-auto mb-3" style={{ width: '60px', height: '60px' }}>
                            <i className="bi bi-play-circle-fill text-primary fs-4"></i>
                          </div>
                          <h5 className="fw-bold">{stats.activeCampaigns}</h5>
                          <p className="text-muted mb-0">Kampanye Aktif</p>
                        </Card.Body>
                      </Card>
                    </Col>
                    
                    <Col md={4} className="mb-4">
                      <Card className="h-100 border-0 shadow-sm text-center">
                        <Card.Body>
                          <div className="bg-light-green rounded-circle d-flex justify-content-center align-items-center mx-auto mb-3" style={{ width: '60px', height: '60px' }}>
                            <i className="bi bi-check-circle-fill text-primary fs-4"></i>
                          </div>
                          <h5 className="fw-bold">{stats.completedCampaigns}</h5>
                          <p className="text-muted mb-0">Kampanye Selesai</p>
                        </Card.Body>
                      </Card>
                    </Col>
                  </>
                )}
                
                <Col md={hasRole('donor') ? 4 : 6} className="mb-4">
                  <Card className="h-100 border-0 shadow-sm text-center">
                    <Card.Body>
                      <div className="bg-light-green rounded-circle d-flex justify-content-center align-items-center mx-auto mb-3" style={{ width: '60px', height: '60px' }}>
                        <i className="bi bi-heart-fill text-primary fs-4"></i>
                      </div>
                      <h5 className="fw-bold">{stats.totalDonations}</h5>
                      <p className="text-muted mb-0">Total Donasi</p>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={hasRole('donor') ? 4 : 6} className="mb-4">
                  <Card className="h-100 border-0 shadow-sm text-center">
                    <Card.Body>
                      <div className="bg-light-green rounded-circle d-flex justify-content-center align-items-center mx-auto mb-3" style={{ width: '60px', height: '60px' }}>
                        <i className="bi bi-wallet2 text-primary fs-4"></i>
                      </div>
                      <h5 className="fw-bold">{formatCurrency(stats.totalDonated)}</h5>
                      <p className="text-muted mb-0">Total Donasi Terverifikasi</p>
                    </Card.Body>
                  </Card>
                </Col>
                
                {hasRole('donor') && (
                  <Col md={4} className="mb-4">
                    <Card className="h-100 border-0 shadow-sm text-center">
                      <Card.Body>
                        <div className="bg-light-green rounded-circle d-flex justify-content-center align-items-center mx-auto mb-3" style={{ width: '60px', height: '60px' }}>
                          <i className="bi bi-hourglass-split text-primary fs-4"></i>
                        </div>
                        <h5 className="fw-bold">{stats.pendingDonations}</h5>
                        <p className="text-muted mb-0">Donasi Menunggu Verifikasi</p>
                      </Card.Body>
                    </Card>
                  </Col>
                )}
              </Row>
              
              <div className="dashboard-card">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3>Aktivitas Terbaru</h3>
                </div>
                
                {dashboardData.donations.length === 0 ? (
                  <p className="text-center py-3 text-muted">
                    Belum ada aktivitas donasi.
                  </p>
                ) : (
                  <div>
                    {dashboardData.donations.slice(0, 5).map(donation => (
                      <div key={donation.id} className="donation-item">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="mb-1 fw-bold">
                              <Link to={`/campaigns/${donation.campaign_id}`}>
                                {donation.campaign_title}
                              </Link>
                            </h6>
                            <p className="mb-1 text-primary fw-semibold">
                              {formatCurrency(donation.amount)}
                            </p>
                            <p className="mb-0 small text-muted">
                              {formatDate(donation.created_at)}
                            </p>
                          </div>
                          <div>
                            {donation.status === 'pending' ? (
                              <span className="badge bg-warning">Menunggu Verifikasi</span>
                            ) : donation.status === 'verified' ? (
                              <span className="badge bg-success">Terverifikasi</span>
                            ) : (
                              <span className="badge bg-danger">Ditolak</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="text-center mt-3">
                      <Button 
                        variant="link" 
                        onClick={() => setActiveTab('donations')}
                      >
                        Lihat Semua Donasi
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          
          {activeTab === 'campaigns' && (
            <div className="dashboard-card">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3>Kampanye Saya</h3>
                <Button as={Link} to="/campaigns/create" variant="primary" size="sm">
                  Buat Kampanye Baru
                </Button>
              </div>
              
              {dashboardData.campaigns.length === 0 ? (
                <div className="text-center py-4">
                  <p className="mb-3">Anda belum memiliki kampanye donasi.</p>
                  <Button as={Link} to="/campaigns/create" variant="primary">
                    Buat Kampanye Pertama
                  </Button>
                </div>
              ) : (
                <div>
                  {dashboardData.campaigns.map(campaign => (
                    <Card key={campaign.id} className="mb-3 border-0 shadow-sm">
                      <Card.Body>
                        <Row>
                          <Col md={2}>                              {campaign.image ? (
                              <img 
                                src={`http://localhost:5000/static/${campaign.image}`}
                                alt={campaign.title}
                                className="img-fluid rounded"
                                style={{ height: '80px', width: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://via.placeholder.com/150?text=Image+Not+Found';
                                }}
                              />
                            ) : (
                              <div 
                                className="bg-light d-flex align-items-center justify-content-center rounded"
                                style={{ height: '80px' }}
                              >
                                <i className="bi bi-image text-secondary"></i>
                              </div>
                            )}
                          </Col>
                          <Col md={7}>
                            <h5 className="fw-bold mb-1">
                              <Link to={`/campaigns/${campaign.id}`} className="text-decoration-none">
                                {campaign.title}
                              </Link>
                            </h5>
                            <p className="mb-2 small">
                              {formatCurrency(campaign.current_amount)} dari {formatCurrency(campaign.target_amount)} ({campaign.progress_percentage}%)
                            </p>
                            <div className="d-flex gap-2">
                              {campaign.status === 'active' ? (
                                <span className="badge bg-success">Aktif</span>
                              ) : campaign.status === 'completed' ? (
                                <span className="badge bg-primary">Selesai</span>
                              ) : (
                                <span className="badge bg-danger">Dibatalkan</span>
                              )}
                              <span className="badge bg-secondary">{campaign.donations.length} donasi</span>
                            </div>
                          </Col>
                          <Col md={3} className="d-flex align-items-center justify-content-end">
                            <Button 
                              as={Link} 
                              to={`/campaigns/manage/${campaign.id}`}
                              variant="outline-primary"
                              size="sm"
                              className="me-2"
                            >
                              Kelola
                            </Button>
                            <Button 
                              as={Link} 
                              to={`/campaigns/${campaign.id}`}
                              variant="outline-secondary"
                              size="sm"
                            >
                              Lihat
                            </Button>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'donations' && (
            <div className="dashboard-card">
              <h3>Donasi Saya</h3>
              
              {dashboardData.donations.length === 0 ? (
                <div className="text-center py-4">
                  <p className="mb-3">Anda belum melakukan donasi.</p>
                  <Button as={Link} to="/campaigns" variant="primary">
                    Jelajahi Kampanye
                  </Button>
                </div>
              ) : (
                <div>
                  {dashboardData.donations.map(donation => (
                    <Card key={donation.id} className="mb-3 border-0 shadow-sm">
                      <Card.Body>
                        <Row>
                          <Col md={9}>
                            <h5 className="fw-bold mb-1">
                              <Link to={`/campaigns/${donation.campaign_id}`} className="text-decoration-none">
                                {donation.campaign_title}
                              </Link>
                            </h5>
                            <p className="mb-1 text-primary fw-semibold">
                              {formatCurrency(donation.amount)}
                            </p>
                            {donation.message && (
                              <p className="mb-2 small fst-italic">"{donation.message}"</p>
                            )}
                            <p className="mb-0 small text-muted">
                              {formatDate(donation.created_at)}
                              {donation.verified_at && ` • Diverifikasi pada ${formatDate(donation.verified_at)}`}
                            </p>
                          </Col>
                          <Col md={3} className="d-flex flex-column align-items-end justify-content-center">
                            {donation.status === 'pending' ? (
                              <span className="badge bg-warning mb-2">Menunggu Verifikasi</span>
                            ) : donation.status === 'verified' ? (
                              <span className="badge bg-success mb-2">Terverifikasi</span>
                            ) : (
                              <span className="badge bg-danger mb-2">Ditolak</span>
                            )}
                            
                            {donation.transfer_proof && (
                              <Button 
                                as="a"
                                href={`http://localhost:5000/static/${donation.transfer_proof}`}
                                target="_blank"
                                variant="outline-secondary"
                                size="sm"
                                onClick={(e) => {
                                  if (!donation.transfer_proof) {
                                    e.preventDefault();
                                    alert('Bukti transfer tidak ditemukan');
                                  }
                                }}
                              >
                                Lihat Bukti Transfer
                              </Button>
                            )}
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'verification' && hasRole('organizer') && (
            <div className="dashboard-card">
              <h3>Verifikasi Donasi</h3>
              <p>
                Untuk memverifikasi donasi, silahkan kunjungi halaman 
                <Link to="/donations/verify"> Verifikasi Donasi</Link>.
              </p>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
