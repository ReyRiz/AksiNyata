#!/usr/bin/env python3

from app import create_app
from app.models.models import User, Campaign, Donation, db
from datetime import datetime
import requests
import json

def create_test_donations():
    """Create test donations for verification testing"""
    
    app = create_app()
    
    with app.app_context():
        print("Creating test donations...")
        
        # Get test campaign
        campaign = Campaign.query.filter_by(title='Test Campaign dengan Gambar').first()
        if not campaign:
            print("Test campaign not found, creating one...")
            # Create test campaign if not exists
            organizer = User.query.filter_by(role='organizer').first()
            if organizer:
                campaign = Campaign(
                    title='Test Campaign untuk Donasi',
                    description='Test campaign untuk testing donation verification',
                    target_amount=1000000,
                    current_amount=0,
                    creator_id=organizer.id,
                    organizer_id=organizer.id,
                    status='active'
                )
                db.session.add(campaign)
                db.session.commit()
        
        # Get a donor user
        donor = User.query.filter_by(role='user').first()
        if not donor:
            donor = User.query.first()
        
        if campaign and donor:
            # Create test donations
            test_donations = [
                {
                    'amount': 50000,
                    'message': 'Semoga kampanye ini berhasil!',
                    'donor_name': donor.full_name,
                    'status': 'pending'
                },
                {
                    'amount': 100000,
                    'message': 'Untuk kebaikan bersama',
                    'donor_name': donor.full_name,
                    'status': 'pending'
                },
                {
                    'amount': 25000,
                    'message': 'Semoga bermanfaat',
                    'donor_name': 'Anonymous',
                    'status': 'pending'
                }
            ]
            
            for donation_data in test_donations:
                donation = Donation(
                    amount=donation_data['amount'],
                    message=donation_data['message'],
                    donor_name=donation_data['donor_name'],
                    campaign_id=campaign.id,
                    donor_id=donor.id,
                    status=donation_data['status'],
                    created_at=datetime.utcnow()
                )
                db.session.add(donation)
            
            db.session.commit()
            print(f"✓ Created {len(test_donations)} test donations for campaign: {campaign.title}")
            
            # Print donation IDs for testing
            donations = Donation.query.filter_by(campaign_id=campaign.id).all()
            for donation in donations:
                print(f"  Donation ID: {donation.id}, Amount: {donation.amount}, Status: {donation.status}")
        
        else:
            print("✗ Could not create test donations - missing campaign or donor user")

def test_donation_verification():
    """Test donation verification API endpoints"""
    
    print("\n=== TESTING DONATION VERIFICATION ===")
    
    # Login as admin
    print("1. Logging in as admin...")
    login_response = requests.post(
        'http://localhost:5000/api/auth/login',
        json={'email': 'admin@aksi-nyata.com', 'password': 'password123'},
        headers={'Content-Type': 'application/json'}
    )
    
    if login_response.status_code != 200:
        print(f"✗ Admin login failed: {login_response.status_code}")
        return
    
    admin_data = login_response.json()
    token = admin_data['access_token']
    print("✓ Admin login successful")
    
    # Get donations list
    print("\n2. Getting donations list...")
    donations_response = requests.get(
        'http://localhost:5000/api/donations',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    if donations_response.status_code == 200:
        donations = donations_response.json()
        print(f"✓ Found {len(donations)} donations")
        
        # Find a pending donation to verify
        pending_donations = [d for d in donations if d.get('status') == 'pending']
        if pending_donations:
            donation_id = pending_donations[0]['id']
            print(f"  Testing with donation ID: {donation_id}")
            
            # Test verify donation
            print("\n3. Testing donation verification...")
            verify_response = requests.put(
                f'http://localhost:5000/api/donations/{donation_id}/verify',
                json={'status': 'verified'},
                headers={
                    'Authorization': f'Bearer {token}',
                    'Content-Type': 'application/json'
                }
            )
            
            print(f"  Verify response status: {verify_response.status_code}")
            if verify_response.status_code == 200:
                verify_data = verify_response.json()
                print(f"✓ Donation verified successfully")
                print(f"  Message: {verify_data.get('message')}")
            else:
                print(f"✗ Verification failed")
                try:
                    error_data = verify_response.json()
                    print(f"  Error: {error_data.get('error', 'Unknown error')}")
                except:
                    print(f"  Raw response: {verify_response.text}")
        else:
            print("  No pending donations found to test")
    else:
        print(f"✗ Failed to get donations: {donations_response.status_code}")

if __name__ == "__main__":
    create_test_donations()
    test_donation_verification()
