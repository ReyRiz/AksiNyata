#!/usr/bin/env python3

import requests
import json

def test_login_simple():
    """Simple login test"""
    
    print("Testing login after password reset...")
    
    # Test admin login
    credentials = {
        "username": "admin", 
        "password": "password123"
    }
    
    try:
        response = requests.post(
            'http://localhost:5000/api/auth/login',
            json=credentials,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✓ Login successful!")
            print(f"User: {data['user']['username']} ({data['user']['role']})")
            print(f"Email: {data['user']['email']}")
            
            # Test protected endpoint
            print("\nTesting protected endpoint...")
            token = data['access_token']
            me_response = requests.get(
                'http://localhost:5000/api/auth/me',
                headers={'Authorization': f'Bearer {token}'}
            )
            print(f"Me endpoint status: {me_response.status_code}")
            
        else:
            error_data = response.json()
            print(f"✗ Login failed: {error_data}")
            
    except Exception as e:
        print(f"✗ Request failed: {e}")

if __name__ == "__main__":
    test_login_simple()
