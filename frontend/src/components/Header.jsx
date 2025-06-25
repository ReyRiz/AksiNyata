import React from 'react';
import { Navbar, Container, Nav, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { currentUser, logout, hasAnyRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar bg="white" expand="lg" className="shadow-sm">
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold">
          <span className="text-primary">Aksi</span>Nyata
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Beranda</Nav.Link>
            <Nav.Link as={Link} to="/campaigns">Donasi</Nav.Link>
            {hasAnyRole(['organizer', 'creator']) && (
              <Nav.Link as={Link} to="/campaigns/create">Buat Donasi</Nav.Link>
            )}
            {currentUser && (
              <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
            )}
          </Nav>
          <Nav>
            {currentUser ? (
              <NavDropdown 
                title={
                  <span>
                    {currentUser.profile_picture ? (
                      <img 
                        src={`http://localhost:5000/static/${currentUser.profile_picture}`} 
                        alt={currentUser.full_name}
                        className="avatar me-2"
                      />
                    ) : (
                      <i className="bi bi-person-circle me-2"></i>
                    )}
                    {currentUser.full_name}
                  </span>
                } 
                id="basic-nav-dropdown"
                align="end"
              >
                <NavDropdown.Item as={Link} to="/profile">Profil Saya</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/dashboard">Dashboard</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>Keluar</NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">Masuk</Nav.Link>
                <Nav.Link as={Link} to="/register" className="btn btn-primary text-white ms-2">Daftar</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
