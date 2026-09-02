# 📖 Dokumentasi & Panduan Arsitektur Wedding Next.js

Dokumen ini dibuat sebagai peta dan panduan referensi utama proyek **The Wedding of Ramazan & Dede**. Gunakan dokumen ini saat ingin melakukan perbaikan, konfigurasi, atau penambahan fitur baru agar tidak perlu membaca dan menelusuri seluruh file kode sumber dari awal.

---

## 📌 1. Ringkasan & Tech Stack

Aplikasi ini adalah sistem undangan pernikahan digital berbasis web interaktif dengan fitur personalisasi link tamu, RSVP kehadiran real-time, buku ucapan/doa restu, dan panel admin.

- **Framework**: [Next.js 15 (App Router)](file:///home/muradelhaq/Documents/GitHub/wedding-nextjs/package.json) dengan TypeScript.
- **Frontend Invitation**: Hybrid SSR Templating menggunakan [Alpine.js](https://alpinejs.dev/) & [Tailwind CSS](https://tailwindcss.com/) di dalam file HTML template ([`public/invitation-template.html`](file:///home/muradelhaq/Documents/GitHub/wedding-nextjs/public/invitation-template.html)).
- **Database**: PostgreSQL (koneksi pooling langsung via driver [`pg`](file:///home/muradelhaq/Documents/GitHub/wedding-nextjs/lib/db.ts)).
- **Autentikasi Admin**: Cookie berbasis hash HMAC-SHA256 ([`lib/admin-auth.ts`](file:///home/muradelhaq/Documents/GitHub/wedding-nextjs/lib/admin-auth.ts)) dan verifikasi password PostgreSQL `crypt()`.
- **Deployment Build**: Standalone Next.js output dengan script postbuild copy asset static.

---

## 🗺️ 2. Peta File & Direktori (File Map)

```
wedding-nextjs/
├── app/                               # Next.js App Router (Route Handlers & Pages)
│   ├── [slug]/route.ts                # Handler undangan personal tamu (/[slug])
│   ├── admin/
│   │   ├── api/
│   │   │   ├── [resource]/route.ts    # REST API CRUD admin (GET all, POST new)
│   │   │   └── [resource]/[id]/route.ts # REST API CRUD admin (PUT update, DELETE)
│   │   ├── links/route.ts             # Export file TSV berisi daftar link undangan tamu
│   │   └── route.ts                   # Halaman Dashboard Admin & Login Form (SSR HTML)
│   ├── guestbook/route.ts             # API Endpoint Buku Tamu (GET list ucapan, POST ucapan)
│   ├── rsvp/route.ts                  # API Endpoint RSVP (POST konfirmasi kehadiran)
│   ├── layout.tsx                     # Root layout Next.js & metadata OpenGraph/SEO
│   ├── not-found.tsx                  # Halaman 404 Fallback Next.js
│   └── route.ts                       # Handler undangan umum root (/)
│
├── lib/                               # Logika Backend, Database & Helpers
│   ├── admin-auth.ts                  # Logika sesi cookie admin HMAC-SHA256 & verifikasi user
│   ├── admin-resources.ts             # Definisi tabel/kolom yang diizinkan untuk dikelola di admin
│   ├── content.ts                     # Metadata profil mempelai, waktu, tempat, dan peta
│   ├── db.ts                          # Pool pg, query helper, CRUD Guest, RSVP, Wish, dan relativeTime
│   ├── invitation-response.ts         # Template engine injeksi HTML undangan + data dinamis
│   └── types.ts                       # Tipe data TypeScript (Guest, Wish)
│
├── public/                            # Asset Statis & Template UI Utama
│   ├── audio/wedding-nasheed.mp3      # Lagu latar belakang undangan
│   ├── build/                         # Asset CSS, JS (Alpine), & Font hasil build
│   ├── images/                        # Foto kartun mempelai, cover, dan ilustrasi
│   └── invitation-template.html       # TEMPLATE UTAMA seluruh tampilan halaman undangan
│
├── .env.example                       # Contoh variabel konfigurasi environment
├── next.config.ts                     # Konfigurasi standalone Next.js & unoptimized images
└── package.json                       # Dependensi dan script build
```

---

## ⚙️ 3. Arsitektur & Alur Kerja Sistem (Workflow)

### A. Alur Halaman Undangan (`/` dan `/[slug]`)
1. User mengakses `https://domain.com/` (Umum) atau `https://domain.com/[slug]` (Personal).
2. Request ditangani oleh [`app/route.ts`](file:///home/muradelhaq/Documents/GitHub/wedding-nextjs/app/route.ts) atau [`app/[slug]/route.ts`](file:///home/muradelhaq/Documents/GitHub/wedding-nextjs/app/%5Bslug%5D/route.ts).
3. Route memanggil [`invitationResponse(slug)`](file:///home/muradelhaq/Documents/GitHub/wedding-nextjs/lib/invitation-response.ts):
   - Query data tamu via [`getGuest(slug)`](file:///home/muradelhaq/Documents/GitHub/wedding-nextjs/lib/db.ts). Jika slug valid: otomatis update `is_opened = true`, catat `opened_at`, dan tambah `view_count + 1`.
   - Query 5 ucapan terbaru via [`getWishes()`](file:///home/muradelhaq/Documents/GitHub/wedding-nextjs/lib/db.ts).
   - Membaca file [`public/invitation-template.html`](file:///home/muradelhaq/Documents/GitHub/wedding-nextjs/public/invitation-template.html).
   - Melakukan string replacement untuk menginjeksi:
     - Nama tamu yang lolos escape HTML (`escapeHtml(guest.name)`).
     - State Alpine.js: `guestId`, form RSVP (`rsvpName`, `attendance`, `totalGuest`, `notes`, `submitted`), serta daftar ucapan awal `items`.
   - Mengembalikan response HTML mentah dengan header `no-store`.
4. Browser merender template, Alpine.js menginisialisasi animasi pembukaan tirai, pemutar audio, countdown, dan interaksi form.

### B. Alur RSVP (`POST /rsvp`)
1. Ditangani di [`app/rsvp/route.ts`](file:///home/muradelhaq/Documents/GitHub/wedding-nextjs/app/rsvp/route.ts).
2. Validasi input: `guest_name`, `attendance` (`hadir` | `tidak_hadir` | `ragu`), `total_guest` (1-10), `notes` (max 1000 karakter).
3. Memanggil [`saveRsvp()`](file:///home/muradelhaq/Documents/GitHub/wedding-nextjs/lib/db.ts):
   - Jika tamu belum ada (`guestId` null), sistem otomatis membuat entri tamu baru dengan kategori `'Umum (RSVP)'` dan slug unik.
   - Melakukan upsert pada tabel `rsvps` berdasarkan `guest_id`.

### C. Alur Buku Tamu / Guestbook (`/guestbook`)
1. **GET `/guestbook?page=N`**:
   - Mengambil data ucapan approved dari tabel `guestbooks` (paginasi per 5 item), diurutkan dari yang terbaru (`id desc`).
   - Waktu dibuat diformat secara relatif (misal: "Baru saja", "5 menit yang lalu").
2. **POST `/guestbook`**:
   - Validasi nama dan pesan (3 - 1000 karakter).
   - Memasukkan ke tabel `guestbooks` dengan status `is_approved = true`.

### D. Alur Panel Admin (`/admin`)
1. **Autentikasi & Akun Default**:
   - **URL Login**: `/admin`
   - **Email**: `admin@wedding.com`
   - **Password**: `password`
   - Sesi menggunakan cookie HTTP-Only `wedding_admin` bertanda tangan HMAC-SHA256 (`userId.expires.signature`).
   - Verifikasi password mencocokkan hash bcrypt di tabel `users` (mendukung kompatibilitas prefix `$2y$` dan `$2a$`).
2. **Dashboard & API**:
   - Menggunakan Single-File Admin UI yang ringan di [`app/admin/route.ts`](file:///home/muradelhaq/Documents/GitHub/wedding-nextjs/app/admin/route.ts).
   - Operasi CRUD tabel (`guests`, `rsvps`, `guestbooks`, `settings`, `stories`, `galleries`) diproses via REST API di [`app/admin/api/[resource]/route.ts`](file:///home/muradelhaq/Documents/GitHub/wedding-nextjs/app/admin/api/%5Bresource%5D/route.ts).
3. **Download Link Tamu**:
   - Mengakses `/admin/links` ([`app/admin/links/route.ts`](file:///home/muradelhaq/Documents/GitHub/wedding-nextjs/app/admin/links/route.ts)) untuk mengunduh file TSV berformat: `Nama \t Tautan Undangan \t Telepon`.

---

## 🗄️ 4. Skema Database (PostgreSQL)

Berikut struktur tabel utama di database:

| Tabel | Kolom Kunci | Keterangan |
|---|---|---|
| **`users`** | `id`, `name`, `email`, `password` (bcrypt/crypt) | Akun login admin. |
| **`guests`** | `id`, `name`, `slug`, `category`, `phone`, `address`, `is_opened`, `opened_at`, `view_count` | Daftar tamu undangan personal. |
| **`rsvps`** | `id`, `guest_id`, `attendance`, `total_guest`, `notes`, `created_at` | Konfirmasi kehadiran tamu. |
| **`guestbooks`** | `id`, `guest_id`, `name`, `message`, `is_approved`, `created_at` | Pesan & ucapan selamat. |
| **`settings`** | `id`, `key`, `value`, `group`, `type` | Pengaturan dinamis. |
| **`stories`** | `id`, `title`, `date_label`, `description`, `image_path`, `sort_order` | Perjalanan kisah cinta. |
| **`galleries`** | `id`, `title`, `file_path`, `media_type`, `sort_order`, `is_featured` | Foto galeri pernikahan. |

---

## 🛠️ 5. Lembar Contekan Perbaikan (Cheat Sheet: Where to Edit What)

Gunakan tabel ini untuk langsung menuju file yang tepat saat ingin melakukan perubahan:

| Kebutuhan Perbaikan / Perubahan | File yang Harus Diedit | Detail Catatan |
|---|---|---|
| **Mengubah Tampilan/Teks/Desain Undangan** | [`public/invitation-template.html`](file:///home/muradelhaq/Documents/GitHub/wedding-nextjs/public/invitation-template.html) | File HTML utama. Berisi markup Tailwind, state Alpine.js (line 89+), teks ayat, nama mempelai, rundown acara, rekening amplop, dan styling. |
| **PENTING: Nama Mempelai, Waktu & Lokasi** | [`public/invitation-template.html`](file:///home/muradelhaq/Documents/GitHub/wedding-nextjs/public/invitation-template.html) & [`lib/content.ts`](file:///home/muradelhaq/Documents/GitHub/wedding-nextjs/lib/content.ts) | Teks tampilan utama dirender langsung dari HTML template. Pastikan sinkron dengan data di `lib/content.ts`. |
| **Ganti Lagu / Musik Latar** | [`public/audio/wedding-nasheed.mp3`](file:///home/muradelhaq/Documents/GitHub/wedding-nextjs/public/audio/wedding-nasheed.mp3) | Ganti file audio ini atau ubah referensi path `<audio>` di `invitation-template.html`. |
| **Ganti Foto Mempelai / Cover / Background** | Folder [`public/images/`](file:///home/muradelhaq/Documents/GitHub/wedding-nextjs/public/images/) | Foto cover (`cartoon_couple_cover.webp`), foto pengantin pria (`cartoon_groom.webp`), wanita (`cartoon_bride.webp`). |
| **Logika Injeksi Data Tamu / SSR Hydration** | [`lib/invitation-response.ts`](file:///home/muradelhaq/Documents/GitHub/wedding-nextjs/lib/invitation-response.ts) | Tempat string-replace untuk Alpine.js data (`guestId`, `rsvpName`, `currentPage`, dll). |
| **Query Database / Tambah Kolom Tamu & RSVP** | [`lib/db.ts`](file:///home/muradelhaq/Documents/GitHub/wedding-nextjs/lib/db.ts) & [`lib/types.ts`](file:///home/muradelhaq/Documents/GitHub/wedding-nextjs/lib/types.ts) | Fungsi `getGuest`, `saveRsvp`, `createWish`, `getWishes`, dan konfigurasi pool koneksi. |
| **Validasi & Response Form RSVP** | [`app/rsvp/route.ts`](file:///home/muradelhaq/Documents/GitHub/wedding-nextjs/app/rsvp/route.ts) | Pilihan kehadiran (`hadir`, `tidak_hadir`, `ragu`), batas max tamu, pesan sukses. |
| **Validasi & Paginasi Buku Tamu** | [`app/guestbook/route.ts`](file:///home/muradelhaq/Documents/GitHub/wedding-nextjs/app/guestbook/route.ts) | Batas panjang karakter ucapan, jumlah ucapan per halaman (`per_page: 5`). |
| **Panel Admin (UI / Fitur)** | [`app/admin/route.ts`](file:///home/muradelhaq/Documents/GitHub/wedding-nextjs/app/admin/route.ts) | Tampilan form login, layout dashboard, script CRUD tabel berbasis vanilla JS & fetch. |
| **Kolom / Tabel yang Muncul di Admin** | [`lib/admin-resources.ts`](file:///home/muradelhaq/Documents/GitHub/wedding-nextjs/lib/admin-resources.ts) | Tambah atau kurangi kolom yang boleh diedit di dashboard admin. |
| **Keamanan / Sesi Login Admin** | [`lib/admin-auth.ts`](file:///home/muradelhaq/Documents/GitHub/wedding-nextjs/lib/admin-auth.ts) | Durasi token cookie (default 8 jam), secret key signing, dan verifikasi password. |
| **Koneksi Database & Port** | `.env.local` / [`.env.example`](file:///home/muradelhaq/Documents/GitHub/wedding-nextjs/.env.example) | Mengatur `DATABASE_URL` atau parameter `DB_HOST`, `DB_PORT`, `DB_DATABASE`, dll. |

---

## 🚀 6. Panduan Menjalankan & Deployment

### Variabel Environment
Buat file `.env.local` berdasarkan [`.env.example`](file:///home/muradelhaq/Documents/GitHub/wedding-nextjs/.env.example):
```env
DATABASE_URL=postgresql://username:password@host:5432/wedding_db?sslmode=require
# ATAU gunakan parameter terpisah:
# DB_HOST=localhost
# DB_PORT=5432
# DB_DATABASE=wedding_db
# DB_USERNAME=postgres
# DB_PASSWORD=secret

ADMIN_SECRET=rahasia_acak_panjang_untuk_signature_cookie
```

### Menjalankan Server Lokal
```bash
# Menjalankan mode development
pnpm dev
# atau: npm run dev
```
Buka `http://localhost:3000` untuk undangan umum, atau `http://localhost:3000/[slug-tamu]` untuk undangan personal.

### Build & Produksi
```bash
# Build aplikasi standalone
pnpm build
# atau: npm run build

# Menjalankan hasil build
pnpm start
# atau: npm start
```
*Catatan: Perintah `pnpm build` secara otomatis menjalankan `postbuild` untuk menduplikasi folder `public/` dan `.next/static/` ke `.next/standalone/` agar siap dijalankan menggunakan Docker atau server Node.js minimalis.*
