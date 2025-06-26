#!/usr/bin/env python3
"""
Database migration script to add missing columns to user table
"""
import sqlite3
import os
from app import create_app

def migrate_user_table():
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
        # Check if user table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='user'")
        if not cursor.fetchone():
            print("User table does not exist")
            return
        
        # Check current user table structure
        cursor.execute("PRAGMA table_info(user)")
        columns = [col[1] for col in cursor.fetchall()]
        
        print(f"Current user table columns: {columns}")
        
        # Expected columns for User model
        expected_columns = [
            'id', 'username', 'email', 'password_hash', 'full_name', 
            'role', 'profile_picture', 'phone_number', 'is_active', 
            'is_verified', 'created_at', 'updated_at'
        ]
        
        missing_columns = [col for col in expected_columns if col not in columns]
        
        if missing_columns:
            print(f"Missing columns: {missing_columns}")
            
            for col in missing_columns:
                if col == 'phone_number':
                    print(f"Adding '{col}' column...")
                    cursor.execute("ALTER TABLE user ADD COLUMN phone_number VARCHAR(20)")
                    print(f"✓ Added '{col}' column")
                elif col == 'profile_picture':
                    print(f"Adding '{col}' column...")
                    cursor.execute("ALTER TABLE user ADD COLUMN profile_picture VARCHAR(255)")
                    print(f"✓ Added '{col}' column")
                elif col == 'is_active':
                    print(f"Adding '{col}' column...")
                    cursor.execute("ALTER TABLE user ADD COLUMN is_active BOOLEAN DEFAULT 1")
                    print(f"✓ Added '{col}' column")
                elif col == 'is_verified':
                    print(f"Adding '{col}' column...")
                    cursor.execute("ALTER TABLE user ADD COLUMN is_verified BOOLEAN DEFAULT 0")
                    print(f"✓ Added '{col}' column")
                elif col == 'updated_at':
                    print(f"Adding '{col}' column...")
                    cursor.execute("ALTER TABLE user ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP")
                    print(f"✓ Added '{col}' column")
                elif col == 'role':
                    print(f"Adding '{col}' column...")
                    cursor.execute("ALTER TABLE user ADD COLUMN role VARCHAR(20) DEFAULT 'user'")
                    print(f"✓ Added '{col}' column")
        else:
            print("✓ All required columns already exist")
        
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
    migrate_user_table()
