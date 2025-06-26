#!/usr/bin/env python3
"""
Test different user roles
"""
import requests

BASE_URL = 'http://localhost:5000/api'

def test_role(username, role_name):
    print(f"\n🔍 Testing {role_name} role with user: {username}")
    
    login_data = {
        'username': username,
        'password': 'password123'
    }
    
    try:
        response = requests.post(f'{BASE_URL}/auth/login', json=login_data)
        if response.status_code == 200:
            data = response.json()
            token = data.get('access_token')
            user_data = data.get('user', {})
            print(f"✅ Login successful - Role: {user_data.get('role', 'unknown')}")
            
            # Test dashboard
            headers = {'Authorization': f'Bearer {token}'}
            dashboard_response = requests.get(f'{BASE_URL}/users/dashboard', headers=headers)
            
            if dashboard_response.status_code == 200:
                dashboard_data = dashboard_response.json()
                stats = dashboard_data['stats']
                print(f"✅ Dashboard loaded successfully")
                print(f"   📊 Stats:")
                for key, value in stats.items():
                    print(f"     - {key}: {value}")
                
                # Role-specific info
                if user_data.get('role') in ['organizer', 'creator']:
                    print(f"   📈 Campaigns managed: {len(dashboard_data['campaigns'])}")
                    print(f"   💸 Pending donations: {len(dashboard_data['pending_donations'])}")
                elif user_data.get('role') in ['donor', 'user']:
                    print(f"   🎯 Campaigns supported: {stats.get('campaigns_supported', 0)}")
                    print(f"   💰 Total donations made: {stats.get('total_donations_count', 0)}")
                    
            else:
                print(f"❌ Dashboard failed: {dashboard_response.text}")
        else:
            print(f"❌ Login failed: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_all_roles():
    print("🚀 Testing all user roles...")
    
    # Test different roles
    test_role('testuser', 'User (regular)')
    test_role('Aipun', 'Donor')
    test_role('ReyRiz', 'Creator')
    test_role('Muslih', 'Organizer')
    
    print("\n🎉 Role testing completed!")

if __name__ == '__main__':
    test_all_roles()
