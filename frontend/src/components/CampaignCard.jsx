import React from 'react';
import { Card, ProgressBar, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const CampaignCard = ({ campaign }) => {
  // Helper function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Helper function to get days remaining or 'Selesai'
  const getDaysRemaining = () => {
    if (campaign.status === 'completed') {
      return 'Selesai';
    }
    
    if (campaign.status === 'cancelled') {
      return 'Dibatalkan';
    }
    
    if (!campaign.end_date) {
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

  return (
    <Card className="campaign-card h-100">
      {campaign.image ? (
        <Card.Img 
          variant="top" 
          src={`http://localhost:5000/static/${campaign.image}`} 
          alt={campaign.title}
          className="campaign-img"
        />
      ) : (
        <div className="campaign-img bg-light d-flex align-items-center justify-content-center">
          <i className="bi bi-image text-secondary" style={{ fontSize: '3rem' }}></i>
        </div>
      )}
      
      <Card.Body className="text-start d-flex flex-column">
        <div className="d-flex justify-content-between align-items-center mb-2">
          {getStatusBadge()}
          <small className="text-muted">{getDaysRemaining()}</small>
        </div>
        
        <Card.Title as={Link} to={`/campaigns/${campaign.id}`} className="text-decoration-none h5 fw-bold">
          {campaign.title}
        </Card.Title>
        
        <Card.Text className="text-muted small mb-3">
          Oleh <span className="fw-semibold">{campaign.organizer_name}</span>
        </Card.Text>
        
        <Card.Text className="small text-truncate mb-3">
          {campaign.description}
        </Card.Text>
        
        <div className="mt-auto">
          <ProgressBar 
            now={campaign.progress_percentage} 
            variant="success" 
            className="mb-2" 
          />
          
          <div className="d-flex justify-content-between small">
            <div>
              <div className="fw-bold text-primary">{formatCurrency(campaign.current_amount)}</div>
              <div className="text-muted">terkumpul</div>
            </div>
            <div className="text-end">
              <div className="fw-bold">{campaign.progress_percentage}%</div>
              <div className="text-muted">dari {formatCurrency(campaign.target_amount)}</div>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default CampaignCard;
