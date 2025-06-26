# 🛠️ Sistem Admin - AksiNyata

## Akun Admin

Untuk mengakses sistem admin, gunakan kredensial berikut:

**Email:** `admin@aksi-nyata.com`
**Password:** `admin123`

## Fitur Admin

### 1. Dashboard Admin
- **URL:** `/admin/dashboard`
- **Fitur:**
  - Statistik global (total users, campaigns, donations)
  - Daftar kampanye yang menunggu persetujuan
  - Approve/reject kampanye

### 2. Persetujuan Kampanye

#### Cara Menyetujui Kampanye:
1. Login sebagai admin
2. Buka menu "Admin" → "Dashboard Admin"
3. Lihat daftar "Kampanye Menunggu Persetujuan"
4. Klik tombol "✅ Setujui" untuk approve kampanye
5. Konfirmasi di modal popup

#### Cara Menolak Kampanye:
1. Login sebagai admin
2. Buka menu "Admin" → "Dashboard Admin"
3. Lihat daftar "Kampanye Menunggu Persetujuan"
4. Klik tombol "❌ Tolak" untuk reject kampanye
5. Berikan alasan penolakan
6. Konfirmasi di modal popup

### 3. Status Kampanye

- **Pending:** Kampanye baru yang belum disetujui admin
- **Active:** Kampanye yang sudah disetujui dan aktif
- **Rejected:** Kampanye yang ditolak admin

### 4. Akses Menu Admin

Setelah login sebagai admin, Anda akan melihat menu "Admin" di header yang berisi:
- Dashboard Admin
- Kelola Kampanye
- Verifikasi Donasi
- Kelola User

## Test Data

Sistem sudah dilengkapi dengan test data:

### Users:
- **Admin:** admin@aksi-nyata.com (password: admin123)
- **Organizer:** organizer@test.com (password: password123)

### Campaigns:
- Ada beberapa kampanye pending untuk testing approval

## API Endpoints Admin

### GET /api/admin/dashboard
- Mendapatkan statistik dashboard admin

### GET /api/admin/campaigns/pending
- Mendapatkan daftar kampanye yang menunggu persetujuan

### PUT /api/admin/campaigns/{id}/approve
- Menyetujui kampanye

### PUT /api/admin/campaigns/{id}/reject
- Menolak kampanye dengan alasan

### PUT /api/admin/campaigns/{id}/feature
- Toggle status featured kampanye

## Cara Menggunakan

1. **Buat kampanye baru:**
   - Login sebagai organizer (organizer@test.com)
   - Buat kampanye baru
   - Kampanye akan berstatus "pending"

2. **Setujui kampanye:**
   - Login sebagai admin (admin@aksi-nyata.com)
   - Buka Admin Dashboard
   - Approve kampanye dari daftar pending

3. **Kampanye muncul di publik:**
   - Setelah disetujui, kampanye akan muncul di `/campaigns`
   - Status berubah menjadi "active"

## Troubleshooting

### Kampanye tidak muncul di public listing:
- Pastikan kampanye sudah disetujui admin
- Cek status kampanye harus "active"

### Tidak bisa akses admin dashboard:
- Pastikan login dengan akun admin
- Cek role user harus "admin"

### Tombol approve/reject tidak berfungsi:
- Cek koneksi API backend
- Cek console browser untuk error
- Pastikan token JWT valid
