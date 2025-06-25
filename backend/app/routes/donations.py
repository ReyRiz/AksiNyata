import os
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app.models.models import User, Campaign, Donation, Milestone, db
from datetime import datetime
import uuid

donations_bp = Blueprint('donations', __name__)

# Helper function to check if a file has an allowed extension
def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf'}
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Helper function to save file with unique name
def save_file(file):
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(file_path)
        return os.path.join('uploads', unique_filename)
    return None

# Campaign Routes
@donations_bp.route('/campaigns', methods=['GET'])
def get_campaigns():
    status = request.args.get('status')
    organizer_id = request.args.get('organizer_id')
    
    query = Campaign.query
    
    if status:
        query = query.filter_by(status=status)
    
    if organizer_id:
        query = query.filter_by(organizer_id=organizer_id)
    
    campaigns = query.order_by(Campaign.created_at.desc()).all()
    
    return jsonify({
        'campaigns': [campaign.to_dict() for campaign in campaigns]
    }), 200

@donations_bp.route('/campaigns/<int:campaign_id>', methods=['GET'])
def get_campaign(campaign_id):
    campaign = Campaign.query.get(campaign_id)
    
    if not campaign:
        return jsonify({'error': 'Campaign not found'}), 404
    
    # Get donations for this campaign
    donations = Donation.query.filter_by(campaign_id=campaign_id, status='verified').all()
    
    # Get milestones for this campaign
    milestones = Milestone.query.filter_by(campaign_id=campaign_id).all()
    
    return jsonify({
        'campaign': campaign.to_dict(),
        'donations': [donation.to_dict() for donation in donations],
        'milestones': [milestone.to_dict() for milestone in milestones]
    }), 200

@donations_bp.route('/campaigns', methods=['POST'])
@jwt_required()
def create_campaign():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or user.role not in ['organizer', 'creator']:
        return jsonify({'error': 'Unauthorized. Only organizers and creators can create campaigns'}), 403
    
    # Process form data
    title = request.form.get('title')
    description = request.form.get('description')
    target_amount = request.form.get('target_amount')
    end_date = request.form.get('end_date')
    
    # Validate required fields
    if not title or not description or not target_amount:
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        target_amount = float(target_amount)
    except ValueError:
        return jsonify({'error': 'Target amount must be a number'}), 400
    
    # Process campaign image
    image_path = None
    if 'image' in request.files:
        image_path = save_file(request.files['image'])
    
    # Create new campaign
    new_campaign = Campaign(
        title=title,
        description=description,
        target_amount=target_amount,
        image=image_path,
        organizer_id=current_user_id
    )
    
    # Set end date if provided
    if end_date:
        try:
            new_campaign.end_date = datetime.fromisoformat(end_date)
        except ValueError:
            pass
    
    db.session.add(new_campaign)
    db.session.commit()
    
    return jsonify({
        'message': 'Campaign created successfully',
        'campaign': new_campaign.to_dict()
    }), 201

@donations_bp.route('/campaigns/<int:campaign_id>', methods=['PUT'])
@jwt_required()
def update_campaign(campaign_id):
    current_user_id = get_jwt_identity()
    campaign = Campaign.query.get(campaign_id)
    
    if not campaign:
        return jsonify({'error': 'Campaign not found'}), 404
    
    # Check if user is the organizer
    if campaign.organizer_id != current_user_id:
        return jsonify({'error': 'Unauthorized. Only the campaign organizer can update it'}), 403
    
    # Update fields if provided
    if 'title' in request.form:
        campaign.title = request.form.get('title')
    
    if 'description' in request.form:
        campaign.description = request.form.get('description')
    
    if 'target_amount' in request.form:
        try:
            campaign.target_amount = float(request.form.get('target_amount'))
        except ValueError:
            return jsonify({'error': 'Target amount must be a number'}), 400
    
    if 'end_date' in request.form:
        try:
            campaign.end_date = datetime.fromisoformat(request.form.get('end_date'))
        except ValueError:
            pass
    
    if 'status' in request.form:
        status = request.form.get('status')
        if status in ['active', 'completed', 'cancelled']:
            campaign.status = status
    
    # Update image if provided
    if 'image' in request.files:
        image_path = save_file(request.files['image'])
        if image_path:
            campaign.image = image_path
    
    db.session.commit()
    
    return jsonify({
        'message': 'Campaign updated successfully',
        'campaign': campaign.to_dict()
    }), 200

