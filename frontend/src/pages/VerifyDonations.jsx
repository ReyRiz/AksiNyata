import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Table, Modal, Form, Badge, Row, Col, InputGroup } from 'react-bootstrap';
import { getAllDonations, verifyDonation, rejectDonation } from '../services/api';

const VerifyDonations = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processingDonation, setProcessingDonation] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [viewImageModal, setViewImageModal] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  
  // Fetch all donations
  useEffect(() => {
    fetchDonations();
  }, []);
  
  const fetchDonations = async () => {
    try {
      setLoading(true);
      const donationsData = await getAllDonations();
      setDonations(donationsData);
    } catch (err) {
      console.error('Failed to fetch donations:', err);
      setError('Failed to load donations. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter donations based on status and search term
  const filteredDonations = donations.filter(donation => {
    const matchesFilter = filter === 'all' || donation.status === filter;
    const matchesSearch = 
      searchTerm === '' || 
      donation.donor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.campaign_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.amount?.toString().includes(searchTerm);
    
    return matchesFilter && matchesSearch;
  });
  
  // Open verification modal
  const openVerifyModal = (donation) => {
    setProcessingDonation(donation);
    setShowVerifyModal(true);
  };
  
  // Open rejection modal
  const openRejectModal = (donation) => {
    setProcessingDonation(donation);
    setRejectionReason('');
    setShowRejectModal(true);
  };
  
  // Handle donation verification
  const handleVerifyDonation = async () => {
    if (!processingDonation) return;
    
    try {
      await verifyDonation(processingDonation.id);
      
      // Update local state
      setDonations(prevDonations => 
        prevDonations.map(donation => 
          donation.id === processingDonation.id 
            ? { ...donation, status: 'verified' } 
            : donation
        )
      );
      
      setSuccess(`Donation of Rp ${parseFloat(processingDonation.amount).toLocaleString()} from ${processingDonation.donor_name || 'Anonymous'} has been verified successfully.`);
    } catch (err) {
      console.error('Verification failed:', err);
      setError('Failed to verify donation. Please try again.');
    } finally {
      setShowVerifyModal(false);
      setProcessingDonation(null);
    }
  };
  
  // Handle donation rejection
  const handleRejectDonation = async () => {
    if (!processingDonation) return;
    
    try {
      await rejectDonation(processingDonation.id, { reason: rejectionReason });
      
      // Update local state
      setDonations(prevDonations => 
        prevDonations.map(donation => 
          donation.id === processingDonation.id 
            ? { ...donation, status: 'rejected', rejection_reason: rejectionReason } 
            : donation
        )
      );
      
      setSuccess(`Donation from ${processingDonation.donor_name || 'Anonymous'} has been rejected.`);
    } catch (err) {
      console.error('Rejection failed:', err);
      setError('Failed to reject donation. Please try again.');
    } finally {
      setShowRejectModal(false);
      setProcessingDonation(null);
      setRejectionReason('');
    }
  };
  
  // View proof of transfer image
  const handleViewImage = (imageUrl) => {
    setCurrentImageUrl(imageUrl);
    setViewImageModal(true);
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
  
  // Status badge component
  const StatusBadge = ({ status }) => {
    let variant = 'secondary';
    
    if (status === 'verified') variant = 'success';
    else if (status === 'pending') variant = 'warning';
    else if (status === 'rejected') variant = 'danger';
    
    return <Badge bg={variant}>{status}</Badge>;
  };
  
  if (loading && donations.length === 0) {
    return <div className="text-center my-5"><p>Loading donations...</p></div>;
  }
  
  return (
    <div className="verify-donations-page">
      <h1 className="text-center mb-4">Verify Donations</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="mb-3 align-items-center">
            <Col md={6} className="mb-3 mb-md-0">
              <Form.Group>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Search by donor, campaign or amount"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => setSearchTerm('')}
                    >
                      Clear
                    </Button>
                  )}
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={6}>
              <div className="d-flex justify-content-md-end">
                <Form.Group>
                  <Form.Select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">All Donations</option>
                    <option value="pending">Pending Verification</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                  </Form.Select>
                </Form.Group>
                <Button 
                  variant="outline-secondary" 
                  className="ms-2" 
                  onClick={fetchDonations}
                >
                  Refresh
                </Button>
              </div>
            </Col>
          </Row>
          
          {filteredDonations.length === 0 ? (
            <Alert variant="info">
              No {filter !== 'all' ? filter : ''} donations found.
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table striped hover>
                <thead>
                  <tr>
                    <th>Donor</th>
                    <th>Campaign</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Proof</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDonations.map(donation => (
                    <tr key={donation.id}>
                      <td>{donation.donor_name || 'Anonymous'}</td>
                      <td>{donation.campaign_name}</td>
                      <td>Rp {parseFloat(donation.amount).toLocaleString()}</td>
                      <td>{new Date(donation.date).toLocaleDateString()}</td>
                      <td><StatusBadge status={donation.status} /></td>
                      <td>
                        {donation.proof_of_transfer ? (
                          <Button 
                            variant="link" 
                            size="sm" 
                            onClick={() => handleViewImage(donation.proof_of_transfer)}
                          >
                            View Image
                          </Button>
                        ) : (
                          <span className="text-muted">No proof</span>
                        )}
                      </td>
                      <td>
                        {donation.status === 'pending' && (
                          <>
                            <Button 
                              variant="outline-success" 
                              size="sm" 
                              className="me-1 mb-1"
                              onClick={() => openVerifyModal(donation)}
                            >
                              Verify
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              className="mb-1"
                              onClick={() => openRejectModal(donation)}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {donation.status === 'rejected' && (
                          <small className="text-danger d-block">
                            Reason: {donation.rejection_reason || 'Not provided'}
                          </small>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Verify Donation Modal */}
      <Modal show={showVerifyModal} onHide={() => setShowVerifyModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Verify Donation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {processingDonation && (
            <>
              <p>Are you sure you want to verify this donation?</p>
              <p><strong>Donor:</strong> {processingDonation.donor_name || 'Anonymous'}</p>
              <p><strong>Campaign:</strong> {processingDonation.campaign_name}</p>
              <p><strong>Amount:</strong> Rp {parseFloat(processingDonation.amount).toLocaleString()}</p>
              
              {processingDonation.proof_of_transfer && (
                <div className="mt-3">
                  <p><strong>Proof of Transfer:</strong></p>
                  <img 
                    src={processingDonation.proof_of_transfer} 
                    alt="Proof of Transfer" 
                    style={{ maxWidth: '100%', maxHeight: '200px' }} 
                    className="border rounded"
                  />
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowVerifyModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleVerifyDonation}>
            Verify Donation
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Reject Donation Modal */}
      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Reject Donation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {processingDonation && (
            <>
              <p>Are you sure you want to reject this donation?</p>
              <p><strong>Donor:</strong> {processingDonation.donor_name || 'Anonymous'}</p>
              <p><strong>Campaign:</strong> {processingDonation.campaign_name}</p>
              <p><strong>Amount:</strong> Rp {parseFloat(processingDonation.amount).toLocaleString()}</p>
              
              <Form.Group className="mt-3">
                <Form.Label>Reason for Rejection</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejecting this donation"
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleRejectDonation}>
            Reject Donation
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* View Image Modal */}
      <Modal 
        show={viewImageModal} 
        onHide={() => setViewImageModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Proof of Transfer</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {currentImageUrl && (
            <img 
              src={currentImageUrl} 
              alt="Proof of Transfer" 
              style={{ maxWidth: '100%' }} 
            />
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default VerifyDonations;
