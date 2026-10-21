# C-DFS PHP/XAMPP

C-DFS membantu perguruan tinggi dan industri menganalisis kesenjangan kompetensi, memprediksi future skills,
serta memberikan rekomendasi kurikulum yang relevan dengan kebutuhan masa depan.

Peran & cara mendapat akun:
  Mahasiswa (Jobseeker)    daftar sendiri, HANYA email mahasiswa UM (@students.um.ac.id) + password sendiri
  Mitra (Jobprovider)      klik "Ajukan Kemitraan" di landing page -> admin memeriksa (NIB / NPSN) -> admin membuat akun
  Dosen / Prodi            akun dibuat admin, dikaitkan ke satu prodi (hanya melihat data agregat prodinya)
  Admin                    akun awal dari database (admin@cdfs.local / Admin@12345, WAJIB diganti saat login pertama)
Akun buatan admin memakai password sementara acak yang wajib diganti saat login pertama.
Domain email mahasiswa bisa diubah di php/api.php (EMAIL_MAHASISWA).

Alur data:
  Mitra mengisi kebutuhan (lowongan / tanpa lowongan) -> mahasiswa mengisi bukti (prodi, transkrip, sertifikat, bahasa)
  dan dosen mengisi CPL/CPMK + tracer study -> C-DFS menganalisis -> hasil ke mahasiswa (kecocokan, rencana belajar),
  dosen (gap prodi, rekomendasi kurikulum, status CPL) dan mitra (kandidat cocok) -> prodi memperbarui kurikulum.

Menu:
  Mahasiswa : Beranda · Profil Kompetensi (transkrip, sertifikat, bahasa; prodi dipilih di bagian atas Beranda) · Kecocokan Lowongan · Rencana Belajar (tab: yang perlu
              dipelajari / gap prodi) · Karier Alumni
  Dosen     : Ringkasan Prodi · Gap & Rekomendasi Kurikulum · CPL & CPMK (tambah/ubah/hapus) · Tracer Study (unggah CSV)
              · Mitra Prodi
  Mitra     : Ringkasan · Kebutuhan Kompetensi (tab: Lowongan / Kebutuhan tanpa lowongan) · Kandidat & Pelamar · Profil Mitra
  Admin     : Kelola Akun (buat akun mitra & dosen, reset password, nonaktifkan) · Pengajuan Mitra

Struktur:
C-DFS-PHP/
├── index.html
├── img/ (logo-cdfs.png, favicon.png, logo-cdfs-full.jpg)
├── css/style.css
├── js/app.js
├── php/config.php
├── php/api.php
├── database/cdfs.sql              (skema lengkap + akun admin awal, untuk instalasi baru)
├── database/data_contoh.sql       (DATA CONTOH fiktif untuk presentasi, opsional)
├── database/migrasi_*.sql         (untuk database lama, lihat bawah)
└── README.md

==========================================================================================
MENJALANKAN DENGAN LARAGON + HEIDISQL (disarankan)
==========================================================================================
1. Instal Laragon (laragon.org, versi Full sudah berisi Apache/Nginx, PHP 8, MySQL/MariaDB, dan HeidiSQL).
2. Salin folder C-DFS-PHP ke  C:\laragon\www\  lalu ganti namanya menjadi  C-DFS  (C:\laragon\www\C-DFS).
3. Buka Laragon -> klik "Start All".
4. Buat database dengan HeidiSQL: di Laragon klik tombol "Database" (membuka HeidiSQL).
   - Sesi bawaan Laragon: host 127.0.0.1, user root, password kosong -> Open.
   - Menu File -> Run SQL file... -> pilih database\cdfs.sql  (membuat database "cdfs", tabel, dan akun admin).
   - (Opsional, untuk presentasi) File -> Run SQL file... -> database\data_contoh.sql
   - Tekan F5 (Refresh) di HeidiSQL agar database cdfs muncul.
