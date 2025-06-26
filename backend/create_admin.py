#!/usr/bin/env python3
"""
Script untuk membuat user admin dan test kampanye
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from app import create_app
from app.models.models import db, User, Campaign, Category
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta

app = create_app()

def create_admin_user():
    with app.app_context():
        # Cek apakah admin sudah ada
        admin = User.query.filter_by(email='admin@aksi-nyata.com').first()
        
        if not admin:
            admin = User(
                username='admin',
                full_name='Administrator',
                email='admin@aksi-nyata.com',
                password_hash=generate_password_hash('admin123'),
                role='admin',
                is_verified=True,
                created_at=datetime.utcnow()
            )
            db.session.add(admin)
            db.session.commit()
            print("✓ Admin user created successfully!")
            print("  Email: admin@aksi-nyata.com")
            print("  Password: admin123")
        else:
            print("Admin user already exists")
            
        # Cek apakah ada user organizer
        organizer = User.query.filter_by(email='organizer@test.com').first()
        if not organizer:
            organizer = User(
                username='organizer',
                full_name='Test Organizer',
                email='organizer@test.com',
                password_hash=generate_password_hash('password123'),
                role='organizer',
                is_verified=True,
                created_at=datetime.utcnow()
            )
            db.session.add(organizer)
            db.session.commit()
            print("✓ Organizer user created successfully!")
            print("  Email: organizer@test.com")
            print("  Password: password123")
        
        # Cek apakah ada kategori
        category = Category.query.filter_by(name='Pendidikan').first()
        if not category:
            category = Category(
                name='Pendidikan',
                description='Kampanye untuk membantu pendidikan'
            )
            db.session.add(category)
            db.session.commit()
            print("✓ Category created successfully!")
        
        # Buat kampanye pending untuk testing
        pending_campaign = Campaign.query.filter_by(title='Kampanye Test Pending').first()
        if not pending_campaign:
            pending_campaign = Campaign(
                title='Kampanye Test Pending',
                description='Ini adalah kampanye test yang memerlukan persetujuan admin',
                target_amount=1000000,
                current_amount=0,
                creator_id=organizer.id,
                organizer_id=organizer.id,  # Tambahan field ini
                category_id=category.id,
                deadline=datetime.utcnow() + timedelta(days=30),
                status='pending',  # Status pending untuk persetujuan admin
                created_at=datetime.utcnow()
            )
            db.session.add(pending_campaign)
            db.session.commit()
            print("✓ Pending campaign created successfully for admin approval!")
        
        return admin, organizer

def test_admin_login():
    with app.app_context():
        print("\nTesting admin login...")
        
        with app.test_client() as client:
            # Test admin login
            response = client.post('/api/auth/login', json={
                'email': 'admin@aksi-nyata.com',
                'password': 'admin123'
            })
            
            if response.status_code == 200:
                token = response.json['access_token']
                print("✓ Admin login successful!")
                
                # Test admin dashboard
                headers = {'Authorization': f'Bearer {token}'}
                admin_response = client.get('/api/admin/dashboard', headers=headers)
                
                if admin_response.status_code == 200:
                    print("✓ Admin dashboard accessible!")
                    data = admin_response.json
                    print(f"  - Total users: {data.get('total_users', 0)}")
                    print(f"  - Total campaigns: {data.get('total_campaigns', 0)}")
                    print(f"  - Pending campaigns: {data.get('pending_campaigns', 0)}")
                else:
                    print(f"✗ Admin dashboard failed: {admin_response.status_code}")
                
                # Test pending campaigns
                pending_response = client.get('/api/admin/campaigns/pending', headers=headers)
                
                if pending_response.status_code == 200:
                    campaigns = pending_response.json['campaigns']
                    print(f"✓ Found {len(campaigns)} pending campaigns")
                    
                    if campaigns:
                        campaign_id = campaigns[0]['id']
                        print(f"  - Campaign ID: {campaign_id}")
                        print(f"  - Title: {campaigns[0]['title']}")
                        print(f"  - Status: {campaigns[0]['status']}")
                        
                        # Test campaign approval
                        approve_response = client.put(f'/api/admin/campaigns/{campaign_id}/approve', headers=headers)
                        
                        if approve_response.status_code == 200:
                            print("✓ Campaign approval test successful!")
                        else:
                            print(f"✗ Campaign approval failed: {approve_response.status_code}")
                else:
                    print(f"✗ Pending campaigns fetch failed: {pending_response.status_code}")
            else:
                print(f"✗ Admin login failed: {response.status_code}")
                print(response.json)

if __name__ == '__main__':
    create_admin_user()
    test_admin_login()
