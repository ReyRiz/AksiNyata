import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, updateUserProfile } from '../services/api';

const Profile = () => {
  const { currentUser, updateProfile } = useAuth();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [donationHistory, setDonationHistory] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const userData = await getUserProfile();
        setProfile({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          password: '',
          confirmPassword: '',
        });
        
        // If there's donation history in the response
        if (userData.donations) {
          setDonationHistory(userData.donations);
        }
      } catch (err) {
        setError('Failed to load profile data. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset messages
    setError('');
    setSuccess('');

    // Validation
    if (profile.password && profile.password !== profile.confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      setLoading(true);
      
      // Create update data object (exclude confirmPassword)
      const updateData = {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
      };
      
      // Only include password if it's provided
      if (profile.password) {
        updateData.password = profile.password;
      }
      
      // Call API to update profile
      await updateUserProfile(updateData);
      
      // Update context with new user data
      updateProfile({
        ...currentUser,
        name: profile.name,
        email: profile.email,
      });
      
      setSuccess('Profile updated successfully!');
      
      // Clear password fields
      setProfile((prev) => ({
        ...prev,
        password: '',
        confirmPassword: '',
      }));
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <h1 className="text-center mb-4">My Profile</h1>
      
      <Row>
        <Col md={8} className="mx-auto">
          <Card className="shadow-sm">
            <Card.Body>
              <h2 className="mb-4">Profile Information</h2>
              
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={profile.name}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={profile.phone}
                    onChange={handleChange}
                  />
                </Form.Group>
                
                <hr className="my-4" />
                <h5>Change Password</h5>
                <p className="text-muted small">Leave blank to keep your current password</p>
                
                <Form.Group className="mb-3">
                  <Form.Label>New Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={profile.password}
                    onChange={handleChange}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Confirm New Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={profile.confirmPassword}
                    onChange={handleChange}
                  />
                </Form.Group>
                
                <div className="d-grid">
                  <Button 
                    variant="success" 
                    type="submit" 
                    disabled={loading}
                    className="mt-3"
                  >
                    {loading ? 'Updating...' : 'Update Profile'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
          
          {donationHistory.length > 0 && (
            <Card className="mt-4 shadow-sm">
              <Card.Body>
                <h2 className="mb-4">Donation History</h2>
                <div className="donation-history">
                  {donationHistory.map((donation) => (
                    <div key={donation.id} className="donation-item p-3 mb-2 border-bottom">
                      <div className="d-flex justify-content-between">
                        <div>
                          <h5>{donation.campaign_name}</h5>
                          <p className="text-muted mb-1">Amount: ${donation.amount}</p>
                          <p className="text-muted mb-1">Date: {new Date(donation.date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className={`badge ${donation.status === 'verified' ? 'bg-success' : donation.status === 'pending' ? 'bg-warning' : 'bg-secondary'}`}>
                            {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default Profile;
