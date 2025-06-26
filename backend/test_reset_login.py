#!/usr/bin/env python3
"""
Test with the reset password
"""
import requests

BASE_URL = 'http://localhost:5000/api'

def test_with_reset_password():
    print("Testing with reset password...")
    
    # Test login with reset password
    login_data = {
        'username': 'testuser',
        'password': 'password123'  # Reset password
    }
    
    try:
        response = requests.post(f'{BASE_URL}/auth/login', json=login_data)
        print(f"Login response: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            token = data.get('access_token')
            print(f"✅ Login successful")
            
            # Test categories endpoint
            categories_response = requests.get(f'{BASE_URL}/campaigns/categories')
            print(f"Categories response: {categories_response.status_code}")
            if categories_response.status_code == 200:
                print("✅ Categories endpoint working")
                print(f"Categories: {categories_response.json()}")
            else:
                print(f"❌ Categories failed: {categories_response.text}")
            
            # Test dashboard with different users
            headers = {'Authorization': f'Bearer {token}'}
            dashboard_response = requests.get(f'{BASE_URL}/users/dashboard', headers=headers)
            print(f"Dashboard response: {dashboard_response.status_code}")
            if dashboard_response.status_code == 200:
                dashboard_data = dashboard_response.json()
                print(f"✅ Dashboard working for user role: {dashboard_data['user']['role']}")
                print(f"Stats: {dashboard_data['stats']}")
            else:
                print(f"❌ Dashboard failed: {dashboard_response.text}")
                
        else:
            print(f"❌ Login failed: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == '__main__':
    test_with_reset_password()