5. Periksa php\config.php : DB_HOST 127.0.0.1, DB_NAME cdfs, DB_USER root, DB_PASS '' (bawaan Laragon).
6. Buka  http://localhost/C-DFS/   (atau  http://c-dfs.test/  bila "Auto virtual hosts" Laragon aktif; klik Reload).
7. Masuk sebagai admin (admin@cdfs.local / Admin@12345) -> ganti password -> buat akun dosen & mitra.

Mengelola data dengan HeidiSQL:
- Lihat / ubah isi tabel: pilih database cdfs -> pilih tabel -> tab "Data".
- Cadangkan database: klik kanan cdfs -> "Export database as SQL" (centang Create + Insert).
- Impor tracer study atau CPL massal: lebih mudah lewat web (akun dosen), atau HeidiSQL: Tools -> Import CSV file.
- Menjalankan file migrasi: File -> Run SQL file...
- Tabel penting: users (semua akun), lowongan_kerja, kompetensi, jobseeker_profil, lamaran, cpl, cpmk,
  tracer_alumni, pengajuan_mitra.

Catatan MySQL 8 (bawaan Laragon) vs MariaDB (bawaan XAMPP): cdfs.sql dan data_contoh.sql jalan di keduanya.
File migrasi_*.sql memakai "ADD COLUMN IF NOT EXISTS" yang hanya didukung MariaDB. Di Laragon, cara paling mudah:
hapus database lama (klik kanan cdfs -> Drop) lalu impor ulang cdfs.sql (+ data_contoh.sql).

Masih memakai XAMPP? Langkahnya sama: salin ke C:\xampp\htdocs\C-DFS, impor cdfs.sql lewat phpMyAdmin.
Jangan membuka index.html dengan double-click: tanpa PHP, halaman berjalan dalam mode demo (DATA CONTOH);
halaman admin, dosen, registrasi, dan pengajuan kemitraan membutuhkan server.

Akun DATA CONTOH (setelah import data_contoh.sql, semua password: CDFS@12345):
- Dosen / Prodi    : koor.trse@contoh.ac.id, koor.mp@contoh.ac.id, koor.pgsd@contoh.ac.id, koor.paud@contoh.ac.id
- Mitra            : hr@elektra.contoh.co.id, hr@mitraotomasi.contoh.co.id, hr@niagadigital.contoh.co.id,
                     hr@analitika.contoh.co.id, hr@ceria.contoh.sch.id, hr@pelangi.contoh.co.id, hr@suryadaya.contoh.co.id,
                     hr@cendekia.contoh.sch.id, hr@cerdasprima.contoh.co.id (contoh mitra yang BELUM mengizinkan namanya tampil)
- Mahasiswa        : 24 mahasiswa, 6 per prodi, mis. rani.trse@contoh.ac.id, salsa.mp@contoh.ac.id,
                     galih.paud@contoh.ac.id, ayu.pgsd@contoh.ac.id
- Admin            : admin@cdfs.local / Admin@12345 (wajib ganti password)
- 2 pengajuan kemitraan contoh untuk dicoba di menu Pengajuan Mitra.
Semua perusahaan, mahasiswa, nilai, dan lamaran di file ini KARANGAN (nama berakhiran "(Contoh)").
Hapus sebelum dipakai sungguhan:
  DELETE FROM users WHERE email LIKE '%@contoh.ac.id' OR email LIKE '%.contoh.co.id' OR email LIKE '%.contoh.sch.id';
Data contoh dibuat dengan tanggal relatif terhadap waktu import, agar grafik tren 6 bulan terisi.

Angka survei di landing page (bagian ld-survey di index.html) masih DATA DUMMY: ganti dengan hasil survei asli.

