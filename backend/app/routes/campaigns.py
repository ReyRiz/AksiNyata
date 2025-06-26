from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import desc, func
from app import db
from app.models.models import Campaign, User, Donation, CampaignUpdate, Category
from datetime import datetime
import os
from werkzeug.utils import secure_filename

campaigns_bp = Blueprint('campaigns', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@campaigns_bp.route('', methods=['GET'])
def get_campaigns():
    """Get all approved campaigns with filtering and pagination"""
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 10, type=int), 100)
    category_id = request.args.get('category_id', type=int)
    status = request.args.get('status', 'active')  # Default to active campaigns
    search = request.args.get('search', '')
    featured = request.args.get('featured', type=bool)
    urgent = request.args.get('urgent', type=bool)
    
    query = Campaign.query
    
    # Filter by status (public endpoint only shows active/approved campaigns by default)
    if status == 'active':
        query = query.filter(Campaign.status.in_(['active', 'approved']))
    elif status == 'all':
        # Only show all if explicitly requested (admin feature)
        pass
    else:
        query = query.filter(Campaign.status == status)
    
    # Filter by category
    if category_id:
        query = query.filter(Campaign.category_id == category_id)
    
    # Filter by featured/urgent
    if featured is not None:
        query = query.filter(Campaign.is_featured == featured)
    if urgent is not None:
        query = query.filter(Campaign.is_urgent == urgent)
    
    # Search filter
    if search:
        query = query.filter(
            db.or_(
                Campaign.title.ilike(f'%{search}%'),
                Campaign.description.ilike(f'%{search}%')
            )
        )
    
    # Order by featured first, then by urgency, then by creation date
    query = query.order_by(
        desc(Campaign.is_featured),
        desc(Campaign.is_urgent),
        desc(Campaign.created_at)
    )
    
    campaigns = query.paginate(
        page=page, 
        per_page=per_page, 
        error_out=False
    )
    
    return jsonify({
        'campaigns': [{
            'id': campaign.id,
            'title': campaign.title,
            'description': campaign.description,
            'goal_amount': campaign.goal_amount,
            'current_amount': campaign.current_amount,
            'image_url': campaign.image_url,
            'status': campaign.status,
            'is_featured': campaign.is_featured,
            'is_urgent': campaign.is_urgent,
            'deadline': campaign.deadline.isoformat() if campaign.deadline else None,
            'created_at': campaign.created_at.isoformat(),
            'updated_at': campaign.updated_at.isoformat(),
            'creator': {
                'id': campaign.creator.id,
                'name': campaign.creator.full_name or campaign.creator.username,
                'full_name': campaign.creator.full_name or campaign.creator.username,
                'email': campaign.creator.email
            },
            'category': {
                'id': campaign.category.id,
                'name': campaign.category.name
            } if campaign.category else None,
            'progress_percentage': (campaign.current_amount / campaign.goal_amount * 100) if campaign.goal_amount > 0 else 0,
            'donations_count': len(campaign.donations or []),
            'followers_count': len(getattr(campaign, 'followers', []))
        } for campaign in campaigns.items],
        'pagination': {
            'page': campaigns.page,
            'pages': campaigns.pages,
            'per_page': campaigns.per_page,
            'total': campaigns.total,
            'has_next': campaigns.has_next,
            'has_prev': campaigns.has_prev
        }
    })

@campaigns_bp.route('/<int:campaign_id>', methods=['GET'])
def get_campaign(campaign_id):
    """Get a specific campaign with full details"""
    campaign = Campaign.query.get_or_404(campaign_id)
    
    # Only show approved or active campaigns to non-admin users
    if campaign.status not in ['approved', 'active']:
        return jsonify({'error': 'Campaign not found or not approved'}), 404
    
    return jsonify({
        'id': campaign.id,
        'title': campaign.title,
        'description': campaign.description,
        'goal_amount': campaign.goal_amount,
        'current_amount': campaign.current_amount,
        'image_url': campaign.image_url,
        'status': campaign.status,
        'is_featured': campaign.is_featured,
        'is_urgent': campaign.is_urgent,
        'deadline': campaign.deadline.isoformat() if campaign.deadline else None,
        'created_at': campaign.created_at.isoformat(),
        'updated_at': campaign.updated_at.isoformat(),
        'creator': {
            'id': campaign.creator.id,
            'name': campaign.creator.full_name or campaign.creator.username,
            'full_name': campaign.creator.full_name or campaign.creator.username,
            'email': campaign.creator.email
        } if campaign.creator else None,
        'category': {
            'id': campaign.category.id,
            'name': campaign.category.name
        } if campaign.category else None,
        'progress_percentage': (campaign.current_amount / campaign.goal_amount * 100) if campaign.goal_amount > 0 else 0,
        'donations_count': len(campaign.donations or []),
        'followers_count': len(getattr(campaign, 'followers', [])),
        'recent_donations': [{
            'id': donation.id,
            'amount': donation.amount,
            'donor_name': (donation.donor.full_name if donation.donor else 'Anonymous') if not getattr(donation, 'is_anonymous', False) else 'Anonymous',
            'message': donation.message,
            'created_at': donation.created_at.isoformat()
        } for donation in (campaign.donations or [])[-10:]],  # Last 10 donations
        'updates': [{
            'id': update.id,
            'title': update.title,
            'content': update.content,
            'created_at': update.created_at.isoformat()
        } for update in (campaign.updates.order_by(desc(CampaignUpdate.created_at)).limit(5) if hasattr(campaign, 'updates') else [])]  # Last 5 updates
    })

