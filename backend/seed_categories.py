#!/usr/bin/env python3
"""
Seed script to populate initial categories
Run this once to add default categories to the database
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.models import Category

def seed_categories():
    """Add default categories to the database"""
    app = create_app()
    
    with app.app_context():
        # Check if categories already exist
        if Category.query.count() > 0:
            print("Categories already exist. Skipping seed.")
            return
        
        categories = [
            {
                'name': 'Kesehatan',
                'description': 'Kampanye untuk bantuan medis, pengobatan, dan kesehatan masyarakat'
            },
            {
                'name': 'Pendidikan',
                'description': 'Bantuan untuk sekolah, beasiswa, dan program pendidikan'
            },
            {
                'name': 'Bencana Alam',
                'description': 'Bantuan untuk korban bencana alam dan pemulihan'
            },
            {
                'name': 'Sosial',
                'description': 'Program sosial untuk membantu masyarakat kurang mampu'
            },
            {
                'name': 'Lingkungan',
                'description': 'Kampanye untuk pelestarian lingkungan dan sustainability'
            },
            {
                'name': 'Kemanusiaan',
                'description': 'Bantuan kemanusiaan dan emergency response'
            },
            {
                'name': 'Hewan',
                'description': 'Perlindungan dan kesejahteraan hewan'
            },
            {
                'name': 'Teknologi',
                'description': 'Inovasi teknologi untuk kebaikan sosial'
            },
            {
                'name': 'Olahraga',
                'description': 'Dukungan untuk atlet dan program olahraga'
            },
            {
                'name': 'Seni & Budaya',
                'description': 'Pelestarian seni, budaya, dan kreativitas'
            }
        ]
        
        # Add categories to database
        for cat_data in categories:
            category = Category(
                name=cat_data['name'],
                description=cat_data['description']
            )
            db.session.add(category)
        
        try:
            db.session.commit()
            print(f"Successfully added {len(categories)} categories:")
            for category in categories:
                print(f"  - {category['name']}")
        except Exception as e:
            db.session.rollback()
            print(f"Error adding categories: {e}")

if __name__ == '__main__':
    print("Seeding categories...")
    seed_categories()
    print("Done!")
