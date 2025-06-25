import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <Container className="py-5 text-center">
      <Row className="justify-content-center">
        <Col md={8}>
          <div className="mb-4">
            <i className="bi bi-exclamation-circle text-primary" style={{ fontSize: '5rem' }}></i>
          </div>
          <h1 className="display-4 fw-bold mb-4">404</h1>
          <h2 className="mb-4">Halaman Tidak Ditemukan</h2>
          <p className="lead mb-5">
            Maaf, halaman yang Anda cari tidak ditemukan atau mungkin telah dihapus.
          </p>
          <Button as={Link} to="/" variant="primary" size="lg">
            Kembali ke Beranda
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default NotFound;
