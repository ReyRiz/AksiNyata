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
    category = request.args.get('category')
    featured = request.args.get('featured')
    search = request.args.get('search')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 12, type=int)
    
    query = Campaign.query
    
    # Filter by status - default to only show active campaigns for public
    if status:
        query = query.filter_by(status=status)
    else:
        query = query.filter_by(status='active')
    
    if category:
        query = query.filter_by(category=category)
    
    if featured == 'true':
        query = query.filter_by(is_featured=True)
    
    if search:
        query = query.filter(
            Campaign.title.contains(search) |
            Campaign.description.contains(search)
        )
    
    # Order by featured campaigns first, then by creation date
    query = query.order_by(Campaign.is_featured.desc(), Campaign.created_at.desc())
    
    campaigns = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'campaigns': [campaign.to_dict() for campaign in campaigns.items],
        'total': campaigns.total,
        'pages': campaigns.pages,
        'current_page': page
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
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Process form data
    title = request.form.get('title')
    description = request.form.get('description')
    target_amount = request.form.get('target_amount')
    end_date = request.form.get('end_date')
    category = request.form.get('category')
    
    # Validate required fields
    if not title or not description or not target_amount:
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        target_amount = float(target_amount)
        if target_amount <= 0:
            return jsonify({'error': 'Target amount must be greater than 0'}), 400
    except ValueError:
        return jsonify({'error': 'Target amount must be a valid number'}), 400
    
    # Process campaign image
    image_path = None
    if 'image' in request.files:
        image_path = save_file(request.files['image'])
    
    # Create new campaign with pending status
    new_campaign = Campaign(
        title=title,
        description=description,
        target_amount=target_amount,
        image=image_path,
        category=category,
        creator_id=current_user_id,
        status='pending'  # All new campaigns start as pending
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
        'message': 'Campaign created successfully and is pending approval',
        'campaign': new_campaign.to_dict()
    }), 201

@donations_bp.route('/campaigns/<int:campaign_id>', methods=['PUT'])
@jwt_required()
def update_campaign(campaign_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    campaign = Campaign.query.get(campaign_id)
    
    if not campaign:
        return jsonify({'error': 'Campaign not found'}), 404
    
    # Check if user is the creator or admin
    if campaign.creator_id != current_user_id and user.role != 'admin':
        return jsonify({'error': 'Unauthorized. Only the campaign creator or admin can update it'}), 403
    
    # Update fields if provided
    if 'title' in request.form:
        campaign.title = request.form.get('title')
    
    if 'description' in request.form:
        campaign.description = request.form.get('description')
    
    if 'target_amount' in request.form:
        try:
            target_amount = float(request.form.get('target_amount'))
            if target_amount <= 0:
                return jsonify({'error': 'Target amount must be greater than 0'}), 400
            campaign.target_amount = target_amount
        except ValueError:
            return jsonify({'error': 'Target amount must be a valid number'}), 400
    
    if 'end_date' in request.form:
        try:
            campaign.end_date = datetime.fromisoformat(request.form.get('end_date'))
        except ValueError:
            pass
    
    if 'category' in request.form:
        campaign.category = request.form.get('category')
    
    # Only admin can change status
    if 'status' in request.form and user.role == 'admin':
        status = request.form.get('status')
        if status in ['pending', 'active', 'completed', 'cancelled', 'rejected']:
            campaign.status = status
    
    # Update image if provided
    if 'image' in request.files:
        image_path = save_file(request.files['image'])
        if image_path:
            campaign.image = image_path
    
    campaign.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'message': 'Campaign updated successfully',
        'campaign': campaign.to_dict()
    }), 200

