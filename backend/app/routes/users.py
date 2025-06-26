import os
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app.models.models import User, db
import uuid

users_bp = Blueprint('users', __name__)

# Helper function to check if a file has an allowed extension
def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
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

@users_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get the user's donations
        from app.models.models import Donation
        donations = Donation.query.filter_by(donor_id=current_user_id).all()
        
        # Get the user's campaigns if they are a creator or organizer
        campaigns = []
        if user.role in ['creator', 'organizer']:
            from app.models.models import Campaign
            campaigns = Campaign.query.filter_by(creator_id=current_user_id).all()
        
        return jsonify({
            'user': user.to_dict(),
            'donations': [donation.to_dict() for donation in donations],
            'campaigns': [campaign.to_dict() for campaign in campaigns]
        }), 200
    except Exception as e:
        print(f"Profile error: {str(e)}")
        return jsonify({'error': f'Failed to get profile data: {str(e)}'}), 500

@users_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Update fields if provided in form data
    if 'full_name' in request.form:
        user.full_name = request.form.get('full_name')
    
    if 'email' in request.form:
        email = request.form.get('email')
        # Check if email already exists for another user
        existing_user = User.query.filter_by(email=email).first()
        if existing_user and existing_user.id != current_user_id:
            return jsonify({'error': 'Email already exists'}), 400
        user.email = email
    
    # Update password if provided
    if 'password' in request.form:
        user.set_password(request.form.get('password'))
    
    # Update profile picture if provided
    if 'profile_picture' in request.files:
        profile_picture = save_file(request.files['profile_picture'])
        if profile_picture:
            user.profile_picture = profile_picture
    
    db.session.commit()
    
    return jsonify({
        'message': 'Profile updated successfully',
        'user': user.to_dict()
    }), 200

@users_bp.route('/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'user': user.to_dict()
    }), 200

@users_bp.route('', methods=['GET'])
@jwt_required()
def get_users():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    if not current_user or current_user.role not in ['organizer', 'admin']:
        return jsonify({'error': 'Unauthorized. Only organizers and admins can access this'}), 403
    
    users = User.query.all()
    
    return jsonify([user.to_dict() for user in users]), 200

