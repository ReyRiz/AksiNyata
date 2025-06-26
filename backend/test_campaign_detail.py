#!/usr/bin/env python3
"""
Test campaign detail endpoint directly
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from app import create_app
from app.models.models import Campaign

app = create_app()

def test_campaign_detail():
    with app.app_context():
        campaign = Campaign.query.get(3)
        if campaign:
            print(f"Campaign found: {campaign.title}")
            print(f"Status: {campaign.status}")
            print(f"Creator: {campaign.creator}")
            print(f"Category: {campaign.category}")
            
            try:
                # Test serialization
                campaign_dict = campaign.to_dict()
                print("✓ to_dict() successful")
                
                # Test manual fields access
                print(f"Goal amount: {campaign.goal_amount}")
                print(f"Current amount: {campaign.current_amount}")
                print(f"Image URL: {campaign.image_url}")
                print(f"Deadline: {campaign.deadline}")
                
            except Exception as e:
                print(f"❌ Error in serialization: {e}")
                import traceback
                traceback.print_exc()
        else:
            print("Campaign not found")

if __name__ == '__main__':
    test_campaign_detail()
