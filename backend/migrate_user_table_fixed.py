#!/usr/bin/env python3
"""
Database migration script to add missing columns to user table (fixed version)
"""
import sqlite3
import os
from datetime import datetime
from app import create_app

def migrate_user_table_fixed():
    app = create_app()
    
    # Path to the database
    db_path = os.path.join(app.instance_path, 'aksi_nyata.db')
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return
    
    print(f"Migrating user table in database at {db_path}")
    
    # Connect to the database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check current user table structure
        cursor.execute("PRAGMA table_info(user)")
        columns = [col[1] for col in cursor.fetchall()]
        
        print(f"Current user table columns: {columns}")
        
        # Add updated_at column if it doesn't exist
        if 'updated_at' not in columns:
            print("Adding 'updated_at' column...")
            # Add the column with a NULL default first
            cursor.execute("ALTER TABLE user ADD COLUMN updated_at DATETIME")
            
            # Then update all existing rows with current timestamp
            current_time = datetime.utcnow().isoformat()
            cursor.execute("UPDATE user SET updated_at = ? WHERE updated_at IS NULL", (current_time,))
            
            print("✓ Added 'updated_at' column and set default values")
        else:
            print("✓ 'updated_at' column already exists")
        
        # Commit changes
        conn.commit()
        print("✅ User table migration completed successfully!")
        
        # Show final table structure
        cursor.execute("PRAGMA table_info(user)")
        final_columns = cursor.fetchall()
        print("\nFinal user table structure:")
        for col in final_columns:
            print(f"  {col[1]} - {col[2]} ({'NOT NULL' if col[3] else 'NULL'}) {'DEFAULT: ' + str(col[4]) if col[4] else ''}")
            
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    migrate_user_table_fixed()
