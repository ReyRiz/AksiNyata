import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-5 py-4 bg-light-green">
      <Container>
        <Row className="mb-4">
          <Col md={4} className="mb-4 mb-md-0 text-start">
            <h5 className="text-primary fw-bold">AksiNyata</h5>
            <p className="mt-3">
              Platform donasi yang menghubungkan orang-orang yang ingin membantu
              dengan mereka yang membutuhkan bantuan.
            </p>
            <div className="social-icons d-flex gap-3 mt-3">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-primary"><i className="bi bi-facebook fs-5"></i></a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-primary"><i className="bi bi-twitter fs-5"></i></a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-primary"><i className="bi bi-instagram fs-5"></i></a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-primary"><i className="bi bi-youtube fs-5"></i></a>
            </div>
          </Col>
          <Col md={2} className="mb-4 mb-md-0 text-start">
            <h6 className="fw-bold mb-3">Tentang Kami</h6>
            <ul className="list-unstyled">
              <li className="mb-2"><Link to="/" className="text-decoration-none">Beranda</Link></li>
              <li className="mb-2"><Link to="/about" className="text-decoration-none">Tentang Kami</Link></li>
              <li className="mb-2"><Link to="/team" className="text-decoration-none">Tim Kami</Link></li>
              <li className="mb-2"><Link to="/contact" className="text-decoration-none">Kontak</Link></li>
            </ul>
          </Col>
          <Col md={2} className="mb-4 mb-md-0 text-start">
            <h6 className="fw-bold mb-3">Donasi</h6>
            <ul className="list-unstyled">
              <li className="mb-2"><Link to="/campaigns" className="text-decoration-none">Semua Donasi</Link></li>
              <li className="mb-2"><Link to="/campaigns/create" className="text-decoration-none">Buat Donasi</Link></li>
              <li className="mb-2"><Link to="/how-it-works" className="text-decoration-none">Cara Kerja</Link></li>
              <li className="mb-2"><Link to="/success-stories" className="text-decoration-none">Kisah Sukses</Link></li>
            </ul>
          </Col>
          <Col md={4} className="text-start">
            <h6 className="fw-bold mb-3">Hubungi Kami</h6>
            <p className="mb-2"><i className="bi bi-geo-alt-fill me-2 text-primary"></i>Makassar</p>
            <p className="mb-2"><i className="bi bi-telephone-fill me-2 text-primary"></i> Coming Soon Ya Disini</p>
            <p className="mb-2"><i className="bi bi-envelope-fill me-2 text-primary"></i> info@aksinyata.id</p>
            <p className="mb-2"><i className="bi bi-clock-fill me-2 text-primary"></i> Senin - Jumat: 09:00 - 17:00</p>
          </Col>
        </Row>
        <hr />
        <Row>
          <Col className="text-center">
            <p className="mb-0 small">
              &copy; {currentYear} AksiNyata. Hak Cipta Dilindungi.
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
