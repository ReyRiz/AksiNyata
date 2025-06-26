#!/usr/bin/env python3
"""
Database migration script to add missing columns to donation table
"""
import sqlite3
import os
from datetime import datetime
from app import create_app

def migrate_donation_table():
    app = create_app()
    
    # Path to the database
    db_path = os.path.join(app.instance_path, 'aksi_nyata.db')
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return
    
    print(f"Migrating donation table in database at {db_path}")
    
    # Connect to the database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if donation table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='donation'")
        if not cursor.fetchone():
            print("Donation table does not exist")
            return
        
        # Check current donation table structure
        cursor.execute("PRAGMA table_info(donation)")
        columns = [col[1] for col in cursor.fetchall()]
        
        print(f"Current donation table columns: {columns}")
        
        # Expected columns for Donation model
        expected_columns = [
            'id', 'amount', 'message', 'donor_name', 'transfer_proof', 
            'payment_method', 'status', 'is_anonymous', 'donor_id', 
            'campaign_id', 'verified_by', 'created_at', 'verified_at', 
            'rejection_reason'
        ]
        
        missing_columns = [col for col in expected_columns if col not in columns]
        
        if missing_columns:
            print(f"Missing columns: {missing_columns}")
            
            for col in missing_columns:
                if col == 'donor_name':
                    print(f"Adding '{col}' column...")
                    cursor.execute("ALTER TABLE donation ADD COLUMN donor_name VARCHAR(100)")
                    print(f"✓ Added '{col}' column")
                elif col == 'transfer_proof':
                    print(f"Adding '{col}' column...")
                    cursor.execute("ALTER TABLE donation ADD COLUMN transfer_proof VARCHAR(255)")
                    print(f"✓ Added '{col}' column")
                elif col == 'payment_method':
                    print(f"Adding '{col}' column...")
                    cursor.execute("ALTER TABLE donation ADD COLUMN payment_method VARCHAR(50)")
                    print(f"✓ Added '{col}' column")
                elif col == 'is_anonymous':
                    print(f"Adding '{col}' column...")
                    cursor.execute("ALTER TABLE donation ADD COLUMN is_anonymous BOOLEAN DEFAULT 0")
                    print(f"✓ Added '{col}' column")
                elif col == 'verified_by':
                    print(f"Adding '{col}' column...")
                    cursor.execute("ALTER TABLE donation ADD COLUMN verified_by INTEGER")
                    print(f"✓ Added '{col}' column")
                elif col == 'verified_at':
                    print(f"Adding '{col}' column...")
                    cursor.execute("ALTER TABLE donation ADD COLUMN verified_at DATETIME")
                    print(f"✓ Added '{col}' column")
                elif col == 'rejection_reason':
                    print(f"Adding '{col}' column...")
                    cursor.execute("ALTER TABLE donation ADD COLUMN rejection_reason TEXT")
                    print(f"✓ Added '{col}' column")
        else:
            print("✓ All required columns already exist")
        
        # Commit changes
        conn.commit()
        print("✅ Donation table migration completed successfully!")
        
        # Show final table structure
        cursor.execute("PRAGMA table_info(donation)")
        final_columns = cursor.fetchall()
        print("\nFinal donation table structure:")
        for col in final_columns:
            print(f"  {col[1]} - {col[2]} ({'NOT NULL' if col[3] else 'NULL'}) {'DEFAULT: ' + str(col[4]) if col[4] else ''}")
            
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    migrate_donation_table()
