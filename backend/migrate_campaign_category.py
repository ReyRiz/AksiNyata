#!/usr/bin/env python3
"""
Database migration script to add category_id column to campaign table
"""
import sqlite3
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app

def migrate_database():
    app = create_app()
    
    # Path to the database
    db_path = os.path.join(app.instance_path, 'aksi_nyata.db')
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return
    
    print(f"Migrating database at {db_path}")
    
    # Connect to the database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check current campaign table structure
        cursor.execute("PRAGMA table_info(campaign)")
        columns = [col[1] for col in cursor.fetchall()]
        
        print(f"Current campaign table columns: {columns}")
        
        # Add category_id column if it doesn't exist
        if 'category_id' not in columns:
            print("Adding 'category_id' column to campaign table...")
            cursor.execute("ALTER TABLE campaign ADD COLUMN category_id INTEGER")
            print("✓ Added 'category_id' column")
        else:
            print("✓ 'category_id' column already exists")
        
        # Commit changes
        conn.commit()
        print("Migration completed successfully!")
        
    except Exception as e:
        conn.rollback()
        print(f"Error during migration: {e}")
        
    finally:
        conn.close()

if __name__ == '__main__':
    migrate_database()
