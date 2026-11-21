# Winter 2FA - TOTP

Aplikasi web Two-Factor Authentication (TOTP) modern, ringan, dan 100% aman di sisi klien (Client-Side). Dirancang untuk kecepatan tinggi dan kemudahan penggunaan dengan antarmuka gelap yang ringkas, serta siap dideploy ke **Cloudflare Pages**.

---

## ✨ Fitur Utama

1. **Perhitungan Kode Real-Time (TOTP RFC 6238)**:
   - Kode 6 digit otomatis diperbarui setiap 30 detik.
   - Menampilkan kode aktif dan *next code* di sampingnya.
   - Indikator waktu countdown (progress bar) dinamis.
   - Tombol salin kode instan dengan feedback cepat.

2. **Proteksi Kunci Master Sesi**:
   - Menambah akun baru (manual / QR) dan menghapus akun diproteksi oleh kunci master.
   - Hash SHA-256 diverifikasi secara aman menggunakan Web Crypto API tanpa menyimpan plaintext password.
   - Kunci terbuka berlaku selama 10 menit per sesi, dengan opsi untuk mengunci manual kapan saja di header.

3. **Input Mudah & Fleksibel**:
   - **Isi Secret**: Form tersembunyi yang ringkas (`Name Account`, `Platform`, `Secret Key`).
   - **Upload QR**: Ekstraksi secret key langsung dari gambar atau tangkapan layar kode QR tanpa perlu izin kamera.
   - Validasi otomatis mencegah duplikasi akun yang sama.

4. **Penyimpanan Offline & Lokal**:
   - Seluruh data akun tersimpan secara persisten di peramban menggunakan **IndexedDB**.
   - Tidak ada transmisi data atau pelacakan ke server eksternal.

---

## 🛠️ Stack Teknologi

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Penyimpanan**: IndexedDB (via `idb`)
- **Engine TOTP**: `otpauth`
- **QR Decoder**: `jsqr` (offline client-side)

---

## 🚀 Menjalankan Secara Lokal

```bash
# Instal dependensi
npm install

# Jalankan server pengembangan
npm run dev

# Bangun untuk produksi
npm run build
```
