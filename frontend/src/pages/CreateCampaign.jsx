import React, { useState } from 'react';
import { Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { createCampaign } from '../services/api';

const CreateCampaign = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_amount: '',
    end_date: '',
    image_url: '',
    milestones: [{ title: '', description: '', target_amount: '' }]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleMilestoneChange = (index, e) => {
    const { name, value } = e.target;
    const updatedMilestones = [...formData.milestones];
    updatedMilestones[index] = {
      ...updatedMilestones[index],
      [name]: value
    };
    setFormData(prev => ({
      ...prev,
      milestones: updatedMilestones
    }));
  };

  const addMilestone = () => {
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, { title: '', description: '', target_amount: '' }]
    }));
  };

  const removeMilestone = (index) => {
    if (formData.milestones.length > 1) {
      const updatedMilestones = [...formData.milestones];
      updatedMilestones.splice(index, 1);
      setFormData(prev => ({
        ...prev,
        milestones: updatedMilestones
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Prepare form data for API
      const campaignData = new FormData();
      campaignData.append('title', formData.title);
      campaignData.append('description', formData.description);
      campaignData.append('target_amount', formData.target_amount);
      campaignData.append('end_date', formData.end_date);
      
      // Add image file if selected
      if (imageFile) {
        campaignData.append('image', imageFile);
      } else if (formData.image_url) {
        campaignData.append('image_url', formData.image_url);
      }
      
      // Add milestones
      campaignData.append('milestones', JSON.stringify(formData.milestones));

      // Submit to API
      const response = await createCampaign(campaignData);
      
      // Redirect to the new campaign page
      navigate(`/campaigns/${response.id}`);
    } catch (err) {
      console.error('Campaign creation failed:', err);
      setError('Failed to create campaign. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-campaign-page">
      <h1 className="text-center mb-4">Create New Campaign</h1>
      
      <Row>
        <Col lg={10} className="mx-auto">
          <Card className="shadow-sm">
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Campaign Title</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter a compelling title"
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
                    placeholder="Explain your campaign in detail"
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
                        placeholder="Enter amount in Rupiah"
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
                  <Form.Label>Campaign Image</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  <Form.Text className="text-muted">
                    Upload an image to represent your campaign
                  </Form.Text>
                </Form.Group>

                {imagePreview && (
                  <div className="mb-3">
                    <p>Image Preview:</p>
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

                <h4 className="mt-4 mb-3">Campaign Milestones</h4>
                <p className="text-muted">Define milestones to track progress and keep donors engaged</p>

                {formData.milestones.map((milestone, index) => (
                  <Card key={index} className="mb-3 milestone-card">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h5 className="mb-0">Milestone {index + 1}</h5>
                        {formData.milestones.length > 1 && (
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => removeMilestone(index)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Title</Form.Label>
                        <Form.Control
                          type="text"
                          name="title"
                          value={milestone.title}
                          onChange={(e) => handleMilestoneChange(index, e)}
                          placeholder="Milestone title"
                          required
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          name="description"
                          value={milestone.description}
                          onChange={(e) => handleMilestoneChange(index, e)}
                          placeholder="What will be accomplished at this milestone?"
                          required
                        />
                      </Form.Group>

                      <Form.Group>
                        <Form.Label>Target Amount (Rp)</Form.Label>
                        <Form.Control
                          type="number"
                          name="target_amount"
                          value={milestone.target_amount}
                          onChange={(e) => handleMilestoneChange(index, e)}
                          placeholder="Amount needed for this milestone"
                          required
                        />
                      </Form.Group>
                    </Card.Body>
                  </Card>
                ))}

                <div className="d-grid mb-4">
                  <Button 
                    variant="outline-success" 
                    onClick={addMilestone}
                    className="mb-3"
                  >
                    + Add Another Milestone
                  </Button>
                </div>

                <div className="d-grid">
                  <Button 
                    variant="success" 
                    type="submit" 
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? 'Creating Campaign...' : 'Create Campaign'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CreateCampaign;
