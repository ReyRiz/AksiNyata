import React, { useState } from 'react';
import { Form, Button, Alert, Card } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get redirect path from location state or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      
      await login(credentials);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal masuk. Silahkan periksa email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-5">
      <Card className="auth-form">
        <Card.Body>
          <h2 className="text-center mb-4">Masuk ke AksiNyata</h2>
          
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="email">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={credentials.email}
                onChange={handleChange}
                placeholder="Masukkan email Anda"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="password">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                placeholder="Masukkan password Anda"
                required
              />
            </Form.Group>

            <Button 
              variant="primary" 
              type="submit" 
              className="w-100 mt-3" 
              disabled={loading}
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </Button>
          </Form>
          
          {/* Demo Credentials */}
          <Alert variant="info" className="mt-3">
            <strong>Demo Credentials:</strong><br />
            <small>
              <strong>Admin:</strong> admin@aksi-nyata.com / password123<br />
              <strong>Organizer:</strong> organizer@test.com / password123<br />
              <strong>User:</strong> test@example.com / password123
            </small>
          </Alert>
          
          <div className="text-center mt-4">
            <p className="mb-0">
              Belum punya akun? <Link to="/register">Daftar sekarang</Link>
            </p>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Login;
