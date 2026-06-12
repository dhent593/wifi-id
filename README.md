# WiFi-ID - Sistem Pencatatan Pembayaran WiFi (Next.js & Supabase)

Aplikasi pencatatan pembayaran WiFi bulanan berbasis web yang modern. Dilengkapi dashboard admin untuk manajemen pelanggan, grid pencatatan pembayaran bulanan, dan shareable link unik dengan token aman (UUID) agar pelanggan dapat melacak tagihan mereka sendiri secara real-time.

Aplikasi ini dideploy menggunakan **Next.js** dan dihubungkan ke database cloud **Supabase**, siap digunakan di **Vercel** dan sangat responsif ketika dibuka di layar HP.

---

## Langkah Setup Database & Autentikasi Supabase

Sebelum menjalankan aplikasi, Anda harus menyiapkan backend di Supabase:

### 1. Buat Proyek Supabase Baru
1. Masuk ke [Supabase Console](https://supabase.com) dan buat proyek baru (gratis).
2. Tunggu hingga database selesai dibuat.

### 2. Jalankan Skrip SQL Database
1. Salin seluruh isi file [schema.sql](file:///d:/Project/wifiid/schema.sql) dari proyek ini.
2. Di dashboard Supabase, buka menu **SQL Editor** -> Klik **New Query**.
3. Paste kodenya di sana, lalu klik tombol **Run** di kanan bawah.
4. Periksa apakah tabel `pelanggan` dan `pembayaran` sudah berhasil dibuat di menu **Table Editor**.

### 3. Buat User Admin di Supabase
1. Masuk ke menu **Authentication** di panel samping Supabase.
2. Buka sub-menu **Providers** -> pilih **Email** -> Pastikan **Enable Email Provider** aktif -> Simpan (Save).
3. Buka sub-menu **Users** -> Klik **Add User** -> **Create User**.
4. Masukkan kredensial berikut:
   *   **Email**: `admin@gmail.com`
   *   **Password**: `palamana`
5. Matikan opsi "Auto-confirm User" jika ingin langsung aktif tanpa verifikasi email, atau langsung klik **Create User**. Akun admin Anda siap digunakan!

---

## Konfigurasi Kredensial Aplikasi

1. Buka file [.env.local](file:///d:/Project/wifiid/.env.local) di folder proyek ini.
2. Di dashboard Supabase Anda, buka **Settings** (ikon gerigi) -> **API**.
3. Salin **Project URL** dan tempel pada `NEXT_PUBLIC_SUPABASE_URL`.
4. Salin **anon/public API Key** (biasanya bertuliskan `service_role` atau `anon public`) dan tempel pada `NEXT_PUBLIC_SUPABASE_ANON_KEY` (pilihlah **anon public key**).

Contoh isi file `.env.local` setelah diubah:
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcde12345.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Cara Menjalankan Aplikasi Secara Lokal

1. Buka terminal (Command Prompt atau PowerShell) di folder proyek ini.
2. Jalankan perintah:
   ```bash
   npm run dev
   ```
3. Buka browser Anda di alamat: [http://localhost:3000](http://localhost:3000)

---

## Deployment ke Vercel

Untuk mempublikasikan aplikasi agar bisa diakses oleh pelanggan Anda di internet:
1. Hubungkan repository GitHub Anda ke [Vercel](https://vercel.com).
2. Impor proyek `wifiid` ini ke Vercel.
3. Pada bagian **Environment Variables** di Vercel, masukkan kredensial yang sama seperti di `.env.local`:
   *   `NEXT_PUBLIC_SUPABASE_URL`
   *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Klik **Deploy**. Selesai! Link aplikasi Anda akan aktif dan siap dibagikan ke pelanggan.
