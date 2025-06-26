#!/usr/bin/env python3
"""
Script untuk membuat beberapa campaign test yang pending approval
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from app import create_app
from app.models.models import db, User, Campaign, Category
from datetime import datetime, timedelta

app = create_app()

def create_test_campaigns():
    with app.app_context():
        # Get organizer user
        organizer = User.query.filter_by(email='organizer@test.com').first()
        if not organizer:
            print("Organizer user not found!")
            return
        
        # Get category
        category = Category.query.filter_by(name='Pendidikan').first()
        if not category:
            print("Category not found!")
            return
        
        campaigns_data = [
            {
                'title': 'Bantu Pendidikan Anak Desa',
                'description': 'Membantu anak-anak di desa terpencil untuk mendapatkan pendidikan yang layak. Dana akan digunakan untuk membeli buku, alat tulis, dan perbaikan fasilitas sekolah.',
                'target_amount': 10000000,
            },
            {
                'title': 'Perpustakaan Digital untuk Sekolah',
                'description': 'Membangun perpustakaan digital modern untuk sekolah dasar. Akan menyediakan akses internet, komputer, dan koleksi buku digital untuk meningkatkan kualitas pembelajaran.',
                'target_amount': 15000000,
            },
            {
                'title': 'Beasiswa untuk Anak Berprestasi',
                'description': 'Program beasiswa untuk anak-anak berprestasi dari keluarga kurang mampu. Dana akan digunakan untuk biaya sekolah, seragam, dan perlengkapan belajar.',
                'target_amount': 8000000,
            }
        ]
        
        for data in campaigns_data:
            # Check if campaign already exists
            existing = Campaign.query.filter_by(title=data['title']).first()
            if not existing:
                campaign = Campaign(
                    title=data['title'],
                    description=data['description'],
                    target_amount=data['target_amount'],
                    current_amount=0,
                    creator_id=organizer.id,
                    organizer_id=organizer.id,
                    category_id=category.id,
                    deadline=datetime.utcnow() + timedelta(days=60),
                    status='pending',  # Pending approval
                    created_at=datetime.utcnow()
                )
                db.session.add(campaign)
                print(f"✓ Created campaign: {data['title']}")
            else:
                print(f"- Campaign already exists: {data['title']}")
        
        db.session.commit()
        print("\n✅ Test campaigns created successfully!")
        
        # Show pending campaigns count
        pending_count = Campaign.query.filter_by(status='pending').count()
        print(f"📊 Total pending campaigns: {pending_count}")

if __name__ == '__main__':
    create_test_campaigns()
