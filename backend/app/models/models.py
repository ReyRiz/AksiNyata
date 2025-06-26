from app import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='user')  # 'admin', 'user'
    profile_picture = db.Column(db.String(255), nullable=True)
    phone_number = db.Column(db.String(20), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    campaigns = db.relationship('Campaign', backref='creator', lazy=True, foreign_keys='Campaign.creator_id')
    organized_campaigns = db.relationship('Campaign', backref='organizer', lazy=True, foreign_keys='Campaign.organizer_id')
    donations = db.relationship('Donation', backref='donor', lazy=True, foreign_keys='Donation.donor_id')
    approved_campaigns = db.relationship('Campaign', backref='approved_by_user', lazy=True, foreign_keys='Campaign.approved_by')
    verified_donations = db.relationship('Donation', backref='verified_by_user', lazy=True, foreign_keys='Donation.verified_by')
    campaign_updates = db.relationship('CampaignUpdate', backref='creator', lazy=True, foreign_keys='CampaignUpdate.created_by')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    # Property for backward compatibility with routes
    @property
    def name(self):
        return self.full_name
        
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name,
            'role': self.role,
            'profile_picture': self.profile_picture,
            'phone_number': self.phone_number,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Campaign(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    target_amount = db.Column(db.Float, nullable=False)
    current_amount = db.Column(db.Float, default=0.0)
    image = db.Column(db.String(255), nullable=True)
    category = db.Column(db.String(50), nullable=True)  # legacy field - kept for compatibility
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=True)  # new field
    start_date = db.Column(db.DateTime, default=datetime.utcnow)
    end_date = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(20), default='pending')  # 'pending', 'active', 'completed', 'cancelled', 'rejected'
    is_featured = db.Column(db.Boolean, default=False)  # untuk kampanye unggulan
    is_urgent = db.Column(db.Boolean, default=False)  # untuk kampanye mendesak
    organizer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # required field
    creator_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    approved_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # admin yang menyetujui
    approved_at = db.Column(db.DateTime, nullable=True)
    rejection_reason = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    donations = db.relationship('Donation', backref='campaign', lazy=True)
    milestones = db.relationship('Milestone', backref='campaign', lazy=True)
    campaign_updates = db.relationship('CampaignUpdate', backref='campaign', lazy=True)
    category = db.relationship('Category', backref='campaigns', lazy=True)
    
    # Property for backward compatibility with frontend
    @property
    def goal_amount(self):
        return self.target_amount
    
    @goal_amount.setter
    def goal_amount(self, value):
        self.target_amount = value
    
    @property
    def deadline(self):
        return self.end_date
    
    @deadline.setter
    def deadline(self, value):
        self.end_date = value
    
    @property
    def image_url(self):
        return self.image
    
    @image_url.setter
    def image_url(self, value):
        self.image = value
    
    # Temporary property for followers (not implemented yet)
    @property
    def followers(self):
        return []  # TODO: Implement followers functionality
    
    def to_dict(self):
        try:
            creator_name = self.creator.full_name if self.creator else None
        except:
            creator_name = None
            
        try:
            approved_by_name = self.approved_by_user.full_name if self.approved_by and hasattr(self, 'approved_by_user') else None
        except:
            approved_by_name = None
        
        try:
            category_data = self.category.to_dict() if self.category else None
        except:
            category_data = None
            
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'target_amount': self.target_amount,
            'current_amount': self.current_amount,
            'image': self.image,
            'image_url': self.image,  # for frontend compatibility
            'category': category_data,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'status': self.status,
            'is_featured': self.is_featured,
            'is_urgent': self.is_urgent,
            'creator_id': self.creator_id,
            'creator_name': creator_name,
            'approved_by': self.approved_by,
            'approved_by_name': approved_by_name,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'rejection_reason': self.rejection_reason,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'progress_percentage': round((self.current_amount / self.target_amount) * 100, 2) if self.target_amount > 0 else 0,
            'donations_count': len(self.donations) if self.donations else 0,
            # Frontend compatibility aliases
            'goal_amount': self.target_amount,
            'deadline': self.end_date.isoformat() if self.end_date else None,
            'creator': {'name': creator_name} if creator_name else None,
            'followers_count': len(self.followers) if hasattr(self, 'followers') and self.followers else 0
        }

class Donation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    message = db.Column(db.Text, nullable=True)
    donor_name = db.Column(db.String(100), nullable=True)  # untuk donasi anonim
    transfer_proof = db.Column(db.String(255), nullable=True)
    payment_method = db.Column(db.String(50), nullable=True)  # bank_transfer, e_wallet, cash
    status = db.Column(db.String(20), default='pending')  # 'pending', 'verified', 'rejected'
    is_anonymous = db.Column(db.Boolean, default=False)
    donor_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # bisa null untuk donasi anonim
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaign.id'), nullable=False)
    verified_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # admin yang memverifikasi
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    verified_at = db.Column(db.DateTime, nullable=True)
    rejection_reason = db.Column(db.Text, nullable=True)
    
    def to_dict(self):
        try:
            donor_name = self.donor.full_name if self.donor and not self.is_anonymous else (self.donor_name or 'Hamba Allah')
        except:
            donor_name = self.donor_name or 'Hamba Allah'
            
        try:
            campaign_title = self.campaign.title if self.campaign else None
        except:
            campaign_title = None
            
        try:
            verified_by_name = self.verified_by_user.full_name if self.verified_by and hasattr(self, 'verified_by_user') else None
        except:
            verified_by_name = None
            
        return {
            'id': self.id,
            'amount': self.amount,
            'message': self.message,
            'donor_name': donor_name,
            'transfer_proof': self.transfer_proof,
            'payment_method': self.payment_method,
            'status': self.status,
            'is_anonymous': self.is_anonymous,
            'donor_id': self.donor_id,
            'campaign_id': self.campaign_id,
            'campaign_title': campaign_title,
            'verified_by': self.verified_by,
            'verified_by_name': verified_by_name,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None,
            'rejection_reason': self.rejection_reason
        }

class Milestone(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    target_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='pending')  # 'pending', 'achieved'
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaign.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    achieved_at = db.Column(db.DateTime, nullable=True)
    
    def to_dict(self):
        try:
            campaign_title = self.campaign.title if self.campaign else None
        except:
            campaign_title = None
            
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'target_amount': self.target_amount,
            'status': self.status,
            'campaign_id': self.campaign_id,
            'campaign_title': campaign_title,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'achieved_at': self.achieved_at.isoformat() if self.achieved_at else None
        }

class CampaignUpdate(db.Model):
    """Model untuk update/laporan transparansi kampanye"""
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    image = db.Column(db.String(255), nullable=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaign.id'), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        try:
            created_by_name = self.creator.full_name if hasattr(self, 'creator') and self.creator else None
        except:
            created_by_name = None
            
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'image': self.image,
            'campaign_id': self.campaign_id,
            'created_by': self.created_by,
            'created_by_name': created_by_name,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Category(db.Model):
    """Model untuk kategori kampanye"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    icon = db.Column(db.String(50), nullable=True)  # icon class untuk UI
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'icon': self.icon,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class UserFollow(db.Model):
    """Model untuk user mengikuti kampanye"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaign.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    user = db.relationship('User', backref='followed_campaigns')
    campaign = db.relationship('Campaign', backref='followers')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'campaign_id': self.campaign_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