# Donation Routes
@donations_bp.route('/donate', methods=['POST'])
@jwt_required()
def create_donation():
    current_user_id = get_jwt_identity()
    
    # Process form data
    campaign_id = request.form.get('campaign_id')
    amount = request.form.get('amount')
    message = request.form.get('message', '')
    
    # Validate required fields
    if not campaign_id or not amount:
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        amount = float(amount)
    except ValueError:
        return jsonify({'error': 'Amount must be a number'}), 400
    
    # Check if campaign exists
    campaign = Campaign.query.get(campaign_id)
    if not campaign:
        return jsonify({'error': 'Campaign not found'}), 404
    
    if campaign.status != 'active':
        return jsonify({'error': 'Cannot donate to inactive campaigns'}), 400
    
    # Process transfer proof
    transfer_proof = None
    if 'transfer_proof' in request.files:
        transfer_proof = save_file(request.files['transfer_proof'])
    
    # Create new donation
    new_donation = Donation(
        amount=amount,
        message=message,
        transfer_proof=transfer_proof,
        donor_id=current_user_id,
        campaign_id=campaign_id
    )
    
    db.session.add(new_donation)
    db.session.commit()
    
    return jsonify({
        'message': 'Donation created successfully',
        'donation': new_donation.to_dict()
    }), 201

@donations_bp.route('/donations/<int:donation_id>/verify', methods=['PUT'])
@jwt_required()
def verify_donation(donation_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or user.role != 'organizer':
        return jsonify({'error': 'Unauthorized. Only organizers can verify donations'}), 403
    
    donation = Donation.query.get(donation_id)
    
    if not donation:
        return jsonify({'error': 'Donation not found'}), 404
    
    # Check if user is the organizer of the campaign
    campaign = Campaign.query.get(donation.campaign_id)
    if campaign.organizer_id != current_user_id:
        return jsonify({'error': 'Unauthorized. Only the campaign organizer can verify donations'}), 403
    
    status = request.json.get('status')
    
    if status not in ['verified', 'rejected']:
        return jsonify({'error': 'Invalid status'}), 400
    
    donation.status = status
    
    if status == 'verified':
        donation.verified_at = datetime.utcnow()
        
        # Update campaign current amount
        campaign.current_amount += donation.amount
        
        # Check if any milestones have been achieved
        milestones = Milestone.query.filter_by(
            campaign_id=campaign.id, 
            status='pending'
        ).order_by(Milestone.target_amount.asc()).all()
        
        for milestone in milestones:
            if campaign.current_amount >= milestone.target_amount:
                milestone.status = 'achieved'
                milestone.achieved_at = datetime.utcnow()
        
        # Check if campaign target has been reached
        if campaign.current_amount >= campaign.target_amount and campaign.status == 'active':
            campaign.status = 'completed'
    
    db.session.commit()
    
    return jsonify({
        'message': f'Donation {status}',
        'donation': donation.to_dict()
    }), 200

# Milestone Routes
@donations_bp.route('/campaigns/<int:campaign_id>/milestones', methods=['POST'])
@jwt_required()
def create_milestone(campaign_id):
    current_user_id = get_jwt_identity()
    
    campaign = Campaign.query.get(campaign_id)
    
    if not campaign:
        return jsonify({'error': 'Campaign not found'}), 404
    
    # Check if user is the organizer
    if campaign.organizer_id != current_user_id:
        return jsonify({'error': 'Unauthorized. Only the campaign organizer can add milestones'}), 403
    
    data = request.json
    
    # Validate required fields
    if not data.get('title') or not data.get('description') or not data.get('target_amount'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        target_amount = float(data['target_amount'])
    except ValueError:
        return jsonify({'error': 'Target amount must be a number'}), 400
    
    # Create new milestone
    new_milestone = Milestone(
        title=data['title'],
        description=data['description'],
        target_amount=target_amount,
        campaign_id=campaign_id
    )
    
    # Check if milestone is already achieved
    if campaign.current_amount >= target_amount:
        new_milestone.status = 'achieved'
        new_milestone.achieved_at = datetime.utcnow()
    
    db.session.add(new_milestone)
    db.session.commit()
    
    return jsonify({
        'message': 'Milestone created successfully',
        'milestone': new_milestone.to_dict()
    }), 201

@donations_bp.route('/campaigns/<int:campaign_id>/milestones/<int:milestone_id>', methods=['PUT'])
@jwt_required()
def update_milestone(campaign_id, milestone_id):
    current_user_id = get_jwt_identity()
    
    campaign = Campaign.query.get(campaign_id)
    if not campaign:
        return jsonify({'error': 'Campaign not found'}), 404
    
    # Check if user is the organizer
    if campaign.organizer_id != current_user_id:
        return jsonify({'error': 'Unauthorized. Only the campaign organizer can update milestones'}), 403
    
    milestone = Milestone.query.get(milestone_id)
    if not milestone or milestone.campaign_id != campaign_id:
        return jsonify({'error': 'Milestone not found'}), 404
    
    data = request.json
    
    # Update status if provided
    if 'status' in data:
        status = data['status']
        if status in ['not_started', 'in_progress', 'completed']:
            milestone.status = status
            
            if status == 'completed':
                milestone.achieved_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        'message': 'Milestone updated successfully',
        'milestone': milestone.to_dict()
    }), 200

