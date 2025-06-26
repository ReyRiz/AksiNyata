#!/usr/bin/env python3
"""
Test upload gambar dengan authentication
"""

import requests
import os
import io
from PIL import Image

def test_image_upload_with_auth():
    print("🔐 Testing Image Upload with Authentication")
    print("=" * 60)
    
    # Step 1: Login to get token
    print("\n1. Getting authentication token...")
    login_response = requests.post('http://localhost:5000/api/auth/login', json={
        'email': 'organizer@test.com',
        'password': 'password123'
    })
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.json()}")
        return
    
    token = login_response.json()['access_token']
    print("✅ Login successful!")
    
    # Step 2: Create a test image
    print("\n2. Creating test image...")
    img = Image.new('RGB', (300, 200), color='red')
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    
    # Step 3: Upload image
    print("\n3. Uploading image...")
    headers = {'Authorization': f'Bearer {token}'}
    files = {'file': ('test_campaign.png', img_byte_arr, 'image/png')}
    
    upload_response = requests.post(
        'http://localhost:5000/api/campaigns/upload-image',
        headers=headers,
        files=files
    )
    
    print(f"   Status: {upload_response.status_code}")
    if upload_response.status_code == 200:
        response_data = upload_response.json()
        print("✅ Upload successful!")
        print(f"   Image URL: {response_data['image_url']}")
        
        # Step 4: Test if image is accessible
        image_url = response_data['image_url']
        full_url = f"http://localhost:5000{image_url}"
        
        print(f"\n4. Testing image accessibility...")
        print(f"   Testing URL: {full_url}")
        
        image_response = requests.get(full_url)
        print(f"   Status: {image_response.status_code}")
        
        if image_response.status_code == 200:
            print("✅ Image is accessible!")
            print(f"   Content-Type: {image_response.headers.get('Content-Type', 'Unknown')}")
            print(f"   Content-Length: {len(image_response.content)} bytes")
        else:
            print(f"❌ Image not accessible: {image_response.text}")
            
        return response_data['image_url']
    else:
        print(f"❌ Upload failed: {upload_response.json()}")
        return None

def test_create_campaign_with_image():
    # First upload image
    image_url = test_image_upload_with_auth()
    
    if not image_url:
        print("Cannot test campaign creation without image")
        return
    
    print(f"\n5. Creating campaign with uploaded image...")
    
    # Login again for fresh token
    login_response = requests.post('http://localhost:5000/api/auth/login', json={
        'email': 'organizer@test.com',
        'password': 'password123'
    })
    token = login_response.json()['access_token']
    
    # Create campaign with image
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    campaign_data = {
        'title': 'Test Campaign dengan Gambar',
        'description': 'Testing campaign creation dengan gambar yang diupload',
        'goal_amount': 5000000,  # Use goal_amount instead of target_amount
        'category_id': 1,
        'deadline': '2025-12-31',
        'image_url': image_url
    }
    
    create_response = requests.post(
        'http://localhost:5000/api/campaigns',
        headers=headers,
        json=campaign_data
    )
    
    print(f"   Status: {create_response.status_code}")
    if create_response.status_code == 201:
        campaign = create_response.json()
        print("✅ Campaign created successfully!")
        print(f"   Campaign ID: {campaign['id']}")
        print(f"   Title: {campaign['title']}")
        print(f"   Image URL: {campaign['image_url']}")
        
        # Test campaign detail endpoint
        print(f"\n6. Testing campaign detail with image...")
        detail_response = requests.get(f"http://localhost:5000/api/campaigns/{campaign['id']}")
        
        if detail_response.status_code == 200:
            detail_data = detail_response.json()
            print("✅ Campaign detail accessible!")
            print(f"   Image URL from detail: {detail_data['image_url']}")
            
            # Test if image is accessible from campaign detail
            if detail_data['image_url']:
                full_image_url = f"http://localhost:5000{detail_data['image_url']}"
                img_test = requests.get(full_image_url)
                print(f"   Image accessibility: {'✅ OK' if img_test.status_code == 200 else '❌ Failed'}")
        else:
            print(f"❌ Campaign detail failed: {detail_response.json()}")
    else:
        print(f"❌ Campaign creation failed: {create_response.json()}")

if __name__ == '__main__':
    test_create_campaign_with_image()
