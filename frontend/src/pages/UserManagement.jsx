import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Table, Modal, Form, Badge, Row, Col, InputGroup } from 'react-bootstrap';
import { getAllUsers, updateUserRole, deactivateUser, activateUser } from '../services/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);
  
  // Modal states
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  
  // Fetch all users
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersData = await getAllUsers();
      setUsers(usersData);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter users based on status and search term
  const filteredUsers = users.filter(user => {
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'active' && user.is_active) || 
      (filter === 'inactive' && !user.is_active) ||
      (filter === user.role);
    
    const matchesSearch = 
      searchTerm === '' || 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });
  
  // Open change role modal
  const openRoleModal = (user) => {
    setCurrentUser(user);
    setSelectedRole(user.role);
    setShowRoleModal(true);
  };
  
  // Open deactivate user modal
  const openDeactivateModal = (user) => {
    setCurrentUser(user);
    setShowDeactivateModal(true);
  };
  
  // Open activate user modal
  const openActivateModal = (user) => {
    setCurrentUser(user);
    setShowActivateModal(true);
  };
  
  // Handle role change
  const handleRoleChange = async () => {
    if (!currentUser || selectedRole === currentUser.role) {
      setShowRoleModal(false);
      return;
    }
    
    try {
      await updateUserRole(currentUser.id, { role: selectedRole });
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === currentUser.id ? { ...user, role: selectedRole } : user
        )
      );
      
      setSuccess(`${currentUser.name}'s role has been updated to ${selectedRole}.`);
    } catch (err) {
      console.error('Role update failed:', err);
      setError('Failed to update user role. Please try again.');
    } finally {
      setShowRoleModal(false);
      setCurrentUser(null);
    }
  };
  
  // Handle user deactivation
  const handleDeactivateUser = async () => {
    if (!currentUser) return;
    
    try {
      await deactivateUser(currentUser.id);
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === currentUser.id ? { ...user, is_active: false } : user
        )
      );
      
      setSuccess(`${currentUser.name}'s account has been deactivated.`);
    } catch (err) {
      console.error('Deactivation failed:', err);
      setError('Failed to deactivate user. Please try again.');
    } finally {
      setShowDeactivateModal(false);
      setCurrentUser(null);
    }
  };
  
  // Handle user activation
  const handleActivateUser = async () => {
    if (!currentUser) return;
    
    try {
      await activateUser(currentUser.id);
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === currentUser.id ? { ...user, is_active: true } : user
        )
      );
      
      setSuccess(`${currentUser.name}'s account has been activated.`);
    } catch (err) {
      console.error('Activation failed:', err);
      setError('Failed to activate user. Please try again.');
    } finally {
      setShowActivateModal(false);
      setCurrentUser(null);
    }
  };
  
  // Reset alerts after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [success, error]);
  
  // Role badge component
  const RoleBadge = ({ role }) => {
    let variant = 'secondary';
    
    if (role === 'organizer') variant = 'danger';
    else if (role === 'creator') variant = 'primary';
    else if (role === 'donor') variant = 'success';
    
    return <Badge bg={variant}>{role}</Badge>;
  };
  
  if (loading && users.length === 0) {
    return <div className="text-center my-5"><p>Loading users...</p></div>;
  }
  
  return (
    <div className="user-management-page">
      <h1 className="text-center mb-4">User Management</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="mb-3 align-items-center">
            <Col md={6} className="mb-3 mb-md-0">
              <Form.Group>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Search by name or email"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => setSearchTerm('')}
                    >
                      Clear
                    </Button>
                  )}
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={6}>
              <div className="d-flex justify-content-md-end">
                <Form.Group>
                  <Form.Select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">All Users</option>
                    <option value="active">Active Users</option>
                    <option value="inactive">Inactive Users</option>
                    <option value="organizer">Organizers</option>
                    <option value="creator">Creators</option>
                    <option value="donor">Donors</option>
                  </Form.Select>
                </Form.Group>
                <Button 
                  variant="outline-secondary" 
                  className="ms-2" 
                  onClick={fetchUsers}
                >
                  Refresh
                </Button>
              </div>
            </Col>
          </Row>
          
          {filteredUsers.length === 0 ? (
            <Alert variant="info">
              No users found matching your criteria.
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table striped hover>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td><RoleBadge role={user.role} /></td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                        <Badge bg={user.is_active ? 'success' : 'secondary'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td>
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          className="me-1 mb-1"
                          onClick={() => openRoleModal(user)}
                        >
                          Change Role
                        </Button>
                        
                        {user.is_active ? (
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            className="mb-1"
                            onClick={() => openDeactivateModal(user)}
                          >
                            Deactivate
                          </Button>
                        ) : (
                          <Button 
                            variant="outline-success" 
                            size="sm"
                            className="mb-1"
                            onClick={() => openActivateModal(user)}
                          >
                            Activate
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Change Role Modal */}
      <Modal show={showRoleModal} onHide={() => setShowRoleModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Change User Role</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentUser && (
            <>
              <p>Change role for user: <strong>{currentUser.name}</strong></p>
              <Form.Group>
                <Form.Label>Select New Role</Form.Label>
                <Form.Select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <option value="donor">Donor</option>
                  <option value="creator">Creator</option>
                  <option value="organizer">Organizer</option>
                </Form.Select>
              </Form.Group>
              
              {selectedRole === 'organizer' && (
                <Alert variant="warning" className="mt-3">
                  <strong>Warning:</strong> Organizer role has full administrative privileges.
                </Alert>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRoleModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleRoleChange}>
            Update Role
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Deactivate User Modal */}
      <Modal show={showDeactivateModal} onHide={() => setShowDeactivateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Deactivate User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentUser && (
            <>
              <p>Are you sure you want to deactivate the account for:</p>
              <p><strong>{currentUser.name}</strong> ({currentUser.email})</p>
              <Alert variant="warning">
                The user will no longer be able to log in or perform any actions on the platform.
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeactivateModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeactivateUser}>
            Deactivate User
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Activate User Modal */}
      <Modal show={showActivateModal} onHide={() => setShowActivateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Activate User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentUser && (
            <>
              <p>Are you sure you want to activate the account for:</p>
              <p><strong>{currentUser.name}</strong> ({currentUser.email})</p>
              <Alert variant="info">
                The user will be able to log in and use the platform again.
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowActivateModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleActivateUser}>
            Activate User
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default UserManagement;
