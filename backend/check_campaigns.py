#!/usr/bin/env python3
"""
Script untuk melihat semua campaign di database
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from app import create_app
from app.models.models import db, Campaign

app = create_app()

def check_campaigns():
    with app.app_context():
        campaigns = Campaign.query.all()
        
        print("📋 Daftar Campaign di Database:")
        print("-" * 80)
        
        if not campaigns:
            print("❌ Tidak ada campaign di database")
            return
        
        for campaign in campaigns:
            print(f"ID: {campaign.id}")
            print(f"Title: {campaign.title}")
            print(f"Status: {campaign.status}")
            print(f"Creator: {campaign.creator.full_name if campaign.creator else 'Unknown'}")
            print(f"Created: {campaign.created_at}")
            print("-" * 40)
        
        print(f"\n📊 Total campaigns: {len(campaigns)}")
        
        # Count by status
        status_counts = {}
        for campaign in campaigns:
            status = campaign.status
            status_counts[status] = status_counts.get(status, 0) + 1
        
        print("\n📈 Status breakdown:")
        for status, count in status_counts.items():
            print(f"  {status}: {count}")

if __name__ == '__main__':
    check_campaigns()
