# Panduan & Standar Proyek Web Kelas XI DKV 3

Proyek ini adalah website profil, galeri karya, dan interaksi siswa untuk Kelas XI DKV 3 SMKN 1 Tasikmalaya.

## Standar Pengembangan Frontend

1. **Stack & Arsitektur:**
   - Gunakan Semantic HTML5 (`header`, `main`, `nav`, `section`, `article`, `footer`).
   - Gunakan Vanilla JavaScript (ES6+) tanpa framework tambahan.
   - Styling terpusat pada file CSS native (`style.css` dan file CSS modular lainnya).

2. **Design Tokens & Konsistensi UI:**
   - Gunakan CSS variables dari `style.css` (`--bg`, `--card`, `--accent`, `--text`, dll.).
   - Pastikan tipografi menggunakan font *Syne* untuk display/heading dan *DM Sans* untuk teks body.
   - Terapkan responsive design secara mobile-first (`< 640px`, `768px`, `1024px+`).

3. **Supabase & Manipulasi DOM:**
   - Gunakan `supabaseClient.js` untuk semua request database atau autentikasi Supabase.
   - Selalu lakukan pengecekan elemen DOM (`if (!el) return;`) sebelum event listener atau manipulasi atribut untuk menghindari runtime error.

Untuk petunjuk alur kerja frontend lengkap, lihat skill workspace di [.agents/skills/frontend/SKILL.md](file:///d:/Web Kelas DKV/WEB/KelasXdkv3/.agents/skills/frontend/SKILL.md).
