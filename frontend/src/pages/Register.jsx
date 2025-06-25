import React, { useState } from 'react';
import { Form, Button, Alert, Card, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    role: 'donor' // Default role
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (userData.password !== userData.confirmPassword) {
      return setError('Password tidak cocok');
    }
    
    if (userData.password.length < 6) {
      return setError('Password harus minimal 6 karakter');
    }
    
    try {
      setError('');
      setLoading(true);
      
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...registerData } = userData;
      
      await register(registerData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal mendaftar. Silahkan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-5">
      <Card className="auth-form" style={{ maxWidth: '600px' }}>
        <Card.Body>
          <h2 className="text-center mb-4">Daftar AksiNyata</h2>
          
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="username">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={userData.username}
                    onChange={handleChange}
                    placeholder="Masukkan username"
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3" controlId="full_name">
                  <Form.Label>Nama Lengkap</Form.Label>
                  <Form.Control
                    type="text"
                    name="full_name"
                    value={userData.full_name}
                    onChange={handleChange}
                    placeholder="Masukkan nama lengkap"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3" controlId="email">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={userData.email}
                onChange={handleChange}
                placeholder="Masukkan email Anda"
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="password">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={userData.password}
                    onChange={handleChange}
                    placeholder="Minimal 6 karakter"
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3" controlId="confirmPassword">
                  <Form.Label>Konfirmasi Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={userData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Masukkan kembali password"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3" controlId="role">
              <Form.Label>Mendaftar Sebagai</Form.Label>
              <Form.Select
                name="role"
                value={userData.role}
                onChange={handleChange}
                required
              >
                <option value="donor">Donatur</option>
                <option value="creator">Pembuat Donasi</option>
                <option value="organizer">Penyelenggara</option>
              </Form.Select>
              <Form.Text className="text-muted">
                * Peran Penyelenggara memerlukan verifikasi admin
              </Form.Text>
            </Form.Group>

            <Button 
              variant="primary" 
              type="submit" 
              className="w-100 mt-3" 
              disabled={loading}
            >
              {loading ? 'Memproses...' : 'Daftar'}
            </Button>
          </Form>
          
          <div className="text-center mt-4">
            <p className="mb-0">
              Sudah punya akun? <Link to="/login">Masuk sekarang</Link>
            </p>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Register;
