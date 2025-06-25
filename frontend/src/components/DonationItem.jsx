import React from 'react';
import { Badge } from 'react-bootstrap';

const DonationItem = ({ donation }) => {
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

  // Get status badge
  const getStatusBadge = () => {
    switch (donation.status) {
      case 'pending':
        return <Badge bg="warning">Menunggu Verifikasi</Badge>;
      case 'verified':
        return <Badge bg="success">Terverifikasi</Badge>;
      case 'rejected':
        return <Badge bg="danger">Ditolak</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="donation-item">
      <div className="d-flex justify-content-between align-items-start">
        <div>
          <h6 className="mb-1 fw-bold">{donation.donor_name}</h6>
          <p className="mb-2 text-primary fw-semibold">{formatCurrency(donation.amount)}</p>
          
          {donation.message && (
            <p className="mb-2 small fst-italic">"{donation.message}"</p>
          )}
          
          <p className="mb-0 small text-muted">
            {formatDate(donation.created_at)}
            {donation.verified_at && ` • Diverifikasi pada ${formatDate(donation.verified_at)}`}
          </p>
        </div>
        
        <div>
          {getStatusBadge()}
          
          {donation.transfer_proof && (
            <div className="mt-2">
              <a 
                href={`http://localhost:5000/static/${donation.transfer_proof}`} 
                target="_blank" 
                rel="noreferrer"
                className="btn btn-sm btn-outline-secondary"
              >
                Lihat Bukti Transfer
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DonationItem;
