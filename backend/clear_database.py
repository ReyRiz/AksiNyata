#!/usr/bin/env python3
"""
Script untuk mengosongkan semua data di database AksiNyata
Hanya menghapus data, tidak menghapus struktur tabel
"""

import os
import sys
import sqlite3
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent
sys.path.append(str(project_root))

def clear_database():
    """Mengosongkan semua data dari database"""
    db_path = project_root / 'instance' / 'aksi_nyata.db'
    
    if not db_path.exists():
        print(f"Database tidak ditemukan di: {db_path}")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🗑️  Mengosongkan database...")
        
        # Disable foreign key constraints temporarily
        cursor.execute("PRAGMA foreign_keys = OFF")
        
        # Get all table names
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        
        # Clear all tables
        for table in tables:
            table_name = table[0]
            if table_name != 'sqlite_sequence':  # Skip sqlite internal table
                print(f"   - Menghapus data dari tabel: {table_name}")
                cursor.execute(f"DELETE FROM {table_name}")
        
        # Reset auto-increment counters
        cursor.execute("DELETE FROM sqlite_sequence")
        
        # Re-enable foreign key constraints
        cursor.execute("PRAGMA foreign_keys = ON")
        
        conn.commit()
        conn.close()
        
        print("✅ Database berhasil dikosongkan!")
        print("📊 Semua data telah dihapus, struktur tabel tetap ada")
        return True
        
    except Exception as e:
        print(f"❌ Error saat mengosongkan database: {e}")
        return False

def confirm_action():
    """Meminta konfirmasi sebelum menghapus data"""
    print("⚠️  PERINGATAN: Script ini akan menghapus SEMUA data di database!")
    print("   - Semua pengguna akan dihapus")
    print("   - Semua kampanye akan dihapus") 
    print("   - Semua donasi akan dihapus")
    print("   - Semua kategori akan dihapus")
    print("   - File upload akan tetap ada di folder static/uploads")
    print()
    
    response = input("Apakah Anda yakin ingin melanjutkan? (ketik 'YA' untuk konfirmasi): ")
    return response.upper() == 'YA'

if __name__ == "__main__":
    print("🧹 Script Pembersihan Database AksiNyata")
    print("=" * 50)
    
    if confirm_action():
        if clear_database():
            print("\n🎉 Proses selesai! Database sudah kosong.")
            print("💡 Anda bisa menjalankan script seeding untuk membuat data sample baru.")
        else:
            print("\n❌ Gagal mengosongkan database.")
    else:
        print("\n🚫 Operasi dibatalkan.")