@campaigns_bp.route('', methods=['POST'])
@jwt_required()
def create_campaign():
    """Create a new campaign (requires authentication)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'description', 'goal_amount']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate goal amount
        try:
            goal_amount = float(data['goal_amount'])
            if goal_amount <= 0:
                return jsonify({'error': 'Goal amount must be greater than 0'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid goal amount'}), 400
        
        # Validate deadline if provided
        deadline = None
        if data.get('deadline'):
            try:
                deadline = datetime.fromisoformat(data['deadline'].replace('Z', '+00:00'))
                if deadline <= datetime.now():
                    return jsonify({'error': 'Deadline must be in the future'}), 400
            except ValueError:
                return jsonify({'error': 'Invalid deadline format'}), 400
        
        # Validate category if provided
        category = None
        if data.get('category_id'):
            category = Category.query.get(data['category_id'])
            if not category:
                return jsonify({'error': 'Invalid category'}), 400
        
        # Create new campaign
        campaign = Campaign(
            title=data['title'],
            description=data['description'],
            target_amount=goal_amount,
            organizer_id=current_user_id,  # Set the required organizer_id
            creator_id=current_user_id,
            category_id=data.get('category_id'),
            deadline=deadline,
            image_url=data.get('image_url'),
            status='pending'  # All new campaigns start as pending
        )
        
        db.session.add(campaign)
        db.session.commit()
        
        return jsonify({
            'message': 'Campaign created successfully and is pending approval',
            'campaign': {
                'id': campaign.id,
                'title': campaign.title,
                'status': campaign.status,
                'created_at': campaign.created_at.isoformat()
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating campaign: {str(e)}")
        return jsonify({'error': 'Failed to create campaign'}), 500

@campaigns_bp.route('/<int:campaign_id>', methods=['PUT'])
@jwt_required()
def update_campaign(campaign_id):
    """Update a campaign (only by creator or admin)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        campaign = Campaign.query.get_or_404(campaign_id)
        
        # Check permissions
        if campaign.creator_id != current_user_id and user.role != 'admin':
            return jsonify({'error': 'Unauthorized to update this campaign'}), 403
        
        data = request.get_json()
        
        # Update allowed fields
        if 'title' in data:
            campaign.title = data['title']
        if 'description' in data:
            campaign.description = data['description']
        if 'image_url' in data:
            campaign.image_url = data['image_url']
        
        # Only creator can update goal amount and deadline
        if campaign.creator_id == current_user_id:
            if 'goal_amount' in data:
                try:
                    goal_amount = float(data['goal_amount'])
                    if goal_amount <= 0:
                        return jsonify({'error': 'Goal amount must be greater than 0'}), 400
                    campaign.goal_amount = goal_amount
                except (ValueError, TypeError):
                    return jsonify({'error': 'Invalid goal amount'}), 400
            
            if 'deadline' in data and data['deadline']:
                try:
                    deadline = datetime.fromisoformat(data['deadline'].replace('Z', '+00:00'))
                    if deadline <= datetime.now():
                        return jsonify({'error': 'Deadline must be in the future'}), 400
                    campaign.deadline = deadline
                except ValueError:
                    return jsonify({'error': 'Invalid deadline format'}), 400
        
        # Update category if provided
        if 'category_id' in data:
            if data['category_id']:
                category = Category.query.get(data['category_id'])
                if not category:
                    return jsonify({'error': 'Invalid category'}), 400
                campaign.category_id = data['category_id']
            else:
                campaign.category_id = None
        
        campaign.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Campaign updated successfully',
            'campaign': {
                'id': campaign.id,
                'title': campaign.title,
                'description': campaign.description,
                'goal_amount': campaign.goal_amount,
                'updated_at': campaign.updated_at.isoformat()
            }
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating campaign: {str(e)}")
        return jsonify({'error': 'Failed to update campaign'}), 500