------------------------------------------------------------------------------------------
1) JOBSEEKER (mahasiswa / lulusan)
------------------------------------------------------------------------------------------
- Dashboard    : pilih Jalur & Program Studi (kolom pencarian), ringkasan IPK, sertifikat & bahasa,
                 "Langkah Anda", lowongan untuk prodi Anda (dengan skor kecocokan + tombol Lamar), status lamaran.
                 * Akademis  : Pendidikan Guru Sekolah Dasar (PGSD), Pendidikan Guru PAUD (PGPAUD)
                 * Vocational: Teknologi Rekayasa Sistem Elektronika (TRSE), Manajemen Pemasaran (MP)
- Job Matching : transkrip PDF (wajib, terdeteksi otomatis), sertifikat BNSP/Non-BNSP (opsional),
                 kemahiran bahasa (opsional) -> "Analisis dengan AI" -> pekerjaan yang cocok, kecocokan & peluang
                 per lowongan, tombol Lamar.
                 Kecocokan = 30% prodi sesuai + 70% rata-rata bukti kompetensi
                 Skor Kesiapan = 55% kecocokan + 25% IPK/4 + 10% kekuatan sertifikat + 10% bahasa tertinggi
                                 (mengukur kesiapan data mahasiswa, bukan peluang pasti diterima kerja)
                 Kompetensi tanpa bukti di transkrip/sertifikat/bahasa bernilai 0 (tidak ada nilai otomatis dari profil prodi).
                 Kotak "Izinkan perusahaan melihat profil saya":
                   dicentang  -> profil tampil di menu Kandidat semua Jobprovider
                   tidak      -> profil hanya terlihat oleh perusahaan yang dilamar
                 Data mahasiswa selalu dipakai ANONIM (tanpa nama/email) untuk analisis prodi.
                 File yang di-upload TIDAK disimpan di server; yang disimpan hanya data hasil deteksinya.
- Kompetensi Prodi (menu dropdown, otomatis memakai prodi Jobseeker):
    * Gap Kompetensi        : per kompetensi yang diminta industri untuk prodi Anda:
                              Permintaan (% lowongan/perusahaan yang meminta), Kesiapan Prodi (% mahasiswa seprodi
                              dengan MK terkait bernilai >= B atau sertifikat terkait), Gap, MK terkait, dan kolom "Anda"
                              (Sudah/Belum, dari data Anda sendiri). Juga tabel kemahiran bahasa.
    * Yang Perlu Dipelajari : daftar kompetensi & bahasa yang diminta tetapi belum terlihat di data Anda, diurutkan
                              menurut permintaan, dengan saran belajar (perdalam MK yang sudah diambil / ambil MK pilihan /
                              kursus & sertifikasi) dan perusahaan yang memintanya.
                              Bagian lipat "Rekomendasi kurikulum untuk prodi" berisi saran untuk dosen/koordinator prodi.
  Dashboard dibuka dengan kartu "Tren Pekerjaan & Skill ke Depan" (grafik batang):
    * Batang hijau = pekerjaan yang tumbuh, merah = menurun, dengan persentase perkiraan perubahan
      jumlah pekerjaan 2025-2030 dari WEF Future of Jobs Report 2025.
    * "Prodi Saya" menampilkan pekerjaan yang relevan dengan prodi (pemetaan tim C-DFS: js/app.js -> FS_JOBS);
      "Global" menampilkan 6 tercepat tumbuh dan 6 tercepat menurun.
    * Baris skill: AI & Big Data +87%, Jaringan & Keamanan Siber +70%, Literasi Teknologi +68% (selisih bersih
      pemberi kerja), dan Ketangkasan Manual (24% pemberi kerja memperkirakan menurun).
    * WEF memproyeksikan sampai 2030; arah sesudahnya diperkirakan berlanjut (dicantumkan di kartu).
  Dashboard juga menampilkan 3 kompetensi teratas yang perlu dipelajari.
  Privasi: kesiapan prodi dihitung DI SERVER (php/api.php, action js_prodi); transkrip mahasiswa lain tidak pernah
  dikirim ke browser, dan angka kesiapan baru tampil bila ada minimal 3 mahasiswa seprodi yang mengunggah transkrip.
