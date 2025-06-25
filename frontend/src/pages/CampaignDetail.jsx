import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, ProgressBar, Badge, Form, Spinner, Alert, InputGroup } from 'react-bootstrap';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCampaignById, makeDonation } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import DonationItem from '../components/DonationItem';

const CampaignDetail = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [campaign, setCampaign] = useState(null);
  const [donations, setDonations] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [donationForm, setDonationForm] = useState({
    amount: '',
    message: '',
    proof_of_transfer: null
  });
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [donationLoading, setDonationLoading] = useState(false);
  const [donationError, setDonationError] = useState(null);
  const [donationSuccess, setDonationSuccess] = useState(false);
  
  const fetchCampaignDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getCampaignById(id);
      
      setCampaign(response.campaign);
      setDonations(response.donations);
      setMilestones(response.milestones);
      setError(null);
    } catch (err) {
      console.error('Error fetching campaign details:', err);
      setError('Gagal memuat detail kampanye donasi.');
    } finally {
      setLoading(false);
    }
  }, [id]);
  
  useEffect(() => {
    fetchCampaignDetails();
  }, [fetchCampaignDetails]);
  
  const handleDonationChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'proof_of_transfer' && files.length > 0) {
      setDonationForm({ ...donationForm, proof_of_transfer: files[0] });
    } else {
      setDonationForm({ ...donationForm, [name]: value });
    }
  };
  
  const handleDonationSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      navigate('/login', { state: { from: { pathname: `/campaigns/${id}` } } });
      return;
    }
    
    try {
      setDonationLoading(true);
      setDonationError(null);
      
      const donationData = {
        ...donationForm,
        campaign_id: id
      };
      
      await makeDonation(donationData);
      
      setDonationForm({
        amount: '',
        message: '',
        proof_of_transfer: null
      });
      setDonationSuccess(true);
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setDonationSuccess(false);
      }, 5000);
      
      // Refresh campaign details
      fetchCampaignDetails();
    } catch (err) {
      console.error('Error making donation:', err);
      setDonationError(err.response?.data?.error || 'Gagal melakukan donasi. Silahkan coba lagi.');
    } finally {
      setDonationLoading(false);
    }
  };
  
  // Helper function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };
  
  // Helper function to get days remaining
  const getDaysRemaining = () => {
    if (!campaign || !campaign.end_date) {
      return 'Tanpa batas waktu';
    }
    
    const endDate = new Date(campaign.end_date);
    const today = new Date();
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      return 'Berakhir';
    }
    
    return `${diffDays} hari lagi`;
  };
  
  // Get status badge
  const getStatusBadge = () => {
    if (!campaign) return null;
    
    switch (campaign.status) {
      case 'active':
        return <Badge bg="success">Aktif</Badge>;
      case 'completed':
        return <Badge bg="primary">Selesai</Badge>;
      case 'cancelled':
        return <Badge bg="danger">Dibatalkan</Badge>;
      default:
        return null;
    }
  };
  
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Memuat detail kampanye...</p>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
        <Button as={Link} to="/campaigns" variant="primary" className="mt-3">
          Kembali ke Daftar Kampanye
        </Button>
      </Container>
    );
  }
  
  if (!campaign) {
    return (
      <Container className="py-5 text-center">
        <h2>Kampanye Tidak Ditemukan</h2>
        <p className="mb-4">Kampanye yang Anda cari tidak ditemukan atau mungkin telah dihapus.</p>
        <Button as={Link} to="/campaigns" variant="primary">
          Kembali ke Daftar Kampanye
        </Button>
      </Container>
    );
  }
  
  return (
    <Container className="py-5">
      <Row>
        <Col lg={8}>
          {/* Campaign Header */}
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h1 className="fw-bold">{campaign.title}</h1>
                <p className="text-muted">
                  Diselenggarakan oleh <span className="fw-semibold">{campaign.organizer_name}</span>
                </p>
              </div>
              <div>{getStatusBadge()}</div>
            </div>
            
            {/* Campaign Image */}
            {campaign.image ? (
              <img 
                src={`http://localhost:5000/static/${campaign.image}`} 
                alt={campaign.title}
                className="img-fluid rounded mb-4 w-100"
                style={{ maxHeight: '400px', objectFit: 'cover' }}
              />
            ) : (
              <div 
                className="bg-light d-flex align-items-center justify-content-center rounded mb-4"
                style={{ height: '300px' }}
              >
                <i className="bi bi-image text-secondary" style={{ fontSize: '4rem' }}></i>
              </div>
            )}
            
            {/* Campaign Progress */}
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between mb-2">
                  <h5 className="fw-bold text-primary">{formatCurrency(campaign.current_amount)}</h5>
                  <h5 className="fw-bold">
                    {campaign.progress_percentage}% dari {formatCurrency(campaign.target_amount)}
                  </h5>
                </div>
                
                <ProgressBar 
                  now={campaign.progress_percentage} 
                  variant="success" 
                  className="mb-3" 
                  style={{ height: '10px' }}
                />
                
                <div className="d-flex justify-content-between">
                  <div>
                    <p className="mb-0 small text-muted">
                      <i className="bi bi-people-fill me-1"></i>
                      {donations.length} donasi
                    </p>
                  </div>
                  <div>
                    <p className="mb-0 small text-muted">
                      <i className="bi bi-calendar-event me-1"></i>
                      {getDaysRemaining()}
                    </p>
                  </div>
                </div>
              </Card.Body>
            </Card>
            
            {/* Campaign Description */}
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Body>
                <h4 className="fw-bold mb-3">Tentang Kampanye Ini</h4>
                <div className="campaign-description">
                  {campaign.description.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </Card.Body>
            </Card>
            
            {/* Milestones */}
            {milestones.length > 0 && (
              <Card className="mb-4 border-0 shadow-sm">
                <Card.Body>
                  <h4 className="fw-bold mb-3">Target Pencapaian</h4>
                  
                  {milestones.map(milestone => (
                    <div 
                      key={milestone.id} 
                      className={`milestone-card ${milestone.status === 'achieved' ? 'milestone-achieved' : ''}`}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h5 className="fw-bold">{milestone.title}</h5>
                          <p className="mb-1">{milestone.description}</p>
                          <p className="mb-0 small text-muted">
                            Target: {formatCurrency(milestone.target_amount)}
                          </p>
                        </div>
                        
                        {milestone.status === 'achieved' ? (
                          <Badge bg="success">Tercapai</Badge>
                        ) : (
                          <Badge bg="secondary">Belum Tercapai</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            )}
            
            {/* Recent Donations */}
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h4 className="fw-bold mb-3">Donasi Terbaru</h4>
                
                {donations.length === 0 ? (
                  <p className="text-center py-4 text-muted">
                    Belum ada donasi untuk kampanye ini.
                    <br />
                    Jadilah yang pertama!
                  </p>
                ) : (
                  donations.map(donation => (
                    <DonationItem key={donation.id} donation={donation} />
                  ))
                )}
              </Card.Body>
            </Card>
          </div>
        </Col>
        
        <Col lg={4}>
          {/* Donation Form */}
          <Card className="border-0 shadow-sm sticky-top" style={{ top: '20px' }}>
            <Card.Body>
              <h4 className="fw-bold mb-3">Donasi Sekarang</h4>
              
              {campaign.status !== 'active' ? (
                <Alert variant="info">
                  Kampanye ini {campaign.status === 'completed' ? 'telah selesai' : 'telah dibatalkan'}.
                  Donasi tidak lagi diterima.
                </Alert>
              ) : (
                <>
                  {donationSuccess && (
                    <Alert variant="success">
                      Terima kasih atas donasi Anda! Donasi Anda sedang diproses.
                    </Alert>
                  )}
                  
                  {donationError && (
                    <Alert variant="danger">{donationError}</Alert>
                  )}
                  
                  {!showDonationForm ? (
                    <div className="text-center py-3">
                      <p className="mb-3">
                        Bantu wujudkan kampanye ini dengan berdonasi sekarang.
                      </p>
                      <Button 
                        variant="primary" 
                        className="w-100" 
                        onClick={() => setShowDonationForm(true)}
                      >
                        Donasi Sekarang
                      </Button>
                    </div>
                  ) : (
                    <Form onSubmit={handleDonationSubmit}>
                      <Form.Group className="mb-3" controlId="amount">
                        <Form.Label>Jumlah Donasi</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>Rp</InputGroup.Text>
                          <Form.Control
                            type="number"
                            name="amount"
                            value={donationForm.amount}
                            onChange={handleDonationChange}
                            placeholder="0"
                            min="10000"
                            required
                          />
                        </InputGroup>
                        <Form.Text className="text-muted">
                          Minimal Rp 10.000
                        </Form.Text>
                      </Form.Group>
                      
                      <Form.Group className="mb-3" controlId="message">
                        <Form.Label>Pesan (Opsional)</Form.Label>
                        <Form.Control
                          as="textarea"
                          name="message"
                          value={donationForm.message}
                          onChange={handleDonationChange}
                          placeholder="Tuliskan pesan dukungan Anda..."
                          rows={3}
                        />
                      </Form.Group>
                      
                      <Form.Group className="mb-3" controlId="proof_of_transfer">
                        <Form.Label>Bukti Transfer</Form.Label>
                        <Form.Control
                          type="file"
                          name="proof_of_transfer"
                          onChange={handleDonationChange}
                          accept="image/*,.pdf"
                          required
                        />
                        <Form.Text className="text-muted">
                          Unggah bukti transfer Anda (PNG, JPG, PDF)
                        </Form.Text>
                      </Form.Group>
                      
                      <div className="d-grid gap-2">
                        <Button 
                          variant="primary" 
                          type="submit" 
                          disabled={donationLoading}
                        >
                          {donationLoading ? (
                            <>
                              <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                                className="me-2"
                              />
                              Memproses...
                            </>
                          ) : (
                            'Kirim Donasi'
                          )}
                        </Button>
                        
                        <Button 
                          variant="outline-secondary" 
                          onClick={() => setShowDonationForm(false)}
                          disabled={donationLoading}
                        >
                          Batal
                        </Button>
                      </div>
                    </Form>
                  )}
                </>
              )}
              
              {/* Campaign Actions */}
              {currentUser && campaign.organizer_id === currentUser.id && (
                <div className="mt-4 pt-3 border-top">
                  <h5 className="fw-bold mb-3">Aksi Penyelenggara</h5>
                  <div className="d-grid gap-2">
                    <Button 
                      as={Link}
                      to={`/campaigns/manage/${campaign.id}`}
                      variant="success"
                    >
                      Kelola Kampanye
                    </Button>
                    
                    {campaign.status === 'active' && (
                      <Button 
                        as={Link}
                        to={`/donations/verify?campaign=${campaign.id}`}
                        variant="outline-primary"
                      >
                        Verifikasi Donasi
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CampaignDetail;
