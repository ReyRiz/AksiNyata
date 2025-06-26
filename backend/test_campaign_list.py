#!/usr/bin/env python3

import requests
import json

def test_campaign_list():
    """Test campaign list API"""
    try:
        print("Testing campaign list API...")
        response = requests.get('http://localhost:5000/api/campaigns')
        
        if response.status_code == 200:
            data = response.json()
            campaigns = data.get('campaigns', [])
            
            print(f"Found {len(campaigns)} campaigns")
            
            for campaign in campaigns[:3]:  # Show first 3 campaigns
                print(f"\nCampaign ID: {campaign.get('id')}")
                print(f"Title: {campaign.get('title')}")
                print(f"Image: {campaign.get('image')}")
                print(f"Image URL: {campaign.get('image_url')}")
                print(f"Status: {campaign.get('status')}")
                
                # Check image URL
                if campaign.get('image_url'):
                    image_url = f"http://localhost:5000{campaign.get('image_url')}"
                    print(f"Full Image URL: {image_url}")
                    
                    # Test image accessibility
                    try:
                        img_response = requests.head(image_url)
                        print(f"Image Status: {img_response.status_code}")
                    except Exception as e:
                        print(f"Image test failed: {e}")
                        
        else:
            print(f"Error: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_campaign_list()