- Lamaran      : status Dikirim -> Ditinjau -> Diundang -> Diterima / Ditolak, diubah oleh Jobprovider.

------------------------------------------------------------------------------------------
2) JOBPROVIDER (industri)
------------------------------------------------------------------------------------------
- Ringkasan Rekrutmen : lowongan aktif, kompetensi & bahasa, kandidat cocok, lamaran masuk, kandidat teratas.
- Lowongan & Kompetensi (dropdown):
    * Kelola Lowongan            : pusat kerja Jobprovider. Posisi, prodi, lokasi, kompetensi, syarat bahasa;
                                   edit, tutup/buka, hapus; jumlah pelamar per lowongan.
    * Kebutuhan Kompetensi Umum : kebutuhan jangka panjang perusahaan per prodi, walau belum ada lowongan.
                                  Dipakai untuk (1) pilihan cepat di form lowongan, (2) masukan ke analisis prodi dan
                                  kartu "Kebutuhan kompetensi" di Job Matching bila perusahaan belum membuka lowongan
                                  untuk prodi itu, (3) menilai kandidat ("Semua kebutuhan kompetensi umum").
                                  Kompetensi & bahasa baru yang diketik di form lowongan otomatis tersimpan di sini.
- Kandidat & Pelamar  : kandidat dinilai terhadap satu lowongan atau seluruh kebutuhan kompetensi umum; filter prodi, skor,
                        "Hanya pelamar", "Hanya shortlist". Pelamar diberi label dan status lamarannya bisa diubah.
                        Skor = 40% prodi sesuai + 60% porsi kebutuhan terpenuhi.
                        Catatan "belum diverifikasi kampus": transkrip & sertifikat diunggah mandiri oleh mahasiswa.

------------------------------------------------------------------------------------------
Analisis AI (opsional)
------------------------------------------------------------------------------------------
- Isi AI_API_KEY di php/config.php dengan API key Claude (console.anthropic.com); AI_MODEL bisa disesuaikan.
- Dipakai untuk: membaca transkrip scan / sertifikat gambar dan narasi Job Matching.
- Semua skor (kecocokan, peluang, gap, kesiapan) dihitung dengan rumus di atas, bukan oleh AI; AI hanya menulis narasi.
- Pastikan ekstensi cURL aktif di XAMPP (php.ini: extension=curl). Batas file untuk AI 5 MB.

Daftar prodi ada di js/app.js (PRODI_BY_JALUR) dan php/api.php (PRODI_BY_JALUR) — ubah keduanya bila menambah prodi.

------------------------------------------------------------------------------------------
Database lama yang sudah terlanjur di-import (jalankan yang belum pernah dijalankan, berurutan)
------------------------------------------------------------------------------------------
1. database/migrasi_role_jobseeker.sql  (jika masih memakai role Administrator PT / Dosen)
2. database/migrasi_kompetensi.sql      (tabel kompetensi & shortlist_kandidat)
3. database/migrasi_jobmatching.sql     (tabel jobseeker_profil)
4. database/migrasi_bahasa.sql          (HANYA jika jobseeker_profil sudah ada tanpa kolom bahasa)
5. database/migrasi_lowongan.sql        (tabel lowongan_kerja + kolom jenis/level pada kompetensi)
6. database/migrasi_lamaran.sql         (izin tampil profil + tabel lamaran)
7. database/migrasi_tracer.sql          (tabel tracer_alumni untuk menu Tracer Study)
8. database/migrasi_kurikulum_mitra.sql (kolom izin_nama mitra + tabel cpl & cpmk)
9. database/migrasi_peran_admin.sql     (peran Dosen & Admin, status akun, tabel pengajuan_mitra, akun admin awal)
Prodi berdata: TRSE, MP, PGSD, PG-PAUD (prodi lain, termasuk Matematika, ada di pencarian dengan label "belum tercakup").
Impor ulang data_contoh.sql agar data contoh ikut diperbarui.
Bila salah satu belum dijalankan, aplikasi menampilkan pesan file migrasi mana yang perlu dijalankan.

