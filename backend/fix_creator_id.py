#!/usr/bin/env python3
"""
Database migration script to fix column name mismatch (organizer_id -> creator_id)
"""
import sqlite3
import os
from app import create_app

def fix_creator_id():
    app = create_app()
    
    # Path to the database
    db_path = os.path.join(app.instance_path, 'aksi_nyata.db')
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return
    
    print(f"Fixing creator_id column in database at {db_path}")
    
    # Connect to the database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check current table structure
        cursor.execute("PRAGMA table_info(campaign)")
        columns = [col[1] for col in cursor.fetchall()]
        
        print(f"Current campaign table columns: {columns}")
        
        if 'organizer_id' in columns and 'creator_id' not in columns:
            print("Adding creator_id column and copying data from organizer_id...")
            
            # Add creator_id column
            cursor.execute("ALTER TABLE campaign ADD COLUMN creator_id INTEGER")
            
            # Copy data from organizer_id to creator_id
            cursor.execute("UPDATE campaign SET creator_id = organizer_id")
            
            print("✓ Added creator_id column and copied data")
            
            # We can't drop organizer_id in SQLite without recreating the table
            # For now, we'll keep both columns
            print("Note: organizer_id column kept for compatibility")
            
        elif 'creator_id' in columns:
            print("✓ creator_id column already exists")
        else:
            print("Adding creator_id column...")
            cursor.execute("ALTER TABLE campaign ADD COLUMN creator_id INTEGER")
            print("✓ Added creator_id column")
        
        # Commit changes
        conn.commit()
        print("✅ Creator ID fix completed successfully!")
        
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
    fix_creator_id()
