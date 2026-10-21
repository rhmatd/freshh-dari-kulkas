-- Jalankan jika database cdfs sudah ada sebelumnya: menambah tabel tracer study alumni.
USE cdfs;
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
