-- Jalankan jika database cdfs sudah ada sebelumnya (setelah migrasi_tracer.sql).
-- Menambah izin nama mitra (Jobprovider) dan tabel CPL / CPMK.
USE cdfs;
ALTER TABLE users ADD COLUMN IF NOT EXISTS izin_nama TINYINT(1) NOT NULL DEFAULT 0 AFTER prodi;

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
