from app import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='donor')  # 'organizer', 'creator', 'donor'
    profile_picture = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    donations = db.relationship('Donation', backref='donor', lazy=True, foreign_keys='Donation.donor_id')
    campaigns = db.relationship('Campaign', backref='organizer', lazy=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
        
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name,
            'role': self.role,
            'profile_picture': self.profile_picture,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Campaign(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    target_amount = db.Column(db.Float, nullable=False)
    current_amount = db.Column(db.Float, default=0.0)
    image = db.Column(db.String(255), nullable=True)
    start_date = db.Column(db.DateTime, default=datetime.utcnow)
    end_date = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(20), default='active')  # 'active', 'completed', 'cancelled'
    organizer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    donations = db.relationship('Donation', backref='campaign', lazy=True)
    milestones = db.relationship('Milestone', backref='campaign', lazy=True)
    
    def to_dict(self):
        try:
            organizer_name = self.organizer.full_name if self.organizer else None
        except:
            organizer_name = None
            
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'target_amount': self.target_amount,
            'current_amount': self.current_amount,
            'image': self.image,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'status': self.status,
            'organizer_id': self.organizer_id,
            'organizer_name': organizer_name,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'progress_percentage': round((self.current_amount / self.target_amount) * 100, 2) if self.target_amount > 0 else 0
        }

class Donation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    message = db.Column(db.Text, nullable=True)
    transfer_proof = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(20), default='pending')  # 'pending', 'verified', 'rejected'
    donor_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaign.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    verified_at = db.Column(db.DateTime, nullable=True)
    
    def to_dict(self):
        try:
            donor_name = self.donor.full_name if self.donor else None
        except:
            donor_name = None
            
        try:
            campaign_title = self.campaign.title if self.campaign else None
        except:
            campaign_title = None
            
        return {
            'id': self.id,
            'amount': self.amount,
            'message': self.message,
            'transfer_proof': self.transfer_proof,
            'status': self.status,
            'donor_id': self.donor_id,
            'donor_name': donor_name,
            'campaign_id': self.campaign_id,
            'campaign_title': campaign_title,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None
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
