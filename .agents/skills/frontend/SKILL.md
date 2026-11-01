---
name: frontend
description: >-
  Panduan pengembangan dan perbaikan frontend untuk proyek web Kelas XI DKV 3 SMKN 1 Tasikmalaya. Meliputi standar HTML5 semantik, CSS modular & design system, Vanilla JavaScript ES6+, integrasi Supabase client-side, responsive design, serta aksesibilitas UI/UX.
---

# Frontend Skill — Kelas XI DKV 3

Skill ini memandu proses pengembangan, penataan gaya (styling), interaktivitas, dan integrasi frontend pada proyek web Kelas XI DKV 3.

---

## 1. Arsitektur & Teknologi Frontend

Proyek ini dibangun tanpa framework berat (Vanilla Architecture) untuk performa optimal dan kesederhanaan pemeliharaan:

- **HTML5:** Semantic markup (`<header>`, `<main>`, `<section>`, `<article>`, `<nav>`, `<footer>`) dengan atribut aksesibilitas ARIA yang lengkap.
- **CSS3:** Native CSS menggunakan CSS Variables (Design Tokens) di `:root` (`style.css`), Flexbox, Grid, dan media queries responsif.
- **JavaScript:** ES6+ Vanilla JS (`document.addEventListener('DOMContentLoaded', ...)`), modular per fitur (`auth.js`, `scripts.js`, `profile.js`, `chat.js`, dll.).
- **Backend / Database Client:** `@supabase/supabase-js` melalui `supabaseClient.js` untuk autentikasi pengguna, penyimpanan gambar/karya, dan interaksi database.

---

## 2. Design System & Styling Conventions

Semua style baru atau modifikasi harus mengikuti token dan variabel yang telah didefinisikan di `style.css`:

### Token Warna & Tema
- `--bg`: Background utama (default soft blue: `#e6ecff`)
- `--bg-2`: Background sekunder / kontras (`#aec4cc`)
- `--card`: Background kartu konten (`#c5cbe0`)
- `--line`: Garis batas / divider (`rgba(255, 255, 255, 0.09)`)
- `--accent`: Aksen primer (`#3b82f6`)
- `--accent-2`: Aksen hover / aktif (`#1d4ed8`)
- `--text`: Teks utama (`#000000`)
- `--muted`: Teks sekunder / keterangan (`#222933`)

### Tipografi
- **Body Font:** `--font-body: "DM Sans", system-ui, sans-serif;`
- **Heading / Display Font:** `--font-display: "Syne", system-ui, sans-serif;`
- **Ukuran Heading:** Gunakan fluid sizing seperti `--h1: clamp(1.9rem, 3.2vw, 2.6rem);`

### Layout & Responsivitas
- Lebar container: `--container: 980px;` dengan helper `.container { width: min(100% - 2rem, var(--container)); margin-inline: auto; }`.
- Radius elemen: `--radius: 12px;` dan `--radius-lg: 18px;`.
- Breakpoint standar:
  - Mobile: `< 640px` (Stack layout, navigasi responsif/hamburger jika ada)
  - Tablet: `640px - 1024px` (2 kolom grid)
  - Desktop: `> 1024px` (Full grid 3-4 kolom)

---

## 3. Standar JavaScript & Penanganan DOM

1. **Pemeriksaan Null / Defensive Programming:**
   Selalu periksa keberadaan elemen sebelum menambahkan event listener atau memanipulasi properti:
   ```javascript
   const element = document.getElementById('myElement');
   if (!element) return;
   ```
2. **Asinkron & Penanganan Error Supabase:**
   Gunakan struktur `try...catch` atau pemeriksaan `error` pada setiap pemanggilan query Supabase:
   ```javascript
   const { data, error } = await supabaseClient
     .from('posts')
     .select('*');
   if (error) {
     console.error('Gagal mengambil data:', error.message);
     return;
   }
   ```
3. **Pemisahan Logika Halaman:**
   - Fitur umum / navigasi / slideshow: `scripts.js`
   - Autentikasi (login, register, session check): `auth.js`
   - Profil & portofolio siswa: `profile.js` & `edit-profile.html`
   - Unggah karya: `upload.js`
   - Keamanan input: `security-utils.js`

---

## 4. Aksesibilitas (A11y) & Performa

- **Media & Gambar:**
  - Tambahkan selalu atribut `alt` yang deskriptif pada elemen `<img>`.
  - Gunakan `loading="lazy"` untuk gambar di luar viewport awal (galeri, portofolio).
- **Interaksi Keyboard & Form:**
  - Pastikan semua tombol interaktif dapat diakses via tombol `Tab` dan `Enter/Space`.
  - Sertakan `<label>` eksplisit untuk setiap input form atau atribut `aria-label` jika label disembunyikan secara visual.
- **Konsistensi Feedback:**
  - Sediakan feedback visual saat loading data atau saat tombol ditekan (disabled state, spinner, atau notifikasi toast).

---

## 5. Prosedur Verifikasi Frontend

Sebelum menyelesaikan tugas frontend:
1. Pastikan tidak ada sintaks CSS/JS yang rusak atau error di konsol browser.
2. Uji tampilan pada viewport mobile (375px), tablet (768px), dan desktop (1280px).
3. Verifikasi tautan navigasi dan konsistensi header sticky.
4. Pastikan session Supabase diperiksa dengan benar pada halaman terproteksi.
