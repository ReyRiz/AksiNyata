#!/usr/bin/env python3
"""
Test script to verify authentication flow
"""
import requests
import json

BASE_URL = 'http://localhost:5000/api'

def test_auth_flow():
    print("Testing authentication flow...")
    
    # Test user registration
    print("\n1. Testing user registration...")
    register_data = {
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'testpassword123',
        'full_name': 'Test User'
    }
    
    try:
        response = requests.post(f'{BASE_URL}/auth/register', json=register_data)
        print(f"Registration response: {response.status_code}")
        if response.status_code == 201:
            print("✓ Registration successful")
            print(f"Response: {response.json()}")
        elif response.status_code == 400:
            print("ℹ User already exists or validation error")
            print(f"Response: {response.json()}")
        else:
            print(f"❌ Registration failed: {response.text}")
            return
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return
    
    # Test user login
    print("\n2. Testing user login...")
    login_data = {
        'username': 'testuser',
        'password': 'testpassword123'
    }
    
    try:
        response = requests.post(f'{BASE_URL}/auth/login', json=login_data)
        print(f"Login response: {response.status_code}")
        if response.status_code == 200:
            print("✓ Login successful")
            login_response = response.json()
            print(f"Token received: {login_response.get('access_token', 'No token')[:20]}...")
            token = login_response.get('access_token')
        else:
            print(f"❌ Login failed: {response.text}")
            return
    except Exception as e:
        print(f"❌ Login error: {e}")
        return
    
    # Test /me endpoint
    print("\n3. Testing /me endpoint...")
    headers = {'Authorization': f'Bearer {token}'}
    
    try:
        response = requests.get(f'{BASE_URL}/auth/me', headers=headers)
        print(f"/me response: {response.status_code}")
        if response.status_code == 200:
            print("✓ /me endpoint working")
            print(f"User data: {response.json()}")
        else:
            print(f"❌ /me failed: {response.text}")
            return
    except Exception as e:
        print(f"❌ /me error: {e}")
        return
    
    # Test dashboard endpoint
    print("\n4. Testing dashboard endpoint...")
    try:
        response = requests.get(f'{BASE_URL}/users/dashboard', headers=headers)
        print(f"Dashboard response: {response.status_code}")
        if response.status_code == 200:
            print("✓ Dashboard endpoint working")
            print(f"Dashboard data keys: {list(response.json().keys())}")
        else:
            print(f"❌ Dashboard failed: {response.text}")
            return
    except Exception as e:
        print(f"❌ Dashboard error: {e}")
        return
    
    print("\n✅ All authentication tests passed!")

if __name__ == '__main__':
    test_auth_flow()
