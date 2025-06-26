#!/usr/bin/env python3
"""
Test Campaign model serialization
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.models import Campaign, Category, User

def test_campaign_serialization():
    app = create_app()
    
    with app.app_context():
        try:
            # Get first campaign
            campaign = Campaign.query.first()
            if campaign:
                print("Testing campaign serialization...")
                result = campaign.to_dict()
                print("✓ Campaign serialization successful!")
                print(f"Campaign ID: {result['id']}")
                print(f"Title: {result['title']}")
                print(f"Category: {result.get('category', 'No category')}")
                return True
            else:
                print("No campaigns found in database")
                return True
        except Exception as e:
            print(f"❌ Serialization error: {e}")
            return False

if __name__ == '__main__':
    success = test_campaign_serialization()
    if success:
        print("✓ All tests passed!")
    else:
        print("❌ Tests failed!")
