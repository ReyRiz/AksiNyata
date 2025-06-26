#!/usr/bin/env python3
"""
Script to reset passwords for existing users with incompatible hashes
"""
import sqlite3
import os
from werkzeug.security import generate_password_hash
from app import create_app

def reset_user_passwords():
    app = create_app()
    
    # Path to the database
    db_path = os.path.join(app.instance_path, 'aksi_nyata.db')
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return
    
    print(f"Resetting user passwords in database at {db_path}")
    
    # Connect to the database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Get all users
        cursor.execute("SELECT id, username, email FROM user")
        users = cursor.fetchall()
        
        print(f"Found {len(users)} users")
        
        # Reset password for each user
        default_password = "password123"  # Default password
        hashed_password = generate_password_hash(default_password)
        
        for user_id, username, email in users:
            cursor.execute(
                "UPDATE user SET password_hash = ? WHERE id = ?",
                (hashed_password, user_id)
            )
            print(f"Reset password for user: {username} ({email})")
        
        # Commit changes
        conn.commit()
        print(f"\n✅ Reset passwords for {len(users)} users")
        print(f"Default password: {default_password}")
        print("Users can now login with this password and should change it later.")
        
    except Exception as e:
        print(f"❌ Error during password reset: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    reset_user_passwords()
