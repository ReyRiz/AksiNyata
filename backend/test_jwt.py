#!/usr/bin/env python3
"""
Simple test to debug JWT issue
"""
import requests
import json

BASE_URL = 'http://localhost:5000/api'

def test_specific_user():
    print("Testing with a specific user...")
    
    # Try to login with an existing user
    login_data = {
        'username': 'testuser',
        'password': 'testpassword123'
    }
    
    try:
        response = requests.post(f'{BASE_URL}/auth/login', json=login_data)
        print(f"Login response: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            login_response = response.json()
            token = login_response.get('access_token')
            print(f"Token: {token[:50]}...")
            
            # Test /me endpoint immediately
            headers = {'Authorization': f'Bearer {token}'}
            print(f"Headers being sent: {headers}")
            
            me_response = requests.get(f'{BASE_URL}/auth/me', headers=headers)
            print(f"/me response: {me_response.status_code}")
            print(f"/me response text: {me_response.text}")
            
            if me_response.status_code != 200:
                # Try with different header format
                headers2 = {'Authorization': f'Bearer {token.strip()}'}
                me_response2 = requests.get(f'{BASE_URL}/auth/me', headers=headers2)
                print(f"/me response (stripped): {me_response2.status_code}")
                print(f"/me response text (stripped): {me_response2.text}")
                
        else:
            print(f"Login failed: {response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    test_specific_user()
