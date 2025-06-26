#!/usr/bin/env python3
"""
Check database schema
"""
import sqlite3
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app

def check_schema():
    app = create_app()
    
    # Path to the database
    db_path = os.path.join(app.instance_path, 'aksi_nyata.db')
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return
    
    print(f"Checking database schema at {db_path}")
    
    # Connect to the database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check campaign table structure
        cursor.execute("PRAGMA table_info(campaign)")
        columns = cursor.fetchall()
        
        print("Campaign table columns:")
        for col in columns:
            null_constraint = "NOT NULL" if col[3] == 1 else "NULL"
            default_val = f"DEFAULT {col[4]}" if col[4] is not None else "NO DEFAULT"
            print(f"  {col[1]} ({col[2]}) - {null_constraint} - {default_val}")
        
    except Exception as e:
        print(f"Error checking schema: {e}")
        
    finally:
        conn.close()

if __name__ == '__main__':
    check_schema()
