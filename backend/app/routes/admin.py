from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.models import User, Campaign, Donation, Category, CampaignUpdate, db
from datetime import datetime

admin_bp = Blueprint('admin', __name__)

def require_admin():
    """Helper function to check if user is admin"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    return user

@admin_bp.route('/campaigns/pending', methods=['GET'])
@jwt_required()
def get_pending_campaigns():
    admin_check = require_admin()
    if isinstance(admin_check, tuple):  # Error response
        return admin_check
    
    campaigns = Campaign.query.filter_by(status='pending').order_by(Campaign.created_at.desc()).all()
    
    return jsonify({
        'campaigns': [campaign.to_dict() for campaign in campaigns]
    }), 200

@admin_bp.route('/campaigns/<int:campaign_id>/approve', methods=['PUT'])
@jwt_required()
def approve_campaign(campaign_id):
    admin_user = require_admin()
    if isinstance(admin_user, tuple):  # Error response
        return admin_user
    
    campaign = Campaign.query.get(campaign_id)
    if not campaign:
        return jsonify({'error': 'Campaign not found'}), 404
    
    if campaign.status != 'pending':
        return jsonify({'error': 'Campaign is not pending approval'}), 400
    
    campaign.status = 'active'
    campaign.approved_by = admin_user.id
    campaign.approved_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        'message': 'Campaign approved successfully',
        'campaign': campaign.to_dict()
    }), 200

@admin_bp.route('/campaigns/<int:campaign_id>/reject', methods=['PUT'])
@jwt_required()
def reject_campaign(campaign_id):
    admin_user = require_admin()
    if isinstance(admin_user, tuple):  # Error response
        return admin_user
    
    campaign = Campaign.query.get(campaign_id)
    if not campaign:
        return jsonify({'error': 'Campaign not found'}), 404
    
    if campaign.status != 'pending':
        return jsonify({'error': 'Campaign is not pending approval'}), 400
    
    data = request.get_json()
    rejection_reason = data.get('reason', 'No reason provided')
    
    campaign.status = 'rejected'
    campaign.rejection_reason = rejection_reason
    campaign.approved_by = admin_user.id
    campaign.approved_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        'message': 'Campaign rejected successfully',
        'campaign': campaign.to_dict()
    }), 200

@admin_bp.route('/campaigns/<int:campaign_id>/feature', methods=['PUT'])
@jwt_required()
def toggle_featured_campaign(campaign_id):
    admin_check = require_admin()
    if isinstance(admin_check, tuple):  # Error response
        return admin_check
    
    campaign = Campaign.query.get(campaign_id)
    if not campaign:
        return jsonify({'error': 'Campaign not found'}), 404
    
    campaign.is_featured = not campaign.is_featured
    db.session.commit()
    
    return jsonify({
        'message': f'Campaign {"featured" if campaign.is_featured else "unfeatured"} successfully',
        'campaign': campaign.to_dict()
    }), 200

@admin_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def admin_dashboard():
    admin_check = require_admin()
    if isinstance(admin_check, tuple):  # Error response
        return admin_check
    
    # Get statistics
    total_users = User.query.count()
    total_campaigns = Campaign.query.count()
    pending_campaigns = Campaign.query.filter_by(status='pending').count()
    active_campaigns = Campaign.query.filter_by(status='active').count()
    total_donations = Donation.query.count()
    pending_donations = Donation.query.filter_by(status='pending').count()
    
    # Total amount donated
    verified_donations = Donation.query.filter_by(status='verified').all()
    total_donated = sum(donation.amount for donation in verified_donations)
    
    # Recent activities
    recent_campaigns = Campaign.query.order_by(Campaign.created_at.desc()).limit(5).all()
    recent_donations = Donation.query.order_by(Donation.created_at.desc()).limit(5).all()
    
    return jsonify({
        'stats': {
            'total_users': total_users,
            'total_campaigns': total_campaigns,
            'pending_campaigns': pending_campaigns,
            'active_campaigns': active_campaigns,
            'total_donations': total_donations,
            'pending_donations': pending_donations,
            'total_donated': total_donated
        },
        'recent_campaigns': [campaign.to_dict() for campaign in recent_campaigns],
        'recent_donations': [donation.to_dict() for donation in recent_donations]
    }), 200

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    admin_check = require_admin()
    if isinstance(admin_check, tuple):  # Error response
        return admin_check
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '')
    
    query = User.query
    
    if search:
        query = query.filter(
            User.full_name.contains(search) |
            User.email.contains(search) |
            User.username.contains(search)
        )
    
    users = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'users': [user.to_dict() for user in users.items],
        'total': users.total,
        'pages': users.pages,
        'current_page': page
    }), 200

@admin_bp.route('/users/<int:user_id>/toggle-active', methods=['PUT'])
@jwt_required()
def toggle_user_active(user_id):
    admin_check = require_admin()
    if isinstance(admin_check, tuple):  # Error response
        return admin_check
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if user.role == 'admin':
        return jsonify({'error': 'Cannot deactivate admin user'}), 400
    
    user.is_active = not user.is_active
    db.session.commit()
    
    return jsonify({
        'message': f'User {"activated" if user.is_active else "deactivated"} successfully',
        'user': user.to_dict()
    }), 200

@admin_bp.route('/categories', methods=['GET', 'POST'])
@jwt_required()
def manage_categories():
    if request.method == 'GET':
        categories = Category.query.filter_by(is_active=True).all()
        return jsonify({
            'categories': [category.to_dict() for category in categories]
        }), 200
    
    # POST - Create new category
    admin_check = require_admin()
    if isinstance(admin_check, tuple):  # Error response
        return admin_check
    
    data = request.get_json()
    
    if not data.get('name'):
        return jsonify({'error': 'Category name is required'}), 400
    
    # Check if category already exists
    existing_category = Category.query.filter_by(name=data['name']).first()
    if existing_category:
        return jsonify({'error': 'Category already exists'}), 400
    
    new_category = Category(
        name=data['name'],
        description=data.get('description'),
        icon=data.get('icon')
    )
    
    db.session.add(new_category)
    db.session.commit()
    
    return jsonify({
        'message': 'Category created successfully',
        'category': new_category.to_dict()
    }), 201
