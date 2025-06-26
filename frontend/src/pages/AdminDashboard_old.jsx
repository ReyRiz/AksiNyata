import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Table, 
  Button, 
  Badge, 
  Modal, 
  Form,
  Alert,
  Spinner 
} from 'react-bootstrap';
import { adminService } from '../services/api';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [pendingCampaigns, setPendingCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchDashboardData();
    fetchPendingCampaigns();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDashboard();
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.message || 'Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCampaigns = async () => {
    try {
      const data = await adminService.getPendingCampaigns();
      setPendingCampaigns(data.campaigns || []);
    } catch (err) {
      console.error('Failed to fetch pending campaigns:', err);
      setError(err.message || 'Gagal memuat kampanye pending');
    }
  };

  const handleApproveCampaign = async () => {
    if (!selectedCampaign) return;

    try {
      await adminService.approveCampaign(selectedCampaign.id);
      setSuccess(`Kampanye "${selectedCampaign.title}" berhasil disetujui!`);
      setShowApproveModal(false);
      setSelectedCampaign(null);
      fetchPendingCampaigns(); // Refresh data
      fetchDashboardData(); // Refresh stats
    } catch (err) {
      setError(err.message || 'Gagal menyetujui kampanye');
    }
  };

  const handleRejectCampaign = async () => {
    if (!selectedCampaign) return;

    try {
      await adminService.rejectCampaign(selectedCampaign.id, rejectionReason);
      setSuccess(`Kampanye "${selectedCampaign.title}" berhasil ditolak!`);
      setShowRejectModal(false);
      setSelectedCampaign(null);
      setRejectionReason('');
      fetchPendingCampaigns(); // Refresh data
      fetchDashboardData(); // Refresh stats
    } catch (err) {
      setError(err.message || 'Gagal menolak kampanye');
    }
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
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
      setSuccess(`Kampanye "${selectedCampaign.title}" berhasil disetujui`);
      fetchDashboardData();
    } catch (err) {
      setError(err.message || 'Gagal menyetujui kampanye');
    } finally {
      setShowApproveModal(false);
      setSelectedCampaign(null);
    }
  };

  const handleRejectCampaign = async () => {
    if (!selectedCampaign || !rejectionReason.trim()) return;

    try {
      await adminService.rejectCampaign(selectedCampaign.id, rejectionReason);
      setSuccess(`Kampanye "${selectedCampaign.title}" berhasil ditolak`);
      fetchDashboardData();
    } catch (err) {
      setError(err.message || 'Gagal menolak kampanye');
    } finally {
      setShowRejectModal(false);
      setSelectedCampaign(null);
      setRejectionReason('');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  // Reset alerts after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Memuat dashboard admin...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h1 className="mb-4">Dashboard Admin</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {dashboardData && (
        <>
          {/* Statistics Cards */}
          <Row className="mb-4">
            <Col md={3} className="mb-3">
              <Card className="h-100 border-0 shadow-sm text-center">
                <Card.Body>
                  <div className="bg-primary bg-opacity-10 rounded-circle d-flex justify-content-center align-items-center mx-auto mb-3" style={{ width: '60px', height: '60px' }}>
                    <i className="bi bi-people-fill text-primary fs-4"></i>
                  </div>
                  <h5 className="fw-bold">{dashboardData.stats.total_users}</h5>
                  <p className="text-muted mb-0">Total Users</p>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3} className="mb-3">
              <Card className="h-100 border-0 shadow-sm text-center">
                <Card.Body>
                  <div className="bg-success bg-opacity-10 rounded-circle d-flex justify-content-center align-items-center mx-auto mb-3" style={{ width: '60px', height: '60px' }}>
                    <i className="bi bi-megaphone-fill text-success fs-4"></i>
                  </div>
                  <h5 className="fw-bold">{dashboardData.stats.total_campaigns}</h5>
                  <p className="text-muted mb-0">Total Kampanye</p>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3} className="mb-3">
              <Card className="h-100 border-0 shadow-sm text-center">
                <Card.Body>
                  <div className="bg-warning bg-opacity-10 rounded-circle d-flex justify-content-center align-items-center mx-auto mb-3" style={{ width: '60px', height: '60px' }}>
                    <i className="bi bi-clock-fill text-warning fs-4"></i>
                  </div>
                  <h5 className="fw-bold">{dashboardData.stats.pending_campaigns}</h5>
                  <p className="text-muted mb-0">Kampanye Pending</p>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3} className="mb-3">
              <Card className="h-100 border-0 shadow-sm text-center">
                <Card.Body>
                  <div className="bg-info bg-opacity-10 rounded-circle d-flex justify-content-center align-items-center mx-auto mb-3" style={{ width: '60px', height: '60px' }}>
                    <i className="bi bi-heart-fill text-info fs-4"></i>
                  </div>
                  <h5 className="fw-bold">{formatCurrency(dashboardData.stats.total_donated)}</h5>
                  <p className="text-muted mb-0">Total Donasi</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Recent Campaigns Pending Approval */}
          <Row>
            <Col md={6} className="mb-4">
              <Card className="h-100">
                <Card.Header>
                  <h5 className="mb-0">Kampanye Menunggu Persetujuan</h5>
                </Card.Header>
                <Card.Body>
                  {dashboardData.recent_campaigns.filter(c => c.status === 'pending').length === 0 ? (
                    <p className="text-muted text-center py-3">Tidak ada kampanye yang menunggu persetujuan</p>
                  ) : (
                    <div className="table-responsive">
                      <Table size="sm">
                        <thead>
                          <tr>
                            <th>Judul</th>
                            <th>Creator</th>
                            <th>Target</th>
                            <th>Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardData.recent_campaigns
                            .filter(campaign => campaign.status === 'pending')
                            .slice(0, 5)
                            .map(campaign => (
                            <tr key={campaign.id}>
                              <td>
                                <small className="fw-bold">{campaign.title}</small>
                              </td>
                              <td>
                                <small>{campaign.creator_name}</small>
                              </td>
                              <td>
                                <small>{formatCurrency(campaign.target_amount)}</small>
                              </td>
                              <td>
                                <div className="btn-group" role="group">
                                  <Button 
                                    size="sm" 
                                    variant="outline-success"
                                    onClick={() => {
                                      setSelectedCampaign(campaign);
                                      setShowApproveModal(true);
                                    }}
                                  >
                                    <i className="bi bi-check"></i>
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline-danger"
                                    onClick={() => {
                                      setSelectedCampaign(campaign);
                                      setShowRejectModal(true);
                                    }}
                                  >
                                    <i className="bi bi-x"></i>
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Recent Donations */}
            <Col md={6} className="mb-4">
              <Card className="h-100">
                <Card.Header>
                  <h5 className="mb-0">Donasi Terbaru</h5>
                </Card.Header>
                <Card.Body>
                  {dashboardData.recent_donations.length === 0 ? (
                    <p className="text-muted text-center py-3">Belum ada donasi</p>
                  ) : (
                    <div className="table-responsive">
                      <Table size="sm">
                        <thead>
                          <tr>
                            <th>Donatur</th>
                            <th>Jumlah</th>
                            <th>Status</th>
                            <th>Tanggal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardData.recent_donations.slice(0, 5).map(donation => (
                            <tr key={donation.id}>
                              <td>
                                <small>{donation.donor_name || 'Hamba Allah'}</small>
                              </td>
                              <td>
                                <small>{formatCurrency(donation.amount)}</small>
                              </td>
                              <td>
                                <Badge 
                                  bg={donation.status === 'verified' ? 'success' : 
                                      donation.status === 'pending' ? 'warning' : 'danger'}
                                >
                                  {donation.status === 'verified' ? 'Terverifikasi' :
                                   donation.status === 'pending' ? 'Pending' : 'Ditolak'}
                                </Badge>
                              </td>
                              <td>
                                <small>{formatDate(donation.created_at)}</small>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* Approve Campaign Modal */}
      <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Setujui Kampanye</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCampaign && (
            <>
              <p>Apakah Anda yakin ingin menyetujui kampanye ini?</p>
              <p><strong>Judul:</strong> {selectedCampaign.title}</p>
              <p><strong>Creator:</strong> {selectedCampaign.creator_name}</p>
              <p><strong>Target:</strong> {formatCurrency(selectedCampaign.target_amount)}</p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowApproveModal(false)}>
            Batal
          </Button>
          <Button variant="success" onClick={handleApproveCampaign}>
            Setujui Kampanye
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Reject Campaign Modal */}
      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Tolak Kampanye</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCampaign && (
            <>
              <p>Apakah Anda yakin ingin menolak kampanye ini?</p>
              <p><strong>Judul:</strong> {selectedCampaign.title}</p>
              <p><strong>Creator:</strong> {selectedCampaign.creator_name}</p>
              
              <Form.Group className="mt-3">
                <Form.Label>Alasan Penolakan <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Berikan alasan penolakan kampanye"
                  required
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
            Batal
          </Button>
          <Button 
            variant="danger" 
            onClick={handleRejectCampaign}
            disabled={!rejectionReason.trim()}
          >
            Tolak Kampanye
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminDashboard;