@users_bp.route('/<int:user_id>/role', methods=['PUT'])
@jwt_required()
def update_user_role(user_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    if not current_user or current_user.role not in ['organizer', 'admin']:
        return jsonify({'error': 'Unauthorized. Only organizers and admins can update roles'}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    if not data or 'role' not in data:
        return jsonify({'error': 'Role is required'}), 400
    
    role = data['role']
    if role not in ['donor', 'creator', 'organizer']:
        return jsonify({'error': 'Invalid role'}), 400
    
    user.role = role
    db.session.commit()
    
    return jsonify({
        'message': 'User role updated successfully',
        'user': user.to_dict()
    }), 200

@users_bp.route('/<int:user_id>/deactivate', methods=['PUT'])
@jwt_required()
def deactivate_user(user_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    if not current_user or current_user.role != 'organizer':
        return jsonify({'error': 'Unauthorized. Only organizers can deactivate users'}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Don't allow deactivating yourself
    if user.id == current_user_id:
        return jsonify({'error': 'You cannot deactivate your own account'}), 400
    
    user.is_active = False
    db.session.commit()
    
    return jsonify({
        'message': 'User deactivated successfully',
        'user': user.to_dict()
    }), 200

@users_bp.route('/<int:user_id>/activate', methods=['PUT'])
@jwt_required()
def activate_user(user_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    if not current_user or current_user.role != 'organizer':
        return jsonify({'error': 'Unauthorized. Only organizers can activate users'}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    user.is_active = True
    db.session.commit()
    
    return jsonify({
        'message': 'User activated successfully',
        'user': user.to_dict()
    }), 200

@users_bp.route('/change-role/<int:user_id>', methods=['PUT'])
@jwt_required()
def change_role(user_id):
    current_user_id = int(get_jwt_identity())
    admin = User.query.get(current_user_id)
    
    if not admin or admin.role != 'organizer':
        return jsonify({'error': 'Unauthorized. Only organizers can change roles'}), 403
    
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.json
    new_role = data.get('role')
    
    if not new_role or new_role not in ['organizer', 'creator', 'donor']:
        return jsonify({'error': 'Invalid role'}), 400
    
    user.role = new_role
    db.session.commit()
    
    return jsonify({
        'message': 'User role updated successfully',
        'user': user.to_dict()
    }), 200

@users_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard():
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Import models
        from app.models.models import Donation, Campaign, Milestone
        from sqlalchemy import func
        
        # Get user's donations (for all roles)
        user_donations = Donation.query.filter_by(donor_id=current_user_id).all()
        
        # Initialize dashboard data
        dashboard_data = {
            'user': user.to_dict(),
            'stats': {
                'total_donated': 0,
                'total_campaigns': 0,
                'active_campaigns': 0,
                'total_raised': 0,
                'pending_donations_count': 0
            },
            'donations': [donation.to_dict() for donation in user_donations],
            'campaigns': [],
            'pending_donations': [],
            'recent_milestones': []
        }
        
        # Calculate total donated by this user
        total_donated = sum(donation.amount for donation in user_donations if donation.status == 'verified')
        dashboard_data['stats']['total_donated'] = total_donated
        
        # Role-specific data
        if user.role in ['organizer', 'creator']:
            # Get campaigns created by this user
            user_campaigns = Campaign.query.filter_by(creator_id=current_user_id).all()
            dashboard_data['campaigns'] = [campaign.to_dict() for campaign in user_campaigns]
            dashboard_data['stats']['total_campaigns'] = len(user_campaigns)
            
            # Count active campaigns
            active_campaigns = sum(1 for campaign in user_campaigns if campaign.status == 'active')
            dashboard_data['stats']['active_campaigns'] = active_campaigns
            
            # Calculate total raised across all campaigns
            total_raised = 0
            for campaign in user_campaigns:
                campaign_donations = Donation.query.filter_by(
                    campaign_id=campaign.id,
                    status='verified'
                ).all()
                campaign_total = sum(donation.amount for donation in campaign_donations)
                total_raised += campaign_total
            dashboard_data['stats']['total_raised'] = total_raised
            
            # Get pending donations for verification (organizers)
            if user.role == 'organizer':
                campaign_ids = [campaign.id for campaign in user_campaigns]
                if campaign_ids:
                    pending_donations = Donation.query.filter(
                        Donation.campaign_id.in_(campaign_ids),
                        Donation.status == 'pending'
                    ).all()
                    dashboard_data['pending_donations'] = [donation.to_dict() for donation in pending_donations]
                    dashboard_data['stats']['pending_donations_count'] = len(pending_donations)
            
            # Get recent milestones
            if user_campaigns:
                campaign_ids = [campaign.id for campaign in user_campaigns]
                recent_milestones = Milestone.query.filter(
                    Milestone.campaign_id.in_(campaign_ids)
                ).order_by(Milestone.created_at.desc()).limit(5).all()
                dashboard_data['recent_milestones'] = [milestone.to_dict() for milestone in recent_milestones]
        
        elif user.role in ['donor', 'user']:
            # For donors/users, focus on their donation activity
            # Get campaigns they've donated to
            donated_campaign_ids = list(set([d.campaign_id for d in user_donations]))
            if donated_campaign_ids:
                donated_campaigns = Campaign.query.filter(Campaign.id.in_(donated_campaign_ids)).all()
                dashboard_data['campaigns'] = [campaign.to_dict() for campaign in donated_campaigns]
            
            # Additional stats for donors
            dashboard_data['stats']['campaigns_supported'] = len(donated_campaign_ids)
            dashboard_data['stats']['total_donations_count'] = len(user_donations)
        
        return jsonify(dashboard_data), 200
    except Exception as e:
        print(f"Dashboard error: {str(e)}")
        return jsonify({'error': f'Failed to get dashboard data: {str(e)}'}), 500