@campaigns_bp.route('/<int:campaign_id>/updates', methods=['POST'])
@jwt_required()
def create_campaign_update(campaign_id):
    """Create a campaign update (only by creator)"""
    try:
        current_user_id = get_jwt_identity()
        campaign = Campaign.query.get_or_404(campaign_id)
        
        # Check permissions
        if campaign.creator_id != current_user_id:
            return jsonify({'error': 'Only campaign creator can post updates'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        if not data.get('title') or not data.get('content'):
            return jsonify({'error': 'Title and content are required'}), 400
        
        # Create update
        update = CampaignUpdate(
            campaign_id=campaign_id,
            title=data['title'],
            content=data['content']
        )
        
        db.session.add(update)
        db.session.commit()
        
        return jsonify({
            'message': 'Campaign update posted successfully',
            'update': {
                'id': update.id,
                'title': update.title,
                'content': update.content,
                'created_at': update.created_at.isoformat()
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating campaign update: {str(e)}")
        return jsonify({'error': 'Failed to create campaign update'}), 500

@campaigns_bp.route('/<int:campaign_id>/follow', methods=['POST'])
@jwt_required()
def follow_campaign(campaign_id):
    """Follow/unfollow a campaign"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        campaign = Campaign.query.get_or_404(campaign_id)
        
        # Check if already following
        if campaign in user.followed_campaigns:
            user.followed_campaigns.remove(campaign)
            message = 'Campaign unfollowed successfully'
            is_following = False
        else:
            user.followed_campaigns.append(campaign)
            message = 'Campaign followed successfully'
            is_following = True
        
        db.session.commit()
        
        return jsonify({
            'message': message,
            'is_following': is_following,
            'followers_count': len(campaign.followers)
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error following/unfollowing campaign: {str(e)}")
        return jsonify({'error': 'Failed to follow/unfollow campaign'}), 500

@campaigns_bp.route('/my-campaigns', methods=['GET'])
@jwt_required()
def get_my_campaigns():
    """Get campaigns created by the current user"""
    current_user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 10, type=int), 100)
    
    campaigns = Campaign.query.filter_by(creator_id=current_user_id)\
        .order_by(desc(Campaign.created_at))\
        .paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'campaigns': [{
            'id': campaign.id,
            'title': campaign.title,
            'description': campaign.description,
            'goal_amount': campaign.goal_amount,
            'current_amount': campaign.current_amount,
            'status': campaign.status,
            'is_featured': campaign.is_featured,
            'is_urgent': campaign.is_urgent,
            'created_at': campaign.created_at.isoformat(),
            'updated_at': campaign.updated_at.isoformat(),
            'progress_percentage': (campaign.current_amount / campaign.goal_amount * 100) if campaign.goal_amount > 0 else 0,
            'donations_count': len(campaign.donations)
        } for campaign in campaigns.items],
        'pagination': {
            'page': campaigns.page,
            'pages': campaigns.pages,
            'per_page': campaigns.per_page,
            'total': campaigns.total,
            'has_next': campaigns.has_next,
            'has_prev': campaigns.has_prev
        }
    })

@campaigns_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get all categories"""
    from app.models.models import Category, Campaign
    
    categories = Category.query.order_by(Category.name).all()
    
    # Count campaigns for each category
    category_data = []
    for category in categories:
        campaigns_count = Campaign.query.filter_by(category_id=category.id).count()
        category_data.append({
            'id': category.id,
            'name': category.name,
            'description': category.description,
            'icon': category.icon,
            'campaigns_count': campaigns_count
        })
    
    return jsonify({
        'categories': category_data
    })

@campaigns_bp.route('/upload-image', methods=['POST'])
@jwt_required()
def upload_campaign_image():
    """Upload campaign image"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Only PNG, JPG, JPEG, and GIF are allowed'}), 400
        
        # Generate secure filename
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_')
        filename = timestamp + filename
        
        # Save file
        upload_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 'campaigns')
        os.makedirs(upload_path, exist_ok=True)
        file_path = os.path.join(upload_path, filename)
        file.save(file_path)
        
        # Return URL
        image_url = f"/static/uploads/campaigns/{filename}"
        
        return jsonify({
            'message': 'Image uploaded successfully',
            'image_url': image_url
        })
        
    except Exception as e:
        current_app.logger.error(f"Error uploading image: {str(e)}")
        return jsonify({'error': 'Failed to upload image'}), 500
