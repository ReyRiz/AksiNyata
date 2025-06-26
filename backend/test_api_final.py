#!/usr/bin/env python3
"""
Script comprehensive test untuk semua endpoint campaign
"""

import requests
import json

def test_campaign_endpoints():
    base_url = 'http://localhost:5000'
    
    print("🧪 Testing Campaign Endpoints")
    print("=" * 50)
    
    # Test 1: Campaign List
    print("\n1. Testing Campaign List (/api/campaigns)")
    try:
        response = requests.get(f'{base_url}/api/campaigns')
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            campaigns = data.get('campaigns', [])
            print(f"   ✅ Success! Found {len(campaigns)} campaigns")
            
            if campaigns:
                first_campaign = campaigns[0]
                print(f"   Sample campaign:")
                print(f"     - Title: {first_campaign.get('title', 'N/A')}")
                print(f"     - Creator: {first_campaign.get('creator', {}).get('name', 'N/A')}")
                print(f"     - Goal: {first_campaign.get('goal_amount', 'N/A')}")
                print(f"     - Status: {first_campaign.get('status', 'N/A')}")
        else:
            print(f"   ❌ Failed: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 2: Campaign Detail for each active campaign
    print("\n2. Testing Campaign Details")
    try:
        # Get list first to find active campaigns
        response = requests.get(f'{base_url}/api/campaigns')
        if response.status_code == 200:
            campaigns = response.json().get('campaigns', [])
            
            for campaign in campaigns[:3]:  # Test first 3
                campaign_id = campaign['id']
                print(f"\n   Testing campaign ID {campaign_id}:")
                
                detail_response = requests.get(f'{base_url}/api/campaigns/{campaign_id}')
                print(f"     Status: {detail_response.status_code}")
                
                if detail_response.status_code == 200:
                    detail_data = detail_response.json()
                    print(f"     ✅ Success!")
                    print(f"       - Title: {detail_data.get('title', 'N/A')}")
                    print(f"       - Creator: {detail_data.get('creator', {}).get('name', 'N/A')}")
                    print(f"       - Progress: {detail_data.get('progress_percentage', 0):.1f}%")
                    print(f"       - Donations: {detail_data.get('donations_count', 0)}")
                    print(f"       - Category: {detail_data.get('category', {}).get('name', 'N/A')}")
                else:
                    print(f"     ❌ Failed: {detail_response.text}")
        else:
            print("   ❌ Could not get campaign list for testing details")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print("\n" + "=" * 50)
    print("🎯 Campaign API Testing Complete!")

if __name__ == '__main__':
    test_campaign_endpoints()
