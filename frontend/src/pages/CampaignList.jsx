import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Form, InputGroup, Button, Spinner } from 'react-bootstrap';
import { getCampaigns } from '../services/api';
import CampaignCard from '../components/CampaignCard';

const CampaignList = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'completed'

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (filter !== 'all') {
        params.status = filter;
      }
      
      const response = await getCampaigns(params);
      setCampaigns(response.campaigns || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Gagal memuat daftar kampanye donasi.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  // Filter campaigns based on search term
  const filteredCampaigns = campaigns.filter(campaign => 
    campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container className="py-5">
      <h1 className="fw-bold mb-4">Kampanye Donasi</h1>
      
      <Row className="mb-4">
        <Col md={6} className="mb-3 mb-md-0">
          <InputGroup>
            <Form.Control
              placeholder="Cari kampanye donasi..."
              value={searchTerm}
              onChange={handleSearch}
            />
            <Button variant="primary">
              <i className="bi bi-search"></i>
            </Button>
          </InputGroup>
        </Col>
        <Col md={6} className="d-flex justify-content-md-end">
          <Form.Select 
            className="w-auto" 
            value={filter}
            onChange={handleFilterChange}
          >
            <option value="all">Semua Kampanye</option>
            <option value="active">Aktif</option>
            <option value="completed">Selesai</option>
            <option value="cancelled">Dibatalkan</option>
          </Form.Select>
        </Col>
      </Row>
      
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Memuat kampanye donasi...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="text-center py-5">
          <p className="mb-3">Tidak ada kampanye donasi yang ditemukan.</p>
          {searchTerm && (
            <Button variant="primary" onClick={() => setSearchTerm('')}>
              Hapus Pencarian
            </Button>
          )}
        </div>
      ) : (
        <Row>
          {filteredCampaigns.map(campaign => (
            <Col key={campaign.id} md={4} className="mb-4">
              <CampaignCard campaign={campaign} />
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default CampaignList;
