CREATE DATABASE IF NOT EXISTS cdfs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cdfs;

CREATE TABLE IF NOT EXISTS users(
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(120) NOT NULL,email VARCHAR(190) NOT NULL UNIQUE,
 password_hash VARCHAR(255) NOT NULL,instansi VARCHAR(190) NOT NULL,
 role ENUM('Jobseeker','Jobprovider','Dosen','Admin') NOT NULL DEFAULT 'Jobseeker',   -- Jobprovider, Dosen, Admin dibuat oleh Admin
 jalur ENUM('Akademis','Vocational') NULL DEFAULT NULL,
 prodi VARCHAR(120) NULL DEFAULT NULL,
 izin_nama TINYINT(1) NOT NULL DEFAULT 0,
 aktif TINYINT(1) NOT NULL DEFAULT 1,           -- 0 = akun dinonaktifkan admin
 wajib_ganti_pw TINYINT(1) NOT NULL DEFAULT 0,  -- 1 = password sementara dari admin, wajib diganti saat login   -- Jobprovider: 1 = mengizinkan nama perusahaan ditampilkan sebagai mitra
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Kompetensi teknis & kebutuhan bahasa Jobprovider (per program studi)
CREATE TABLE IF NOT EXISTS kompetensi(
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 provider_id INT UNSIGNED NOT NULL,
 nama VARCHAR(100) NOT NULL,
 prodi VARCHAR(120) NOT NULL,
 jenis ENUM('kompetensi','bahasa') NOT NULL DEFAULT 'kompetensi',  -- kompetensi teknis atau kebutuhan bahasa
 level VARCHAR(20) NULL DEFAULT NULL,                              -- tingkat minimal bahasa: Basic/Intermediate/Advanced
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 KEY idx_komp_provider(provider_id),
 CONSTRAINT fk_komp_provider FOREIGN KEY(provider_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Lowongan kerja dari Jobprovider (menu Kelola Kompetensi > Kelola Lowongan)
CREATE TABLE IF NOT EXISTS lowongan_kerja(
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 provider_id INT UNSIGNED NOT NULL,
 posisi VARCHAR(120) NOT NULL,
 prodi VARCHAR(120) NOT NULL,
 lokasi VARCHAR(100) NULL,
 deskripsi TEXT NULL,
 kompetensi TEXT NOT NULL,   -- JSON array nama kompetensi
 bahasa TEXT NULL,           -- JSON array {nama, level} persyaratan bahasa
 status ENUM('Aktif','Ditutup') NOT NULL DEFAULT 'Aktif',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 KEY idx_lk_provider(provider_id),
 CONSTRAINT fk_lk_provider FOREIGN KEY(provider_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Kandidat (Jobseeker) yang di-shortlist oleh Jobprovider
CREATE TABLE IF NOT EXISTS shortlist_kandidat(
 provider_id INT UNSIGNED NOT NULL,
 jobseeker_id INT UNSIGNED NOT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(provider_id, jobseeker_id),
 CONSTRAINT fk_sk_provider FOREIGN KEY(provider_id) REFERENCES users(id) ON DELETE CASCADE,
 CONSTRAINT fk_sk_jobseeker FOREIGN KEY(jobseeker_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Data Job Matching milik Jobseeker (transkrip nilai, sertifikat, kemahiran bahasa; format JSON)
CREATE TABLE IF NOT EXISTS jobseeker_profil(
 user_id INT UNSIGNED PRIMARY KEY,
 transkrip MEDIUMTEXT NULL,
 sertifikat TEXT NULL,
 bahasa TEXT NULL,          -- kemahiran bahasa (JSON: nama + level)
 tampil TINYINT(1) NOT NULL DEFAULT 0,  -- 1 = Jobseeker mengizinkan profilnya dilihat perusahaan
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_jsp_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Lamaran Jobseeker ke lowongan Jobprovider
CREATE TABLE IF NOT EXISTS lamaran(
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 lowongan_id INT UNSIGNED NOT NULL,
 jobseeker_id INT UNSIGNED NOT NULL,
 status ENUM('Dikirim','Ditinjau','Diundang','Diterima','Ditolak') NOT NULL DEFAULT 'Dikirim',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 UNIQUE KEY uq_lamaran(lowongan_id, jobseeker_id),
 CONSTRAINT fk_lam_lowongan FOREIGN KEY(lowongan_id) REFERENCES lowongan_kerja(id) ON DELETE CASCADE,
 CONSTRAINT fk_lam_jobseeker FOREIGN KEY(jobseeker_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tracer study alumni (diisi prodi/kampus dari hasil tracer study; ditampilkan ke Jobseeker)
CREATE TABLE IF NOT EXISTS tracer_alumni(
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 nama VARCHAR(150) NOT NULL,
 prodi VARCHAR(150) NOT NULL,
 tahun_lulus SMALLINT NOT NULL,
 status ENUM('Bekerja','Belum Bekerja') NOT NULL,
 perusahaan VARCHAR(150) NOT NULL DEFAULT '',
 posisi VARCHAR(150) NOT NULL DEFAULT '',
 masa_tunggu TINYINT UNSIGNED NULL,      -- bulan dari lulus sampai mulai bekerja
 sesuai_bidang TINYINT(1) NULL,          -- 1 = pekerjaan sesuai bidang prodi
 sumber VARCHAR(40) NOT NULL DEFAULT 'Tracer study prodi',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 INDEX idx_tracer_prodi(prodi)
) ENGINE=InnoDB;

-- Kurikulum prodi: CPL (capaian pembelajaran lulusan) dan CPMK (capaian pembelajaran mata kuliah).
-- Diinput admin prodi dari RPS. kata_kunci = daftar kompetensi (dipisah ;) yang dipakai memetakan kebutuhan mitra ke CPMK.
CREATE TABLE IF NOT EXISTS cpl(
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 prodi VARCHAR(150) NOT NULL,
 kode VARCHAR(20) NOT NULL,
 deskripsi VARCHAR(400) NOT NULL,
 wef_pembanding VARCHAR(120) NOT NULL DEFAULT '',   -- kategori skill WEF yang dipakai sebagai pembanding
 wef_arah ENUM('naik','turun') NULL,
 sumber VARCHAR(40) NOT NULL DEFAULT 'RPS prodi',
 INDEX idx_cpl_prodi(prodi)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS cpmk(
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 cpl_id INT UNSIGNED NOT NULL,
 kode VARCHAR(20) NOT NULL,
 deskripsi VARCHAR(400) NOT NULL,
 mata_kuliah VARCHAR(150) NOT NULL,
 kata_kunci VARCHAR(400) NOT NULL DEFAULT '',
 CONSTRAINT fk_cpmk_cpl FOREIGN KEY(cpl_id) REFERENCES cpl(id) ON DELETE CASCADE
) ENGINE=InnoDB;

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
