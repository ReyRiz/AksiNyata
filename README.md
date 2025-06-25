# AksiNyata - Platform Donasi Online

AksiNyata adalah platform donasi online yang menghubungkan orang-orang yang ingin membantu dengan mereka yang membutuhkan bantuan. Platform ini dibuat dengan menggunakan Flask untuk backend dan React untuk frontend.

## Fitur Utama

- **Sistem Role Pengguna**:
  - Penyelenggara: Mengelola kampanye donasi dan memverifikasi donasi
  - Pembuat Donasi: Membuat kampanye donasi
  - Donatur: Berdonasi ke kampanye yang tersedia

- **Autentikasi**: Menggunakan JWT (JSON Web Token) untuk sistem otentikasi yang aman

- **Kampanye Donasi**:
  - Membuat kampanye donasi dengan target dana
  - Menetapkan milestone untuk target donasi
  - Melacak progress donasi secara real-time

- **Sistem Donasi**:
  - Donasi ke kampanye yang tersedia
  - Upload bukti transfer
  - Verifikasi donasi oleh penyelenggara

- **Dashboard**:
  - Dashboard khusus untuk setiap jenis pengguna
  - Lacak kampanye dan donasi

## Teknologi yang Digunakan

### Backend
- Flask
- Flask-JWT-Extended untuk otentikasi
- SQLAlchemy untuk ORM
- Flask-Cors untuk mengaktifkan CORS
- Werkzeug untuk keamanan dan utilitas

### Frontend
- React
- React Router untuk navigasi
- Axios untuk HTTP requests
- Bootstrap untuk UI
- JWT-Decode untuk dekode token

## Struktur Proyek

```
AksiNyata/
├── backend/               # Backend Flask API
│   ├── app/               # Modul aplikasi Flask
│   │   ├── models/        # Model database
│   │   ├── routes/        # Endpoint API
│   │   ├── utils/         # Utilitas
│   │   └── static/        # File statis dan uploads
│   ├── .env               # Variabel lingkungan
│   ├── requirements.txt   # Dependensi Python
│   └── run.py             # Entry point aplikasi
│
└── frontend/              # Frontend React
    ├── public/            # File statis publik
    └── src/               # Kode sumber React
        ├── components/    # Komponen React yang reusable
        ├── contexts/      # Context API
        ├── pages/         # Komponen halaman
        ├── services/      # Service API
        └── assets/        # Aset statis (gambar, font, dll)
```

## Panduan Instalasi

### Backend (Flask)

1. Masuk ke direktori backend:
   ```
   cd backend
   ```

2. Buat virtual environment:
   ```
   python -m venv venv
   ```

3. Aktifkan virtual environment:
   - Windows:
     ```
     venv\Scripts\activate
     ```
   - Linux/Mac:
     ```
     source venv/bin/activate
     ```

4. Install dependensi:
   ```
   pip install -r requirements.txt
   ```

5. Jalankan aplikasi:
   ```
   python run.py
   ```

### Frontend (React)

1. Masuk ke direktori frontend:
   ```
   cd frontend
   ```

2. Install dependensi:
   ```
   npm install
   ```

3. Jalankan aplikasi:
   ```
   npm start
   ```

## Penggunaan

1. Buka aplikasi di browser: `http://localhost:3000`
2. Daftar sebagai pengguna dengan peran Penyelenggara, Pembuat Donasi, atau Donatur
3. Mulai berdonasi atau membuat kampanye donasi