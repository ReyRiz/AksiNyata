import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Row, Col, Tab, Nav, Table, ProgressBar } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { getCampaignById, updateCampaign, getCampaignDonations, updateMilestone } from '../services/api';

const ManageCampaign = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [campaign, setCampaign] = useState(null);
  const [donations, setDonations] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_amount: '',
    end_date: '',
    image_url: '',
    status: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  
  // Fetch campaign data and donations
  useEffect(() => {
    const fetchCampaignData = async () => {
      try {
        setLoading(true);
        
        // Get campaign details
        const campaignData = await getCampaignById(id);
        setCampaign(campaignData);
        
        // Set form data
        setFormData({
          title: campaignData.title || '',
          description: campaignData.description || '',
          target_amount: campaignData.target_amount || '',
          end_date: formatDateForInput(campaignData.end_date) || '',
          image_url: campaignData.image_url || '',
          status: campaignData.status || 'active'
        });
        
        // Set image preview if available
        if (campaignData.image_url) {
          setImagePreview(campaignData.image_url);
        }
        
        // Get campaign donations
        const donationsData = await getCampaignDonations(id);
        setDonations(donationsData);
        
      } catch (err) {
        console.error('Error fetching campaign data:', err);
        setError('Failed to load campaign data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCampaignData();
  }, [id]);
  
  // Format date for input fields (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };
  
  // Handle campaign update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUpdating(true);
    
    try {
      // Prepare form data for API
      const campaignData = new FormData();
      campaignData.append('title', formData.title);
      campaignData.append('description', formData.description);
      campaignData.append('target_amount', formData.target_amount);
      campaignData.append('end_date', formData.end_date);
      campaignData.append('status', formData.status);
      
      // Add image file if selected
      if (imageFile) {
        campaignData.append('image', imageFile);
      } else if (formData.image_url) {
        campaignData.append('image_url', formData.image_url);
      }
      
      // Submit to API
      await updateCampaign(id, campaignData);
      setSuccess('Campaign updated successfully!');
      
      // Refresh campaign data
      const updatedCampaign = await getCampaignById(id);
      setCampaign(updatedCampaign);
      
    } catch (err) {
      console.error('Campaign update failed:', err);
      setError('Failed to update campaign. Please try again.');
    } finally {
      setUpdating(false);
    }
  };
  
  // Handle milestone status update
  const handleMilestoneUpdate = async (milestoneId, newStatus) => {
    try {
      await updateMilestone(id, milestoneId, { status: newStatus });
      
      // Refresh campaign data to show updated milestone status
      const updatedCampaign = await getCampaignById(id);
      setCampaign(updatedCampaign);
      
      setSuccess('Milestone updated successfully!');
    } catch (err) {
      console.error('Milestone update failed:', err);
      setError('Failed to update milestone. Please try again.');
    }
  };
  
  // Calculate campaign progress
  const calculateProgress = () => {
    if (!campaign || !campaign.target_amount) return 0;
    const raisedAmount = donations
      .filter(donation => donation.status === 'verified')
      .reduce((sum, donation) => sum + parseFloat(donation.amount), 0);
    const progress = (raisedAmount / parseFloat(campaign.target_amount)) * 100;
    return Math.min(progress, 100); // Cap at 100%
  };
  
  if (loading) {
    return <div className="text-center my-5"><p>Loading campaign data...</p></div>;
  }
  
  if (!campaign) {
    return (
      <Alert variant="danger" className="my-5">
        Campaign not found or you don't have permission to manage it.
      </Alert>
    );
  }
  
  return (
    <div className="manage-campaign-page">
      <h1 className="text-center mb-4">Manage Campaign</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      <Tab.Container id="campaign-management-tabs" defaultActiveKey="details">
        <Row>
          <Col lg={10} className="mx-auto">
            <Card className="shadow-sm mb-4">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 className="mb-0">{campaign.title}</h3>
                  <span className={`badge ${campaign.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                    {campaign.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="mb-3">
                  <ProgressBar 
                    variant="success" 
                    now={calculateProgress()} 
                    label={`${Math.round(calculateProgress())}%`} 
                  />
                  <div className="d-flex justify-content-between mt-1">
                    <small>
                      Rp {donations
                        .filter(donation => donation.status === 'verified')
                        .reduce((sum, donation) => sum + parseFloat(donation.amount), 0)
                        .toLocaleString()} raised
                    </small>
                    <small>Goal: Rp {parseFloat(campaign.target_amount).toLocaleString()}</small>
                  </div>
                </div>
                
                <Nav variant="tabs" className="mb-3">
                  <Nav.Item>
                    <Nav.Link eventKey="details">Campaign Details</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="donations">Donations ({donations.length})</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="milestones">Milestones ({campaign.milestones ? campaign.milestones.length : 0})</Nav.Link>
                  </Nav.Item>
                </Nav>
                
                <Tab.Content>
                  {/* Campaign Details Tab */}
                  <Tab.Pane eventKey="details">
                    <Form onSubmit={handleSubmit}>
                      <Form.Group className="mb-3">
                        <Form.Label>Campaign Title</Form.Label>
                        <Form.Control
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={5}
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>
                      
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Target Amount (Rp)</Form.Label>
                            <Form.Control
                              type="number"
                              name="target_amount"
                              value={formData.target_amount}
                              onChange={handleChange}
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>End Date</Form.Label>
                            <Form.Control
                              type="date"
                              name="end_date"
                              value={formData.end_date}
                              onChange={handleChange}
                              required
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Campaign Status</Form.Label>
                        <Form.Select
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                        >
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                          <option value="paused">Paused</option>
                        </Form.Select>
                      </Form.Group>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Campaign Image</Form.Label>
                        <Form.Control
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                        <Form.Text className="text-muted">
                          Upload a new image to replace the current one
                        </Form.Text>
                      </Form.Group>
                      
                      {imagePreview && (
                        <div className="mb-3">
                          <p>Current Image:</p>
                          <img 
                            src={imagePreview} 
                            alt="Campaign Preview" 
                            style={{ maxWidth: '100%', maxHeight: '200px' }} 
                            className="border rounded"
                          />
                        </div>
                      )}
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Image URL (Alternative)</Form.Label>
                        <Form.Control
                          type="url"
                          name="image_url"
                          value={formData.image_url}
                          onChange={handleChange}
                          placeholder="Or provide a URL to an image"
                        />
                      </Form.Group>
                      
                      <div className="d-grid mt-4">
                        <Button 
                          variant="success" 
                          type="submit" 
                          disabled={updating}
                        >
                          {updating ? 'Updating...' : 'Update Campaign'}
                        </Button>
                      </div>
                    </Form>
                  </Tab.Pane>
                  
                  {/* Donations Tab */}
                  <Tab.Pane eventKey="donations">
                    {donations.length === 0 ? (
                      <p className="text-center my-4">No donations have been made to this campaign yet.</p>
                    ) : (
                      <Table responsive striped hover>
                        <thead>
                          <tr>
                            <th>Donor</th>
                            <th>Amount</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Message</th>
                          </tr>
                        </thead>
                        <tbody>
                          {donations.map(donation => (
                            <tr key={donation.id}>
                              <td>{donation.donor_name || 'Anonymous'}</td>
                              <td>Rp {parseFloat(donation.amount).toLocaleString()}</td>
                              <td>{new Date(donation.date).toLocaleDateString()}</td>
                              <td>
                                <span className={`badge ${donation.status === 'verified' ? 'bg-success' : donation.status === 'pending' ? 'bg-warning' : 'bg-secondary'}`}>
                                  {donation.status}
                                </span>
                              </td>
                              <td>{donation.message || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                  </Tab.Pane>
                  
                  {/* Milestones Tab */}
                  <Tab.Pane eventKey="milestones">
                    {!campaign.milestones || campaign.milestones.length === 0 ? (
                      <p className="text-center my-4">No milestones have been set for this campaign.</p>
                    ) : (
                      campaign.milestones.map((milestone, index) => (
                        <Card key={milestone.id || index} className="mb-3">
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <h5 className="mb-0">{milestone.title}</h5>
                              <span className={`badge ${milestone.status === 'completed' ? 'bg-success' : milestone.status === 'in_progress' ? 'bg-warning' : 'bg-secondary'}`}>
                                {milestone.status === 'completed' ? 'Completed' : 
                                  milestone.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                              </span>
                            </div>
                            
                            <p>{milestone.description}</p>
                            <p className="text-muted">Target: Rp {parseFloat(milestone.target_amount).toLocaleString()}</p>
                            
                            <div className="d-flex mt-3">
                              <Button 
                                variant={milestone.status === 'not_started' ? 'outline-warning' : 'outline-secondary'} 
                                size="sm"
                                className="me-2"
                                disabled={milestone.status === 'in_progress'}
                                onClick={() => handleMilestoneUpdate(milestone.id, 'in_progress')}
                              >
                                Mark as In Progress
                              </Button>
                              <Button 
                                variant={milestone.status === 'in_progress' ? 'outline-success' : 'outline-secondary'} 
                                size="sm"
                                disabled={milestone.status === 'completed'}
                                onClick={() => handleMilestoneUpdate(milestone.id, 'completed')}
                              >
                                Mark as Completed
                              </Button>
                            </div>
                          </Card.Body>
                        </Card>
                      ))
                    )}
                  </Tab.Pane>
                </Tab.Content>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Tab.Container>
    </div>
  );
};

export default ManageCampaign;
