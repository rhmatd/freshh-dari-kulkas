-- Jalankan jika database cdfs sudah ada sebelumnya (setelah migrasi_kurikulum_mitra.sql).
-- Menambah peran Dosen & Admin, status akun, password wajib diganti, dan tabel pengajuan kemitraan.
USE cdfs;
ALTER TABLE users MODIFY role ENUM('Jobseeker','Jobprovider','Dosen','Admin') NOT NULL DEFAULT 'Jobseeker';
ALTER TABLE users ADD COLUMN IF NOT EXISTS aktif TINYINT(1) NOT NULL DEFAULT 1 AFTER izin_nama;
ALTER TABLE users ADD COLUMN IF NOT EXISTS wajib_ganti_pw TINYINT(1) NOT NULL DEFAULT 0 AFTER aktif;

-- Pengajuan kemitraan dari landing page (perusahaan / sekolah / instansi). Admin memeriksa lalu membuatkan akun.
CREATE TABLE IF NOT EXISTS pengajuan_mitra(
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 nama_instansi VARCHAR(190) NOT NULL,
 jenis ENUM('Perusahaan','Sekolah / Lembaga Pendidikan','Instansi Pemerintah','Lainnya') NOT NULL DEFAULT 'Perusahaan',
 email VARCHAR(190) NOT NULL,
 kontak_nama VARCHAR(120) NOT NULL,
 telepon VARCHAR(40) NOT NULL DEFAULT '',
 nib_npsn VARCHAR(60) NOT NULL DEFAULT '',     -- NIB (perusahaan) atau NPSN (sekolah)
 prodi_minat VARCHAR(150) NOT NULL DEFAULT '',
 pesan VARCHAR(600) NOT NULL DEFAULT '',
 status ENUM('Baru','Disetujui','Ditolak') NOT NULL DEFAULT 'Baru',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Akun admin awal. GANTI password saat login pertama (wajib). Email bisa diubah lewat HeidiSQL.
INSERT IGNORE INTO users(name,email,password_hash,instansi,role,wajib_ganti_pw)
VALUES('Admin C-DFS','admin@cdfs.local','$2y$12$xTH/JpOWPbFYH6MyxNtJTOyD5ZKeeEnNKGp2jTzRCl0yFB3q1WsKu','Universitas Negeri Malang','Admin',1);