@donations_bp.route('', methods=['GET'])
@jwt_required()
def get_all_donations():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or user.role != 'organizer':
        return jsonify({'error': 'Unauthorized. Only organizers can view all donations'}), 403
    
    # Optional filter by status
    status = request.args.get('status')
    campaign_id = request.args.get('campaign_id')
    
    query = Donation.query
    
    if status:
        query = query.filter_by(status=status)
    
    if campaign_id:
        query = query.filter_by(campaign_id=campaign_id)
    
    donations = query.order_by(Donation.created_at.desc()).all()
    
    # Enhance donation data with donor and campaign info
    result = []
    for donation in donations:
        donation_dict = donation.to_dict()
        
        # Add donor info
        donor = User.query.get(donation.donor_id)
        if donor:
            donation_dict['donor_name'] = donor.name
        
        # Add campaign info
        campaign = Campaign.query.get(donation.campaign_id)
        if campaign:
            donation_dict['campaign_name'] = campaign.title
        
        result.append(donation_dict)
    
    return jsonify(result), 200

@donations_bp.route('/campaigns/<int:campaign_id>/donations', methods=['GET'])
@jwt_required()
def get_campaign_donations(campaign_id):
    current_user_id = get_jwt_identity()
    
    campaign = Campaign.query.get(campaign_id)
    if not campaign:
        return jsonify({'error': 'Campaign not found'}), 404
    
    # Check if user is authorized to view all donations for this campaign
    user = User.query.get(current_user_id)
    
    # Only organizers and the campaign creator can see all donations
    if user.role != 'organizer' and campaign.organizer_id != current_user_id:
        return jsonify({'error': 'Unauthorized. Only organizers and campaign creators can view all donations'}), 403
    
    donations = Donation.query.filter_by(campaign_id=campaign_id).order_by(Donation.created_at.desc()).all()
    
    # Enhance donation data with donor info
    result = []
    for donation in donations:
        donation_dict = donation.to_dict()
        
        # Add donor info
        donor = User.query.get(donation.donor_id)
        if donor:
            donation_dict['donor_name'] = donor.name
        
        result.append(donation_dict)
    
    return jsonify(result), 200
