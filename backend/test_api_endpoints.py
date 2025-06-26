#!/usr/bin/env python3
"""
Quick test to verify dashboard API endpoint
"""

import requests
import json

def test_dashboard_endpoint():
    # Test the dashboard endpoint without authentication
    try:
        response = requests.get('http://localhost:5000/api/users/dashboard')
        print(f"Dashboard endpoint response status: {response.status_code}")
        
        if response.status_code == 401:
            print("✓ Dashboard endpoint requires authentication (expected)")
        elif response.status_code == 200:
            data = response.json()
            print("✓ Dashboard endpoint accessible")
            print(f"Response keys: {list(data.keys())}")
        else:
            print(f"Unexpected status code: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"Error testing dashboard endpoint: {e}")

def test_campaigns_endpoint():
    # Test the campaigns endpoint
    try:
        response = requests.get('http://localhost:5000/api/campaigns')
        print(f"Campaigns endpoint response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✓ Campaigns endpoint working")
            print(f"Number of campaigns: {len(data.get('campaigns', []))}")
        else:
            print(f"Unexpected status code: {response.status_code}")
            
    except Exception as e:
        print(f"Error testing campaigns endpoint: {e}")

if __name__ == '__main__':
    test_dashboard_endpoint()
    test_campaigns_endpoint()
