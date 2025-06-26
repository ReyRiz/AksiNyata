#!/usr/bin/env python3

import requests
import json

def test_campaign_api():
    """Test campaign API endpoint"""
    try:
        print("Testing campaign detail API...")
        response = requests.get('http://localhost:5000/api/campaigns/8')
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print("\nCampaign Data:")
            print(f"ID: {data.get('id')}")
            print(f"Title: {data.get('title')}")
            print(f"Image: {data.get('image')}")
            print(f"Image URL: {data.get('image_url')}")
            print(f"Creator: {data.get('creator')}")
            print(f"Goal Amount: {data.get('goal_amount')}")
            print(f"Status: {data.get('status')}")
            
            # Check if image URL is accessible
            if data.get('image_url'):
                image_url = f"http://localhost:5000{data.get('image_url')}"
                print(f"\nTesting image URL: {image_url}")
                img_response = requests.get(image_url)
                print(f"Image Status Code: {img_response.status_code}")
                print(f"Image Content-Type: {img_response.headers.get('Content-Type')}")
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_campaign_api()
