#!/usr/bin/env python3
"""
Test script untuk upload gambar dan verify file path
"""

import requests
import os
import sys
sys.path.append(os.path.dirname(__file__))

from app import create_app

app = create_app()

def test_upload_endpoint():
    print("🖼️ Testing Image Upload System")
    print("=" * 50)
    
    # Test 1: Check upload endpoint without authentication
    print("\n1. Testing upload endpoint (without auth)")
    try:
        response = requests.post('http://localhost:5000/api/campaigns/upload-image')
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 2: Check upload folder structure
    print("\n2. Checking upload folder structure")
    with app.app_context():
        upload_folder = app.config['UPLOAD_FOLDER']
        campaigns_folder = os.path.join(upload_folder, 'campaigns')
        
        print(f"   Upload folder: {upload_folder}")
        print(f"   Campaigns folder: {campaigns_folder}")
        print(f"   Upload folder exists: {os.path.exists(upload_folder)}")
        print(f"   Campaigns folder exists: {os.path.exists(campaigns_folder)}")
        
        # Create campaigns folder if not exists
        if not os.path.exists(campaigns_folder):
            os.makedirs(campaigns_folder, exist_ok=True)
            print(f"   ✅ Created campaigns folder")
        
        # List files in campaigns folder
        if os.path.exists(campaigns_folder):
            files = os.listdir(campaigns_folder)
            print(f"   Files in campaigns folder: {len(files)}")
            for file in files:
                print(f"     - {file}")
    
    # Test 3: Check static file serving
    print("\n3. Testing static file serving")
    try:
        # Test if static route exists
        response = requests.get('http://localhost:5000/static/uploads/test.txt')
        print(f"   Static route test status: {response.status_code}")
    except Exception as e:
        print(f"   Static route test error: {e}")

def check_campaign_images():
    print("\n4. Checking campaign images in database")
    with app.app_context():
        from app.models.models import Campaign
        
        campaigns = Campaign.query.all()
        for campaign in campaigns:
            if campaign.image_url:
                print(f"   Campaign {campaign.id}: {campaign.title}")
                print(f"     Image URL: {campaign.image_url}")
                
                # Check if file exists
                if campaign.image_url.startswith('/static/uploads/'):
                    file_path = campaign.image_url.replace('/static/uploads/', '')
                    full_path = os.path.join(app.config['UPLOAD_FOLDER'], file_path)
                    exists = os.path.exists(full_path)
                    print(f"     File exists: {exists}")
                    print(f"     Full path: {full_path}")

if __name__ == '__main__':
    test_upload_endpoint()
    check_campaign_images()