# Donation Routes
@donations_bp.route('/donate', methods=['POST'])
@jwt_required(optional=True)  # Allow anonymous donations
def create_donation():
    current_user_id = get_jwt_identity()
    
    # Process form data
    campaign_id = request.form.get('campaign_id')
    amount = request.form.get('amount')
    message = request.form.get('message', '')
    donor_name = request.form.get('donor_name', '')
    payment_method = request.form.get('payment_method', 'bank_transfer')
    is_anonymous = request.form.get('is_anonymous', 'false').lower() == 'true'
    
    # Validate required fields
    if not campaign_id or not amount:
        return jsonify({'error': 'Campaign ID and amount are required'}), 400
    
    try:
        amount = float(amount)
        if amount <= 0:
            return jsonify({'error': 'Amount must be greater than 0'}), 400
    except ValueError:
        return jsonify({'error': 'Amount must be a valid number'}), 400
    
    # Check if campaign exists and is active
    campaign = Campaign.query.get(campaign_id)
    if not campaign:
        return jsonify({'error': 'Campaign not found'}), 404
    
    if campaign.status != 'active':
        return jsonify({'error': 'Cannot donate to inactive campaigns'}), 400
    
    # For anonymous donations, require donor name if not logged in
    if not current_user_id and not donor_name:
        return jsonify({'error': 'Donor name is required for anonymous donations'}), 400
    
    # Process transfer proof
    transfer_proof = None
    if 'transfer_proof' in request.files:
        transfer_proof = save_file(request.files['transfer_proof'])
    
    # Create new donation
    new_donation = Donation(
        amount=amount,
        message=message,
        donor_name=donor_name if not current_user_id else None,
        transfer_proof=transfer_proof,
        payment_method=payment_method,
        is_anonymous=is_anonymous,
        donor_id=current_user_id,
        campaign_id=campaign_id
    )
    
    db.session.add(new_donation)
    db.session.commit()
    
    return jsonify({
        'message': 'Donation created successfully. Please wait for verification.',
        'donation': new_donation.to_dict()
    }), 201

@donations_bp.route('/<int:donation_id>/verify', methods=['PUT'])
@jwt_required()
def verify_donation(donation_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or user.role not in ['admin', 'organizer']:
        return jsonify({'error': 'Unauthorized. Only admins and organizers can verify donations'}), 403
    
    donation = Donation.query.get(donation_id)
    
    if not donation:
        return jsonify({'error': 'Donation not found'}), 404
    
    data = request.json
    status = data.get('status')
    rejection_reason = data.get('rejection_reason')
    
    if status not in ['verified', 'rejected']:
        return jsonify({'error': 'Invalid status. Must be verified or rejected'}), 400
    
    donation.status = status
    donation.verified_by = current_user_id
    
    if status == 'verified':
        donation.verified_at = datetime.utcnow()
        
        # Update campaign current amount
        campaign = Campaign.query.get(donation.campaign_id)
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
            
    elif status == 'rejected':
        donation.rejection_reason = rejection_reason
    
    db.session.commit()
    
    return jsonify({
        'message': f'Donation {status} successfully',
        'donation': donation.to_dict()
    }), 200

@donations_bp.route('/<int:donation_id>/reject', methods=['PUT'])
@jwt_required()
def reject_donation(donation_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or user.role not in ['admin', 'organizer']:
        return jsonify({'error': 'Unauthorized. Only admins and organizers can reject donations'}), 403
    
    donation = Donation.query.get(donation_id)
    
    if not donation:
        return jsonify({'error': 'Donation not found'}), 404
    
    data = request.json
    rejection_reason = data.get('rejection_reason', 'No reason provided')
    
    donation.status = 'rejected'
    donation.rejection_reason = rejection_reason
    donation.verified_by = current_user_id
    
    db.session.commit()
    
    return jsonify({
        'message': 'Donation rejected successfully',
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
    if campaign.creator_id != current_user_id:
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
    if campaign.creator_id != current_user_id:
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
    
    if not user or user.role not in ['organizer', 'admin']:
        return jsonify({'error': 'Unauthorized. Only organizers and admins can view all donations'}), 403
    
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
    if user.role != 'organizer' and campaign.creator_id != current_user_id:
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