------------------------------------------------------------------------------------------
Aturan data (fokus mahasiswa aktif UM)
------------------------------------------------------------------------------------------
- Akun Jobseeker otomatis berinstansi "Universitas Negeri Malang"; analisis prodi hanya memakai mahasiswa UM.
- Verifikasi transkrip: mata kuliah yang terbaca otomatis dari PDF (atau oleh AI) dianggap terverifikasi.
  Mata kuliah yang ditambahkan manual diberi label "manual", terlihat oleh perusahaan, dan TIDAK dihitung
  dalam analisis prodi. Mahasiswa juga tidak dihitung bila prodi di dokumen berbeda dengan prodi akun.
  Catatan: verifikasi penuh baru bisa dicapai lewat integrasi SIAKAD.
- "Yang Perlu Dipelajari" dan rekomendasi kurikulum hanya memakai kompetensi yang diminta minimal 2 sumber
  (lowongan/perusahaan). Kompetensi yang baru diminta 1 perusahaan ditampilkan di bagian "Pantau dulu".

------------------------------------------------------------------------------------------
Isi otomatis dari poster lowongan (Jobprovider -> Kelola Lowongan)
------------------------------------------------------------------------------------------
- Unggah/seret gambar (JPG/PNG) atau PDF poster lowongan. Posisi, prodi target, lokasi, deskripsi, kompetensi,
  dan syarat bahasa terdeteksi otomatis, lalu tampil sebagai KARTU KONFIRMASI:
  * "Sesuai, terbitkan lowongan" -> langsung tersimpan dan muncul di daftar lowongan (tanpa isi form manual),
    juga di Job Matching / Dashboard mahasiswa.
  * "Ubah dulu di form" -> hasil dipindah ke form untuk dilengkapi, lalu Simpan Lowongan.
  * "Tidak sesuai" -> dibatalkan, tidak ada yang tersimpan.
  Bila posisi atau kompetensi tidak terdeteksi, tombol "Sesuai" dinonaktifkan. Prodi tetap bisa dicek di kartu.
- Dengan AI_API_KEY: poster dibaca oleh AI (Claude).
- Tanpa API key: teks dibaca OCR di browser (Tesseract.js dari cdn.jsdelivr.net, perlu internet; pertama kali
  memuat bahasa Indonesia + Inggris beberapa MB), lalu diurai dengan aturan (kata kunci kompetensi, lokasi,
  bahasa, dan prodi). Hasil OCR paling baik untuk poster dengan teks jelas, tidak miring, kontras tinggi.

------------------------------------------------------------------------------------------
Dashboard Jobseeker
------------------------------------------------------------------------------------------
- Kartu Jalur Pendidikan & Program Studi menjelaskan Akademis (S1) vs Vokasi (D4) dan fokus/karier tiap prodi.
  Pencarian prodi memuat 1 prodi UM dari 10 fakultas (PRODI_UM di js/app.js, PRODI_UM_LAIN di php/api.php).
  Prodi yang sudah tercakup C-DFS baru 4: TRSE, Manajemen Pemasaran (Vokasi), PGSD, PG-PAUD (Akademis).
  Prodi lain bisa dipilih, tetapi mendapat pesan "belum tercakup", bukan dashboard kosong.
- SATU pilihan "Prodi Saya / Global" di pojok kanan mengatur kedua grafik:
  * Tren Pekerjaan & Skill ke Depan (WEF 2025). Bila WEF belum merinci prodi (mis. PGSD), ditampilkan global + catatan.
  * Tumbuh & Gap Kompetensi. Prodi = "diminta X dari Y mitra" vs "X dari Y mahasiswa siap" (jumlah, bukan persen,
    karena sampel kecil). Global = keselarasan tiap prodi + gap terbesarnya (action js_gap_global, angka agregat).
