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

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Memuat dashboard admin...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h1 className="mb-4 fw-bold">🛠️ Dashboard Admin</h1>
      
      {/* Alerts */}
      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" onClose={() => setSuccess('')} dismissible>
          {success}
        </Alert>
      )}

      {/* Stats Cards */}
      {dashboardData && dashboardData.stats && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="text-center">
                <div className="text-primary mb-2">
                  <i className="bi bi-people fs-1"></i>
                </div>
                <h3 className="fw-bold">{dashboardData.stats.total_users}</h3>
                <p className="text-muted mb-0">Total Users</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="text-center">
                <div className="text-success mb-2">
                  <i className="bi bi-megaphone fs-1"></i>
                </div>
                <h3 className="fw-bold">{dashboardData.stats.total_campaigns}</h3>
                <p className="text-muted mb-0">Total Kampanye</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="text-center">
                <div className="text-warning mb-2">
                  <i className="bi bi-clock fs-1"></i>
                </div>
                <h3 className="fw-bold">{dashboardData.stats.pending_campaigns}</h3>
                <p className="text-muted mb-0">Kampanye Pending</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="text-center">
                <div className="text-info mb-2">
                  <i className="bi bi-wallet2 fs-1"></i>
                </div>
                <h3 className="fw-bold">{formatCurrency(dashboardData.stats.total_donated)}</h3>
                <p className="text-muted mb-0">Total Donasi</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Pending Campaigns */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-warning text-dark">
          <h5 className="mb-0">⏳ Kampanye Menunggu Persetujuan ({pendingCampaigns.length})</h5>
        </Card.Header>
        <Card.Body>
          {pendingCampaigns.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-check-circle fs-1 mb-3 d-block"></i>
              <p>Tidak ada kampanye yang menunggu persetujuan</p>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Kampanye</th>
                  <th>Organizer</th>
                  <th>Target</th>
                  <th>Kategori</th>
                  <th>Tanggal Dibuat</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pendingCampaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td>
                      <div>
                        <strong>{campaign.title}</strong>
                        <br />
                        <small className="text-muted">
                          {campaign.description?.substring(0, 100)}...
                        </small>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{campaign.creator?.name || campaign.creator?.full_name}</strong>
                        <br />
                        <small className="text-muted">{campaign.creator?.email}</small>
                      </div>
                    </td>
                    <td>
                      <span className="fw-bold text-primary">
                        {formatCurrency(campaign.target_amount)}
                      </span>
                    </td>
                    <td>
                      <Badge bg="secondary">
                        {campaign.category?.name || 'Tidak ada kategori'}
                      </Badge>
                    </td>
                    <td>
                      <small>{formatDate(campaign.created_at)}</small>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => {
                            setSelectedCampaign(campaign);
                            setShowApproveModal(true);
                          }}
                        >
                          ✅ Setujui
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            setSelectedCampaign(campaign);
                            setShowRejectModal(true);
                          }}
                        >
                          ❌ Tolak
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Approve Modal */}
      <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Setujui Kampanye</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Apakah Anda yakin ingin menyetujui kampanye <strong>"{selectedCampaign?.title}"</strong>?
          </p>
          <p className="text-muted">
            Kampanye yang disetujui akan muncul di halaman publik dan dapat menerima donasi.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowApproveModal(false)}>
            Batal
          </Button>
          <Button variant="success" onClick={handleApproveCampaign}>
            ✅ Ya, Setujui
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Reject Modal */}
      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Tolak Kampanye</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Menolak kampanye <strong>"{selectedCampaign?.title}"</strong>
          </p>
          <Form.Group className="mb-3">
            <Form.Label>Alasan Penolakan *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Berikan alasan mengapa kampanye ini ditolak..."
              required
            />
          </Form.Group>
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
            ❌ Tolak Kampanye
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminDashboard;
