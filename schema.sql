-- ==========================================================================
-- SKEMA DATABASE WIFI-ID UNTUK SUPABASE
-- Silakan salin dan jalankan seluruh query ini di SQL Editor Supabase Anda.
-- ==========================================================================

-- 1. Bersihkan tabel jika sebelumnya sudah ada
drop table if exists pembayaran;
drop table if exists pelanggan;

-- 2. Buat Tabel Pelanggan
create table pelanggan (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    phone text not null,
    fee integer not null,
    address text not null,
    joined date not null,
    status text not null default 'aktif',
    token uuid default gen_random_uuid() not null unique,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Buat Tabel Pembayaran
create table pembayaran (
    id uuid default gen_random_uuid() primary key,
    pelanggan_id uuid references pelanggan(id) on delete cascade not null,
    year integer not null,
    month integer not null, -- 0 (Januari) sampai 11 (Desember)
    amount_paid integer not null,
    date date not null,
    method text not null,
    notes text,
    status text not null, -- 'paid' (lunas) atau 'partial' (kurang bayar)
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Aktifkan Row Level Security (RLS)
alter table pelanggan enable row level security;
alter table pembayaran enable row level security;

-- 5. Kebijakan Keamanan (RLS Policies) untuk tabel 'pelanggan'

-- Kebijakan 1: Admin terautentikasi (Supabase Auth) memiliki akses penuh
create policy "Admin full access on pelanggan"
on pelanggan
for all
to authenticated
using (true)
with check (true);

-- Kebijakan 2: Pelanggan (anonim/publik) dapat membaca profil mereka sendiri menggunakan token UUID
create policy "Client read profile by token"
on pelanggan
for select
to anon
using (true); -- Kita filter token di query aplikasi demi fleksibilitas client-side token loading

-- 6. Kebijakan Keamanan (RLS Policies) untuk tabel 'pembayaran'

-- Kebijakan 1: Admin terautentikasi (Supabase Auth) memiliki akses penuh
create policy "Admin full access on pembayaran"
on pembayaran
for all
to authenticated
using (true)
with check (true);

-- Kebijakan 2: Pelanggan (anonim/publik) dapat membaca data pembayaran mereka sendiri
create policy "Client read payments"
on pembayaran
for select
to anon
using (true); -- Kita filter di query aplikasi demi kecocokan token pelanggan

-- 7. Tambahkan Data Dummy Awal (Opsional - untuk demo)
insert into pelanggan (id, name, phone, fee, address, joined, status, token) values
('7a8b9c0d-1111-2222-3333-444455556666', 'Budi Santoso', '081234567890', 150000, 'Jl. Melati No. 45, Blok C', '2026-01-10', 'aktif', 'b1111111-1111-1111-1111-111111111111'),
('7a8b9c0d-2222-3333-4444-555566667777', 'Rina Wijaya', '082345678901', 200000, 'Jl. Mawar Gg. Kelinci No. 12', '2026-03-05', 'aktif', 'r2222222-2222-2222-2222-222222222222'),
('7a8b9c0d-3333-4444-5555-666677778888', 'Agus Setiawan', '083456789012', 150000, 'Perum Gading Indah, Blok D-10', '2026-05-20', 'aktif', 'a3333333-3333-3333-3333-333333333333');

insert into pembayaran (pelanggan_id, year, month, amount_paid, date, method, notes, status) values
-- Budi Santoso
('7a8b9c0d-1111-2222-3333-444455556666', 2026, 0, 150000, '2026-01-08', 'Cash', 'Bayar lunas', 'paid'),
('7a8b9c0d-1111-2222-3333-444455556666', 2026, 1, 150000, '2026-02-09', 'Transfer Bank', 'Transfer Mandiri', 'paid'),
('7a8b9c0d-1111-2222-3333-444455556666', 2026, 2, 150000, '2026-03-09', 'Transfer Bank', 'Transfer Mandiri', 'paid'),
('7a8b9c0d-1111-2222-3333-444455556666', 2026, 3, 150000, '2026-04-10', 'E-Wallet', 'Dana', 'paid'),
('7a8b9c0d-1111-2222-3333-444455556666', 2026, 4, 150000, '2026-05-08', 'Transfer Bank', 'Transfer Mandiri', 'paid'),
('7a8b9c0d-1111-2222-3333-444455556666', 2026, 5, 100000, '2026-06-05', 'Cash', 'Bayar sebagian dulu', 'partial'),
-- Rina Wijaya
('7a8b9c0d-2222-3333-4444-555566667777', 2026, 2, 200000, '2026-03-06', 'E-Wallet', 'Gopay', 'paid'),
('7a8b9c0d-2222-3333-4444-555566667777', 2026, 3, 200000, '2026-04-05', 'Transfer Bank', 'Transfer BCA', 'paid'),
('7a8b9c0d-2222-3333-4444-555566667777', 2026, 4, 120000, '2026-05-12', 'Cash', 'Baru bayar 120rb, kurang 80rb', 'partial'),
-- Agus Setiawan
('7a8b9c0d-3333-4444-5555-666677778888', 2026, 4, 150000, '2026-05-22', 'Transfer Bank', 'Transfer langsung setelah pasang', 'paid');
