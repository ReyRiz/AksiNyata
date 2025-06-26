#!/usr/bin/env python3
"""
Test script to create sample data and test dashboard functionality
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from app import create_app
from app.models.models import db, User, Campaign, Category, Donation
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
import random

app = create_app()

def create_test_data():
    with app.app_context():
        # Create test users
        print("Creating test users...")
        
        # Create test organizer
        organizer = User.query.filter_by(email='organizer@test.com').first()
        if not organizer:
            organizer = User(
                full_name='Test Organizer',
                email='organizer@test.com',
                password_hash=generate_password_hash('password123'),
                role='organizer',
                is_verified=True
            )
            db.session.add(organizer)
        
        # Create test donor
        donor = User.query.filter_by(email='donor@test.com').first()
        if not donor:
            donor = User(
                full_name='Test Donor',
                email='donor@test.com', 
                password_hash=generate_password_hash('password123'),
                role='donor',
                is_verified=True
            )
            db.session.add(donor)
        
        db.session.commit()
        
        # Create test category
        print("Creating test category...")
        category = Category.query.filter_by(name='Pendidikan').first()
        if not category:
            category = Category(
                name='Pendidikan',
                description='Kampanye untuk membantu pendidikan'
            )
            db.session.add(category)
            db.session.commit()
        
        # Create test campaigns
        print("Creating test campaigns...")
        for i in range(3):
            title = f'Kampanye Test {i+1}'
            existing_campaign = Campaign.query.filter_by(title=title).first()
            if not existing_campaign:
                campaign = Campaign(
                    title=title,
                    description=f'Deskripsi untuk kampanye test {i+1}',
                    target_amount=5000000 + (i * 1000000),
                    current_amount=random.randint(500000, 2000000),
                    creator_id=organizer.id,
                    category_id=category.id,
                    deadline=datetime.now() + timedelta(days=30 + i*10),
                    status='active'
                )
                db.session.add(campaign)
        
        db.session.commit()
        
        # Create test donations
        print("Creating test donations...")
        campaigns = Campaign.query.all()
        for campaign in campaigns:
            for j in range(random.randint(1, 5)):
                donation = Donation(
                    amount=random.randint(50000, 500000),
                    message=f'Donasi untuk {campaign.title}',
                    donor_id=donor.id,
                    campaign_id=campaign.id,
                    status=random.choice(['verified', 'pending']),
                    created_at=datetime.now() - timedelta(days=random.randint(1, 30))
                )
                db.session.add(donation)
        
        db.session.commit()
        print("✓ Test data created successfully!")

def test_dashboard_api():
    with app.app_context():
        print("\nTesting dashboard API...")
        
        # Test user login
        from app.routes.auth import login_user
        with app.test_client() as client:
            # Test login
            response = client.post('/api/auth/login', json={
                'email': 'organizer@test.com',
                'password': 'password123'
            })
            
            if response.status_code == 200:
                token = response.json['access_token']
                print("✓ Login successful!")
                
                # Test dashboard endpoint
                headers = {'Authorization': f'Bearer {token}'}
                dashboard_response = client.get('/api/users/dashboard', headers=headers)
                
                if dashboard_response.status_code == 200:
                    data = dashboard_response.json
                    print("✓ Dashboard API working!")
                    print(f"  - Campaigns: {len(data.get('campaigns', []))}")
                    print(f"  - Donations: {len(data.get('donations', []))}")
                    print(f"  - Stats: {data.get('stats', {})}")
                else:
                    print(f"✗ Dashboard API failed: {dashboard_response.status_code}")
                    print(dashboard_response.json)
            else:
                print(f"✗ Login failed: {response.status_code}")
                print(response.json)

if __name__ == '__main__':
    create_test_data()
    test_dashboard_api()