- Kartu Kurikulum: CPL yang dibutuhkan mitra ("3 dari 5 mitra"), status Bertumbuh / Stabil / Perlu ditinjau
  (bukan "hapus"), WEF 2025 sebagai pembanding. Tren antarperiode (semester) baru muncul bila data >= 2 periode.
- Mitra PGSD diberi label "mitra / pengguna lulusan", bukan "industri".

------------------------------------------------------------------------------------------
CPL & CPMK (Kompetensi Prodi -> CPL & CPMK)
------------------------------------------------------------------------------------------
- Rantai penelusuran: kebutuhan mitra -> CPL -> CPMK -> mata kuliah, lengkap dengan kolom "Anda".
- Siapa mengisi apa:
  * CPL & CPMK: admin prodi, disalin dari RPS (tabel cpl & cpmk, impor lewat phpMyAdmin).
  * Pemetaan kebutuhan mitra -> CPL: otomatis lewat kolom cpmk.kata_kunci (dipisah ;) yang ditetapkan admin prodi,
    lalu ditinjau koordinator prodi. Kebutuhan tanpa CPL ditandai "Belum tercakup CPL" + usulan.
  * Kebutuhan mitra: Jobprovider (lowongan & kebutuhan kompetensi umum), harus dari survei / wawancara nyata.
- cpl.wef_pembanding / wef_arah ('naik' / 'turun') = pembanding WEF yang dipilih admin prodi.
- CPMK juga tampil di Job Matching (MK yang menjadi bukti) dan di Yang Perlu Dipelajari.
- data_contoh.sql berisi CPL/CPMK CONTOH (sumber = 'Data contoh'); ganti dengan CPL resmi:
  DELETE FROM cpl WHERE sumber='Data contoh';

------------------------------------------------------------------------------------------
Mitra: izin nama & penulisan
------------------------------------------------------------------------------------------
- Jobprovider -> Ringkasan Rekrutmen -> "Izinkan nama perusahaan ditampilkan sebagai mitra C-DFS".
  Tanpa izin, nama perusahaan tidak tampil di Tracer Study dan CPL (dihitung sebagai "mitra tanpa nama").
- Nama instansi dirapikan otomatis saat registrasi (PT/CV/SDN... huruf kapital, spasi ganda dibuang).
  Nama resmi tetap perlu dicek manual. Jangan memasang nama perusahaan asli tanpa izin tertulis.

------------------------------------------------------------------------------------------
Tracer Study (menu Jobseeker)
------------------------------------------------------------------------------------------
- HANYA GRAFIK: total alumni, sudah bekerja, belum bekerja, masa tunggu, status per tahun lulus,
  % sudah bekerja per prodi, dan % sesuai bidang. Nama alumni TIDAK dikirim ke browser.
- Nama perusahaan hanya tampil untuk mitra C-DFS yang mengizinkan (users.izin_nama = 1);
  tempat kerja lain dihitung tanpa nama. Prodi tanpa data tracer study disembunyikan.
- Data dari tabel tracer_alumni, diisi prodi/kampus dari hasil tracer study (impor lewat phpMyAdmin).
  Kolom: nama, prodi (nama persis seperti daftar prodi), tahun_lulus, status ('Bekerja' / 'Belum Bekerja'),
  perusahaan, posisi, masa_tunggu (bulan), sesuai_bidang (1/0), sumber.
- data_contoh.sql berisi 60 alumni CONTOH (fiktif, sumber = 'Data contoh'). Hapus sebelum dipakai sungguhan:
  DELETE FROM tracer_alumni WHERE sumber='Data contoh';
- Wirausaha dihitung sebagai "Sudah Bekerja".
