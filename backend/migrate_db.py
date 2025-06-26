#!/usr/bin/env python3
"""
Database migration script to add missing columns to existing database
"""
import sqlite3
import os
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
        # Check if category column exists in campaign table
        cursor.execute("PRAGMA table_info(campaign)")
        columns = [col[1] for col in cursor.fetchall()]
        
        print(f"Current campaign table columns: {columns}")
        
        # Add category column if it doesn't exist
        if 'category' not in columns:
            print("Adding 'category' column to campaign table...")
            cursor.execute("ALTER TABLE campaign ADD COLUMN category VARCHAR(50)")
            print("✓ Added 'category' column")
        else:
            print("✓ 'category' column already exists")
        
        # Check other potential missing columns
        expected_columns = [
            'id', 'title', 'description', 'target_amount', 'current_amount', 
            'image', 'category', 'start_date', 'end_date', 'status', 
            'is_featured', 'is_urgent', 'creator_id', 'approved_by', 
            'approved_at', 'rejection_reason', 'created_at', 'updated_at'
        ]
        
        missing_columns = [col for col in expected_columns if col not in columns]
        
        for col in missing_columns:
            if col == 'is_featured':
                print(f"Adding '{col}' column...")
                cursor.execute("ALTER TABLE campaign ADD COLUMN is_featured BOOLEAN DEFAULT 0")
                print(f"✓ Added '{col}' column")
            elif col == 'is_urgent':
                print(f"Adding '{col}' column...")
                cursor.execute("ALTER TABLE campaign ADD COLUMN is_urgent BOOLEAN DEFAULT 0")
                print(f"✓ Added '{col}' column")
            elif col == 'approved_by':
                print(f"Adding '{col}' column...")
                cursor.execute("ALTER TABLE campaign ADD COLUMN approved_by INTEGER")
                print(f"✓ Added '{col}' column")
            elif col == 'approved_at':
                print(f"Adding '{col}' column...")
                cursor.execute("ALTER TABLE campaign ADD COLUMN approved_at DATETIME")
                print(f"✓ Added '{col}' column")
            elif col == 'rejection_reason':
                print(f"Adding '{col}' column...")
                cursor.execute("ALTER TABLE campaign ADD COLUMN rejection_reason TEXT")
                print(f"✓ Added '{col}' column")
            elif col == 'updated_at':
                print(f"Adding '{col}' column...")
                cursor.execute("ALTER TABLE campaign ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP")
                print(f"✓ Added '{col}' column")
        
        # Commit changes
        conn.commit()
        print("✅ Database migration completed successfully!")
        
        # Show final table structure
        cursor.execute("PRAGMA table_info(campaign)")
        final_columns = cursor.fetchall()
        print("\nFinal campaign table structure:")
        for col in final_columns:
            print(f"  {col[1]} - {col[2]} ({'NOT NULL' if col[3] else 'NULL'}) {'DEFAULT: ' + str(col[4]) if col[4] else ''}")
            
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    migrate_database()
