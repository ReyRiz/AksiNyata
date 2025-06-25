import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import CampaignCard from '../components/CampaignCard';
import { campaignService } from '../services/api';

const Home = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        // Fetch only active campaigns and limit to 6
        const response = await campaignService.getAllCampaigns({ status: 'active', limit: 6 });
        setCampaigns(response.campaigns);
        setError(null);
      } catch (err) {
        console.error('Error fetching campaigns:', err);
        setError('Gagal memuat kampanye donasi.');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="hero text-center text-white">
        <Container>
          <Row className="justify-content-center">
            <Col md={8}>
              <h1 className="display-4 fw-bold mb-4">Aksi Nyata untuk Perubahan</h1>
              <p className="lead mb-4">
                Bersama kita bisa membantu mereka yang membutuhkan. Setiap donasi yang Anda berikan
                dapat memberikan dampak nyata bagi kehidupan seseorang.
              </p>
              <div>
                <Button as={Link} to="/campaigns" variant="light" size="lg" className="me-2">
                  Lihat Donasi
                </Button>
                <Button as={Link} to="/campaigns/create" variant="outline-light" size="lg">
                  Buat Donasi
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Featured Campaigns */}
      <section className="py-5">
        <Container>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold">Donasi Pilihan</h2>
            <Link to="/campaigns" className="btn btn-outline-primary">
              Lihat Semua
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-4">
              <p>Belum ada kampanye donasi yang tersedia.</p>
              <Button as={Link} to="/campaigns/create" variant="primary">
                Buat Kampanye Donasi Pertama
              </Button>
            </div>
          ) : (
            <Row>
              {campaigns.map(campaign => (
                <Col key={campaign.id} md={4} className="mb-4">
                  <CampaignCard campaign={campaign} />
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </section>

      {/* How It Works */}
      <section className="py-5 bg-light-green">
        <Container>
          <Row className="justify-content-center text-center mb-5">
            <Col md={8}>
              <h2 className="fw-bold mb-4">Cara Kerja AksiNyata</h2>
              <p className="lead">
                Platform donasi yang mudah, aman, dan transparan untuk membantu
                sesama.
              </p>
            </Col>
          </Row>

          <Row>
            <Col md={4} className="mb-4 mb-md-0">
              <Card className="h-100 border-0 text-center">
                <div className="card-body">
                  <div className="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center mx-auto mb-4" style={{ width: '80px', height: '80px' }}>
                    <i className="bi bi-people-fill fs-1"></i>
                  </div>
                  <h4 className="fw-bold">1. Daftar</h4>
                  <p>
                    Daftar sebagai pengguna dengan peran Penyelenggara, Pembuat Donasi, atau Donatur
                    untuk mulai berpartisipasi.
                  </p>
                </div>
              </Card>
            </Col>

            <Col md={4} className="mb-4 mb-md-0">
              <Card className="h-100 border-0 text-center">
                <div className="card-body">
                  <div className="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center mx-auto mb-4" style={{ width: '80px', height: '80px' }}>
                    <i className="bi bi-heart-fill fs-1"></i>
                  </div>
                  <h4 className="fw-bold">2. Buat atau Donasi</h4>
                  <p>
                    Buat kampanye donasi untuk penyebab yang Anda pedulikan atau donasikan
                    langsung ke kampanye yang ada.
                  </p>
                </div>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="h-100 border-0 text-center">
                <div className="card-body">
                  <div className="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center mx-auto mb-4" style={{ width: '80px', height: '80px' }}>
                    <i className="bi bi-graph-up-arrow fs-1"></i>
                  </div>
                  <h4 className="fw-bold">3. Pantau Progres</h4>
                  <p>
                    Lihat transparansi dan perkembangan kampanye donasi secara
                    real-time melalui dashboard yang interaktif.
                  </p>
                </div>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Call to Action */}
      <section className="py-5">
        <Container>
          <Row className="justify-content-center">
            <Col md={10}>
              <Card className="border-0 bg-primary text-white p-4 p-md-5">
                <Card.Body className="text-center">
                  <h2 className="fw-bold mb-4">Mulai Berdonasi Sekarang</h2>
                  <p className="lead mb-4">
                    Bersama kita bisa memberikan dampak nyata bagi mereka yang membutuhkan.
                    Setiap bantuan yang Anda berikan sangat berarti.
                  </p>
                  <Button as={Link} to="/campaigns" variant="light" size="lg" className="px-4">
                    Lihat Kampanye Donasi
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
};

export default Home;
