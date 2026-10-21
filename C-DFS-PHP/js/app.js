
/* C-DFS PHP/MySQL API */
async function apiRequest(action, payload = {}) {
    try {
        const r = await fetch(`php/api.php?action=${encodeURIComponent(action)}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'same-origin',
            body: JSON.stringify(payload)
        });
        const data = await r.json();
        if (!r.ok || data.success === false) return {success: false, message: data.message || 'Permintaan gagal.'};
        return data;
    } catch (e) {
        console.warn('PHP API belum tersedia:', e.message);
        return null;
    }
}
async function cdfsLogin(email, password) { return apiRequest('login', {email, password}); }
async function cdfsRegister(user) { return apiRequest('register', user); }
async function cdfsLogout() { return apiRequest('logout'); }
async function cdfsUpdateProdi(jalur, prodi) { return apiRequest('update_prodi', {jalur, prodi}); }

/* Daftar Program Studi per Jalur Pendidikan (Jobseeker) */
const PRODI_BY_JALUR = {
    'Akademis': [
        {kode: 'PAUD', nama: 'Pendidikan Guru Pendidikan Anak Usia Dini (PGPAUD)'},
        {kode: 'PGSD', nama: 'Pendidikan Guru Sekolah Dasar (PGSD)'}
    ],
    'Vocational': [
        {kode: 'TRSE', nama: 'Teknologi Rekayasa Sistem Elektronika'},
        {kode: 'MP', nama: 'Manajemen Pemasaran'}
    ]
};

/* Seluruh program studi UM untuk pencarian. Yang sudah ada datanya di C-DFS hanya prodi di PRODI_BY_JALUR. */
const PRODI_UM = [{"fak": "FV", "fakultas": "Fakultas Vokasi", "jenjang": "D4", "jalur": "Vocational", "prodi": ["Akuntansi (D4)", "Animasi", "Desain Mode", "Manajemen Pemasaran", "Perpustakaan Digital", "Tata Boga", "Teknologi Rekayasa Manufaktur", "Teknologi Rekayasa Otomotif", "Teknologi Rekayasa Pembangkit Energi", "Teknologi Rekayasa Sistem Elektronika", "Teknologi Rekayasa dan Pemeliharaan Bangunan Sipil"]}, {"fak": "FIP", "fakultas": "Fakultas Ilmu Pendidikan", "jenjang": "S1", "jalur": "Akademis", "prodi": ["Administrasi Pendidikan", "Bimbingan dan Konseling", "Pendidikan Guru Pendidikan Anak Usia Dini (PGPAUD)", "Pendidikan Guru Sekolah Dasar (PGSD)", "Pendidikan Luar Biasa (PLB)", "Pendidikan Luar Sekolah / Pendidikan Non Formal", "Teknologi Pendidikan"]}, {"fak": "FS", "fakultas": "Fakultas Sastra", "jenjang": "S1", "jalur": "Akademis", "prodi": ["Bahasa dan Sastra Indonesia", "Bahasa dan Sastra Inggris", "Desain Komunikasi Visual (DKV)", "Ilmu Perpustakaan", "Pendidikan Bahasa Arab", "Pendidikan Bahasa Inggris", "Pendidikan Bahasa Jerman", "Pendidikan Bahasa Mandarin", "Pendidikan Bahasa, Sastra Indonesia dan Daerah", "Pendidikan Seni Rupa", "Pendidikan Seni Tari dan Musik / Pertunjukan"]}, {"fak": "FMIPA", "fakultas": "Fakultas Matematika dan IPA", "jenjang": "S1", "jalur": "Akademis", "prodi": ["Biologi", "Bioteknologi", "Fisika", "Gizi", "Kimia", "Matematika", "Pendidikan Biologi", "Pendidikan Fisika", "Pendidikan Ilmu Pengetahuan Alam (IPA)", "Pendidikan Kimia", "Pendidikan Matematika", "Sains Aktuaria"]}, {"fak": "FEB", "fakultas": "Fakultas Ekonomi dan Bisnis", "jenjang": "S1", "jalur": "Akademis", "prodi": ["Akuntansi", "Ekonomi Pembangunan", "Manajemen", "Pendidikan Administrasi Perkantoran", "Pendidikan Akuntansi", "Pendidikan Bisnis / Pendidikan Tata Niaga", "Pendidikan Ekonomi"]}, {"fak": "FT", "fakultas": "Fakultas Teknik", "jenjang": "S1", "jalur": "Akademis", "prodi": ["Arsitektur", "Pendidikan Tata Boga", "Pendidikan Tata Busana", "Pendidikan Teknik Bangunan", "Pendidikan Teknik Elektro", "Pendidikan Teknik Informatika", "Pendidikan Teknik Mesin", "Pendidikan Teknik Otomotif", "Teknik Elektro", "Teknik Industri", "Teknik Informatika", "Teknik Lingkungan", "Teknik Mesin", "Teknik Sipil"]}, {"fak": "FIK", "fakultas": "Fakultas Ilmu Keolahragaan", "jenjang": "S1", "jalur": "Akademis", "prodi": ["Ilmu Keolahragaan", "Ilmu Kesehatan Masyarakat", "Pendidikan Jasmani, Kesehatan, dan Rekreasi (PJKR)", "Pendidikan Kepelatihan Olahraga (PKO)"]}, {"fak": "FIS", "fakultas": "Fakultas Ilmu Sosial", "jenjang": "S1", "jalur": "Akademis", "prodi": ["Geografi", "Hukum", "Ilmu Komunikasi", "Ilmu Sejarah", "Pariwisata", "Pendidikan Geografi", "Pendidikan Ilmu Pengetahuan Sosial (IPS)", "Pendidikan Pancasila dan Kewarganegaraan (PPKn)", "Pendidikan Sejarah", "Pendidikan Sosiologi"]}, {"fak": "FPsi", "fakultas": "Fakultas Psikologi", "jenjang": "S1", "jalur": "Akademis", "prodi": ["Psikologi"]}, {"fak": "FK", "fakultas": "Fakultas Kedokteran", "jenjang": "S1", "jalur": "Akademis", "prodi": ["Kebidanan", "Kedokteran", "Keperawatan"]}];
const PRODI_UM_LIST = PRODI_UM.flatMap(f => f.prodi.map(nama => ({nama, fak: f.fak, fakultas: f.fakultas, jenjang: f.jenjang, jalur: f.jalur})));

/* Profil kompetensi inti tiap prodi — dasar skor kecocokan kandidat (sesuaikan dengan CPL prodi) */
const PRODI_SKILLS = {
    'Pendidikan Guru Pendidikan Anak Usia Dini (PGPAUD)': ['Perencanaan Pembelajaran PAUD', 'Psikologi Perkembangan Anak', 'Asesmen Perkembangan Anak', 'Kemitraan Orang Tua', 'Media Pembelajaran', 'Manajemen Kelas'],
    'Pendidikan Guru Sekolah Dasar (PGSD)': ['Perencanaan Pembelajaran SD', 'Asesmen Pembelajaran', 'Manajemen Kelas', 'Media Pembelajaran', 'Pendidikan Inklusif', 'Perkembangan Peserta Didik'],
    'Teknologi Rekayasa Sistem Elektronika': ['Rangkaian Elektronika', 'Mikrokontroler', 'Internet of Things (IoT)', 'PLC & Otomasi', 'Troubleshooting Perangkat', 'Desain PCB', 'Instrumentasi'],
    'Manajemen Pemasaran': ['Digital Marketing', 'Riset Pasar', 'Penjualan (Sales)', 'Branding', 'Komunikasi Pemasaran', 'Manajemen Media Sosial', 'Negosiasi']
};

document.addEventListener('DOMContentLoaded', function() {
            // Teks grafik hitam agar mudah dibaca
            if (window.Chart) { Chart.defaults.color = '#0b1220'; Chart.defaults.font.family = 'Inter, sans-serif'; }

            // ==============================================================
            // 1. CHART.JS – Grafik di Landing (gapChart)
            // ==============================================================
            // (grafik contoh di landing kini berupa batang HTML statis berlabel sumber WEF)

            // ==============================================================
            // 2. DATE PICKER – Batas 7 hari
            // ==============================================================
            function setupDatePickers() {
                const today = new Date();
                const sevenDaysAgo = new Date(today);
                sevenDaysAgo.setDate(today.getDate() - 7);

                const formatDate = (d) => d.toISOString().split('T')[0];
                const minDate = formatDate(sevenDaysAgo);
                const maxDate = formatDate(today);

                document.querySelectorAll('input[type="date"]').forEach(input => {
                    input.setAttribute('min', minDate);
                    input.setAttribute('max', maxDate);
                    if (input.id.includes('Start') || input.id.includes('start') || input.id === 'industriDate') {
                        input.value = formatDate(sevenDaysAgo);
                    } else if (input.id.includes('End') || input.id.includes('end')) {
                        input.value = formatDate(today);
                    } else {
                        input.value = formatDate(today);
                    }
                });

                document.querySelectorAll('.date-picker').forEach(picker => {
                    const inputs = picker.querySelectorAll('input[type="date"]');
                    if (inputs.length === 2) {
                        const startInput = inputs[0];
                        const endInput = inputs[1];
                        startInput.addEventListener('change', function() {
                            if (this.value > endInput.value) {
                                endInput.value = this.value;
                            }
                        });
                        endInput.addEventListener('change', function() {
                            if (this.value < startInput.value) {
                                startInput.value = this.value;
                            }
                        });
                    }
                });
            }
            setupDatePickers();

            // ==============================================================
            // 3. TOAST NOTIFICATION
            // ==============================================================
            function showToast(message) {
                const toast = document.getElementById('toast');
                document.getElementById('toastMessage').textContent = message;
                toast.classList.add('show');
                clearTimeout(toast._timeout);
                toast._timeout = setTimeout(() => {
                    toast.classList.remove('show');
                }, 3000);
            }

            // ==============================================================
            // 4. DOWNLOAD FUNGSI
            // ==============================================================
            function downloadFile(content, filename, mimeType) {
                const blob = new Blob([content], { type: mimeType + ';charset=utf-8' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
            }

            // ==============================================================
            // 5. TOGGLE LANDING / AUTH / DASHBOARD
            // ==============================================================
            const landingContainer = document.getElementById('landingContainer');
            const authContainer = document.getElementById('authContainer');
            const dashboardContainer = document.getElementById('dashboardContainer');

            function showLanding() {
                landingContainer.classList.remove('hidden');
                authContainer.classList.remove('active');
                dashboardContainer.classList.remove('active');
                setMode('register');
                document.getElementById('global-stepper').classList.remove('hidden-stepper');
                document.querySelectorAll('.user-profile').forEach(el => el.classList.remove('show'));
            }

            function showAuth() {
                landingContainer.classList.add('hidden');
                authContainer.classList.add('active');
                dashboardContainer.classList.remove('active');
                setMode('register');
                document.querySelectorAll('.user-profile').forEach(el => el.classList.remove('show'));
            }

            function showDashboard() {
                landingContainer.classList.add('hidden');
                authContainer.classList.remove('active');
                dashboardContainer.classList.add('active');
                applyRoleLayout();
                setTimeout(isiMenuProfil, 0);
                initDashboardCharts();
                setTimeout(jalankanAnimasiAngka, 200);
                const name = sessionStorage.getItem('c-dfs_user_name') || 'Admin PT';
                document.querySelectorAll('.user-name').forEach(el => el.textContent = name);
                document.querySelectorAll('.user-profile').forEach(el => el.classList.remove('show'));
                setupDatePickers();
                renderJobseekerDashboard();
            }

            document.getElementById('landingLoginBtn').addEventListener('click', showAuth);
            document.querySelectorAll('.ld-go-register').forEach(b => b.addEventListener('click', showAuth));
            document.querySelectorAll('.ld-go-login').forEach(b => b.addEventListener('click', () => { showAuth(); setMode('login'); }));
            document.getElementById('backToLandingBtn').addEventListener('click', showLanding);

            // ==============================================================
            // 6. AUTH STATE & NAVIGATION
            // ==============================================================
            const state = {
                currentStep: 1,
                mode: 'register',
                name: '',
                email: '',
                instansi: '',
                role: 'Jobseeker',
                jalur: '',
                prodi: ''
            };
            const TOTAL_STEPS = 2; // 1 Data diri (nama, email UM, password), 2 Akun siap. Registrasi khusus mahasiswa UM.

            const btnBack = document.getElementById('btn-back');
            const stepperEl = document.getElementById('global-stepper');

            function goToStep(stepNumber) {
                state.currentStep = stepNumber;
                document.querySelectorAll('.auth-mode-content').forEach(el => el.classList.remove('active'));
                const target = document.getElementById(`view-step-${stepNumber}`);
                if (target) target.classList.add('active');

                for (let i = 1; i <= TOTAL_STEPS; i++) {
                    const indicator = document.getElementById(`step-indicator-${i}`);
                    if (!indicator) continue;
                    const circle = indicator.querySelector('.v-step-circle');
                    if (i < stepNumber || (stepNumber === TOTAL_STEPS && i === TOTAL_STEPS)) {
                        indicator.className = 'v-step completed';
                        circle.innerHTML = '<i class="fa-solid fa-check"></i>';
                    } else if (i === stepNumber) {
                        indicator.className = 'v-step active';
                        circle.innerText = i;
                    } else {
                        indicator.className = 'v-step';
                        circle.innerText = i;
                    }
                }

                if (stepNumber === 1 || stepNumber === TOTAL_STEPS) btnBack.style.visibility = 'hidden';
                else btnBack.style.visibility = 'visible';
            }

            function setMode(mode) {
                state.mode = mode;
                document.querySelectorAll('.auth-mode-content').forEach(el => el.classList.remove('active'));

                if (mode === 'login') {
                    document.getElementById('view-login').classList.add('active');
                    stepperEl.classList.add('hidden-stepper');
                    btnBack.style.visibility = 'hidden';
                } else {
                    stepperEl.classList.remove('hidden-stepper');
                    goToStep(1);
                }
            }

            document.getElementById('switchToLogin').addEventListener('click', (e) => {
                e.preventDefault();
                setMode('login');
            });
            document.getElementById('switchToRegister').addEventListener('click', (e) => {
                e.preventDefault();
                setMode('register');
            });

            btnBack.addEventListener('click', () => {
                if (state.mode === 'register' && state.currentStep > 1 && state.currentStep < TOTAL_STEPS) {
                    goToStep(state.currentStep - 1);
                }
            });

            // ---------- Registrasi mahasiswa (email UM + password sendiri) ----------
            document.getElementById('formRegister').addEventListener('submit', async function(e) {
                e.preventDefault();
                state.name = document.getElementById('regName').value.trim();
                state.email = document.getElementById('userEmail').value.trim().toLowerCase();
                const pw = document.getElementById('regPassword').value, pw2 = document.getElementById('regPassword2').value;
                if (!state.name || !state.email || !pw) return alert('Harap isi semua field.');
                if (pw !== pw2) return alert('Ulangi password belum sama.');
                if (pw.length < 8 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return alert('Password minimal 8 karakter dan memuat huruf serta angka.');
                const btn = this.querySelector('button[type=submit]'); btn.disabled = true;
                const result = await cdfsRegister({name: state.name, email: state.email, password: pw});
                btn.disabled = false;
                if (result && result.success === false) return alert(result.message || 'Registrasi gagal.');
                state.role = 'Jobseeker'; state.instansi = 'Universitas Negeri Malang'; state.jalur = ''; state.prodi = '';
                saveSession({name: state.name, email: state.email, instansi: state.instansi, role: 'Jobseeker', jalur: '', prodi: ''});
                document.getElementById('regSummary').innerHTML = result ? `Akun: <strong>${escHtml(state.email)}</strong>` : 'Mode demo (server belum aktif): data hanya tersimpan di browser.';
                goToStep(2);
            });

            function saveSession(u) {
                sessionStorage.setItem('c-dfs_user_name', u.name || '');
                sessionStorage.setItem('c-dfs_user_email', u.email || '');
                sessionStorage.setItem('c-dfs_user_instansi', u.instansi || '');
                sessionStorage.setItem('c-dfs_user_role', u.role || '');
                sessionStorage.setItem('c-dfs_user_jalur', u.jalur || '');
                sessionStorage.setItem('c-dfs_user_prodi', u.prodi || '');
            }

            // ---------- Antarmuka Jobseeker di Dashboard: pencarian jalur & prodi ----------
            const jobseekerDashCard = document.getElementById('jobseekerDashCard');
            const dashProdiBadge = document.getElementById('dashProdiBadge');
            const escHtml = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

            // Komponen pencarian (combobox) sederhana yang bisa dipakai ulang
            function createSearchPick(rootId, getOptions, onSelect, onClear, emptyMsg) {
                const root = document.getElementById(rootId);
                const input = root.querySelector('input');
                const list = root.querySelector('.search-pick-list');
                let items = [], hl = 0, selected = null;
                const mark = (text, q) => {
                    if (!q) return escHtml(text);
                    const i = text.toLowerCase().indexOf(q.toLowerCase());
                    return i < 0 ? escHtml(text) : escHtml(text.slice(0, i)) + '<mark>' + escHtml(text.slice(i, i + q.length)) + '</mark>' + escHtml(text.slice(i + q.length));
                };
                function render() {
                    const q = (selected && input.value === selected.label) ? '' : input.value.trim();
                    items = getOptions().filter(o => !q || (o.label + ' ' + (o.code || '') + ' ' + (o.group || '')).toLowerCase().includes(q.toLowerCase()));
                    hl = Math.min(hl, Math.max(0, items.length - 1));
                    list.innerHTML = items.length ? items.map((o, i) => `
                        <li role="option" data-i="${i}" class="${i === hl ? 'hl' : ''}" aria-selected="${selected && selected.value === o.value}">
                            ${o.code ? `<span class="code">${mark(o.code, q)}</span>` : ''}<span>${mark(o.label, q)}</span>${o.group ? `<span class="grp">${escHtml(o.group)}</span>` : ''}
                        </li>`).join('') : `<li class="empty">${emptyMsg ? emptyMsg(q) : 'Tidak ditemukan'}</li>`;
                }
                const open = () => { render(); root.classList.add('open'); input.setAttribute('aria-expanded', 'true'); };
                const close = () => { root.classList.remove('open'); input.setAttribute('aria-expanded', 'false'); if (selected) input.value = selected.label; else input.value = ''; };
                function choose(o) {
                    selected = o; input.value = o.label; root.classList.add('has-value');
                    root.classList.remove('open'); input.blur(); onSelect(o);
                }
                input.addEventListener('focus', () => { input.select(); open(); });
                input.addEventListener('input', () => { hl = 0; open(); });
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'ArrowDown') { e.preventDefault(); hl = Math.min(hl + 1, items.length - 1); render(); }
                    else if (e.key === 'ArrowUp') { e.preventDefault(); hl = Math.max(hl - 1, 0); render(); }
                    else if (e.key === 'Enter') { e.preventDefault(); if (items[hl]) choose(items[hl]); }
                    else if (e.key === 'Escape') { close(); input.blur(); }
                });
                list.addEventListener('mousedown', (e) => {
                    const li = e.target.closest('li[data-i]');
                    if (li) { e.preventDefault(); choose(items[+li.dataset.i]); }
                });
                input.addEventListener('blur', () => setTimeout(close, 120));
                root.querySelector('.search-pick-clear').addEventListener('click', () => {
                    selected = null; input.value = ''; root.classList.remove('has-value'); onClear && onClear();
                });
                return {
                    set(value) {
                        selected = getOptions().find(o => o.value === value) || null;
                        input.value = selected ? selected.label : '';
                        root.classList.toggle('has-value', !!selected);
                    }
                };
            }

            const jalurOptions = () => Object.keys(PRODI_BY_JALUR).map(j => ({value: j, label: j, group: `${PRODI_UM_LIST.filter(p => p.jalur === j).length} prodi · ${PRODI_BY_JALUR[j].length} tercakup`}));
            const prodiOptions = () => {
                const jalur = sessionStorage.getItem('c-dfs_user_jalur') || '';
                // Prodi yang sudah tercakup di atas, sisanya prodi UM lain (belum tercakup)
                const ada = (n) => Object.values(PRODI_BY_JALUR).some(l => l.some(x => x.nama === n));
                return PRODI_UM_LIST.filter(p => !jalur || p.jalur === jalur)
                    .map(p => ({value: p.nama, label: p.nama, jalur: p.jalur, code: ada(p.nama) ? kodeProdi(p.nama) : p.jenjang,
                        group: `${p.fak} · ${ada(p.nama) ? 'tercakup' : 'belum tercakup'}`, ada: ada(p.nama)}))
                    .sort((a, b) => b.ada - a.ada);
            };
            async function saveProdiChoice() {
                const jalur = sessionStorage.getItem('c-dfs_user_jalur') || '';
                const prodi = sessionStorage.getItem('c-dfs_user_prodi') || '';
                dashProdiBadge.textContent = prodi ? `${jalur} · ${prodi}` : (jalur ? `${jalur} · pilih prodi` : 'Belum dipilih');
                renderJalurInfo();
                if (jalur && prodi) {
                    await cdfsUpdateProdi(jalur, prodi);
                    showToast(`Program Studi: ${prodi}`);
                }
                if (typeof jmRefreshStats === 'function') jmRefreshStats();
                if (JM.loaded) jsRenderDash();
            }
            const pickJalur = createSearchPick('pickJalur', jalurOptions, (o) => {
                const prev = sessionStorage.getItem('c-dfs_user_jalur');
                sessionStorage.setItem('c-dfs_user_jalur', o.value);
                const prodi = sessionStorage.getItem('c-dfs_user_prodi');
                if (prev !== o.value && prodi && !(PRODI_BY_JALUR[o.value] || []).some(p => p.nama === prodi)) {
                    sessionStorage.setItem('c-dfs_user_prodi', '');
                    pickProdi.set('');
                }
                saveProdiChoice();
                setTimeout(() => document.getElementById('pickProdiInput').focus(), 60);
            }, () => {
                sessionStorage.setItem('c-dfs_user_jalur', '');
                sessionStorage.setItem('c-dfs_user_prodi', '');
                pickProdi.set('');
                saveProdiChoice();
            });
            const pickProdi = createSearchPick('pickProdi', prodiOptions, (o) => {
                sessionStorage.setItem('c-dfs_user_jalur', o.jalur);   // jalur otomatis mengikuti prodi
                sessionStorage.setItem('c-dfs_user_prodi', o.value);
                pickJalur.set(o.jalur);
                saveProdiChoice();
            }, () => {
                sessionStorage.setItem('c-dfs_user_prodi', '');
                saveProdiChoice();
            }, (q) => `<strong>"${escHtml(q)}" tidak ditemukan di daftar prodi UM.</strong><br>Prodi yang sudah tercakup C-DFS: ${PRODI_TERCAKUP_TXT}.`);

            // ---------- Penjelasan jalur pendidikan & prodi ----------
            const PRODI_TERCAKUP_TXT = 'TRSE, Manajemen Pemasaran (Vokasi), PGSD, dan PG-PAUD (Akademis)';
            const prodiTercakup = (p) => Object.values(PRODI_BY_JALUR).some(l => l.some(x => x.nama === p));
            const JALUR_INFO = {
                Akademis: {judul: 'Akademis · Sarjana (S1)', ikon: 'fa-book',
                    isi: 'Menekankan penguasaan teori, konsep keilmuan, dan riset. Lulusan bergelar Sarjana dan dapat melanjutkan ke S2. Cocok untuk karier sebagai pendidik, analis, atau peneliti.'},
                Vocational: {judul: 'Vokasi · Sarjana Terapan (D4)', ikon: 'fa-screwdriver-wrench',
                    isi: 'Menekankan keterampilan praktik sesuai kebutuhan dunia kerja, dengan porsi praktikum, proyek, dan magang industri yang besar. Lulusan bergelar Sarjana Terapan dan dapat melanjutkan ke S2 Terapan.'}
            };
            const PRODI_INFO = {
                'Teknologi Rekayasa Sistem Elektronika': {fokus: 'rangkaian elektronika, sistem tertanam & IoT, kendali dan instrumentasi', karier: 'teknisi IoT, embedded system engineer, teknisi otomasi & instrumentasi'},
                'Manajemen Pemasaran': {fokus: 'strategi & komunikasi pemasaran, pemasaran digital, penjualan, riset pasar', karier: 'digital marketing staff, sales executive, analis riset pasar'},
                'Pendidikan Guru Pendidikan Anak Usia Dini (PGPAUD)': {fokus: 'perencanaan pembelajaran berbasis bermain, asesmen tumbuh kembang, media ajar anak', karier: 'guru TK / PAUD, fasilitator tumbuh kembang, pengasuh daycare'},
                'Pendidikan Guru Sekolah Dasar (PGSD)': {fokus: 'perencanaan & asesmen pembelajaran SD, pengelolaan kelas, pendidikan inklusif', karier: 'guru kelas SD, guru pendamping inklusi, pengembang media ajar',
                    catatan: 'Mitra PGSD disebut mitra / pengguna lulusan (sekolah, bimbingan belajar, penerbit), bukan industri.'}
            };
            function renderJalurInfo() {
                const box = document.getElementById('jalurInfo');
                if (!box) return;
                const jalur = sessionStorage.getItem('c-dfs_user_jalur') || '';
                const raw = sessionStorage.getItem('c-dfs_user_prodi') || '';
                const prodi = prodiTercakup(raw) ? raw : '';
                const pi = PRODI_INFO[prodi];
                box.innerHTML = raw && !prodi ? `<p class="jalur-warn"><i class="fa-solid fa-circle-exclamation"></i> Prodi <strong>${escHtml(raw)}</strong> sudah terdaftar, tetapi <strong>belum tercakup</strong> C-DFS (lowongan mitra, CPL, dan tracer study). Prodi yang sudah tercakup: ${PRODI_TERCAKUP_TXT}.</p>` : '';
            }

            function renderJobseekerDashboard() {
                const role = sessionStorage.getItem('c-dfs_user_role') || '';
                const isJobseeker = role === 'Jobseeker';
                jobseekerDashCard.classList.toggle('is-hidden', !isJobseeker);
                if (!isJobseeker) return;
                const jalur = sessionStorage.getItem('c-dfs_user_jalur') || '';
                const prodi = sessionStorage.getItem('c-dfs_user_prodi') || '';
                pickJalur.set(jalur);
                pickProdi.set(prodi);
                dashProdiBadge.textContent = prodi ? `${jalur} · ${prodi}` : (jalur ? `${jalur} · pilih prodi` : 'Belum dipilih');
                renderJalurInfo();
                if (JM.loaded) jsRenderDash();
            }

            document.getElementById('formLogin').addEventListener('submit', async function(e) {
                e.preventDefault();
                const email = document.getElementById('loginEmail').value.trim();
                const pass = document.getElementById('loginPassword').value.trim();
                if (!email || !pass) {
                    alert('Harap isi email dan kata sandi.');
                    return;
                }
                const result = await cdfsLogin(email, pass);
                if (result && result.success === false) {
                    alert(result.message || 'Email atau kata sandi salah.');
                    return;
                }
                const u = result?.user || {};
                saveSession({name: u.name || email.split('@')[0], email: u.email || email,
                    instansi: u.instansi || '', role: u.role || 'Jobseeker',
                    jalur: u.jalur || '', prodi: u.prodi || ''});
                showDashboard();
                if (u.wajib_ganti_pw) setTimeout(() => bukaGantiPassword(true), 300);
            });

            document.querySelector('.forgot-link').addEventListener('click', (e) => { e.preventDefault(); showToast('Lupa password? Hubungi admin C-DFS (Pusat Karier / unit kerja sama UM).'); });

            // ---------- Coba Demo (tanpa daftar) ----------
            // Dengan XAMPP + database/data_contoh.sql: masuk ke akun contoh. Tanpa itu: mode demo dengan data contoh di browser.
            const DEMO_AKUN = {
                Jobseeker: {email: 'rani.trse@contoh.ac.id', name: 'Rani Kusumawati (Contoh)', instansi: 'Universitas Negeri Malang', jalur: 'Vocational', prodi: 'Teknologi Rekayasa Sistem Elektronika'},
                Jobprovider: {email: 'hr@elektra.contoh.co.id', name: 'HR Elektra (Contoh)', instansi: 'PT Elektra Nusantara (Contoh)', jalur: '', prodi: ''}
            };
            document.querySelectorAll('.ld-demo').forEach(btn => btn.addEventListener('click', async () => {
                const role = btn.dataset.demo, akun = DEMO_AKUN[role];
                btn.disabled = true;
                try {
                    const res = await cdfsLogin(akun.email, 'CDFS@12345');
                    if (res && res.success && res.user) {
                        const u = res.user;
                        saveSession({name: u.name, email: u.email, instansi: u.instansi || '', role: u.role, jalur: u.jalur || '', prodi: u.prodi || ''});
                    } else {
                        // Server/akun contoh tidak tersedia: jalankan mode demo di browser
                        saveSession({...akun, role});
                    }
                    showDashboard();
                    showToast(res && res.success ? `Masuk sebagai akun demo ${role}` : 'Mode demo: memakai data contoh (fiktif)');
                    window.scrollTo(0, 0);
                } finally { btn.disabled = false; }
            }));

            document.getElementById('gotoDashboardBtn').addEventListener('click', function() {
                showDashboard();
            });

            // ==============================================================
            // 7. DROPDOWN LOGOUT
            // ==============================================================
            document.querySelectorAll('.user-profile').forEach(profile => {
                profile.addEventListener('click', (e) => { if (e.target.closest('.dropdown-menu')) return; e.stopPropagation(); const buka = !profile.classList.contains('show'); document.querySelectorAll('.user-profile').forEach(x => x.classList.remove('show')); profile.classList.toggle('show', buka); });
                profile.setAttribute('title', 'Kelola profil');
                return;
                const chevron = profile.querySelector('.fa-chevron-down');
                if (chevron) {
                    chevron.addEventListener('click', function(e) {
                        e.stopPropagation();
                        profile.classList.toggle('show');
                    });
                }
                const avatar = profile.querySelector('.avatar');
                const nameSpan = profile.querySelector('.user-name');
                if (avatar) avatar.addEventListener('click', function(e) { e.stopPropagation();
                    profile.classList.toggle('show'); });
                if (nameSpan) nameSpan.addEventListener('click', function(e) { e.stopPropagation();
                    profile.classList.toggle('show'); });
            });

            document.addEventListener('click', function() {
                document.querySelectorAll('.user-profile').forEach(el => el.classList.remove('show'));
            });

            document.querySelectorAll('.logout-btn, #logoutBtn').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    sessionStorage.removeItem('c-dfs_user_name');
                    sessionStorage.removeItem('c-dfs_user_email');
                    sessionStorage.removeItem('c-dfs_user_instansi');
                    sessionStorage.removeItem('c-dfs_user_role');
                    sessionStorage.removeItem('c-dfs_user_jalur');
                    sessionStorage.removeItem('c-dfs_user_prodi');
                    cdfsLogout();
                    JM.loaded = false; JM.lamaran = []; fsMode = null; DASH.mode = null; DASH.pilihan = false; fsKey = ''; if (fsChart) { fsChart.destroy(); fsChart = null; } PR.loaded = false; PR.prodi = ''; PR.reqProdi = null; GK.loaded = false; GK.mode = null; GK.pilihan = false; GK.key = ''; if (GK.chart) { GK.chart.destroy(); GK.chart = null; } TR.loaded = false; TR.mode = null; TR.tahun = ''; CP.loaded = false; CP.prodi = null; ADM.data = null;
                    delete document.body.dataset.role;
                    showLanding();
                    document.querySelectorAll('.user-profile').forEach(el => el.classList.remove('show'));
                });
            });

            // ==============================================================
            // 8. DASHBOARD CHARTS
            // ==============================================================
            let dashboardChartsInited = false;

            function initDashboardCharts() {
                if (dashboardChartsInited) return;
                dashboardChartsInited = true;

                // (grafik statis lama dihapus; tren skill kini di kartu Dashboard)
            }

            // ==============================================================
            // 9. ANIMASI ANGKA STATISTIK
            // ==============================================================
            function jalankanAnimasiAngka() {
                const statValues = document.querySelectorAll('.view-section.active .num-animate');
                statValues.forEach(stat => {
                    let textNode = stat.childNodes[0];
                    let text = textNode.nodeValue;
                    if (!text) return;

                    let isCurrency = text.includes('Rp');
                    let isPercent = text.includes('%');
                    let isDecimal = text.includes(',');

                    let endValue = parseFloat(text.replace(/[^0-9,]/g, '').replace(',', '.'));

                    if (!isNaN(endValue)) {
                        let startTime = null;
                        const step = (timestamp) => {
                            if (!startTime) startTime = timestamp;
                            const progress = Math.min((timestamp - startTime) / 1000, 1);
                            const easeOutQuad = progress * (2 - progress);
                            let currentVal = easeOutQuad * endValue;

                            let formattedVal = "";
                            if (isDecimal) {
                                formattedVal = currentVal.toFixed(1).replace('.', ',');
                            } else {
                                formattedVal = Math.floor(currentVal).toLocaleString('id-ID');
                            }

                            textNode.nodeValue = (isCurrency ? 'Rp ' : '') + formattedVal + (isPercent ? '%' :
                                '') + " ";

                            if (progress < 1) window.requestAnimationFrame(step);
                            else {
                                textNode.nodeValue = (isCurrency ? 'Rp ' : '') + (isDecimal ? endValue.toFixed(
                                    1).replace('.', ',') : endValue.toLocaleString('id-ID')) + (
                                    isPercent ? '%' : '') + " ";
                            }
                        };
                        window.requestAnimationFrame(step);
                    }
                });
            }

            // ==============================================================
            // 10. NAVIGASI MENU DASHBOARD
            // ==============================================================
            const navItems = document.querySelectorAll('.sidebar-nav .nav-item[data-target]');
            const viewSections = document.querySelectorAll('.view-section');

            navItems.forEach(item => {
                item.addEventListener('click', function(e) {
                    e.preventDefault();
                    document.querySelectorAll('.sidebar-nav .nav-item').forEach(nav => nav.classList.remove(
                    'active'));
                    this.classList.add('active');

                    viewSections.forEach(section => section.classList.remove('active'));

                    const targetId = this.getAttribute('data-target');
                    document.getElementById(targetId).classList.add('active');

                    jalankanAnimasiAngka();
                    document.querySelectorAll('.user-profile').forEach(el => el.classList.remove('show'));
                });
            });

            // ==============================================================
            // 12. ANTARMUKA JOBPROVIDER
            //     Ringkasan · Kelola Kompetensi (Kompetensi & Bahasa, Kelola Lowongan) · Kandidat
            // ==============================================================
            const JP_DEMO_KEY = 'c-dfs_jp_demo_v3';
            const JP = { demo: false, kompetensi: [], lowongan: [], shortlist: [], candidates: [], lamaran: [], kompTab: 'teknis', lowFilter: 'semua',
                form: { komp: [], bahasa: [] } };

            const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
            const allProdi = () => Object.entries(PRODI_BY_JALUR).flatMap(([jalur, list]) => list.map(p => ({...p, jalur})));
            const prodiKode = (nama) => nama === SEMUA_PRODI ? 'Semua prodi' : ((allProdi().find(p => p.nama === nama) || {}).kode || nama);
            const SEMUA_PRODI = 'Semua Prodi';   // lowongan umum: tidak menyebut prodi tertentu
            const prodiOptionsHtml = () => allProdi().map(p => `<option value="${esc(p.nama)}">${esc(p.kode)} — ${esc(p.nama)}</option>`).join('');
            const isBahasa = (k) => k.jenis === 'bahasa';
            const langLabel = (b) => `Bahasa ${b.nama} · min. ${b.level}`;

            // Kandidat contoh hanya dipakai saat PHP/MySQL belum aktif (mode demo)
            const JP_DEMO_CANDIDATES = [
                {id: 'd1', name: 'Alya Rahma', instansi: 'Universitas Negeri Malang', jalur: 'Vocational', prodi: 'Teknologi Rekayasa Sistem Elektronika', mk: [], cert: [], bahasa: [{nama: 'Inggris', level: 'Advanced'}]},
                {id: 'd2', name: 'Bima Pratama', instansi: 'Universitas Negeri Malang', jalur: 'Vocational', prodi: 'Teknologi Rekayasa Sistem Elektronika', mk: [], cert: [], bahasa: [{nama: 'Inggris', level: 'Basic'}]},
                {id: 'd3', name: 'Citra Lestari', instansi: 'Universitas Negeri Malang', jalur: 'Vocational', prodi: 'Manajemen Pemasaran', mk: [], cert: [], bahasa: [{nama: 'Inggris', level: 'Intermediate'}]},
                {id: 'd4', name: 'Dimas Saputra', instansi: 'Universitas Negeri Malang', jalur: 'Vocational', prodi: 'Manajemen Pemasaran', mk: [], cert: [], bahasa: []},
                {id: 'd5', name: 'Eka Wulandari', instansi: 'Universitas Negeri Malang', jalur: 'Akademis', prodi: 'Pendidikan Guru Pendidikan Anak Usia Dini (PGPAUD)', mk: [], cert: [], bahasa: [{nama: 'Jepang', level: 'Intermediate'}]},
                {id: 'd6', name: 'Fajar Nugroho', instansi: 'Universitas Negeri Malang', jalur: 'Akademis', prodi: 'Pendidikan Guru Pendidikan Anak Usia Dini (PGPAUD)', mk: [], cert: [], bahasa: []},
                {id: 'd7', name: 'Gita Anjani', instansi: 'Universitas Negeri Malang', jalur: 'Akademis', prodi: 'Pendidikan Guru Sekolah Dasar (PGSD)', mk: [], cert: [], bahasa: [{nama: 'Inggris', level: 'Intermediate'}]},
                {id: 'd8', name: 'Hana Puspita', instansi: 'Universitas Negeri Malang', jalur: 'Akademis', prodi: 'Pendidikan Guru Sekolah Dasar (PGSD)', mk: [], cert: [], bahasa: []}
            ];

            function jpSaveDemo() {
                try { sessionStorage.setItem(JP_DEMO_KEY, JSON.stringify({kompetensi: JP.kompetensi, lowongan: JP.lowongan, shortlist: JP.shortlist, izinNama: !!JP.izinNama})); } catch (e) {}
            }
            async function jpLoad() {
                const res = await apiRequest('jp_bootstrap');
                if (res && res.success) {
                    JP.demo = false;
                    JP.kompetensi = res.kompetensi || [];
                    JP.lowongan = res.lowongan || [];
                    JP.shortlist = (res.shortlist || []).map(String);
                    JP.candidates = res.candidates || [];
                    JP.lamaran = res.lamaran || [];
                    JP.aiEnabled = !!res.ai_enabled;
                    JP.izinNama = !!res.izin_nama;
                } else {
                    JP.demo = true;
                    let saved = {};
                    try { saved = JSON.parse(sessionStorage.getItem(JP_DEMO_KEY) || '{}'); } catch (e) {}
                    JP.kompetensi = saved.kompetensi || [];
                    JP.lowongan = saved.lowongan || [];
                    JP.shortlist = saved.shortlist || [];
                    JP.candidates = JP_DEMO_CANDIDATES;
                    JP.lamaran = [];
                    JP.izinNama = !!saved.izinNama;
                }
                jpRenderIzin();
                jpRenderProfil();
            }
            // Izin nama mitra: nama perusahaan hanya tampil ke mahasiswa (tracer, CPL) bila diizinkan
            function jpRenderIzin() {
                const cb = document.getElementById('jpIzinNama');
                if (!cb) return;
                cb.checked = !!JP.izinNama;
                const st = document.getElementById('jpIzinState');
                st.textContent = JP.izinNama ? 'Diizinkan' : 'Belum diizinkan';
                st.classList.toggle('on', !!JP.izinNama);
            }
            document.getElementById('jpIzinNama').addEventListener('change', async (e) => {
                const v = e.target.checked;
                if (JP.demo) { JP.izinNama = v; try { const d = JSON.parse(sessionStorage.getItem(JP_DEMO_KEY) || '{}'); d.izinNama = v; sessionStorage.setItem(JP_DEMO_KEY, JSON.stringify(d)); } catch (er) {} }
                else {
                    const res = await apiRequest('jp_izin_nama', {izin: v});
                    if (!res || !res.success) { e.target.checked = !v; showToast((res && res.message) || 'Gagal menyimpan izin.'); return; }
                    JP.izinNama = !!res.izin_nama;
                }
                jpRenderIzin();
                showToast(v ? 'Nama perusahaan boleh ditampilkan sebagai mitra' : 'Nama perusahaan tidak ditampilkan');
            });

            // ---------- Pemilih bahasa (dipakai di Kompetensi & Lowongan) ----------
            function setupLangPicker(prefix) {
                const st = {lang: 'Inggris', level: 'Intermediate'};
                const other = document.getElementById(prefix + 'LangOther');
                document.querySelectorAll(`#${prefix}LangPick .seg-btn`).forEach(b => b.addEventListener('click', () => {
                    st.lang = b.dataset.lang;
                    document.querySelectorAll(`#${prefix}LangPick .seg-btn`).forEach(x => x.classList.toggle('active', x === b));
                    other.classList.toggle('is-hidden', st.lang !== '__lain');
                    if (st.lang === '__lain') other.focus();
                }));
                document.querySelectorAll(`#${prefix}LangLevel .seg-btn`).forEach(b => b.addEventListener('click', () => {
                    st.level = b.dataset.level;
                    document.querySelectorAll(`#${prefix}LangLevel .seg-btn`).forEach(x => x.classList.toggle('active', x === b));
                }));
                return {
                    value() {
                        let nama = st.lang === '__lain' ? other.value.trim() : st.lang;
                        nama = nama.replace(/^bahasa\s+/i, '').replace(/\s+/g, ' ').slice(0, 40);
                        if (!nama) { other.focus(); showToast('Tulis nama bahasanya terlebih dahulu'); return null; }
                        return {nama: nama.charAt(0).toUpperCase() + nama.slice(1), level: st.level};
                    },
                    reset() { other.value = ''; },
                    onEnter(fn) { other.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); fn(); } }); }
                };
            }
            const sameLang = (a, b) => String(a).toLowerCase().replace(/^bahasa\s+/, '').trim() === String(b).toLowerCase().replace(/^bahasa\s+/, '').trim();

            // ---------- Kebutuhan (requirement) untuk penilaian kandidat ----------
            function reqFromKompetensi() {
                return {
                    kompetensi: JP.kompetensi.filter(k => !isBahasa(k)).map(k => k.nama),
                    bahasa: JP.kompetensi.filter(isBahasa).map(k => ({nama: k.nama, level: k.level})),
                    prodi: [...new Set(JP.kompetensi.map(k => k.prodi))]
                };
            }
            const reqFromLowongan = (l) => ({kompetensi: l.kompetensi || [], bahasa: l.bahasa || [], prodi: l.prodi === SEMUA_PRODI ? allProdi().map(p => p.nama) : [l.prodi]});
            function jpCurrentReq() {
                const sel = document.getElementById('jpFilterLowongan').value;
                const low = JP.lowongan.find(l => String(l.id) === sel);
                return low ? reqFromLowongan(low) : reqFromKompetensi();
            }
            function jpMatch(cand, req) {
                const prof = {prodi: cand.prodi, mk: cand.mk || [], cert: cand.cert || [], bahasa: cand.bahasa || []};
                const detail = evalReq(req, prof, true);
                const total = detail.length;
                const prodiOk = req.prodi.includes(cand.prodi);
                const avg = total ? detail.reduce((a, d) => a + d.v, 0) / total : 0;
                const score = total ? Math.round((prodiOk ? 40 : 0) + 60 * avg) : 0;
                return {score, prodiOk, detail, hit: detail.filter(d => d.v >= 0.5), miss: detail.filter(d => d.v < 0.5)};
            }
            const jpRanked = (req) => JP.candidates.map(c => ({c, m: jpMatch(c, req), sl: JP.shortlist.includes(String(c.id))}))
                .sort((a, b) => b.m.score - a.m.score);

            // ---------- Ringkasan Rekrutmen ----------
            function jpRenderDashboard() {
                document.getElementById('jpCompanyName').textContent = sessionStorage.getItem('c-dfs_user_instansi') || 'Perusahaan Anda';
                const aktif = JP.lowongan.filter(l => l.status === 'Aktif');
                document.getElementById('jpStatLowongan').textContent = aktif.length;
                document.getElementById('jpStatLowonganDesc').textContent = `dari ${JP.lowongan.length} lowongan`;
                const prodiSet = new Set(JP.kompetensi.map(k => k.prodi).concat(JP.lowongan.map(l => l.prodi)));
                document.getElementById('jpStatKompetensi').textContent = JP.kompetensi.length;
                document.getElementById('jpStatProdi').textContent = `${JP.kompetensi.filter(isBahasa).length} bahasa · ${prodiSet.size} prodi`;
                // Kandidat cocok: cocok (>=60) dengan salah satu lowongan aktif, atau dengan daftar kompetensi
                const reqs = aktif.length ? aktif.map(reqFromLowongan) : (JP.kompetensi.length ? [reqFromKompetensi()] : []);
                const best = JP.candidates.map(c => ({c, score: reqs.length ? Math.max(...reqs.map(r => jpMatch(c, r).score)) : 0}))
                    .sort((a, b) => b.score - a.score);
                document.getElementById('jpStatKandidat').textContent = best.filter(x => x.score >= 60).length;
                document.getElementById('jpStatLamaran').textContent = JP.lamaran.length;
                const baru = JP.lamaran.filter(a => a.status === 'Dikirim').length;
                document.getElementById('jpStatShortlist').textContent = `${baru} belum ditinjau · ${JP.shortlist.length} shortlist`;

                const byProdi = allProdi().map(p => ({...p, k: JP.kompetensi.filter(k => k.prodi === p.nama).length, l: JP.lowongan.filter(l => l.prodi === p.nama).length}));
                const maxN = Math.max(1, ...byProdi.map(p => p.k + p.l));
                document.getElementById('jpProdiBars').innerHTML = byProdi.map(p => `
                    <div class="jp-prodi-row">
                        <span class="name">${esc(p.kode)} <span class="jp-muted">· ${esc(p.jalur)}</span></span>
                        <span class="val">${p.k} · ${p.l}</span>
                        <div class="track"><div class="fill" style="width:${((p.k + p.l) / maxN) * 100}%"></div></div>
                    </div>`).join('');

                const top = reqs.length ? best.slice(0, 5) : [];
                document.getElementById('jpTopBody').innerHTML = top.length ? top.map(({c, score}) => `
                    <tr>
                        <td><strong>${esc(c.name)}</strong>${JP.demo ? '<span class="jp-demo-badge">CONTOH</span>' : ''}</td>
                        <td>${esc(prodiKode(c.prodi))} <span class="jp-muted">· ${esc(c.jalur)}</span></td>
                        <td class="text-center"><strong>${score}%</strong></td>
                        <td class="text-center">${JP.shortlist.includes(String(c.id)) ? '<span class="badge badge-orange">Shortlist</span>' : '<span class="jp-muted">-</span>'}</td>
                    </tr>`).join('')
                    : `<tr><td colspan="4" class="text-center jp-muted" style="padding:24px;">Tambahkan kompetensi atau lowongan agar kandidat bisa dinilai.</td></tr>`;
            }

            // ---------- Kelola Kompetensi: Kompetensi Teknis & Kebutuhan Bahasa ----------
            const jpKompProdi = document.getElementById('jpKompProdi');
            jpKompProdi.innerHTML = prodiOptionsHtml();
            document.querySelectorAll('#jpKompTab .seg-btn').forEach(b => b.addEventListener('click', () => {
                JP.kompTab = b.dataset.tab;
                document.querySelectorAll('#jpKompTab .seg-btn').forEach(x => x.classList.toggle('active', x === b));
                document.getElementById('jpKompPaneTeknis').classList.toggle('is-hidden', JP.kompTab !== 'teknis');
                document.getElementById('jpKompPaneBahasa').classList.toggle('is-hidden', JP.kompTab !== 'bahasa');
            }));

            function jpRenderSuggest() {
                const prodi = jpKompProdi.value;
                const ada = JP.kompetensi.filter(k => k.prodi === prodi && !isBahasa(k)).map(k => k.nama.toLowerCase());
                const pool = (PRODI_SKILLS[prodi] || []).filter(s => !ada.includes(s.toLowerCase()));
                const box = document.getElementById('jpKompSuggest');
                box.innerHTML = pool.length ? `<span class="jp-muted" style="width:100%;">Saran untuk ${esc(prodiKode(prodi))} (klik untuk menambah):</span>` : '';
                pool.forEach(s => {
                    const b = document.createElement('button');
                    b.type = 'button'; b.textContent = '+ ' + s;
                    b.addEventListener('click', () => jpAddKompetensi({nama: s, prodi, jenis: 'kompetensi'}));
                    box.appendChild(b);
                });
            }
            jpKompProdi.addEventListener('change', jpRenderSuggest);

            async function jpAddKompetensi(item) {
                item.nama = item.nama.trim();
                if (!item.nama) return;
                const ada = JP.kompetensi.find(k => k.prodi === item.prodi && (k.jenis || 'kompetensi') === item.jenis && k.nama.toLowerCase() === item.nama.toLowerCase());
                if (ada && item.jenis === 'kompetensi') return showToast('Kompetensi sudah ada');
                if (JP.demo) {
                    if (ada) ada.level = item.level; else JP.kompetensi.push({...item, id: 'k' + Date.now()});
                    jpSaveDemo();
                } else {
                    const res = await apiRequest('jp_kompetensi_add', item);
                    if (!res || !res.success) return alert((res && res.message) || 'Gagal menyimpan.');
                    if (ada) ada.level = res.kompetensi.level; else JP.kompetensi.push(res.kompetensi);
                }
                showToast(ada ? `Tingkat bahasa ${item.nama} diperbarui` : (item.jenis === 'bahasa' ? 'Kebutuhan bahasa ditambahkan' : 'Kompetensi ditambahkan'));
                jpRenderAll();
            }
            document.getElementById('formJpKompetensi').addEventListener('submit', (e) => {
                e.preventDefault();
                const input = document.getElementById('jpKompNama');
                jpAddKompetensi({nama: input.value, prodi: jpKompProdi.value, jenis: 'kompetensi'});
                input.value = '';
                input.focus();
            });
            const jpKLang = setupLangPicker('jpK');
            const jpKAddLang = () => {
                const v = jpKLang.value();
                if (!v) return;
                jpAddKompetensi({nama: v.nama, level: v.level, prodi: jpKompProdi.value, jenis: 'bahasa'});
                jpKLang.reset();
            };
            document.getElementById('jpKLangAdd').addEventListener('click', jpKAddLang);
            jpKLang.onEnter(jpKAddLang);

            function jpRenderKompetensi() {
                document.getElementById('jpKompCount').textContent = `${JP.kompetensi.length} item`;
                const rows = [...JP.kompetensi].sort((a, b) => a.prodi.localeCompare(b.prodi) || (isBahasa(a) - isBahasa(b)));
                document.getElementById('jpKompBody').innerHTML = rows.length ? rows.map((k, i) => `
                    <tr>
                        <td class="text-center">${i + 1}</td>
                        <td><strong>${esc(isBahasa(k) ? 'Bahasa ' + k.nama : k.nama)}</strong></td>
                        <td>${isBahasa(k) ? `<span class="badge jp-badge-lang">Bahasa · min. ${esc(k.level)}</span>` : '<span class="badge badge-blue">Teknis</span>'}</td>
                        <td><span class="badge badge-blue">${esc(prodiKode(k.prodi))}</span> <span class="jp-muted">${esc(k.prodi)}</span></td>
                        <td class="text-center"><button class="jp-btn-sm danger" data-hapus="${esc(k.id)}" aria-label="Hapus ${esc(k.nama)}"><i class="fa-regular fa-trash-can"></i> Hapus</button></td>
                    </tr>`).join('')
                    : `<tr><td colspan="5" class="text-center jp-muted" style="padding:24px;">Belum ada data. Tambahkan kompetensi teknis atau kebutuhan bahasa di atas.</td></tr>`;
                jpRenderSuggest();
            }
            document.getElementById('jpKompBody').addEventListener('click', async (e) => {
                const b = e.target.closest('button[data-hapus]');
                if (!b) return;
                const k = JP.kompetensi.find(x => String(x.id) === b.dataset.hapus);
                if (!k) return;
                if (!JP.demo) {
                    const res = await apiRequest('jp_kompetensi_delete', {id: k.id});
                    if (!res || !res.success) return alert((res && res.message) || 'Gagal menghapus.');
                }
                JP.kompetensi = JP.kompetensi.filter(x => x !== k);
                if (JP.demo) jpSaveDemo();
                showToast('Data dihapus');
                jpRenderAll();
            });

            // ---------- Kelola Lowongan ----------
            const jpLowProdi = document.getElementById('jpLowProdi');
            jpLowProdi.innerHTML = prodiOptionsHtml() + `<option value="${SEMUA_PRODI}">Semua prodi (lowongan umum)</option>`;
            const jpLLang = setupLangPicker('jpL');

            function jpRenderLowForm() {
                const prodi = jpLowProdi.value;
                // Chip kompetensi: dari daftar kompetensi teknis prodi ini + kompetensi tambahan lowongan
                const pool = [...new Set(JP.kompetensi.filter(k => !isBahasa(k) && k.prodi === prodi).map(k => k.nama).concat(JP.form.komp))];
                document.getElementById('jpLowKompChips').innerHTML = pool.length ? pool.map(n => `
                    <button type="button" class="jp-chip ${JP.form.komp.includes(n) ? 'on' : ''}" data-komp="${esc(n)}">
                        <i class="fa-solid ${JP.form.komp.includes(n) ? 'fa-check' : 'fa-plus'}"></i> ${esc(n)}</button>`).join('')
                    : '<span class="jp-muted">Belum ada kompetensi untuk prodi ini. Ketik di bawah; kompetensi baru otomatis tersimpan ke Kebutuhan Kompetensi Umum.</span>';
                // Chip bahasa: persyaratan terpilih + saran dari Kebutuhan Bahasa prodi ini
                const saran = JP.kompetensi.filter(k => isBahasa(k) && k.prodi === prodi && !JP.form.bahasa.some(b => sameLang(b.nama, k.nama)));
                document.getElementById('jpLowLangChips').innerHTML =
                    JP.form.bahasa.map((b, i) => `<span class="jp-chip on lang">${esc(langLabel(b))} <button type="button" data-del-blang="${i}" aria-label="Hapus">&times;</button></span>`).join('') +
                    saran.map(k => `<button type="button" class="jp-chip" data-add-blang="${esc(k.id)}"><i class="fa-solid fa-plus"></i> ${esc(langLabel(k))}</button>`).join('');
            }
            jpLowProdi.addEventListener('change', () => { JP.form.komp = []; jpRenderLowForm(); });
            document.getElementById('jpLowKompChips').addEventListener('click', (e) => {
                const b = e.target.closest('[data-komp]');
                if (!b) return;
                const n = b.dataset.komp;
                JP.form.komp = JP.form.komp.includes(n) ? JP.form.komp.filter(x => x !== n) : [...JP.form.komp, n];
                jpRenderLowForm();
            });
            document.getElementById('jpLowKompInput').addEventListener('keydown', (e) => {
                if (e.key !== 'Enter') return;
                e.preventDefault();
                const v = e.target.value.trim().slice(0, 100);
                if (v && !JP.form.komp.some(x => x.toLowerCase() === v.toLowerCase())) JP.form.komp.push(v);
                e.target.value = '';
                jpRenderLowForm();
            });
            function jpAddLowLang(v) {
                if (!v) return;
                const ada = JP.form.bahasa.find(b => sameLang(b.nama, v.nama));
                if (ada) ada.level = v.level; else JP.form.bahasa.push(v);
                jpLLang.reset();
                jpRenderLowForm();
            }
            document.getElementById('jpLLangAdd').addEventListener('click', () => jpAddLowLang(jpLLang.value()));
            jpLLang.onEnter(() => jpAddLowLang(jpLLang.value()));
            document.getElementById('jpLowLangChips').addEventListener('click', (e) => {
                const d = e.target.closest('[data-del-blang]');
                if (d) { JP.form.bahasa.splice(+d.dataset.delBlang, 1); return jpRenderLowForm(); }
                const a = e.target.closest('[data-add-blang]');
                if (a) { const k = JP.kompetensi.find(x => String(x.id) === a.dataset.addBlang); if (k) jpAddLowLang({nama: k.nama, level: k.level}); }
            });

            // ---------- Isi otomatis dari poster lowongan (AI / OCR) ----------
            // Dengan API key: poster dibaca AI (Claude). Tanpa API key: teks dibaca OCR di browser (Tesseract.js) lalu diurai aturan.
            const OCR_CDN = Object.assign({script: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js'}, window.CDFS_OCR || {});
            let tessPromise = null;
            function loadTesseract() {
                if (window.Tesseract) return Promise.resolve(window.Tesseract);
                if (!tessPromise) tessPromise = new Promise((resolve, reject) => {
                    const sc = document.createElement('script');
                    sc.src = OCR_CDN.script;
                    sc.onload = () => resolve(window.Tesseract);
                    sc.onerror = () => { tessPromise = null; reject(new Error('Pustaka OCR gagal dimuat (periksa koneksi internet).')); };
                    document.head.appendChild(sc);
                });
                return tessPromise;
            }
            async function ocrImage(src, onProgress) {
                const T = await loadTesseract();
                const opt = {logger: (m) => { if (m.status === 'recognizing text' && onProgress) onProgress(Math.round(m.progress * 100)); }};
                ['workerPath', 'corePath', 'langPath'].forEach(k => { if (OCR_CDN[k]) opt[k] = OCR_CDN[k]; });
                const worker = await T.createWorker(['ind', 'eng'], 1, opt);
                try { return (await worker.recognize(src)).data.text || ''; } finally { await worker.terminate(); }
            }
            async function pdfFirstPageImage(file) {
                const pdfjs = await loadPdfJs();
                const doc = await pdfjs.getDocument({data: new Uint8Array(await file.arrayBuffer())}).promise;
                const page = await doc.getPage(1);
                const vp = page.getViewport({scale: 2});
                const cv = document.createElement('canvas'); cv.width = vp.width; cv.height = vp.height;
                await page.render({canvasContext: cv.getContext('2d'), viewport: vp}).promise;
                return cv.toDataURL('image/png');
            }

            // Kosakata kompetensi untuk mengenali isi poster
            const POSTER_VOCAB = [...new Set(Object.values(PRODI_SKILLS).flat().concat([
                'PLC', 'SCADA', 'Arduino', 'Mikrokontroler', 'Internet of Things', 'IoT', 'Embedded System', 'Desain PCB', 'Instrumentasi', 'Sistem Kendali', 'Otomasi Industri', 'Panel Listrik', 'Panel Surya', 'Troubleshooting', 'Soldering', 'AutoCAD', 'Pemeliharaan Mesin', 'K3',
                'Digital Marketing', 'Media Sosial', 'Social Media', 'SEO', 'Google Ads', 'Meta Ads', 'Copywriting', 'Content Creator', 'Branding', 'Riset Pasar', 'Negosiasi', 'Penjualan', 'Customer Service', 'CRM', 'E-commerce',
                'Python', 'SQL', 'Excel', 'Microsoft Office', 'Statistika', 'Analisis Data', 'Data Analytics', 'Machine Learning', 'Power BI', 'Tableau', 'Pemodelan Matematika', 'Aktuaria',
                'Perencanaan Pembelajaran', 'Asesmen Perkembangan', 'Media Pembelajaran', 'Bercerita', 'Literasi Anak', 'Pengasuhan', 'Kurikulum Merdeka', 'Manajemen Kelas'
            ]))];
            const KOTA = ['Malang', 'Batu', 'Surabaya', 'Sidoarjo', 'Pasuruan', 'Gresik', 'Mojokerto', 'Kediri', 'Blitar', 'Jakarta', 'Bekasi', 'Tangerang', 'Bandung', 'Semarang', 'Yogyakarta', 'Bali', 'Remote'];
            const PRODI_KATA = {
                'Teknologi Rekayasa Sistem Elektronika': /elektro|elektronika|listrik|\biot\b|plc|mikrokontroler|embedded|instrumentasi|otomasi|teknisi|scada|pcb/g,
                'Manajemen Pemasaran': /pemasaran|marketing|\bsales\b|penjualan|brand|promosi|media sosial|social media|copywrit|e-commerce/g,
                'Pendidikan Guru Pendidikan Anak Usia Dini (PGPAUD)': /\bpaud\b|\btk\b|anak usia dini|kelompok bermain|\bkb\b|daycare|pengasuh|tumbuh kembang/g,
                'Pendidikan Guru Sekolah Dasar (PGSD)': /\bpgsd\b|sekolah dasar|\bsd\b|\bsdn\b|guru kelas|wali kelas|madrasah ibtidaiyah/g
            };
            const BAHASA_KATA = [[/inggris|english|toefl|toeic|ielts/i, 'Inggris'], [/jepang|japanese|jlpt|nihongo/i, 'Jepang'], [/jerman|german|deutsch/i, 'Jerman'], [/mandarin|chinese|hsk/i, 'Mandarin'], [/korea|korean|topik/i, 'Korea'], [/\barab|arabic/i, 'Arab']];
            const tutupTeks = (t) => t.replace(/[•·●▪■◦►\-–—*]+\s*/g, '').replace(/\s+/g, ' ').replace(/[.;,:]+$/, '').trim();

            function parsePoster(text) {
                const lines = text.split(/\r?\n/).map(l => l.replace(/\s+/g, ' ').trim()).filter(l => l.length > 1);
                const low = text.toLowerCase();
                const hasil = {posisi: '', lokasi: '', deskripsi: '', kompetensi: [], bahasa: [], prodi: ''};
                // Posisi
                const RE_POS = /^(?:lowongan(?:\s+kerja)?|dibutuhkan|dicari|we(?:'|’)?re hiring|we are hiring|hiring|open recruitment|posisi|position|job title)\s*[:\-–]?\s*(.*)$/i;
                for (let i = 0; i < lines.length && !hasil.posisi; i++) {
                    const m = lines[i].match(RE_POS);
                    if (!m) continue;
                    const isi = tutupTeks(m[1] || '');
                    hasil.posisi = isi.length >= 3 ? isi : tutupTeks(lines[i + 1] || '');
                }
                if (!hasil.posisi) hasil.posisi = tutupTeks(lines.find(l => { const w = l.split(' ').length; return w >= 1 && w <= 6 && !/^(pt|cv)\b|lowongan|kualifikasi|persyaratan/i.test(l); }) || '');
                hasil.posisi = hasil.posisi.slice(0, 120);
                // Lokasi
                const lm = text.match(/(?:lokasi|penempatan|location|domisili|area)\s*(?:kerja)?\s*[:\-–]\s*([^\n]+)/i);
                if (lm) hasil.lokasi = tutupTeks(lm[1]).slice(0, 100);
                else { const k = KOTA.find(c => new RegExp('\\b' + c + '\\b', 'i').test(text)); if (k) hasil.lokasi = k; }
                // Bagian kualifikasi
                const RE_HEAD = /^(kualifikasi|persyaratan|requirements?|qualifications?|syarat|kriteria|skills?|keahlian|kemampuan|yang kami cari)\b/i;
                const RE_STOP = /^(benefit|fasilitas|keuntungan|cara melamar|how to apply|kirim|apply|deadline|batas|kontak|contact|deskripsi|tanggung jawab|job desc|tugas)\b/i;
                let iKual = lines.findIndex(l => RE_HEAD.test(l));
                const kual = [];
                if (iKual >= 0) for (let i = iKual + 1; i < lines.length && !RE_STOP.test(lines[i]); i++) kual.push(lines[i]);
                const sumber = kual.length ? kual : lines;
                // (a) kosakata yang dikenal
                const ketemu = new Set();
                POSTER_VOCAB.forEach(v => {
                    const tv = tokens(v);
                    if (!tv.length && v.length > 2) return;
                    const pola = v.length <= 4 ? new RegExp('\\b' + v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i') : null;
                    if (sumber.some(l => pola ? pola.test(l) : (tokens(l).length && tv.every(t => tokens(l).some(y => same(t, y)))))) ketemu.add(v);
                });
                // gabungkan sinonim yang sama
                [['IoT', 'Internet of Things'], ['Social Media', 'Media Sosial']].forEach(([a, b]) => { if (ketemu.has(a) && ketemu.has(b)) ketemu.delete(a); });
                // (b) frasa "Menguasai / Mampu / Paham / Familiar with ..." yang bukan syarat umum
                const UMUM = /pendidikan|lulusan|\bs1\b|\bd3\b|\bd4\b|\bsma\b|\bsmk\b|usia|umur|pria|wanita|\bipk\b|\bsim\b|domisili|berpenampilan|jujur|disiplin|bersedia|sehat|tidak (buta|merokok)|pengalaman minimal|fresh graduate|tim|komunikasi/i;
                sumber.forEach(l => {
                    const m = l.match(/(?:menguasai|mampu|memahami|paham|familiar with|proficient in|mahir|terampil|berpengalaman (?:di|dalam))\s+(.+)/i);
                    if (!m || UMUM.test(l)) return;
                    const frasa = tutupTeks(m[1]).replace(/^(menggunakan|mengoperasikan|membuat)\s+/i, '');
                    if (frasa.length >= 3 && frasa.length <= 60 && ![...ketemu].some(k => related(k, frasa))) ketemu.add(frasa.charAt(0).toUpperCase() + frasa.slice(1));
                });
                hasil.kompetensi = [...ketemu].slice(0, 10);
                // Bahasa
                BAHASA_KATA.forEach(([re, nama]) => {
                    const baris = lines.find(l => re.test(l));
                    if (!baris) return;
                    const b = baris.toLowerCase();
                    let level = 'Intermediate';
                    if (/fasih|fluent|native|advanced|n1\b|n2\b|sangat baik/.test(b)) level = 'Advanced';
                    else if (/pasif|dasar|basic|n4\b|n5\b|sedikit/.test(b)) level = 'Basic';
                    hasil.bahasa.push({nama, level});
                });
                // Prodi
                const skor = Object.entries(PRODI_KATA).map(([p, re]) => [p, (low.match(re) || []).length]).sort((a, b) => b[1] - a[1]);
                if (skor[0][1] > 0 && skor[0][1] > (skor[1] || [0, 0])[1]) hasil.prodi = skor[0][0];
                // Deskripsi
                const iDesk = lines.findIndex(l => /^(deskripsi|tanggung jawab|job desc|tugas|responsibilit)/i.test(l));
                const desk = [];
                if (iDesk >= 0) for (let i = iDesk + 1; i < lines.length && desk.length < 4 && !RE_HEAD.test(lines[i]) && !RE_STOP.test(lines[i]); i++) desk.push(lines[i]);
                hasil.deskripsi = desk.map(tutupTeks).join('; ').slice(0, 600);
                return hasil;
            }

            function applyPoster(d, sumber) {
                if (d.posisi) document.getElementById('jpLowPosisi').value = d.posisi;
                if (d.prodi && [...jpLowProdi.options].some(o => o.value === d.prodi)) jpLowProdi.value = d.prodi;
                if (d.lokasi) document.getElementById('jpLowLokasi').value = d.lokasi;
                const desk = (d.deskripsi || '').trim();
                document.getElementById('jpLowDesk').value = (desk ? desk + '\n' : '') + `(Diisi otomatis dari poster · ${sumber}. Periksa kembali sebelum menyimpan.)`;
                JP.form.komp = [...new Set((d.kompetensi || []).map(k => String(k).trim()).filter(Boolean))].slice(0, 12);
                JP.form.bahasa = (d.bahasa || []).filter(b => b && b.nama && LEVELS.includes(b.level)).map(b => ({nama: b.nama, level: b.level}));
                jpRenderLowForm();
            }

            async function handlePoster(file) {
                if (!file) return;
                const st = document.getElementById('jpPosterStatus'), box = document.getElementById('jpPosterResult');
                const isPdf = /pdf$/i.test(file.type) || /\.pdf$/i.test(file.name);
                if (!isPdf && !/^image\//.test(file.type)) return showToast('Gunakan gambar (JPG/PNG) atau PDF poster lowongan');
                if (file.size > 5 * 1024 * 1024) return showToast('File terlalu besar (maks. 5 MB)');
                const url = isPdf ? '' : URL.createObjectURL(file);
                box.classList.remove('is-hidden');
                box.innerHTML = `${url ? `<img src="${url}" alt="Pratinjau poster" />` : '<div class="jp-poster-pdf"><i class="fa-regular fa-file-pdf"></i></div>'}<div class="jp-poster-info"><strong>${escHtml(file.name)}</strong><span id="jpPosterProg"><i class="fa-solid fa-spinner fa-spin"></i> Membaca poster...</span></div>`;
                const prog = (t) => { const el = document.getElementById('jpPosterProg'); if (el) el.innerHTML = t; };
                let data = null, sumber = '';
                try {
                    if (JP.aiEnabled && !JP.demo) {
                        prog('<i class="fa-solid fa-spinner fa-spin"></i> AI sedang membaca poster...');
                        const res = await apiRequest('jp_ai_lowongan', {media_type: isPdf ? 'application/pdf' : file.type, data: await fileToBase64(file)});
                        if (res && res.success && res.data) { data = res.data; sumber = 'dibaca AI'; }
                    }
                    if (!data) {
                        let text = '';
                        if (isPdf) { try { text = (await pdfLines(file)).join('\n'); } catch (e) { console.warn(e); } }
                        if (text.replace(/\s/g, '').length < 30) {
                            prog('<i class="fa-solid fa-spinner fa-spin"></i> Membaca teks pada gambar (OCR)... 0%');
                            text = await ocrImage(isPdf ? await pdfFirstPageImage(file) : file, (p) => prog(`<i class="fa-solid fa-spinner fa-spin"></i> Membaca teks pada gambar (OCR)... ${p}%`));
                            sumber = 'OCR otomatis';
                        } else sumber = 'teks PDF';
                        data = parsePoster(text);
                    }
                } catch (e) {
                    console.warn(e);
                    prog(`<span class="warn"><i class="fa-solid fa-triangle-exclamation"></i> ${escHtml(e.message || 'Poster gagal dibaca')}</span>`);
                    return;
                }
                if (!data.posisi && !(data.kompetensi || []).length) { prog('<span class="warn"><i class="fa-solid fa-triangle-exclamation"></i> Isi lowongan tidak terdeteksi. Coba gambar yang lebih jelas, atau isi form secara manual.</span>'); return; }
                if (data.posisi) data.posisi = String(data.posisi).replace(/^\s*(posisi|jabatan|lowongan|dibutuhkan|position)\s*[:\-–]\s*/i, '').trim();
                posterKonfirmasi(data, sumber, url);
            }
            // Kartu konfirmasi: Jobprovider cukup memeriksa hasil deteksi. "Sesuai" = langsung terbit di daftar lowongan.
            function posterKonfirmasi(data, sumber, url) {
                const box = document.getElementById('jpPosterResult');
                const st = {komp: [...new Set((data.kompetensi || []).map(k => String(k).trim()).filter(Boolean))].slice(0, 12)};
                const komp = st.komp;
                const bahasa = (data.bahasa || []).filter(b => b && b.nama && LEVELS.includes(b.level)).map(b => ({nama: b.nama, level: b.level}));
                // Poster tanpa permintaan prodi -> lowongan untuk semua prodi
                const prodiOk = data.prodi && [...jpLowProdi.options].some(o => o.value === data.prodi);
                const prodiPilih = prodiOk ? data.prodi : SEMUA_PRODI;
                const desk = (data.deskripsi || '').trim();
                box.classList.remove('is-hidden');
                box.innerHTML = `
                    ${url ? `<img src="${url}" alt="Pratinjau poster" />` : '<div class="jp-poster-pdf"><i class="fa-regular fa-file-pdf"></i></div>'}
                    <div class="jp-poster-confirm">
                        <p class="jp-pc-q"><i class="fa-solid fa-circle-question"></i> Apakah hasil deteksi ini <strong>sesuai</strong> dengan lowongan Anda? <small>(${escHtml(sumber)})</small></p>
                        <dl class="jp-pc-grid">
                            <dt>Posisi</dt><dd>${data.posisi ? escHtml(data.posisi) : '<input type="text" id="jpPcPosisi" class="jp-pc-input" placeholder="Posisi tidak terdeteksi, ketik di sini" maxlength="120" />'}</dd>
                            <dt>Prodi</dt><dd><select id="jpPcProdi" aria-label="Program studi lowongan">${[...jpLowProdi.options].map(o => `<option value="${escHtml(o.value)}"${prodiPilih === o.value ? ' selected' : ''}>${escHtml(o.textContent)}</option>`).join('')}</select>${prodiOk ? '' : ' <span class="jp-muted">poster tidak menyebut prodi → semua prodi</span>'}</dd>
                            <dt>Lokasi</dt><dd>${data.lokasi ? escHtml(data.lokasi) : '<span class="jp-muted">-</span>'}</dd>
                            <dt>Kompetensi</dt><dd><span id="jpPcKomp"></span>
                                <input type="text" id="jpPcKompIn" class="jp-pc-input" placeholder="${komp.length ? 'Tambah kompetensi lain…' : 'Tidak terdeteksi, ketik kompetensi lalu Enter'}" maxlength="100" /></dd>
                            <dt>Bahasa</dt><dd>${bahasa.length ? bahasa.map(b => `<span class="jp-pc-chip">${escHtml(b.nama)} · ${escHtml(b.level)}</span>`).join('') : '<span class="jp-muted">tidak ada syarat</span>'}</dd>
                            ${desk ? `<dt>Deskripsi</dt><dd class="jp-pc-desk">${escHtml(desk.length > 220 ? desk.slice(0, 219) + '…' : desk)}</dd>` : ''}
                        </dl>
                        <div class="jp-pc-actions">
                            <button type="button" class="jp-btn-sm primary jp-pc-ok" id="jpPcOk"><i class="fa-solid fa-check"></i> Sesuai, terbitkan lowongan</button>
                            <button type="button" class="jp-btn-sm" id="jpPcEdit"><i class="fa-solid fa-pen"></i> Ubah dulu di form</button>
                            <button type="button" class="jp-btn-sm danger" id="jpPcNo">Tidak sesuai</button>
                        </div>
                        <small id="jpPcHint"></small>
                    </div>`;
                const posisiNow = () => (data.posisi || (document.getElementById('jpPcPosisi') || {}).value || '').trim();
                const renderKomp = () => {
                    document.getElementById('jpPcKomp').innerHTML = komp.map((k, i) => `<span class="jp-pc-chip">${escHtml(k)} <button type="button" data-i="${i}" aria-label="Hapus ${escHtml(k)}">&times;</button></span>`).join('');
                    const kurang = [!posisiNow() && 'posisi', !komp.length && 'minimal satu kompetensi'].filter(Boolean);
                    document.getElementById('jpPcOk').disabled = kurang.length > 0;
                    document.getElementById('jpPcHint').innerHTML = kurang.length ? `<span class="warn">Lengkapi ${kurang.join(' dan ')} agar lowongan bisa terbit.</span>` : 'Setelah dikonfirmasi, lowongan langsung masuk daftar lowongan Anda dan tampil di Job Matching mahasiswa.';
                };
                const kin = document.getElementById('jpPcKompIn');
                const tambah = () => { kin.value.split(/[,;]/).map(x => x.trim()).filter(Boolean).forEach(x => { if (!komp.some(k => k.toLowerCase() === x.toLowerCase()) && komp.length < 12) komp.push(x.slice(0, 100)); }); kin.value = ''; renderKomp(); };
                kin.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); tambah(); } });
                kin.addEventListener('blur', () => { if (kin.value.trim()) tambah(); });
                document.getElementById('jpPcKomp').addEventListener('click', (e) => { const b = e.target.closest('button[data-i]'); if (b) { komp.splice(+b.dataset.i, 1); renderKomp(); } });
                const pin = document.getElementById('jpPcPosisi'); if (pin) pin.addEventListener('input', renderKomp);
                renderKomp();
                const ambil = () => ({...data, posisi: posisiNow(), prodi: document.getElementById('jpPcProdi').value, kompetensi: [...komp], bahasa});
                document.getElementById('jpPcOk').addEventListener('click', async (e) => {
                    const d = ambil();
                    if (!d.prodi) return showToast('Pilih program studi lowongan dahulu');
                    e.currentTarget.disabled = true;
                    const low = {id: null, posisi: d.posisi.trim().slice(0, 150), prodi: d.prodi, lokasi: (d.lokasi || '').trim(),
                        deskripsi: (desk ? desk + '\n' : '') + `(Dibuat dari poster · ${sumber}; dikonfirmasi Jobprovider.)`, kompetensi: [...komp], bahasa};
                    const r = await jpSimpanLowongan(low);
                    if (!r.ok) { e.currentTarget.disabled = false; return alert(r.message); }
                    box.innerHTML = `<div class="jp-poster-info"><span class="ok"><i class="fa-solid fa-circle-check"></i> Lowongan <b>${escHtml(low.posisi)}</b> diterbitkan dan sudah tampil di daftar lowongan.</span><small>${r.baru > 0 ? `${r.baru} kebutuhan baru juga disimpan ke Kebutuhan Kompetensi Umum. ` : ''}Bisa diubah atau ditutup kapan saja dari daftar.</small></div>`;
                    showToast('Lowongan dari poster diterbitkan');
                    jpRenderAll();
                    const item = r.lowongan && document.querySelector(`#jpLowList [data-id="${CSS.escape(String(r.lowongan.id))}"]`);
                    const kartu = item ? item.closest('#jpLowList > *') : null;
                    if (kartu) { kartu.classList.add('jp-baru'); setTimeout(() => kartu.classList.remove('jp-baru'), 4000); }
                    (kartu || document.getElementById('jpLowList')).scrollIntoView({behavior: 'smooth', block: 'center'});
                });
                document.getElementById('jpPcEdit').addEventListener('click', () => {
                    applyPoster(ambil(), sumber);
                    box.innerHTML = '<div class="jp-poster-info"><span class="ok"><i class="fa-solid fa-pen"></i> Hasil deteksi dipindahkan ke form.</span><small>Lengkapi atau ubah, lalu klik <b>Simpan Lowongan</b>.</small></div>';
                    document.getElementById('jpLowPosisi').scrollIntoView({behavior: 'smooth', block: 'center'});
                });
                document.getElementById('jpPcNo').addEventListener('click', () => {
                    box.innerHTML = '<div class="jp-poster-info"><span class="warn"><i class="fa-solid fa-xmark"></i> Hasil deteksi dibatalkan.</span><small>Coba poster yang lebih jelas, atau isi form secara manual.</small></div>';
                });
            }
            (() => {
                const drop = document.getElementById('jpPosterDrop'), inp = document.getElementById('jpPosterFile');
                inp.addEventListener('change', () => { if (inp.files[0]) handlePoster(inp.files[0]); inp.value = ''; });
                ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('drag'); }));
                ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('drag'); }));
                drop.addEventListener('drop', (e) => { const f = e.dataTransfer.files[0]; if (f) handlePoster(f); });
            })();

            function jpResetLowForm() {
                const prodiTerakhir = jpLowProdi.value;
                document.getElementById('formJpLowongan').reset();
                if (prodiTerakhir) jpLowProdi.value = prodiTerakhir;   // pertahankan prodi agar mudah menambah lowongan berikutnya
                document.getElementById('jpLowId').value = '';
                document.getElementById('jpLowFormTitle').textContent = 'Tambah Lowongan';
                document.getElementById('jpLowSubmit').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Lowongan';
                document.getElementById('jpLowCancel').classList.add('is-hidden');
                JP.form = {komp: [], bahasa: []};
                jpRenderLowForm();
            }
            document.getElementById('jpLowCancel').addEventListener('click', jpResetLowForm);
            function jpEditLow(id) {
                const l = JP.lowongan.find(x => String(x.id) === String(id));
                if (!l) return;
                document.getElementById('jpLowId').value = l.id;
                document.getElementById('jpLowPosisi').value = l.posisi;
                jpLowProdi.value = l.prodi;
                document.getElementById('jpLowLokasi').value = l.lokasi || '';
                document.getElementById('jpLowDesk').value = l.deskripsi || '';
                JP.form = {komp: [...(l.kompetensi || [])], bahasa: (l.bahasa || []).map(b => ({...b}))};
                document.getElementById('jpLowFormTitle').textContent = 'Edit Lowongan';
                document.getElementById('jpLowSubmit').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Perubahan';
                document.getElementById('jpLowCancel').classList.remove('is-hidden');
                jpRenderLowForm();
                document.getElementById('jpLowPosisi').focus();
            }
            document.getElementById('formJpLowongan').addEventListener('submit', async (e) => {
                e.preventDefault();
                const low = {
                    id: document.getElementById('jpLowId').value || null,
                    posisi: document.getElementById('jpLowPosisi').value.trim(),
                    prodi: jpLowProdi.value,
                    lokasi: document.getElementById('jpLowLokasi').value.trim(),
                    deskripsi: document.getElementById('jpLowDesk').value.trim(),
                    kompetensi: [...JP.form.komp],
                    bahasa: JP.form.bahasa.map(b => ({...b}))
                };
                if (!low.posisi) return alert('Isi posisi / jabatan.');
                if (!low.kompetensi.length) return alert('Pilih atau tambahkan minimal satu kompetensi yang dibutuhkan.');
                const r = await jpSimpanLowongan(low);
                if (!r.ok) return alert(r.message);
                showToast((low.id ? 'Lowongan diperbarui' : 'Lowongan ditambahkan') + (r.baru > 0 ? ` · ${r.baru} kebutuhan baru disimpan ke Kebutuhan Kompetensi Umum` : ''));
                jpResetLowForm();
                jpRenderAll();
            });
            // Simpan lowongan (dipakai form manual dan konfirmasi poster). Mengembalikan {ok, baru, lowongan, message}
            async function jpSimpanLowongan(low) {
                let baru = 0, saved = null;
                if (JP.demo) {
                    if (low.id) { const i = JP.lowongan.findIndex(x => String(x.id) === String(low.id)); JP.lowongan[i] = {...JP.lowongan[i], ...low}; }
                    else { saved = {...low, id: 'l' + Date.now(), status: 'Aktif', created_at: new Date().toISOString()}; JP.lowongan.push(saved); }
                    // Kompetensi & bahasa baru otomatis masuk ke Kebutuhan Kompetensi Umum (bahasa yang sudah ada tidak diubah)
                    const ada = (nama, jenis) => JP.kompetensi.some(k => k.prodi === low.prodi && (k.jenis || 'kompetensi') === jenis && (jenis === 'bahasa' ? sameLang(k.nama, nama) : k.nama.toLowerCase() === nama.toLowerCase()));
                    low.kompetensi.forEach((n, i) => { if (!ada(n, 'kompetensi')) { JP.kompetensi.push({id: 'k' + Date.now() + i, nama: n, prodi: low.prodi, jenis: 'kompetensi'}); baru++; } });
                    low.bahasa.forEach((b, i) => { if (!ada(b.nama, 'bahasa')) { JP.kompetensi.push({id: 'b' + Date.now() + i, nama: b.nama, level: b.level, prodi: low.prodi, jenis: 'bahasa'}); baru++; } });
                    jpSaveDemo();
                } else {
                    const res = await apiRequest('jp_lowongan_save', low);
                    if (!res || !res.success) return {ok: false, message: (res && res.message) || 'Gagal menyimpan lowongan.'};
                    const i = JP.lowongan.findIndex(x => String(x.id) === String(res.lowongan.id));
                    if (i >= 0) JP.lowongan[i] = res.lowongan; else JP.lowongan.unshift(res.lowongan);
                    if (Array.isArray(res.kompetensi)) { baru = res.kompetensi.length - JP.kompetensi.length; JP.kompetensi = res.kompetensi; }
                    saved = res.lowongan;
                }
                return {ok: true, baru, lowongan: saved};
            }
            async function jpLowStatus(l) {
                const status = l.status === 'Aktif' ? 'Ditutup' : 'Aktif';
                if (!JP.demo) {
                    const res = await apiRequest('jp_lowongan_status', {id: l.id, status});
                    if (!res || !res.success) return alert((res && res.message) || 'Gagal mengubah status.');
                }
                l.status = status;
                if (JP.demo) jpSaveDemo();
                showToast(status === 'Aktif' ? 'Lowongan dibuka kembali' : 'Lowongan ditutup');
                jpRenderAll();
            }
            async function jpLowDelete(l) {
                if (!confirm(`Hapus lowongan "${l.posisi}"?`)) return;
                if (!JP.demo) {
                    const res = await apiRequest('jp_lowongan_delete', {id: l.id});
                    if (!res || !res.success) return alert((res && res.message) || 'Gagal menghapus.');
                }
                JP.lowongan = JP.lowongan.filter(x => x !== l);
                if (JP.demo) jpSaveDemo();
                showToast('Lowongan dihapus');
                jpRenderAll();
            }
            function jpRenderLowList() {
                const list = JP.lowongan.filter(l => JP.lowFilter === 'semua' || l.status === JP.lowFilter);
                const box = document.getElementById('jpLowList');
                if (!list.length) {
                    box.innerHTML = `<div class="jp-empty-block"><i class="fa-regular fa-folder-open"></i>${JP.lowongan.length ? 'Tidak ada lowongan dengan status ini.' : 'Belum ada lowongan. Isi form di samping untuk menambahkan lowongan pertama.'}</div>`;
                    return;
                }
                box.innerHTML = list.map(l => {
                    const req = reqFromLowongan(l);
                    const cocok = JP.candidates.filter(c => jpMatch(c, req).score >= 60).length;
                    const pel = JP.lamaran.filter(a => String(a.lowongan_id) === String(l.id)).length;
                    return `
                    <div class="jp-job ${l.status === 'Aktif' ? '' : 'closed'}">
                        <div class="jp-job-head">
                            <div>
                                <div class="jp-job-title">${esc(l.posisi)}</div>
                                <div class="jp-job-meta">
                                    <span><i class="fa-solid fa-graduation-cap"></i> ${esc(prodiKode(l.prodi))}</span>
                                    ${l.lokasi ? `<span><i class="fa-solid fa-location-dot"></i> ${esc(l.lokasi)}</span>` : ''}
                                    <span class="${pel ? 'jp-pel' : ''}"><i class="fa-solid fa-paper-plane"></i> ${pel} pelamar</span>
                                </div>
                            </div>
                            <span class="badge ${l.status === 'Aktif' ? 'badge-green' : 'badge-orange'}">${esc(l.status)}</span>
                        </div>
                        <div class="jp-job-tags">
                            ${(l.kompetensi || []).map(k => `<span class="t">${esc(k)}</span>`).join('')}
                            ${(l.bahasa || []).map(b => `<span class="t lang"><i class="fa-solid fa-language"></i> ${esc(b.nama)} · min. ${esc(b.level)}</span>`).join('')}
                        </div>
                        ${l.deskripsi ? `<p class="jp-job-desc">${esc(l.deskripsi)}</p>` : ''}
                        <div class="jp-job-actions">
                            <button class="jp-btn-sm primary" data-act="kandidat" data-id="${esc(l.id)}"><i class="fa-solid fa-user-check"></i> ${cocok} Kandidat Cocok</button>
                            <button class="jp-btn-sm" data-act="edit" data-id="${esc(l.id)}"><i class="fa-solid fa-pen"></i> Edit</button>
                            <button class="jp-btn-sm" data-act="status" data-id="${esc(l.id)}"><i class="fa-solid ${l.status === 'Aktif' ? 'fa-lock' : 'fa-lock-open'}"></i> ${l.status === 'Aktif' ? 'Tutup' : 'Buka'}</button>
                            <button class="jp-btn-sm danger" data-act="hapus" data-id="${esc(l.id)}"><i class="fa-regular fa-trash-can"></i> Hapus</button>
                        </div>
                    </div>`;
                }).join('');
            }
            document.getElementById('jpLowList').addEventListener('click', (e) => {
                const b = e.target.closest('button[data-act]');
                if (!b) return;
                const l = JP.lowongan.find(x => String(x.id) === b.dataset.id);
                if (!l) return;
                if (b.dataset.act === 'edit') jpEditLow(l.id);
                else if (b.dataset.act === 'status') jpLowStatus(l);
                else if (b.dataset.act === 'hapus') jpLowDelete(l);
                else if (b.dataset.act === 'kandidat') {
                    jpGoto('view-jp-kandidat');
                    document.getElementById('jpFilterLowongan').value = String(l.id);
                    document.getElementById('jpHanyaPelamar').checked = JP.lamaran.some(a => String(a.lowongan_id) === String(l.id));
                    jpRenderCandidates();
                }
            });
            document.querySelectorAll('#jpLowFilter .seg-btn').forEach(b => b.addEventListener('click', () => {
                JP.lowFilter = b.dataset.status;
                document.querySelectorAll('#jpLowFilter .seg-btn').forEach(x => x.classList.toggle('active', x === b));
                jpRenderLowList();
            }));

            // ---------- Rekomendasi Kandidat ----------
            const jpFilterProdi = document.getElementById('jpFilterProdi');
            jpFilterProdi.innerHTML = '<option value="">Semua program studi</option>' + prodiOptionsHtml();
            function jpRenderLowSelect() {
                const sel = document.getElementById('jpFilterLowongan');
                const prev = sel.value;
                sel.innerHTML = '<option value="">Semua kebutuhan kompetensi umum</option>' +
                    JP.lowongan.map(l => `<option value="${esc(l.id)}">Lowongan: ${esc(l.posisi)} (${esc(prodiKode(l.prodi))})${l.status === 'Aktif' ? '' : ' — ditutup'}</option>`).join('');
                if ([...sel.options].some(o => o.value === prev)) sel.value = prev;
            }
            function jpRenderCandidates() {
                const grid = document.getElementById('jpCandidateGrid');
                const empty = (icon, msg) => `<div class="jp-empty-block" style="grid-column:1/-1;"><i class="fa-solid ${icon}"></i>${msg}</div>`;
                const req = jpCurrentReq();
                if (!req.kompetensi.length && !req.bahasa.length) {
                    grid.innerHTML = empty('fa-list-check', 'Tambahkan kompetensi atau lowongan di menu <strong>Kelola Lowongan</strong> atau <strong>Kebutuhan Kompetensi Umum</strong> agar kandidat bisa dinilai.');
                    return;
                }
                if (!JP.candidates.length) { grid.innerHTML = empty('fa-user-graduate', 'Belum ada Jobseeker yang memilih program studi.'); return; }
                const minSkor = parseInt(document.getElementById('jpFilterSkor').value, 10);
                const onlyShort = document.getElementById('jpHanyaShortlist').checked;
                const prodi = jpFilterProdi.value;
                const selLow = document.getElementById('jpFilterLowongan').value;
                const onlyPel = document.getElementById('jpHanyaPelamar').checked;
                // Pelamar selalu ditampilkan walau skornya di bawah batas minimal
                const rows = jpRanked(req).map(r => {
                    const lams = jpLamOf(r.c.id);
                    return {...r, lams, lam: selLow ? lams.find(a => String(a.lowongan_id) === selLow) : null};
                }).filter(r => {
                    const pelamar = selLow ? !!r.lam : r.lams.length > 0;
                    return (r.m.score >= minSkor || pelamar) && (!onlyPel || pelamar) && (!onlyShort || r.sl) && (!prodi || r.c.prodi === prodi);
                });
                if (!rows.length) { grid.innerHTML = empty('fa-filter', onlyPel ? 'Belum ada pelamar untuk pilihan ini.' : 'Tidak ada kandidat yang memenuhi filter. Coba turunkan skor minimal.'); return; }
                const total = req.kompetensi.length + req.bahasa.length;
                grid.innerHTML = rows.map(({c, m, sl, lams, lam}) => {
                    const initials = c.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
                    const level = m.score >= 60 ? '' : (m.score >= 40 ? 'mid' : 'low');
                    const nMan = (c.mk || []).filter(m => m.manual).length;
                    const dok = !(c.mk || []).length ? '' : (c.verif && !nMan ? '<span class="jp-dok"><i class="fa-solid fa-shield-halved"></i> transkrip terverifikasi</span>' : `<span class="jp-dok warn"><i class="fa-solid fa-pen"></i> ${c.verif ? nMan + ' MK diisi manual' : 'transkrip diisi manual'}</span>`);
                    return `
                    <div class="jp-cand">
                        <div class="jp-cand-head">
                            <div class="jp-cand-avatar">${esc(initials)}</div>
                            <div>
                                <div class="jp-cand-name">${esc(c.name)}${JP.demo ? '<span class="jp-demo-badge">DATA CONTOH</span>' : ''}${lam ? '<span class="lam-tag">Pelamar</span>' : (lams.length ? `<span class="lam-tag soft">Melamar ${lams.length} lowongan</span>` : '')}</div>
                                <div class="jp-cand-sub">${esc(prodiKode(c.prodi))} · ${esc(c.jalur)} · ${esc(c.instansi || '-')} ${dok}</div>
                            </div>
                            <div class="jp-score"><strong>${m.score}%</strong><span>kecocokan</span></div>
                        </div>
                        <div class="jp-meter ${level}"><div style="width:${m.score}%"></div></div>
                        <div class="jp-cand-sub">${m.prodiOk ? '<i class="fa-solid fa-circle-check" style="color:#16a34a"></i> Prodi sesuai' : '<i class="fa-solid fa-circle-minus"></i> Prodi di luar kebutuhan'} · ${m.hit.length}/${total} kebutuhan terpenuhi</div>
                        <div class="jp-cand-skills">
                            ${m.hit.map(d => `<span class="s hit" title="${esc(d.src)}">${esc(d.nama)}</span>`).join('')}
                            ${m.miss.map(d => `<span class="s miss" title="${esc(d.src)}">${esc(d.nama)}</span>`).join('')}
                        </div>
                        ${lam ? `<div class="jp-lam-row"><label>Status lamaran</label>
                            <select class="jp-input jp-lam-sel ${(LAM_INFO[lam.status] || LAM_INFO.Dikirim)[0]}" data-lam-low="${esc(lam.lowongan_id)}" data-lam-js="${esc(c.id)}" aria-label="Status lamaran ${esc(c.name)}">
                                ${Object.keys(LAM_INFO).map(st => `<option ${st === lam.status ? 'selected' : ''}>${st}</option>`).join('')}
                            </select></div>`
                        : (lams.length ? `<div class="jp-lam-list">${lams.map(a => { const lw = JP.lowongan.find(l => String(l.id) === String(a.lowongan_id)); return `<span>${esc(lw ? lw.posisi : 'Lowongan')}: ${lamBadge(a.status)}</span>`; }).join('')}</div>` : '')}
                        ${(c.mk || []).length ? '<div class="jp-unverified"><i class="fa-solid fa-circle-info"></i> Transkrip dibaca otomatis dari dokumen yang diunggah kandidat; belum dicocokkan dengan SIAKAD. Kemahiran bahasa diisi sendiri oleh kandidat.</div>' : ''}
                        <button class="jp-btn-sm ${sl ? 'primary' : ''}" data-short="${esc(c.id)}">
                            <i class="fa-${sl ? 'solid' : 'regular'} fa-bookmark"></i> ${sl ? 'Di-shortlist' : 'Tambah ke Shortlist'}
                        </button>
                    </div>`;
                }).join('');
            }
            document.getElementById('jpCandidateGrid').addEventListener('click', async (e) => {
                const b = e.target.closest('button[data-short]');
                if (!b) return;
                const id = b.dataset.short;
                const on = !JP.shortlist.includes(id);
                if (!JP.demo) {
                    const res = await apiRequest('jp_shortlist', {jobseeker_id: id, on});
                    if (!res || !res.success) return alert((res && res.message) || 'Gagal memperbarui shortlist.');
                }
                JP.shortlist = on ? [...JP.shortlist, id] : JP.shortlist.filter(x => x !== id);
                if (JP.demo) jpSaveDemo();
                showToast(on ? 'Kandidat ditambahkan ke shortlist' : 'Kandidat dihapus dari shortlist');
                jpRenderCandidates();
                jpRenderDashboard();
            });
            const jpLamOf = (cid) => JP.lamaran.filter(a => String(a.jobseeker_id) === String(cid));
            document.getElementById('jpCandidateGrid').addEventListener('change', async (e) => {
                const sel = e.target.closest('.jp-lam-sel');
                if (!sel) return;
                const a = JP.lamaran.find(x => String(x.lowongan_id) === sel.dataset.lamLow && String(x.jobseeker_id) === sel.dataset.lamJs);
                if (!a) return;
                const status = sel.value;
                if (!JP.demo) {
                    const res = await apiRequest('jp_lamaran_status', {lowongan_id: a.lowongan_id, jobseeker_id: a.jobseeker_id, status});
                    if (!res || !res.success) { sel.value = a.status; return alert((res && res.message) || 'Gagal memperbarui status.'); }
                }
                a.status = status;
                showToast(`Status lamaran: ${status}`);
                jpRenderCandidates();
                jpRenderDashboard();
            });
            ['jpFilterLowongan', 'jpFilterProdi', 'jpFilterSkor', 'jpHanyaShortlist', 'jpHanyaPelamar'].forEach(id =>
                document.getElementById(id).addEventListener('change', jpRenderCandidates));

            // ---------- Navigasi, dropdown sidebar & inisialisasi ----------
            function jpGoto(target) {
                const nav = [...document.querySelectorAll(`.sidebar-nav .nav-item[data-target="${target}"]`)].find(n => n.offsetParent !== null);
                if (nav) nav.click(); else showView(target);
            }
            document.querySelectorAll('.jp-goto').forEach(b => b.addEventListener('click', () => jpGoto(b.dataset.goto)));
            document.addEventListener('click', (e) => {
                const b = e.target.closest('.js-goto, .pr-goto, .js-goto-btn');
                if (b && b.dataset.goto) { e.preventDefault(); jpGoto(b.dataset.goto); }
            });
            document.querySelectorAll('.nav-group').forEach(g => {
                const t = g.querySelector('.nav-group-toggle');
                t.addEventListener('click', () => {
                    g.classList.toggle('open');
                    t.setAttribute('aria-expanded', g.classList.contains('open'));
                });
                g.querySelectorAll('.nav-sub-item').forEach(si => si.addEventListener('click', () => g.classList.add('open')));
            });

            function jpRenderAll() {
                jpRenderDashboard();
                jpRenderKompetensi();
                jpRenderLowForm();
                jpRenderLowList();
                jpRenderLowSelect();
                jpRenderCandidates();
            }
            async function initJobprovider() {
                await jpLoad();
                JP.form = {komp: [], bahasa: []};
                jpRenderAll();
            }

            // Tampilkan menu & halaman sesuai peran
            function applyRoleLayout() {
                const role = sessionStorage.getItem('c-dfs_user_role') || 'Jobseeker';
                document.body.dataset.role = role;
                const first = {Jobprovider: 'view-jp-dashboard', Dosen: 'view-dsn-ringkasan', Admin: 'view-adm-akun'}[role] || 'view-dashboard';
                document.querySelectorAll('.sidebar-nav .nav-item').forEach(n => n.classList.toggle('active', n.dataset.target === first));
                document.querySelectorAll('.view-section').forEach(v => v.classList.toggle('active', v.id === first));
                if (role === 'Jobprovider') initJobprovider();
                else if (role === 'Dosen') initDosen();
                else if (role === 'Admin') initAdmin();
                else initJobMatching();
            }

            // ==============================================================
            // 13. TAB PADA HALAMAN GABUNGAN
            // ==============================================================
            document.querySelectorAll('.page-tabs').forEach(bar => {
                bar.addEventListener('click', (e) => {
                    const btn = e.target.closest('.tab-btn');
                    if (!btn) return;
                    const g = bar.dataset.group;
                    bar.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
                    document.querySelectorAll(`.tab-panel[data-group="${g}"]`).forEach(p =>
                        p.classList.toggle('active', p.dataset.panel === btn.dataset.tab));
                    jalankanAnimasiAngka();
                });
            });

            // ==============================================================
            // 14. JOB MATCHING (Jobseeker)
            //     Upload transkrip & sertifikat -> deteksi otomatis -> analisis AI
            // ==============================================================
            const JM_DEMO_KEY = 'c-dfs_jm_demo_v2';
            // Bobot nilai mengikuti pedoman UM (A-=3,7; B+=3,3; dst.). Jika transkrip memuat nilai angka (NA), angka itu yang dipakai.
            const GRADE = {'A': 4, 'A-': 3.7, 'AB': 3.5, 'B+': 3.3, 'B': 3, 'B-': 2.7, 'BC': 2.5, 'C+': 2.3, 'C': 2, 'D': 1, 'E': 0};
            const bobot = (m) => (typeof m.na === 'number' && m.na >= 0 && m.na <= 4) ? m.na : (GRADE[m.nilai] ?? 0);
            const JM = { loaded: false, demo: false, aiEnabled: false, mk: [], mkMeta: {}, cert: [], bahasa: [], lowongan: [], lamaran: [], tampil: false, results: [], roles: [], sort: 'peluang', langPick: 'Inggris', langLevel: 'Intermediate' };
            // Kemahiran bahasa: bobot tiap tingkat
            const LEVEL_VAL = {'Basic': 0.4, 'Intermediate': 0.7, 'Advanced': 1};
            const LEVELS = Object.keys(LEVEL_VAL);

            // Lowongan contoh — hanya tampil saat PHP/MySQL belum aktif
            const JM_DEMO_LOWONGAN = [
                {id: 'd1', tipe: 'lowongan', posisi: 'Teknisi IoT', perusahaan: 'PT Contoh Elektronika', prodi: 'Teknologi Rekayasa Sistem Elektronika', lokasi: 'Malang', kompetensi: ['Rangkaian Elektronika', 'Mikrokontroler', 'Internet of Things (IoT)', 'PLC & Otomasi'], bahasa: [{nama: 'Inggris', level: 'Intermediate'}]},
                {id: 'd2', tipe: 'lowongan', posisi: 'Digital Marketing Staff', perusahaan: 'PT Contoh Niaga', prodi: 'Manajemen Pemasaran', lokasi: 'Surabaya', kompetensi: ['Digital Marketing', 'Riset Pasar', 'Penjualan (Sales)'], bahasa: [{nama: 'Inggris', level: 'Intermediate'}]},
                {id: 'd3', tipe: 'lowongan', posisi: 'Guru TK', perusahaan: 'TK Contoh Ceria', prodi: 'Pendidikan Guru Pendidikan Anak Usia Dini (PGPAUD)', lokasi: 'Malang', kompetensi: ['Perencanaan Pembelajaran PAUD', 'Asesmen Perkembangan Anak', 'Media Pembelajaran'], bahasa: []},
                {id: 'd4', tipe: 'lowongan', posisi: 'Guru Kelas SD', perusahaan: 'SD Contoh Cendekia', prodi: 'Pendidikan Guru Sekolah Dasar (PGSD)', lokasi: '', kompetensi: ['Perencanaan Pembelajaran SD', 'Asesmen Pembelajaran', 'Media Pembelajaran Digital'], bahasa: []}
            ];

            // Profil pekerjaan (kompetensi inti) untuk rekomendasi "cocok di pekerjaan apa".
            // Sesuaikan dengan profil lulusan / CPL masing-masing prodi.
            const JOB_ROLES = [
                {nama: 'Teknisi Elektronika', prodi: 'Teknologi Rekayasa Sistem Elektronika', kompetensi: ['Elektronika Analog', 'Elektronika Digital', 'Rangkaian Listrik', 'Pengukuran Elektronika', 'Pemeliharaan dan Perbaikan Perangkat Elektronika']},
                {nama: 'Embedded System Engineer', prodi: 'Teknologi Rekayasa Sistem Elektronika', kompetensi: ['Mikrokontroler', 'Embedded System', 'Algoritma dan Pemrograman', 'Elektronika Digital']},
                {nama: 'IoT Engineer', prodi: 'Teknologi Rekayasa Sistem Elektronika', kompetensi: ['Internet of Things', 'Sensor dan Transduser', 'Komputer dan Jaringan', 'Mikrokontroler']},
                {nama: 'Teknisi Instrumentasi & Kontrol', prodi: 'Teknologi Rekayasa Sistem Elektronika', kompetensi: ['Instrumentasi', 'Sistem Kendali', 'Sensor dan Transduser', 'PLC']},
                {nama: 'Digital Marketing Specialist', prodi: 'Manajemen Pemasaran', kompetensi: ['Digital Marketing', 'Media Sosial', 'Komunikasi Pemasaran', 'Periklanan']},
                {nama: 'Sales Executive', prodi: 'Manajemen Pemasaran', kompetensi: ['Penjualan', 'Negosiasi', 'Perilaku Konsumen', 'Komunikasi Bisnis']},
                {nama: 'Market Research Analyst', prodi: 'Manajemen Pemasaran', kompetensi: ['Riset Pasar', 'Riset Pemasaran', 'Statistika', 'Perilaku Konsumen']},
                {nama: 'Guru TK / PAUD', prodi: 'Pendidikan Guru Pendidikan Anak Usia Dini (PGPAUD)', kompetensi: ['Perencanaan Pembelajaran PAUD', 'Asesmen Perkembangan Anak', 'Manajemen Kelas', 'Media Pembelajaran']},
                {nama: 'Fasilitator Tumbuh Kembang Anak', prodi: 'Pendidikan Guru Pendidikan Anak Usia Dini (PGPAUD)', kompetensi: ['Psikologi Perkembangan Anak', 'Asesmen Perkembangan Anak', 'Kemitraan Orang Tua']},
                {nama: 'Guru Kelas SD', prodi: 'Pendidikan Guru Sekolah Dasar (PGSD)', kompetensi: ['Perencanaan Pembelajaran SD', 'Asesmen Pembelajaran', 'Manajemen Kelas', 'Pembelajaran Matematika SD']},
                {nama: 'Guru Pendamping Inklusi', prodi: 'Pendidikan Guru Sekolah Dasar (PGSD)', kompetensi: ['Pendidikan Inklusif', 'Perkembangan Peserta Didik', 'Asesmen Pembelajaran']},
                {nama: 'Pengembang Media Ajar SD', prodi: 'Pendidikan Guru Sekolah Dasar (PGSD)', kompetensi: ['Media Pembelajaran', 'Media Pembelajaran Digital', 'Perencanaan Pembelajaran SD']}
            ];
            const kodeProdi = (nama) => { if (nama === 'Semua Prodi') return 'Semua prodi'; for (const l of Object.values(PRODI_BY_JALUR)) { const p = l.find(x => x.nama === nama); if (p) return p.kode; } return nama || '-'; };
            const jalurOf = (nama) => Object.keys(PRODI_BY_JALUR).find(j => PRODI_BY_JALUR[j].some(p => p.nama === nama)) || '';

            // ---------- Pencocokan teks kompetensi ----------
            const STOP = new Set(['dan', 'atau', 'the', 'of', 'and', 'untuk', 'dengan', 'dalam', 'pada', 'dasar', 'lanjut', 'lanjutan', 'pengantar', 'praktik', 'praktikum', 'teori', 'sistem', 'teknik', 'manajemen', 'pengembangan', 'aplikasi', 'tenaga', 'mata', 'kuliah']);
            const tokens = (t) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ').filter(w => w.length >= 3 && !STOP.has(w));
            // Kata umum: tidak cukup sendirian untuk menyatakan cocok
            const WEAK = new Set(['digital', 'data', 'dasar', 'terapan', 'umum', 'modern', 'bisnis', 'industri', 'komputer', 'profesional', 'fundamentals', 'fundamental', 'kreatif', 'anak', 'matematika']);
            const same = (x, y) => x === y || (x.length >= 5 && y.length >= 5 && (x.includes(y) || y.includes(x)));
            // Skor kemiripan: 0 = tidak terkait; makin besar = makin banyak kata yang sama
            function relScore(a, b) {
                const ta = tokens(a), tb = tokens(b);
                if (!ta.length || !tb.length) return 0;
                const hits = ta.filter(x => tb.some(y => same(x, y)));
                const ok = hits.some(x => !WEAK.has(x)) || hits.length === ta.length;
                return ok ? hits.length / ta.length + hits.length / tb.length : 0;
            }
            const related = (a, b) => relScore(a, b) > 0;

            function jmIpk() {
                const sks = JM.mk.reduce((a, m) => a + Number(m.sks), 0);
                const mutu = JM.mk.reduce((a, m) => a + Number(m.sks) * bobot(m), 0);
                return {ipk: sks ? mutu / sks : 0, sks};
            }
            // Bukti untuk satu kompetensi dari dokumen (mata kuliah & sertifikat)
            // Profil Jobseeker yang sedang login (dipakai Job Matching)
            const profJM = () => ({prodi: sessionStorage.getItem('c-dfs_user_prodi') || '', mk: JM.mk, cert: JM.cert, bahasa: JM.bahasa});
            // Bukti untuk satu kompetensi dari transkrip, sertifikat, dan bahasa milik "prof"
            function evidenceFor(k, withProfil, prof = profJM()) {
                // Pilih bukti dengan nilai tertinggi; jika sama, pilih yang namanya paling mirip
                let best = {v: 0, r: 0, src: 'Belum ada bukti', mk: null};
                const consider = (v, r, src, mk) => { if (r > 0 && (v > best.v || (v === best.v && r > best.r))) best = {v, r, src, mk}; };
                (prof.mk || []).forEach(m => consider(bobot(m) / 4, relScore(k, m.nama), `MK ${m.nama} (${m.nilai})`, m.nama));
                (prof.cert || []).forEach(c => consider(c.jenis === 'BNSP' ? 1 : 0.8, relScore(k, c.nama), `Sertifikat ${c.jenis}: ${c.nama}`, null));
                (prof.bahasa || []).forEach(b => consider(LEVEL_VAL[b.level] || 0, relScore(k, `Bahasa ${b.nama}`), `Bahasa ${b.nama} (${b.level})`, null));
                // Tidak ada nilai otomatis dari profil prodi: kompetensi tanpa bukti di transkrip/sertifikat/bahasa bernilai 0
                return best;
            }
            // Persyaratan bahasa: terpenuhi bila tingkat Jobseeker >= tingkat minimal
            const normLang = (n) => String(n).toLowerCase().replace(/^bahasa\s+/, '').trim();
            function langReqEval(req, prof) {
                const have = (prof.bahasa || []).find(b => normLang(b.nama) === normLang(req.nama));
                if (!have) return {v: 0, src: 'Belum ada'};
                const hv = LEVEL_VAL[have.level] || 0, rv = LEVEL_VAL[req.level] || 1;
                return hv >= rv ? {v: 1, src: `Anda: ${have.level}`} : {v: Math.round(hv / rv * 60) / 100, src: `Anda: ${have.level} (kurang)`};
            }
            // Nilai seluruh kebutuhan (kompetensi + bahasa) terhadap satu profil
            function evalReq(req, prof, withProfil) {
                return (req.kompetensi || []).map(k => ({nama: k, tipe: 'kompetensi', ...evidenceFor(k, withProfil, prof)}))
                    .concat((req.bahasa || []).map(b => ({nama: `Bahasa ${b.nama} (min. ${b.level})`, tipe: 'bahasa', ...langReqEval(b, prof)})));
            }
            function jmAnalyze(low) {
                const prof = profJM();
                const detail = evalReq(low, prof, true);
                const avg = detail.length ? detail.reduce((a, d) => a + d.v, 0) / detail.length : 0;
                const prodiOk = !!prof.prodi && (prof.prodi === low.prodi || low.prodi === 'Semua Prodi');
                const kecocokan = Math.round((prodiOk ? 30 : 0) + 70 * avg);
                const {ipk} = jmIpk();
                const nB = JM.cert.filter(c => c.jenis === 'BNSP').length, nN = JM.cert.length - nB;
                const certStrength = Math.min(1, (nB + 0.5 * nN) / 2);
                const peluang = Math.round(0.55 * kecocokan + 25 * (ipk / 4) + 10 * certStrength + 10 * jmLangStrength());
                const kategori = peluang >= 75 ? 'Tinggi' : (peluang >= 50 ? 'Sedang' : 'Rendah');
                const status = kecocokan >= 75 ? 'Cocok' : (kecocokan >= 50 ? 'Cukup cocok' : 'Belum cocok');
                const bahasaReq = detail.filter(d => d.tipe === 'bahasa');
                return {low, detail, kecocokan, peluang, kategori, status, prodiOk,
                    bahasaOk: bahasaReq.every(d => d.v >= 1),
                    terpenuhi: detail.filter(d => d.v >= 0.5).map(d => d.nama),
                    kurang: detail.filter(d => d.v < 0.5).map(d => d.nama)};
            }
            // Kekuatan bahasa = tingkat tertinggi yang dimiliki (Basic 0,4 · Intermediate 0,7 · Advanced 1,0)
            function jmLangStrength() {
                return JM.bahasa.reduce((m, b) => Math.max(m, LEVEL_VAL[b.level] || 0), 0);
            }
            function jmRoles() {
                const prodi = sessionStorage.getItem('c-dfs_user_prodi') || '';
                const all = JOB_ROLES.map(r => {
                    const detail = r.kompetensi.map(k => ({nama: k, ...evidenceFor(k, false)}));
                    const skor = Math.round(100 * detail.reduce((a, d) => a + d.v, 0) / detail.length);
                    const dukung = [...new Set(detail.filter(d => d.v > 0).map(d => d.src))];
                    return {...r, skor, dukung, kurang: detail.filter(d => d.v === 0).map(d => d.nama), sendiri: r.prodi === prodi};
                }).sort((a, b) => b.skor - a.skor);
                const own = all.filter(r => r.sendiri);
                const other = all.filter(r => !r.sendiri && r.skor >= 50).slice(0, 1).map(r => ({...r, lintas: true}));
                return (own.length ? own : all.slice(0, 3)).concat(other).filter(r => r.skor > 0).slice(0, 5);
            }

            // ---------- Muat & simpan ----------
            async function jmLoad() {
                const res = await apiRequest('js_profile');
                if (res && res.success) {
                    JM.demo = false;
                    JM.aiEnabled = !!res.ai_enabled;
                    JM.mk = res.transkrip || [];
                    JM.mkMeta = res.transkrip_meta || {};
                    JM.cert = res.sertifikat || [];
                    JM.bahasa = res.bahasa || [];
                    JM.lowongan = res.lowongan || [];
                    JM.lamaran = res.lamaran || [];
                    JM.tampil = !!res.tampil;
                } else {
                    JM.demo = true;
                    JM.aiEnabled = false;
                    let saved = {};
                    try { saved = JSON.parse(sessionStorage.getItem(JM_DEMO_KEY) || '{}'); } catch (e) {}
                    JM.mk = saved.mk || [];
                    JM.mkMeta = saved.mkMeta || {};
                    JM.cert = saved.cert || [];
                    JM.bahasa = saved.bahasa || [];
                    JM.lowongan = JM_DEMO_LOWONGAN;
                    JM.lamaran = saved.lamaran || [];
                    JM.tampil = !!saved.tampil;
                }
                JM.loaded = true;
            }
            async function jmSave() {
                if (JM.demo) {
                    try { sessionStorage.setItem(JM_DEMO_KEY, JSON.stringify({mk: JM.mk, mkMeta: JM.mkMeta, cert: JM.cert, bahasa: JM.bahasa, tampil: JM.tampil, lamaran: JM.lamaran})); } catch (e) {}
                    return true;
                }
                const res = await apiRequest('js_profile_save', {transkrip: JM.mk, transkrip_meta: JM.mkMeta, sertifikat: JM.cert, bahasa: JM.bahasa, tampil: JM.tampil});
                if (!res || !res.success) { alert((res && res.message) || 'Gagal menyimpan data.'); return false; }
                return true;
            }

            // ---------- Membaca PDF di browser (pdf.js) ----------
            let pdfjsPromise = null;
            function loadPdfJs() {
                if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
                if (!pdfjsPromise) pdfjsPromise = new Promise((resolve, reject) => {
                    const sc = document.createElement('script');
                    sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
                    sc.onload = () => {
                        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                        resolve(window.pdfjsLib);
                    };
                    sc.onerror = () => { pdfjsPromise = null; reject(new Error('Pustaka pembaca PDF gagal dimuat (periksa koneksi internet).')); };
                    document.head.appendChild(sc);
                });
                return pdfjsPromise;
            }
            // Susun teks PDF menjadi baris berdasarkan posisi vertikal
            async function pdfLines(file) {
                const pdfjs = await loadPdfJs();
                const doc = await pdfjs.getDocument({data: new Uint8Array(await file.arrayBuffer())}).promise;
                const out = [];
                for (let n = 1; n <= Math.min(doc.numPages, 15); n++) {
                    const page = await doc.getPage(n);
                    const tc = await page.getTextContent();
                    const rows = [];
                    tc.items.forEach(it => {
                        if (!it.str || !it.str.trim()) return;
                        const x = it.transform[4], y = it.transform[5];
                        let row = rows.find(r => Math.abs(r.y - y) < 3);
                        if (!row) { row = {y, items: []}; rows.push(row); }
                        row.items.push({x, s: it.str.trim()});
                    });
                    rows.sort((a, b) => b.y - a.y).forEach(r => out.push(r.items.sort((a, b) => a.x - b.x).map(i => i.s).join(' ').replace(/\s+/g, ' ').trim()));
                }
                return out;
            }
            const fileToBase64 = (file) => new Promise((res, rej) => {
                const fr = new FileReader();
                fr.onload = () => res(String(fr.result).split(',')[1]);
                fr.onerror = rej;
                fr.readAsDataURL(file);
            });
            async function aiExtract(kind, file) {
                if (!JM.aiEnabled) return null;
                if (file.size > 5 * 1024 * 1024) { showToast('File terlalu besar untuk dibaca AI (maks. 5 MB)'); return null; }
                const res = await apiRequest('js_ai_extract', {kind, media_type: file.type || 'application/pdf', data: await fileToBase64(file)});
                return res && res.success && res.data ? res.data : null;
            }

            // ---------- Deteksi transkrip ----------
            const GRADE_RE = '(A-|AB|A|B\\+|B-|BC|B|C\\+|C|D|E)';
            // Mata kuliah umum/wajib universitas (tidak dihitung sebagai "nilai terbaik" bidang)
            const RE_UMUM = /^(UNIV|UKKN|MKU|MKDU|MPK|MKWU)/i;
            const NAMA_UMUM = /(agama|pancasila|kewarganegaraan|bahasa indonesia|kuliah kerja nyata|\bkkn\b|kemampuan kerjasama|etika profesi)/i;
            function parseTranskrip(lines) {
                const rows = [];
                const reKode = new RegExp('^\\d{1,3}\\s+([A-Z]{2,8}\\d{3,8})\\s+(.+?)\\s+(\\d{1,2})\\s+(?:(\\d(?:[.,]\\d{1,2})?)\\s+)?' + GRADE_RE + '(?:\\s|$)');
                const reUmum = new RegExp('^(?:\\d{1,3}\\s+)?(?:([A-Z]{2,8}\\d{3,8})\\s+)?([A-Za-z][^\\d]*?(?:\\s\\d)?)\\s+(\\d{1,2})\\s+(?:(\\d(?:[.,]\\d{1,2})?)\\s+)?' + GRADE_RE + '(?:\\s|$)');
                let prodiText = '', ipkDoc = null;
                lines.forEach(line => {
                    const pm = line.match(/Program\s*Studi\s*:?\s*(.+)/i);
                    if (pm && !prodiText) prodiText = pm[1].trim();
                    const im = line.match(/\bIPK\s*:?\s*([0-4](?:[.,]\d{1,2})?)\b/i);
                    if (im) ipkDoc = parseFloat(im[1].replace(',', '.'));
                    if (/^\s*IP[K]?\s*[\d.,]/i.test(line)) return;
                    const m = line.match(reKode) || line.match(reUmum);
                    if (!m) return;
                    const kode = m[1] || '', nama = m[2].replace(/\s+/g, ' ').trim(), sks = parseInt(m[3], 10);
                    const na = m[4] ? parseFloat(m[4].replace(',', '.')) : null, nilai = m[5].toUpperCase();
                    if (nama.length >= 3 && sks >= 1 && sks <= 8 && nilai in GRADE) {
                        const row = {nama, sks, nilai};
                        if (na !== null && na <= 4) row.na = na;
                        if (RE_UMUM.test(kode) || NAMA_UMUM.test(nama)) row.umum = true;
                        rows.push(row);
                    }
                });
                const prodi = matchProdi(prodiText);
                return {rows, prodiText, prodi, ipkDoc};
            }
            function matchProdi(text) {
                if (!text) return '';
                const t = text.toLowerCase();
                for (const l of Object.values(PRODI_BY_JALUR)) for (const p of l) {
                    const core = p.nama.toLowerCase().replace(/\s*\(.*\)\s*/, '');
                    if (t.includes(core) || new RegExp('\\b' + p.kode.toLowerCase() + '\\b').test(t)) return p.nama;
                }
                return '';
            }
            function applyDetectedProdi(prodi) {
                if (!prodi) return;
                const cur = sessionStorage.getItem('c-dfs_user_prodi') || '';
                if (cur === prodi) return;
                sessionStorage.setItem('c-dfs_user_jalur', jalurOf(prodi));
                sessionStorage.setItem('c-dfs_user_prodi', prodi);
                renderJobseekerDashboard();
                cdfsUpdateProdi(jalurOf(prodi), prodi);
                showToast(`Program Studi diatur otomatis: ${prodi}`);
            }

            async function handleTranskrip(file) {
                if (!file) return;
                const info = document.getElementById('jmTranskripInfo');
                info.classList.remove('is-hidden');
                info.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Membaca dokumen...';
                let hasil = null, sumber = '';
                try {
                    if (/pdf$/i.test(file.type) || /\.pdf$/i.test(file.name)) {
                        hasil = parseTranskrip(await pdfLines(file));
                        sumber = 'Deteksi otomatis';
                    }
                } catch (e) { console.warn(e); }
                if ((!hasil || !hasil.rows.length) && JM.aiEnabled) {
                    info.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Format tidak dikenali, dokumen dibaca oleh AI...';
                    const d = await aiExtract('transkrip', file);
                    if (d && Array.isArray(d.mata_kuliah)) {
                        hasil = {
                            rows: d.mata_kuliah.map(m => ({nama: String(m.nama || '').trim(), sks: parseInt(m.sks, 10) || 0, nilai: String(m.nilai || '').toUpperCase().trim()}))
                                .filter(m => m.nama && m.sks >= 1 && m.sks <= 8 && m.nilai in GRADE).map(m => NAMA_UMUM.test(m.nama) ? {...m, umum: true} : m),
                            prodiText: d.prodi || '', prodi: matchProdi(d.prodi || ''), ipkDoc: d.ipk ? Number(d.ipk) : null
                        };
                        sumber = 'Dibaca AI';
                    }
                }
                if (!hasil || !hasil.rows.length) {
                    info.innerHTML = `<div class="jm-detect-warn"><i class="fa-solid fa-triangle-exclamation"></i> Mata kuliah tidak terdeteksi dari <strong>${escHtml(file.name)}</strong>.
                        ${JM.aiEnabled ? 'Pastikan file adalah transkrip yang jelas.' : 'Pastikan PDF berupa teks (bukan hasil scan), atau isi API key AI di php/config.php agar dokumen scan bisa dibaca.'}
                        Anda juga bisa menambah mata kuliah secara manual di bagian bawah.</div>`;
                    document.getElementById('jmManual').open = true;
                    return;
                }
                JM.mk = hasil.rows;
                JM.mkMeta = {file: file.name, sumber, prodi_dokumen: hasil.prodiText, ipk_dokumen: hasil.ipkDoc};
                applyDetectedProdi(hasil.prodi);
                await jmSave();
                jmRenderMk();
                showToast(`${hasil.rows.length} mata kuliah terdeteksi`);
            }

            // ---------- Deteksi sertifikat ----------
            const RE_BNSP = /\bBNSP\b|Badan\s+Nasional\s+Sertifikasi\s+Profesi|Lembaga\s+Sertifikasi\s+Profesi|\bLSP\b|National\s+Professional\s+Certification\s+Agency/i;
            const cleanName = (n) => n.replace(/\.[a-z0-9]+$/i, '').replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim();
            function parseSertifikat(lines, fileName) {
                const text = lines.join('\n');
                const jenis = RE_BNSP.test(text) ? 'BNSP' : 'Non-BNSP';
                let nama = '', lembaga = '';
                // Urutan prioritas: Skema > Kualifikasi/Okupasi/Klaster > "Bidang/Unit Kompetensi :"
                const POLA = [
                    /(?:Skema(?:\s+Sertifikasi)?|Certification\s+Scheme|Scheme)\s*[:\-]\s*(.*)$/i,
                    /(?:Kualifikasi|Qualification|Okupasi|Occupation|Klaster|Cluster)\s*[:\-]\s*(.*)$/i,
                    /(?:Bidang|Unit)\s+Kompetensi\s*[:\-]\s*(.*)$/i
                ];
                for (const re of POLA) {
                    for (let i = 0; i < lines.length && !nama; i++) {
                        const m = lines[i].match(re);
                        if (m) { const v = (m[1] || '').trim(); nama = v.length >= 3 ? v : (lines[i + 1] || '').trim(); }
                    }
                    if (nama) break;
                }
                for (const l of lines) {
                    const lm = l.match(/(LSP\s+[A-Za-z0-9 .\-]{3,70}|Lembaga\s+Sertifikasi\s+Profesi\s+[A-Za-z0-9 .\-]{3,70})/i);
                    if (lm) { lembaga = lm[1].trim(); break; }
                }
                if (!nama) {
                    // Sertifikat umum: ambil baris setelah "Sertifikat / Certificate of ..." atau "telah menyelesaikan"
                    for (let i = 0; i < lines.length; i++) {
                        if (/(certificate\s+of|sertifikat|piagam|telah\s+(menyelesaikan|mengikuti|lulus)|has\s+(successfully\s+)?completed)/i.test(lines[i])) {
                            const after = lines[i].replace(/.*?(certificate\s+of\s+\w+|sertifikat|piagam|telah\s+(menyelesaikan|mengikuti|lulus)|has\s+(successfully\s+)?completed)\s*:?/i, '').trim();
                            nama = after.length >= 4 ? after : '';
                            if (nama) break;
                        }
                    }
                }
                return {nama: (nama || cleanName(fileName)).slice(0, 150), jenis, lembaga: lembaga.slice(0, 150)};
            }
            async function handleSertifikat(files) {
                for (const file of files) {
                    const item = {nama: cleanName(file.name), jenis: /bnsp|lsp/i.test(file.name) ? 'BNSP' : 'Non-BNSP', lembaga: '', file: file.name, sumber: 'Perlu dicek'};
                    JM.cert.push(item);
                    jmRenderCert(JM.cert.length - 1);
                    try {
                        let ok = false;
                        if (/pdf$/i.test(file.type) || /\.pdf$/i.test(file.name)) {
                            const lines = await pdfLines(file);
                            if (lines.join('').replace(/\s/g, '').length > 30) {
                                Object.assign(item, parseSertifikat(lines, file.name), {sumber: 'Deteksi otomatis'});
                                ok = true;
                            }
                        }
                        if (!ok && JM.aiEnabled) {
                            const d = await aiExtract('sertifikat', file);
                            if (d && d.nama) {
                                Object.assign(item, {nama: String(d.nama).slice(0, 150), jenis: d.jenis === 'BNSP' ? 'BNSP' : 'Non-BNSP', lembaga: String(d.lembaga || '').slice(0, 150), sumber: 'Dibaca AI'});
                                ok = true;
                            }
                        }
                    } catch (e) { console.warn(e); }
                    jmRenderCert();
                }
                await jmSave();
                showToast(`${files.length} sertifikat diproses`);
            }

            // ---------- Drag & drop ----------
            function setupDrop(zoneId, inputId, handler, multiple) {
                const zone = document.getElementById(zoneId), input = document.getElementById(inputId);
                input.addEventListener('change', () => { if (input.files.length) handler(multiple ? [...input.files] : input.files[0]); input.value = ''; });
                ['dragenter', 'dragover'].forEach(ev => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.add('drag'); }));
                ['dragleave', 'drop'].forEach(ev => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.remove('drag'); }));
                zone.addEventListener('drop', (e) => { const f = [...e.dataTransfer.files]; if (f.length) handler(multiple ? f : f[0]); });
            }
            setupDrop('jmDropTranskrip', 'jmFileTranskrip', handleTranskrip, false);
            setupDrop('jmDropCert', 'jmFileCert', handleSertifikat, true);

            // ---------- Render ----------
            function jmRefreshStats() {
                const prodi = sessionStorage.getItem('c-dfs_user_prodi') || '';
                const jalur = sessionStorage.getItem('c-dfs_user_jalur') || '';
                document.getElementById('jmStatProdi').textContent = prodi ? kodeProdi(prodi) : '-';
                document.getElementById('jmStatJalur').textContent = prodi ? `${jalur} · ${prodi}` : 'Terdeteksi dari transkrip';
                const {ipk, sks} = jmIpk();
                document.getElementById('jmStatIpk').textContent = ipk.toFixed(2).replace('.', ',');
                document.getElementById('jmStatSks').textContent = `${sks} SKS · ${JM.mk.length} mata kuliah`;
                const nB = JM.cert.filter(c => c.jenis === 'BNSP').length;
                document.getElementById('jmStatCert').textContent = JM.cert.length + JM.bahasa.length;
                document.getElementById('jmStatCertDetail').textContent = `${nB} BNSP · ${JM.cert.length - nB} Non-BNSP · ${JM.bahasa.length} bahasa`;
                document.getElementById('jmStatLowongan').textContent = `dari ${JM.lowongan.length} lowongan${JM.demo ? ' (contoh)' : ''}`;
                if (JM.loaded) jsRenderDash();
            }
            function bestCourses(n) {
                const bidang = JM.mk.filter(m => !m.umum);
                return [...(bidang.length ? bidang : JM.mk)].sort((a, b) => (bobot(b) - bobot(a)) || (b.sks - a.sks)).slice(0, n);
            }
            // Status verifikasi transkrip: terbaca otomatis dari PDF/AI vs diisi manual
            const SUMBER_VERIF = ['Deteksi otomatis', 'Dibaca AI', 'Data contoh'];
            function jmVerifBadge() {
                const man = JM.mk.filter(m => m.manual).length;
                const auto = SUMBER_VERIF.includes((JM.mkMeta || {}).sumber);
                if (auto && !man) return '<span class="ok"><i class="fa-solid fa-shield-halved"></i> Terverifikasi otomatis dari dokumen</span>';
                if (auto) return `<span class="warn"><i class="fa-solid fa-pen"></i> ${man} MK diisi manual: ditandai untuk perusahaan dan tidak dihitung dalam analisis prodi</span>`;
                return '<span class="warn"><i class="fa-solid fa-pen"></i> Diisi manual: belum terverifikasi, tidak dihitung dalam analisis prodi</span>';
            }
            function jmRenderMk() {
                const body = document.getElementById('jmMkBody');
                document.getElementById('jmMkCount').textContent = JM.mk.length;
                body.innerHTML = JM.mk.length ? JM.mk.map((m, i) => {
                    const g = bobot(m);
                    const cls = g >= 3.5 ? 'g-hi' : (g >= 2.5 ? 'g-mid' : 'g-lo');
                    return `<tr><td>${escHtml(m.nama)}${m.umum ? ' <span class="jm-umum">umum</span>' : ''}${m.manual ? ' <span class="jm-man-tag" title="Diisi manual, belum terverifikasi">manual</span>' : ''}</td><td class="text-center">${escHtml(m.sks)}</td>
                        <td class="text-center"><span class="jm-grade ${cls}">${escHtml(m.nilai)}</span></td>
                        <td class="text-center"><button class="jm-icon-btn" data-del-mk="${i}" aria-label="Hapus ${escHtml(m.nama)}"><i class="fa-regular fa-trash-can"></i></button></td></tr>`;
                }).join('') : '<tr><td colspan="4" class="text-center jp-muted" style="padding:20px;">Belum ada data. Upload transkrip PDF di atas.</td></tr>';

                const info = document.getElementById('jmTranskripInfo');
                const dropSt = document.getElementById('jmDropTranskripStatus');
                document.getElementById('jmDropTranskrip').classList.toggle('done', JM.mk.length > 0);
                dropSt.innerHTML = JM.mk.length ? `<i class="fa-solid fa-circle-check"></i> ${JM.mk.length} mata kuliah · ${escHtml(JM.mkMeta.sumber || 'Input manual')} — klik untuk ganti` : 'Klik atau seret file ke sini';
                if (JM.mk.length) {
                    const {ipk, sks} = jmIpk();
                    const meta = JM.mkMeta || {};
                    const ipkDoc = meta.ipk_dokumen;
                    const cocokIpk = ipkDoc ? Math.abs(ipkDoc - ipk) < 0.02 : null;
                    info.classList.remove('is-hidden');
                    info.innerHTML = `
                        <div class="jm-detect-ok">
                            <i class="fa-solid fa-circle-check"></i>
                            <div>
                                <strong>${JM.mk.length} mata kuliah · ${sks} SKS terdeteksi</strong>${meta.file ? ` dari <em>${escHtml(meta.file)}</em>` : ''}
                                <div class="jm-detect-meta">
                                    ${meta.prodi_dokumen ? `<span><i class="fa-solid fa-graduation-cap"></i> ${escHtml(meta.prodi_dokumen)}</span>` : ''}
                                    <span><i class="fa-solid fa-calculator"></i> IPK dihitung ${ipk.toFixed(2).replace('.', ',')}</span>
                                    ${jmVerifBadge()}
                                    ${ipkDoc ? `<span class="${cocokIpk ? 'ok' : 'warn'}"><i class="fa-solid ${cocokIpk ? 'fa-check' : 'fa-triangle-exclamation'}"></i> IPK di dokumen ${String(ipkDoc).replace('.', ',')}${cocokIpk ? ' (sesuai)' : ' (berbeda, cek data)'}</span>` : ''}
                                </div>
                            </div>
                        </div>`;
                    document.getElementById('jmBestBox').classList.remove('is-hidden');
                    document.getElementById('jmBestList').innerHTML = bestCourses(6).map(m => `
                        <div class="jm-best-item"><span class="jm-grade g-hi">${escHtml(m.nilai)}</span><span class="nm">${escHtml(m.nama)}</span><span class="sks">${escHtml(m.sks)} SKS</span></div>`).join('');
                } else {
                    info.classList.add('is-hidden');
                    document.getElementById('jmBestBox').classList.add('is-hidden');
                }
                jmRefreshStats();
            }
            function jmRenderCert() {
                const box = document.getElementById('jmCertListView');
                document.getElementById('jmCertWrap').classList.toggle('is-hidden', !JM.cert.length);
                document.getElementById('jmDropCert').classList.toggle('done', JM.cert.length > 0);
                document.getElementById('jmDropCertStatus').innerHTML = JM.cert.length
                    ? `<i class="fa-solid fa-circle-check"></i> ${JM.cert.length} sertifikat — klik untuk menambah` : 'Klik atau seret file ke sini';
                box.innerHTML = JM.cert.length ? JM.cert.map((c, i) => `
                    <div class="jm-cert">
                        <div class="jm-cert-main">
                            <select class="jm-cert-jenis ${c.jenis === 'BNSP' ? 'bnsp' : 'non'}" data-i="${i}" aria-label="Jenis sertifikat">
                                <option ${c.jenis === 'BNSP' ? 'selected' : ''}>BNSP</option><option ${c.jenis !== 'BNSP' ? 'selected' : ''}>Non-BNSP</option>
                            </select>
                            <input class="jm-cert-nama" data-i="${i}" value="${escHtml(c.nama)}" aria-label="Nama sertifikat" list="jmCertList" />
                            <button class="jm-icon-btn" data-del-cert="${i}" aria-label="Hapus ${escHtml(c.nama)}"><i class="fa-regular fa-trash-can"></i></button>
                        </div>
                        <div class="jm-cert-meta">
                            <span class="src ${c.sumber === 'Perlu dicek' ? 'warn' : ''}">${escHtml(c.sumber || 'Manual')}</span>
                            ${c.lembaga ? `<span>${escHtml(c.lembaga)}</span>` : ''}
                            ${c.file ? `<span class="file"><i class="fa-regular fa-file"></i> ${escHtml(c.file)}</span>` : ''}
                        </div>
                    </div>`).join('') : '<p class="jp-muted" style="text-align:center;padding:10px;">Belum ada sertifikat.</p>';
                jmRefreshStats();
            }
            document.getElementById('jmCertListView').addEventListener('change', async (e) => {
                const i = e.target.dataset.i;
                if (i === undefined) return;
                if (e.target.classList.contains('jm-cert-jenis')) JM.cert[i].jenis = e.target.value;
                if (e.target.classList.contains('jm-cert-nama')) JM.cert[i].nama = e.target.value.trim().slice(0, 150);
                JM.cert[i].sumber = 'Dikoreksi manual';
                jmRenderCert();
                await jmSave();
            });
            document.getElementById('jmCertListView').addEventListener('click', async (e) => {
                const b = e.target.closest('[data-del-cert]');
                if (b) { JM.cert.splice(+b.dataset.delCert, 1); jmRenderCert(); await jmSave(); }
            });
            document.getElementById('formJmMk').addEventListener('submit', async (e) => {
                e.preventDefault();
                const nama = document.getElementById('jmMkNama').value.trim();
                if (!nama) return;
                JM.mk.push({nama, sks: Math.max(1, parseInt(document.getElementById('jmMkSks').value, 10) || 1), nilai: document.getElementById('jmMkNilai').value, manual: true});
                if (!JM.mkMeta.sumber) JM.mkMeta.sumber = 'Input manual';
                document.getElementById('jmMkNama').value = '';
                jmRenderMk();
                await jmSave();
            });
            document.getElementById('jmMkBody').addEventListener('click', async (e) => {
                const b = e.target.closest('[data-del-mk]');
                if (b) { JM.mk.splice(+b.dataset.delMk, 1); jmRenderMk(); await jmSave(); }
            });

            // ---------- Kemahiran bahasa ----------
            const langOther = document.getElementById('jmLangOther');
            document.querySelectorAll('#jmLangPick .seg-btn').forEach(b => b.addEventListener('click', () => {
                JM.langPick = b.dataset.lang;
                document.querySelectorAll('#jmLangPick .seg-btn').forEach(x => x.classList.toggle('active', x === b));
                langOther.classList.toggle('is-hidden', JM.langPick !== '__lain');
                if (JM.langPick === '__lain') langOther.focus();
            }));
            document.querySelectorAll('#jmLangLevel .seg-btn').forEach(b => b.addEventListener('click', () => {
                JM.langLevel = b.dataset.level;
                document.querySelectorAll('#jmLangLevel .seg-btn').forEach(x => x.classList.toggle('active', x === b));
            }));
            async function jmAddLang() {
                let nama = JM.langPick === '__lain' ? langOther.value.trim() : JM.langPick;
                nama = nama.replace(/^bahasa\s+/i, '').replace(/\s+/g, ' ').slice(0, 40);
                if (!nama) { langOther.focus(); return showToast('Tulis nama bahasanya terlebih dahulu'); }
                nama = nama.charAt(0).toUpperCase() + nama.slice(1);
                const ada = JM.bahasa.find(b => b.nama.toLowerCase() === nama.toLowerCase());
                if (ada) ada.level = JM.langLevel; else JM.bahasa.push({nama, level: JM.langLevel});
                langOther.value = '';
                jmRenderLang();
                await jmSave();
                showToast(ada ? `Tingkat bahasa ${nama} diperbarui` : `Bahasa ${nama} ditambahkan`);
            }
            document.getElementById('jmLangAdd').addEventListener('click', jmAddLang);
            langOther.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); jmAddLang(); } });
            function jmRenderLang() {
                const box = document.getElementById('jmLangList');
                box.innerHTML = JM.bahasa.map((b, i) => `
                    <div class="jm-lang-item">
                        <i class="fa-solid fa-language"></i>
                        <strong>${escHtml(b.nama)}</strong>
                        <select class="jm-lang-sel lv-${escHtml(b.level.toLowerCase())}" data-i="${i}" aria-label="Tingkat ${escHtml(b.nama)}">
                            ${LEVELS.map(l => `<option ${l === b.level ? 'selected' : ''}>${l}</option>`).join('')}
                        </select>
                        <button class="jm-icon-btn" data-del-lang="${i}" aria-label="Hapus ${escHtml(b.nama)}"><i class="fa-regular fa-trash-can"></i></button>
                    </div>`).join('');
                jmRefreshStats();
            }
            document.getElementById('jmLangList').addEventListener('change', async (e) => {
                const i = e.target.dataset.i;
                if (i === undefined) return;
                JM.bahasa[i].level = e.target.value;
                jmRenderLang();
                await jmSave();
            });
            document.getElementById('jmLangList').addEventListener('click', async (e) => {
                const b = e.target.closest('[data-del-lang]');
                if (b) { JM.bahasa.splice(+b.dataset.delLang, 1); jmRenderLang(); await jmSave(); }
            });

            // ---------- Hasil analisis ----------
            function jmLocalNarrative() {
                const prodi = sessionStorage.getItem('c-dfs_user_prodi') || '-';
                const {ipk} = jmIpk();
                const top = JM.results[0];
                const tinggi = JM.results.filter(r => r.kategori === 'Tinggi');
                const best = bestCourses(3).map(m => `${m.nama} (${m.nilai})`).join(', ');
                const roles = JM.roles.filter(r => !r.lintas).slice(0, 2).map(r => `**${r.nama}** (${r.skor}%)`).join(' dan ');
                const relevan = JM.results.filter(r => r.prodiOk);
                const kurang = [...new Set((relevan.length ? relevan : JM.results.slice(0, 1)).flatMap(r => r.kurang))].slice(0, 3);
                let t = `Transkrip menunjukkan IPK ${ipk.toFixed(2).replace('.', ',')} dengan nilai terbaik pada ${best || '-'}. `;
                t += `Sertifikat: ${JM.cert.length ? JM.cert.map(c => `${c.nama} (${c.jenis})`).join(', ') : 'belum ada'}. `;
                t += `Kemahiran bahasa: ${JM.bahasa.length ? JM.bahasa.map(b => `${b.nama} (${b.level})`).join(', ') : 'belum diisi'}.`;
                t += '\n\n';
                if (roles) t += `Berdasarkan data Anda, Anda paling cocok bekerja sebagai ${roles}. `;
                const nmTop = top ? (top.low.posisi ? `${top.low.posisi} di ${top.low.perusahaan}` : top.low.perusahaan) : '';
                if (top) t += tinggi.length ? `Ada **${tinggi.length} lowongan dengan skor kesiapan tinggi**; yang paling relevan adalah **${nmTop}** (${top.status.toLowerCase()}, kecocokan ${top.kecocokan}%, skor kesiapan ${top.peluang}%).`
                    : `Lowongan paling relevan saat ini adalah **${nmTop}** (${top.status.toLowerCase()}, kecocokan ${top.kecocokan}%, skor kesiapan ${top.peluang}%).`;
                else t += 'Belum ada lowongan dari Jobprovider untuk dicocokkan.';
                t += '\n\n';
                const langkah = [];
                kurang.forEach(k => langkah.push(`Perkuat kompetensi ${k} melalui mata kuliah pilihan, proyek, atau pelatihan.`));
                if (!JM.cert.some(c => c.jenis === 'BNSP')) langkah.push('Ambil sertifikasi BNSP pada skema yang sesuai bidang Anda untuk menaikkan skor kesiapan.');
                if (!JM.bahasa.some(b => b.level === 'Advanced')) langkah.push(JM.bahasa.length ? 'Tingkatkan kemahiran bahasa asing ke level Advanced (mis. dengan tes TOEFL/IELTS, JLPT, atau Goethe) untuk menaikkan peluang.' : 'Isi kemahiran bahasa asing Anda; kemampuan bahasa ikut menaikkan skor peluang.');
                if (langkah.length) t += 'Langkah berikutnya:\n' + langkah.slice(0, 3).map(l => `- ${l}`).join('\n');
                return t;
            }
            function jmMd(text) {
                const blocks = escHtml(text).split(/\n{2,}/);
                return blocks.map(b => {
                    const lines = b.split('\n');
                    const isLi = (l) => /^\s*[-*•]\s+/.test(l);
                    const li = (l) => `<li>${l.replace(/^\s*[-*•]\s+/, '')}</li>`;
                    if (lines.every(isLi)) return '<ul>' + lines.map(li).join('') + '</ul>';
                    if (lines.length > 1 && lines.slice(1).every(isLi)) return `<p>${lines[0]}</p><ul>` + lines.slice(1).map(li).join('') + '</ul>';
                    return '<p>' + lines.join('<br>') + '</p>';
                }).join('').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
            }
            function jmRenderRoles() {
                const grid = document.getElementById('jmRoleGrid');
                grid.innerHTML = JM.roles.length ? JM.roles.map((r, i) => `
                    <div class="jm-role ${i === 0 ? 'best' : ''}">
                        <div class="jm-role-head">
                            <div><strong>${escHtml(r.nama)}</strong><span>${r.lintas ? 'Alternatif lintas prodi · ' : ''}${escHtml(kodeProdi(r.prodi))}</span></div>
                            <div class="jm-role-score">${r.skor}%</div>
                        </div>
                        <div class="jm-bar"><div style="width:${r.skor}%"></div></div>
                        <div class="jm-role-ev">${r.dukung.slice(0, 4).map(d => `<span>${escHtml(d)}</span>`).join('')}</div>
                        ${r.kurang.length ? `<div class="jm-role-gap">Belum terlihat: ${r.kurang.map(escHtml).join(', ')}</div>` : ''}
                    </div>`).join('')
                    : '<div class="jp-empty-block" style="grid-column:1/-1;"><i class="fa-solid fa-briefcase"></i>Belum ada mata kuliah atau sertifikat yang terkait dengan profil pekerjaan.</div>';
            }
            function jmRenderResults() {
                const grid = document.getElementById('jmJobGrid');
                const rows = [...JM.results].sort((a, b) => b[JM.sort] - a[JM.sort]);
                document.getElementById('jmStatTinggi').textContent = JM.results.filter(r => r.kategori === 'Tinggi').length;
                if (!rows.length) {
                    grid.innerHTML = '<div class="jp-empty-block" style="grid-column:1/-1;"><i class="fa-solid fa-briefcase"></i>Belum ada lowongan dari Jobprovider. Lowongan muncul setelah Jobprovider mengisi menu Kelola Lowongan atau Kebutuhan Kompetensi Umum.</div>';
                    return;
                }
                grid.innerHTML = rows.map((r, i) => {
                    const L = r.low, isLow = L.tipe === 'lowongan';
                    const stCls = r.status === 'Cocok' ? (r.bahasaOk ? 'ok' : 'mid') : (r.status === 'Cukup cocok' ? 'mid' : 'no');   // kuning bila syarat bahasa belum terpenuhi
                    return `
                    <div class="jm-job ${i === 0 ? 'best' : ''}">
                        <div class="jm-job-top">
                            <div>
                                <span class="jm-job-type ${isLow ? 'low' : ''}">${isLow ? 'Lowongan' : 'Kebutuhan kompetensi'}</span>
                                <div class="jm-job-co">${escHtml(isLow ? L.posisi : L.perusahaan)}${JM.demo ? '<span class="jp-demo-badge">DATA CONTOH</span>' : ''}</div>
                                <div class="jm-job-sub">${isLow ? `<i class="fa-solid fa-building"></i> ${escHtml(L.perusahaan)} · ` : ''}${escHtml(kodeProdi(L.prodi))}${L.lokasi ? ` · ${escHtml(L.lokasi)}` : ''}${r.prodiOk ? ' · <span style="color:#16a34a;font-weight:600;">sesuai prodi Anda</span>' : ''}</div>
                            </div>
                            <span class="jm-chance ${r.kategori.toLowerCase()}">Kesiapan ${r.kategori}</span>
                        </div>
                        <div class="jm-verdict ${stCls}"><i class="fa-solid ${stCls === 'ok' ? 'fa-circle-check' : (stCls === 'mid' ? 'fa-circle-half-stroke' : 'fa-circle-xmark')}"></i> ${r.status} dengan ${isLow ? 'lowongan ini' : 'kebutuhan perusahaan ini'}${(L.bahasa || []).length ? ` · syarat bahasa ${r.bahasaOk ? 'terpenuhi' : 'belum terpenuhi'}` : ''}</div>
                        <div class="jm-scores">
                            <div class="jm-score-box"><span>Kecocokan</span><strong>${r.kecocokan}%</strong><div class="jm-bar"><div style="width:${r.kecocokan}%"></div></div></div>
                            <div class="jm-score-box"><span>Skor Kesiapan</span><strong>${r.peluang}%</strong><div class="jm-bar peluang"><div style="width:${r.peluang}%"></div></div></div>
                        </div>
                        <div class="jm-komp-list">
                            ${r.detail.map(d => `<div class="jm-komp ${d.v >= 0.5 ? '' : 'miss'}">
                                <i class="fa-solid ${d.v >= 0.5 ? 'fa-circle-check ok' : 'fa-circle-xmark no'}"></i>
                                <span>${d.tipe === 'bahasa' ? '<i class="fa-solid fa-language jm-lang-ic"></i> ' : ''}${escHtml(d.nama)}</span><span class="src">${escHtml(d.src)}${(() => { const m = d.mk && d.v > 0 ? cpmkOfMk(d.mk) : null; return m ? ` <span class="cpmk-tag" title="${escHtml(m.deskripsi)}">${escHtml(m.cpl)} · ${escHtml(m.kode)}: ${escHtml(m.deskripsi)}</span>` : ''; })()}</span></div>`).join('')}
                        </div>
                        ${isLow ? `<div class="jm-job-actions">${lamarBtnHtml(L)}</div>` : ''}
                        ${r.kurang.length ? `<div class="jm-tip"><i class="fa-solid fa-lightbulb"></i> Perkuat <strong>${r.kurang.slice(0, 2).map(escHtml).join('</strong> dan <strong>')}</strong> melalui mata kuliah pilihan, pelatihan, kursus bahasa, atau sertifikasi BNSP pada skema terkait.</div>` : '<div class="jm-tip"><i class="fa-solid fa-star"></i> Semua kebutuhan sudah didukung bukti dari transkrip, sertifikat, atau kemahiran bahasa Anda.</div>'}
                    </div>`;
                }).join('');
            }
            document.querySelectorAll('#jmSort .seg-btn').forEach(b => b.addEventListener('click', () => {
                JM.sort = b.dataset.sort;
                document.querySelectorAll('#jmSort .seg-btn').forEach(x => x.classList.toggle('active', x === b));
                jmRenderResults();
            }));

            document.getElementById('jmRunBtn').addEventListener('click', async () => {
                if (!JM.mk.length) { showToast('Upload transkrip nilai (PDF) di Profil Kompetensi terlebih dahulu.'); jpGoto('view-profil'); return; }
                if (!sessionStorage.getItem('c-dfs_user_prodi')) return alert('Program studi belum terdeteksi. Pilih program studi di halaman Dashboard.');
                const btn = document.getElementById('jmRunBtn');
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menganalisis...';
                try {
                    if (!(await jmSave())) return;
                    if (!JM.demo) { const fresh = await apiRequest('js_profile'); if (fresh && fresh.success) JM.lowongan = fresh.lowongan || []; }
                    JM.results = JM.lowongan.map(jmAnalyze).sort((a, b) => b.peluang - a.peluang);
                    JM.roles = jmRoles();
                    jmRefreshStats();
                    document.getElementById('jmResults').classList.remove('is-hidden');
                    jmRenderRoles();
                    jmRenderResults();

                    const aiText = document.getElementById('jmAiText');
                    const src = document.getElementById('jmAiSource');
                    aiText.innerHTML = '<p class="jp-muted"><i class="fa-solid fa-spinner fa-spin"></i> AI sedang menyusun analisis...</p>';
                    let ai = null;
                    if (!JM.demo && JM.aiEnabled) {
                        const {ipk, sks} = jmIpk();
                        ai = await apiRequest('js_ai_analisis', {
                            prodi: sessionStorage.getItem('c-dfs_user_prodi'), ipk: +ipk.toFixed(2), sks,
                            nilai_terbaik: bestCourses(8),
                            sertifikat: JM.cert.map(c => ({nama: c.nama, jenis: c.jenis, lembaga: c.lembaga})),
                            bahasa: JM.bahasa,
                            pekerjaan_cocok: JM.roles.map(r => ({pekerjaan: r.nama, skor: r.skor, bukti: r.dukung.slice(0, 4), belum_terlihat: r.kurang})),
                            lowongan: JM.results.slice(0, 5).map(r => ({jenis: r.low.tipe === 'lowongan' ? 'lowongan' : 'kebutuhan kompetensi',
                                posisi: r.low.posisi || null, perusahaan: r.low.perusahaan, prodi_lowongan: r.low.prodi, lokasi: r.low.lokasi || null,
                                syarat_bahasa: r.low.bahasa || [], status_kecocokan: r.status,
                                kecocokan: r.kecocokan, skor_kesiapan: r.peluang, kategori_kesiapan: r.kategori, terpenuhi: r.terpenuhi, kurang: r.kurang}))
                        });
                    }
                    if (ai && ai.success && ai.ai && ai.text) {
                        aiText.innerHTML = jmMd(ai.text);
                        src.textContent = 'Dibuat oleh AI (Claude)';
                    } else {
                        aiText.innerHTML = jmMd(jmLocalNarrative());
                        src.textContent = JM.aiEnabled ? 'Ringkasan otomatis (AI tidak terhubung)' : 'Ringkasan otomatis';
                    }
                    document.getElementById('jmResults').scrollIntoView({behavior: 'smooth', block: 'start'});
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Analisis dengan AI';
                }
            });


            // ---------- Lamaran & Dashboard Jobseeker ----------
            const LAM_INFO = {
                Dikirim: ['lam-dikirim', 'fa-paper-plane', 'Terkirim, menunggu ditinjau perusahaan'],
                Ditinjau: ['lam-ditinjau', 'fa-magnifying-glass', 'Sedang ditinjau perusahaan'],
                Diundang: ['lam-diundang', 'fa-calendar-check', 'Diundang ke tahap seleksi / wawancara'],
                Diterima: ['lam-diterima', 'fa-circle-check', 'Selamat, Anda diterima'],
                Ditolak: ['lam-ditolak', 'fa-circle-xmark', 'Belum berhasil untuk lowongan ini']
            };
            const lamInfo = (st) => LAM_INFO[st] || LAM_INFO.Dikirim;
            const lamBadge = (st) => `<span class="lam-badge ${lamInfo(st)[0]}"><i class="fa-solid ${lamInfo(st)[1]}"></i> ${escHtml(st)}</span>`;
            const jmLamFor = (id) => JM.lamaran.find(a => String(a.lowongan_id) === String(id));
            const fmtTgl = (v) => { const d = new Date(String(v || '').replace(' ', 'T')); return isNaN(d) ? '' : d.toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'}); };
            function lamarBtnHtml(L) {
                if (L.tipe !== 'lowongan') return '';
                const a = jmLamFor(L.id);
                return a ? `<span class="jp-muted">Lamaran Anda:</span> ${lamBadge(a.status)}`
                    : `<button type="button" class="jp-btn-sm primary" data-lamar="${escHtml(L.id)}"><i class="fa-solid fa-paper-plane"></i> Lamar</button>`;
            }
            async function jmLamar(id) {
                const L = JM.lowongan.find(l => String(l.id) === String(id));
                if (!L || jmLamFor(id)) return;
                if (!JM.mk.length) { showToast('Upload transkrip nilai di Profil Kompetensi sebelum melamar'); jpGoto('view-profil'); return; }
                if (!confirm(`Kirim lamaran untuk "${L.posisi}" di ${L.perusahaan}?\nPerusahaan ini akan dapat melihat profil, transkrip, sertifikat, dan kemahiran bahasa Anda.`)) return;
                let item = {lowongan_id: L.id, status: 'Dikirim', updated_at: new Date().toISOString(), posisi: L.posisi, perusahaan: L.perusahaan};
                if (!JM.demo) {
                    const res = await apiRequest('js_lamar', {lowongan_id: L.id});
                    if (!res || !res.success) return alert((res && res.message) || 'Gagal mengirim lamaran.');
                    item = res.lamaran;
                }
                JM.lamaran.unshift(item);
                if (JM.demo) await jmSave();
                showToast(`Lamaran terkirim ke ${L.perusahaan}`);
                if (JM.results.length) jmRenderResults();
                jsRenderDash();
            }
            document.addEventListener('click', (e) => {
                const b = e.target.closest('[data-lamar]');
                if (b) { e.preventDefault(); jmLamar(b.dataset.lamar); }
            });
            document.getElementById('jmTampil').addEventListener('change', async (e) => {
                JM.tampil = e.target.checked;
                if (await jmSave()) showToast(JM.tampil ? 'Profil Anda kini dapat dilihat perusahaan' : 'Profil hanya terlihat oleh perusahaan yang Anda lamar');
                jsRenderDash();
            });

            function jsRenderDash() {
                if ((sessionStorage.getItem('c-dfs_user_role') || '') !== 'Jobseeker') return;
                const set = (id, v) => { document.getElementById(id).textContent = v; };
                const prodi = sessionStorage.getItem('c-dfs_user_prodi') || '';
                const {ipk, sks} = jmIpk();
                set('jsDashIpk', JM.mk.length ? ipk.toFixed(2).replace('.', ',') : '-');
                set('jsDashIpkDesc', JM.mk.length ? `${sks} SKS · ${JM.mk.length} mata kuliah` : 'Upload transkrip di Job Matching');
                const nB = JM.cert.filter(c => c.jenis === 'BNSP').length;
                set('jsDashCert', JM.cert.length + JM.bahasa.length);
                set('jsDashCertDesc', `${JM.cert.length} sertifikat (${nB} BNSP) · ${JM.bahasa.length} bahasa`);
                const semua = JM.lowongan.filter(l => l.tipe === 'lowongan');
                const lows = semua.filter(l => l.prodi === prodi || l.prodi === 'Semua Prodi');
                set('jsDashLow', prodi ? lows.length : '-');
                set('jsDashLowDesc', prodi ? `dari ${semua.length} lowongan aktif${JM.demo ? ' (contoh)' : ''}` : 'pilih program studi dahulu');
                set('jsDashLam', JM.lamaran.length);
                const per = Object.keys(LAM_INFO).map(st => [st, JM.lamaran.filter(a => a.status === st).length]).filter(x => x[1]);
                set('jsDashLamDesc', per.length ? per.map(([st, n]) => `${n} ${st.toLowerCase()}`).join(' · ') : 'belum ada lamaran');

                const steps = [
                    {ok: !!prodi, t: 'Pilih program studi', d: 'Di kartu paling atas Beranda, atau otomatis dari transkrip'},
                    {ok: JM.mk.length > 0, t: 'Upload transkrip nilai', d: 'PDF transkrip dibaca otomatis', go: 'view-profil'},
                    {ok: JM.cert.length + JM.bahasa.length > 0, t: 'Sertifikat & bahasa', d: 'Opsional, menaikkan skor kesiapan', go: 'view-profil'},
                    {ok: JM.lamaran.length > 0, t: 'Cek kecocokan & lamar', d: 'Lihat skor lalu kirim lamaran', go: 'view-jobmatch'}
                ];
                const done = steps.filter(x => x.ok).length;
                document.getElementById('jsNextCard').innerHTML = `
                    <div class="card-header-flex"><h3 class="card-title"><i class="fa-solid fa-list-check text-blue"></i> Langkah Anda</h3><span class="badge ${done === steps.length ? 'badge-green' : 'badge-blue'}">${done}/${steps.length} selesai</span></div>
                    <div class="js-steps">${steps.map((x, i) => `
                        <div class="js-step ${x.ok ? 'done' : ''}">
                            <span class="n">${x.ok ? '<i class="fa-solid fa-check"></i>' : i + 1}</span>
                            <div class="tx"><strong>${x.t}</strong><small>${x.d}</small></div>
                            ${!x.ok && x.go ? `<button type="button" class="jp-btn-sm js-goto-btn" data-goto="${x.go}">Buka</button>` : ''}
                        </div>`).join('')}</div>
                    <div class="js-privacy ${JM.tampil ? 'on' : ''}"><i class="fa-solid ${JM.tampil ? 'fa-eye' : 'fa-eye-slash'}"></i>
                        ${JM.tampil ? 'Profil Anda <strong>dapat dilihat</strong> perusahaan di menu Kandidat.' : 'Profil Anda <strong>hanya terlihat</strong> oleh perusahaan yang Anda lamar.'}
                        <a href="#" class="js-goto" data-goto="view-profil">Ubah di Profil Kompetensi</a></div>`;

                const lowBox = document.getElementById('jsLowList');
                if (!prodi) lowBox.innerHTML = '<div class="jp-empty-block"><i class="fa-solid fa-graduation-cap"></i>Pilih program studi di atas untuk melihat lowongan yang sesuai.</div>';
                else if (!lows.length) lowBox.innerHTML = `<div class="jp-empty-block"><i class="fa-regular fa-folder-open"></i>Belum ada lowongan aktif untuk ${escHtml(kodeProdi(prodi))}. Lowongan prodi lain tetap bisa dicek di Job Matching.</div>`;
                else lowBox.innerHTML = lows.slice(0, 6).map(L => {
                    const r = JM.mk.length ? jmAnalyze(L) : null;
                    return `
                    <div class="js-low">
                        <div class="js-low-main">
                            <strong>${escHtml(L.posisi)}</strong>${JM.demo ? '<span class="jp-demo-badge">CONTOH</span>' : ''}
                            <span class="jp-muted"><i class="fa-solid fa-building"></i> ${escHtml(L.perusahaan)}${L.lokasi ? ` · ${escHtml(L.lokasi)}` : ''}</span>
                            <div class="jp-job-tags">${(L.kompetensi || []).slice(0, 4).map(k => `<span class="t">${escHtml(k)}</span>`).join('')}${(L.bahasa || []).map(b => `<span class="t lang">${escHtml(b.nama)} · ${escHtml(b.level)}</span>`).join('')}</div>
                        </div>
                        <div class="js-low-side">
                            ${r ? `<span class="js-low-score"><strong>${r.kecocokan}%</strong> kecocokan</span>` : '<span class="jp-muted" style="font-size:12px;">Upload transkrip untuk melihat skor</span>'}
                            <div>${lamarBtnHtml(L)}</div>
                        </div>
                    </div>`;
                }).join('');

                const lam = [...JM.lamaran].sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));
                document.getElementById('jsLamList').innerHTML = lam.length ? lam.map(a => {
                    const L = JM.lowongan.find(l => String(l.id) === String(a.lowongan_id)) || {};
                    return `
                    <div class="js-lam ${lamInfo(a.status)[0]}">
                        <div class="js-lam-head"><strong>${escHtml(a.posisi || L.posisi || 'Lowongan')}</strong>${lamBadge(a.status)}</div>
                        <span class="jp-muted">${escHtml(a.perusahaan || L.perusahaan || '')}${a.lowongan_ditutup ? ' · lowongan sudah ditutup' : ''}</span>
                        <small>${lamInfo(a.status)[2]}${fmtTgl(a.updated_at) ? ' · ' + fmtTgl(a.updated_at) : ''}</small>
                    </div>`;
                }).join('') : '<div class="jp-empty-block"><i class="fa-regular fa-paper-plane"></i>Belum ada lamaran. Cek kecocokan di Job Matching lalu klik <strong>Lamar</strong>.</div>';
                fsRender();
                gkRender();
                jsRenderLearnCard();
                prEnsure();
                cpRenderAll();
            }

            async function initJobMatching() {
                await jmLoad();
                JM.results = [];
                document.getElementById('jmResults').classList.add('is-hidden');
                document.getElementById('jmStatTinggi').textContent = '-';
                document.getElementById('jmCertList').innerHTML = Object.values(PRODI_SKILLS).flat().map(n => `<option value="${escHtml(n)}"></option>`).join('');
                jmRenderMk();
                jmRenderCert();
                jmRenderLang();
                document.getElementById('jmTampil').checked = JM.tampil;
                jsRenderDash();
            }

            // ==============================================================
            // 15. KOMPETENSI PRODI (menu dropdown Jobseeker)
            //     Gap Kompetensi · Yang Perlu Dipelajari · Tren Skill
            //     Kebutuhan industri = lowongan & kompetensi Jobprovider untuk prodi Jobseeker.
            //     Kesiapan prodi = agregat anonim dari transkrip mahasiswa seprodi (dihitung di server).
            //     "Anda" = dihitung di browser dari transkrip, sertifikat, dan bahasa milik Jobseeker sendiri.
            // ==============================================================
            // Data contoh (fiktif) — hanya dipakai bila PHP/MySQL belum aktif. Sama dengan database/data_contoh.sql
            const PR_DEMO = {"sources":[{"tipe":"lowongan","posisi":"Teknisi IoT","perusahaan":"PT Elektra Nusantara (Contoh)","izin_nama":1,"prodi":"Teknologi Rekayasa Sistem Elektronika","lokasi":"Malang","kompetensi":["Internet of Things (IoT)","Mikrokontroler","Sensor dan Transduser","Komputer dan Jaringan"],"bahasa":[{"nama":"Inggris","level":"Intermediate"}],"bulan_lalu":5},{"tipe":"lowongan","posisi":"Teknisi Otomasi PLC","perusahaan":"PT Elektra Nusantara (Contoh)","izin_nama":1,"prodi":"Teknologi Rekayasa Sistem Elektronika","lokasi":"Pasuruan","kompetensi":["PLC & Otomasi Industri","Sistem Kendali","Instrumentasi"],"bahasa":[{"nama":"Inggris","level":"Basic"}],"bulan_lalu":2},{"tipe":"lowongan","posisi":"Embedded System Engineer","perusahaan":"PT Elektra Nusantara (Contoh)","izin_nama":1,"prodi":"Teknologi Rekayasa Sistem Elektronika","lokasi":"Malang","kompetensi":["Embedded System","Pemrograman C","Mikrokontroler","Elektronika Digital"],"bahasa":[{"nama":"Inggris","level":"Intermediate"}],"bulan_lalu":1},{"tipe":"lowongan","posisi":"Teknisi Panel Surya","perusahaan":"PT Elektra Nusantara (Contoh)","izin_nama":1,"prodi":"Teknologi Rekayasa Sistem Elektronika","lokasi":"Sidoarjo","kompetensi":["Energi Terbarukan (Panel Surya)","Rangkaian Listrik","PLC & Otomasi Industri"],"bahasa":[],"bulan_lalu":0},{"tipe":"lowongan","posisi":"Teknisi Maintenance","perusahaan":"PT Mitra Otomasi Jaya (Contoh)","izin_nama":1,"prodi":"Teknologi Rekayasa Sistem Elektronika","lokasi":"Gresik","kompetensi":["Pemeliharaan Perangkat Elektronika","PLC & Otomasi Industri","Pengukuran Elektronika"],"bahasa":[{"nama":"Jepang","level":"Basic"}],"bulan_lalu":4},{"tipe":"lowongan","posisi":"Teknisi Instrumentasi","perusahaan":"PT Mitra Otomasi Jaya (Contoh)","izin_nama":1,"prodi":"Teknologi Rekayasa Sistem Elektronika","lokasi":"Gresik","kompetensi":["Instrumentasi","Sistem Kendali","PLC & Otomasi Industri","Sensor dan Transduser"],"bahasa":[{"nama":"Jepang","level":"Basic"}],"bulan_lalu":1},{"tipe":"lowongan","posisi":"Digital Marketing Staff","perusahaan":"CV Niaga Digital Kreatif (Contoh)","izin_nama":1,"prodi":"Manajemen Pemasaran","lokasi":"Surabaya","kompetensi":["Digital Marketing","Media Sosial","Komunikasi Pemasaran"],"bahasa":[{"nama":"Inggris","level":"Intermediate"}],"bulan_lalu":5},{"tipe":"lowongan","posisi":"Sales Executive","perusahaan":"CV Niaga Digital Kreatif (Contoh)","izin_nama":1,"prodi":"Manajemen Pemasaran","lokasi":"Malang","kompetensi":["Penjualan","Negosiasi","Perilaku Konsumen"],"bahasa":[],"bulan_lalu":3},{"tipe":"lowongan","posisi":"Content & Social Media Specialist","perusahaan":"CV Niaga Digital Kreatif (Contoh)","izin_nama":1,"prodi":"Manajemen Pemasaran","lokasi":"Surabaya","kompetensi":["Media Sosial","Content Marketing","Analisis Data Marketing"],"bahasa":[{"nama":"Inggris","level":"Intermediate"}],"bulan_lalu":2},{"tipe":"lowongan","posisi":"Marketing Data Analyst","perusahaan":"CV Niaga Digital Kreatif (Contoh)","izin_nama":1,"prodi":"Manajemen Pemasaran","lokasi":"Remote","kompetensi":["Analisis Data Marketing","Riset Pemasaran","Digital Marketing"],"bahasa":[{"nama":"Inggris","level":"Intermediate"}],"bulan_lalu":0},{"tipe":"lowongan","posisi":"Market Research Analyst","perusahaan":"PT Analitika Data Indonesia (Contoh)","izin_nama":1,"prodi":"Manajemen Pemasaran","lokasi":"Jakarta","kompetensi":["Riset Pemasaran","Statistika Bisnis","Analisis Data Marketing"],"bahasa":[],"bulan_lalu":2},{"tipe":"lowongan","posisi":"Guru TK","perusahaan":"Yayasan Pendidikan Ceria (Contoh)","izin_nama":1,"prodi":"Pendidikan Guru Pendidikan Anak Usia Dini (PGPAUD)","lokasi":"Malang","kompetensi":["Perencanaan Pembelajaran PAUD","Asesmen Perkembangan Anak","Manajemen Kelas"],"bahasa":[],"bulan_lalu":5},{"tipe":"lowongan","posisi":"Guru PAUD Bilingual","perusahaan":"Yayasan Pendidikan Ceria (Contoh)","izin_nama":1,"prodi":"Pendidikan Guru Pendidikan Anak Usia Dini (PGPAUD)","lokasi":"Batu","kompetensi":["Perencanaan Pembelajaran PAUD","Media Pembelajaran","Literasi Anak"],"bahasa":[{"nama":"Inggris","level":"Intermediate"}],"bulan_lalu":2},{"tipe":"lowongan","posisi":"Fasilitator Tumbuh Kembang","perusahaan":"Yayasan Pendidikan Ceria (Contoh)","izin_nama":1,"prodi":"Pendidikan Guru Pendidikan Anak Usia Dini (PGPAUD)","lokasi":"Malang","kompetensi":["Deteksi Dini Tumbuh Kembang","Psikologi Perkembangan Anak","Kemitraan Orang Tua"],"bahasa":[],"bulan_lalu":0},{"tipe":"lowongan","posisi":"Pengasuh & Fasilitator Daycare","perusahaan":"Daycare Pelangi Nusantara (Contoh)","izin_nama":1,"prodi":"Pendidikan Guru Pendidikan Anak Usia Dini (PGPAUD)","lokasi":"Malang","kompetensi":["Psikologi Perkembangan Anak","Asesmen Perkembangan Anak","Kemitraan Orang Tua"],"bahasa":[],"bulan_lalu":3},{"tipe":"lowongan","posisi":"Guru Kelas SD","perusahaan":"SD Cendekia Nusantara (Contoh)","izin_nama":1,"prodi":"Pendidikan Guru Sekolah Dasar (PGSD)","lokasi":"Malang","kompetensi":["Perencanaan Pembelajaran SD","Asesmen Pembelajaran","Manajemen Kelas"],"bahasa":[],"bulan_lalu":5},{"tipe":"lowongan","posisi":"Guru SD Bilingual","perusahaan":"SD Cendekia Nusantara (Contoh)","izin_nama":1,"prodi":"Pendidikan Guru Sekolah Dasar (PGSD)","lokasi":"Batu","kompetensi":["Perencanaan Pembelajaran SD","Media Pembelajaran Digital","Literasi Membaca Permulaan"],"bahasa":[{"nama":"Inggris","level":"Intermediate"}],"bulan_lalu":2},{"tipe":"lowongan","posisi":"Guru Pendamping Inklusi","perusahaan":"SD Cendekia Nusantara (Contoh)","izin_nama":1,"prodi":"Pendidikan Guru Sekolah Dasar (PGSD)","lokasi":"Malang","kompetensi":["Pendidikan Inklusif","Deteksi Kesulitan Belajar","Kemitraan Orang Tua"],"bahasa":[],"bulan_lalu":0},{"tipe":"lowongan","posisi":"Tutor Matematika SD","perusahaan":"Bimbel Cerdas Prima (Contoh)","izin_nama":0,"prodi":"Pendidikan Guru Sekolah Dasar (PGSD)","lokasi":"Malang","kompetensi":["Pembelajaran Matematika SD","Media Pembelajaran Digital","Asesmen Pembelajaran"],"bahasa":[],"bulan_lalu":1},{"tipe":"kebutuhan","posisi":null,"perusahaan":"PT Mitra Otomasi Jaya (Contoh)","izin_nama":1,"prodi":"Manajemen Pemasaran","lokasi":"","kompetensi":["Penjualan Teknis (Technical Sales)","Komunikasi Bisnis"],"bahasa":[{"nama":"Inggris","level":"Intermediate"}],"bulan_lalu":3},{"tipe":"kebutuhan","posisi":null,"perusahaan":"PT Surya Daya Energi (Contoh)","izin_nama":1,"prodi":"Teknologi Rekayasa Sistem Elektronika","lokasi":"","kompetensi":["Energi Terbarukan (Panel Surya)","PLC & Otomasi Industri","Rangkaian Listrik"],"bahasa":[],"bulan_lalu":4}],"students":[{"prodi":"Teknologi Rekayasa Sistem Elektronika","mk":[{"nama":"Elektronika Digital","sks":3,"nilai":"B"},{"nama":"Elektronika Analog","sks":3,"nilai":"B"},{"nama":"Rangkaian Listrik 1","sks":3,"nilai":"B+"},{"nama":"Sistem Mikrokontroler","sks":3,"nilai":"B-"},{"nama":"Embedded System","sks":2,"nilai":"C+"},{"nama":"Internet of Things","sks":3,"nilai":"B-"},{"nama":"Aplikasi Sensor dan Transduser","sks":2,"nilai":"B"},{"nama":"Instrumentasi Elektronika","sks":2,"nilai":"B-"},{"nama":"Sistem Kendali","sks":3,"nilai":"C+"},{"nama":"Komputer dan Jaringan","sks":2,"nilai":"B+"},{"nama":"Pemeliharaan dan Perbaikan Perangkat Elektronika","sks":2,"nilai":"B+"},{"nama":"Algoritma dan Pemrograman","sks":3,"nilai":"B"},{"nama":"Pengukuran Elektronika","sks":2,"nilai":"B"},{"nama":"Pendidikan Pancasila","sks":2,"nilai":"B+","umum":true},{"nama":"Bahasa Indonesia","sks":2,"nilai":"A-","umum":true},{"nama":"Bahasa Inggris","sks":2,"nilai":"B"}],"cert":[{"nama":"Pelatihan Internet of Things Dasar","jenis":"Non-BNSP"}],"bahasa":[{"nama":"Inggris","level":"Basic"}]},{"prodi":"Teknologi Rekayasa Sistem Elektronika","mk":[{"nama":"Elektronika Digital","sks":3,"nilai":"A-"},{"nama":"Elektronika Analog","sks":3,"nilai":"B+"},{"nama":"Rangkaian Listrik 1","sks":3,"nilai":"B+"},{"nama":"Sistem Mikrokontroler","sks":3,"nilai":"B"},{"nama":"Embedded System","sks":2,"nilai":"B-"},{"nama":"Internet of Things","sks":3,"nilai":"B+"},{"nama":"Aplikasi Sensor dan Transduser","sks":2,"nilai":"A-"},{"nama":"Instrumentasi Elektronika","sks":2,"nilai":"B"},{"nama":"Sistem Kendali","sks":3,"nilai":"B"},{"nama":"Komputer dan Jaringan","sks":2,"nilai":"B+"},{"nama":"Pemeliharaan dan Perbaikan Perangkat Elektronika","sks":2,"nilai":"B"},{"nama":"Algoritma dan Pemrograman","sks":3,"nilai":"B-"},{"nama":"Pengukuran Elektronika","sks":2,"nilai":"B+"},{"nama":"Pendidikan Pancasila","sks":2,"nilai":"B+","umum":true},{"nama":"Bahasa Indonesia","sks":2,"nilai":"B+","umum":true},{"nama":"Bahasa Inggris","sks":2,"nilai":"A-"}],"cert":[{"nama":"Pelatihan PLC Dasar","jenis":"Non-BNSP"}],"bahasa":[{"nama":"Inggris","level":"Advanced"},{"nama":"Jepang","level":"Basic"}]},{"prodi":"Teknologi Rekayasa Sistem Elektronika","mk":[{"nama":"Elektronika Digital","sks":3,"nilai":"B+"},{"nama":"Elektronika Analog","sks":3,"nilai":"B"},{"nama":"Rangkaian Listrik 1","sks":3,"nilai":"B"},{"nama":"Sistem Mikrokontroler","sks":3,"nilai":"B"},{"nama":"Embedded System","sks":2,"nilai":"B"},{"nama":"Internet of Things","sks":3,"nilai":"B"},{"nama":"Aplikasi Sensor dan Transduser","sks":2,"nilai":"B+"},{"nama":"Instrumentasi Elektronika","sks":2,"nilai":"B-"},{"nama":"Sistem Kendali","sks":3,"nilai":"B-"},{"nama":"Komputer dan Jaringan","sks":2,"nilai":"B+"},{"nama":"Pemeliharaan dan Perbaikan Perangkat Elektronika","sks":2,"nilai":"A-"},{"nama":"Algoritma dan Pemrograman","sks":3,"nilai":"B-"},{"nama":"Pengukuran Elektronika","sks":2,"nilai":"B+"},{"nama":"Pendidikan Pancasila","sks":2,"nilai":"A-","umum":true},{"nama":"Bahasa Indonesia","sks":2,"nilai":"A-","umum":true},{"nama":"Bahasa Inggris","sks":2,"nilai":"A"}],"cert":[],"bahasa":[{"nama":"Inggris","level":"Advanced"}]},{"prodi":"Teknologi Rekayasa Sistem Elektronika","mk":[{"nama":"Elektronika Digital","sks":3,"nilai":"B"},{"nama":"Elektronika Analog","sks":3,"nilai":"B"},{"nama":"Rangkaian Listrik 1","sks":3,"nilai":"B"},{"nama":"Sistem Mikrokontroler","sks":3,"nilai":"B"},{"nama":"Embedded System","sks":2,"nilai":"B"},{"nama":"Internet of Things","sks":3,"nilai":"B+"},{"nama":"Aplikasi Sensor dan Transduser","sks":2,"nilai":"B"},{"nama":"Instrumentasi Elektronika","sks":2,"nilai":"B"},{"nama":"Sistem Kendali","sks":3,"nilai":"B-"},{"nama":"Komputer dan Jaringan","sks":2,"nilai":"B+"},{"nama":"Pemeliharaan dan Perbaikan Perangkat Elektronika","sks":2,"nilai":"B+"},{"nama":"Algoritma dan Pemrograman","sks":3,"nilai":"B+"},{"nama":"Pengukuran Elektronika","sks":2,"nilai":"B+"},{"nama":"Pendidikan Pancasila","sks":2,"nilai":"B+","umum":true},{"nama":"Bahasa Indonesia","sks":2,"nilai":"B+","umum":true},{"nama":"Bahasa Inggris","sks":2,"nilai":"A-"}],"cert":[],"bahasa":[{"nama":"Inggris","level":"Advanced"},{"nama":"Jepang","level":"Basic"}]},{"prodi":"Teknologi Rekayasa Sistem Elektronika","mk":[{"nama":"Elektronika Digital","sks":3,"nilai":"B"},{"nama":"Elektronika Analog","sks":3,"nilai":"B+"},{"nama":"Rangkaian Listrik 1","sks":3,"nilai":"B"},{"nama":"Sistem Mikrokontroler","sks":3,"nilai":"B+"},{"nama":"Embedded System","sks":2,"nilai":"B"},{"nama":"Internet of Things","sks":3,"nilai":"B"},{"nama":"Aplikasi Sensor dan Transduser","sks":2,"nilai":"B"},{"nama":"Instrumentasi Elektronika","sks":2,"nilai":"C+"},{"nama":"Sistem Kendali","sks":3,"nilai":"B-"},{"nama":"Komputer dan Jaringan","sks":2,"nilai":"B-"},{"nama":"Pemeliharaan dan Perbaikan Perangkat Elektronika","sks":2,"nilai":"B"},{"nama":"Algoritma dan Pemrograman","sks":3,"nilai":"B"},{"nama":"Pengukuran Elektronika","sks":2,"nilai":"B+"},{"nama":"Pendidikan Pancasila","sks":2,"nilai":"A-","umum":true},{"nama":"Bahasa Indonesia","sks":2,"nilai":"A-","umum":true},{"nama":"Bahasa Inggris","sks":2,"nilai":"B+"}],"cert":[],"bahasa":[{"nama":"Inggris","level":"Basic"}]},{"prodi":"Teknologi Rekayasa Sistem Elektronika","mk":[{"nama":"Elektronika Digital","sks":3,"nilai":"B"},{"nama":"Elektronika Analog","sks":3,"nilai":"B"},{"nama":"Rangkaian Listrik 1","sks":3,"nilai":"B+"},{"nama":"Sistem Mikrokontroler","sks":3,"nilai":"B+"},{"nama":"Embedded System","sks":2,"nilai":"B-"},{"nama":"Internet of Things","sks":3,"nilai":"B+"},{"nama":"Aplikasi Sensor dan Transduser","sks":2,"nilai":"B+"},{"nama":"Instrumentasi Elektronika","sks":2,"nilai":"C+"},{"nama":"Sistem Kendali","sks":3,"nilai":"B"},{"nama":"Komputer dan Jaringan","sks":2,"nilai":"B-"},{"nama":"Pemeliharaan dan Perbaikan Perangkat Elektronika","sks":2,"nilai":"B+"},{"nama":"Algoritma dan Pemrograman","sks":3,"nilai":"B"},{"nama":"Pengukuran Elektronika","sks":2,"nilai":"B"},{"nama":"Pendidikan Pancasila","sks":2,"nilai":"B+","umum":true},{"nama":"Bahasa Indonesia","sks":2,"nilai":"A","umum":true},{"nama":"Bahasa Inggris","sks":2,"nilai":"A"}],"cert":[],"bahasa":[]},{"prodi":"Manajemen Pemasaran","mk":[{"nama":"Manajemen Pemasaran","sks":3,"nilai":"A"},{"nama":"Perilaku Konsumen","sks":3,"nilai":"A"},{"nama":"Riset Pemasaran","sks":3,"nilai":"B+"},{"nama":"Komunikasi Pemasaran","sks":3,"nilai":"B+"},{"nama":"Manajemen Penjualan","sks":3,"nilai":"A"},{"nama":"Negosiasi Bisnis","sks":2,"nilai":"B+"},{"nama":"Periklanan","sks":2,"nilai":"A"},{"nama":"Manajemen Merek","sks":2,"nilai":"B+"},{"nama":"Statistika Bisnis","sks":3,"nilai":"B"},{"nama":"Bahasa Inggris Bisnis","sks":2,"nilai":"A-"},{"nama":"Kewirausahaan","sks":2,"nilai":"A"},{"nama":"Pendidikan Pancasila","sks":2,"nilai":"A-","umum":true},{"nama":"Bahasa Indonesia","sks":2,"nilai":"B+","umum":true},{"nama":"Bahasa Inggris","sks":2,"nilai":"B"}],"cert":[{"nama":"Kursus Digital Marketing Dasar","jenis":"Non-BNSP"}],"bahasa":[{"nama":"Inggris","level":"Basic"}]},{"prodi":"Manajemen Pemasaran","mk":[{"nama":"Manajemen Pemasaran","sks":3,"nilai":"A"},{"nama":"Perilaku Konsumen","sks":3,"nilai":"A-"},{"nama":"Riset Pemasaran","sks":3,"nilai":"B+"},{"nama":"Komunikasi Pemasaran","sks":3,"nilai":"B+"},{"nama":"Manajemen Penjualan","sks":3,"nilai":"B+"},{"nama":"Negosiasi Bisnis","sks":2,"nilai":"A-"},{"nama":"Periklanan","sks":2,"nilai":"A-"},{"nama":"Manajemen Merek","sks":2,"nilai":"A-"},{"nama":"Statistika Bisnis","sks":3,"nilai":"B"},{"nama":"Bahasa Inggris Bisnis","sks":2,"nilai":"A-"},{"nama":"Kewirausahaan","sks":2,"nilai":"B+"},{"nama":"Pendidikan Pancasila","sks":2,"nilai":"B+","umum":true},{"nama":"Bahasa Indonesia","sks":2,"nilai":"A-","umum":true},{"nama":"Bahasa Inggris","sks":2,"nilai":"A"}],"cert":[],"bahasa":[{"nama":"Inggris","level":"Advanced"}]},{"prodi":"Manajemen Pemasaran","mk":[{"nama":"Manajemen Pemasaran","sks":3,"nilai":"B"},{"nama":"Perilaku Konsumen","sks":3,"nilai":"B-"},{"nama":"Riset Pemasaran","sks":3,"nilai":"C+"},{"nama":"Komunikasi Pemasaran","sks":3,"nilai":"B+"},{"nama":"Manajemen Penjualan","sks":3,"nilai":"B+"},{"nama":"Negosiasi Bisnis","sks":2,"nilai":"B"},{"nama":"Periklanan","sks":2,"nilai":"B"},{"nama":"Manajemen Merek","sks":2,"nilai":"B-"},{"nama":"Statistika Bisnis","sks":3,"nilai":"B-"},{"nama":"Bahasa Inggris Bisnis","sks":2,"nilai":"B"},{"nama":"Kewirausahaan","sks":2,"nilai":"A-"},{"nama":"Pendidikan Pancasila","sks":2,"nilai":"B+","umum":true},{"nama":"Bahasa Indonesia","sks":2,"nilai":"B","umum":true},{"nama":"Bahasa Inggris","sks":2,"nilai":"A-"}],"cert":[],"bahasa":[{"nama":"Inggris","level":"Intermediate"}]},{"prodi":"Manajemen Pemasaran","mk":[{"nama":"Manajemen Pemasaran","sks":3,"nilai":"A"},{"nama":"Perilaku Konsumen","sks":3,"nilai":"B+"},{"nama":"Riset Pemasaran","sks":3,"nilai":"B+"},{"nama":"Komunikasi Pemasaran","sks":3,"nilai":"A"},{"nama":"Manajemen Penjualan","sks":3,"nilai":"A-"},{"nama":"Negosiasi Bisnis","sks":2,"nilai":"A"},{"nama":"Periklanan","sks":2,"nilai":"A-"},{"nama":"Manajemen Merek","sks":2,"nilai":"A-"},{"nama":"Statistika Bisnis","sks":3,"nilai":"B+"},{"nama":"Bahasa Inggris Bisnis","sks":2,"nilai":"B+"},{"nama":"Kewirausahaan","sks":2,"nilai":"A"},{"nama":"Pendidikan Pancasila","sks":2,"nilai":"B+","umum":true},{"nama":"Bahasa Indonesia","sks":2,"nilai":"A-","umum":true},{"nama":"Bahasa Inggris","sks":2,"nilai":"B+"}],"cert":[],"bahasa":[{"nama":"Inggris","level":"Basic"}]},{"prodi":"Manajemen Pemasaran","mk":[{"nama":"Manajemen Pemasaran","sks":3,"nilai":"B+"},{"nama":"Perilaku Konsumen","sks":3,"nilai":"B+"},{"nama":"Riset Pemasaran","sks":3,"nilai":"B-"},{"nama":"Komunikasi Pemasaran","sks":3,"nilai":"A-"},{"nama":"Manajemen Penjualan","sks":3,"nilai":"B+"},{"nama":"Negosiasi Bisnis","sks":2,"nilai":"B+"},{"nama":"Periklanan","sks":2,"nilai":"A-"},{"nama":"Manajemen Merek","sks":2,"nilai":"B+"},{"nama":"Statistika Bisnis","sks":3,"nilai":"B"},{"nama":"Bahasa Inggris Bisnis","sks":2,"nilai":"B"},{"nama":"Kewirausahaan","sks":2,"nilai":"A-"},{"nama":"Pendidikan Pancasila","sks":2,"nilai":"A-","umum":true},{"nama":"Bahasa Indonesia","sks":2,"nilai":"B","umum":true},{"nama":"Bahasa Inggris","sks":2,"nilai":"B+"}],"cert":[],"bahasa":[{"nama":"Inggris","level":"Advanced"}]},{"prodi":"Manajemen Pemasaran","mk":[{"nama":"Manajemen Pemasaran","sks":3,"nilai":"B+"},{"nama":"Perilaku Konsumen","sks":3,"nilai":"A-"},{"nama":"Riset Pemasaran","sks":3,"nilai":"B"},{"nama":"Komunikasi Pemasaran","sks":3,"nilai":"B+"},{"nama":"Manajemen Penjualan","sks":3,"nilai":"A-"},{"nama":"Negosiasi Bisnis","sks":2,"nilai":"A"},{"nama":"Periklanan","sks":2,"nilai":"B+"},{"nama":"Manajemen Merek","sks":2,"nilai":"B+"},{"nama":"Statistika Bisnis","sks":3,"nilai":"B-"},{"nama":"Bahasa Inggris Bisnis","sks":2,"nilai":"A-"},{"nama":"Kewirausahaan","sks":2,"nilai":"A"},{"nama":"Pendidikan Pancasila","sks":2,"nilai":"A-","umum":true},{"nama":"Bahasa Indonesia","sks":2,"nilai":"B+","umum":true},{"nama":"Bahasa Inggris","sks":2,"nilai":"B+"}],"cert":[],"bahasa":[]},{"prodi":"Pendidikan Guru Pendidikan Anak Usia Dini (PGPAUD)","mk":[{"nama":"Psikologi Perkembangan Anak","sks":3,"nilai":"B"},{"nama":"Perencanaan Pembelajaran PAUD","sks":3,"nilai":"A-"},{"nama":"Asesmen Perkembangan Anak Usia Dini","sks":3,"nilai":"B+"},{"nama":"Media Pembelajaran PAUD","sks":3,"nilai":"A-"},{"nama":"Manajemen Kelas","sks":2,"nilai":"A-"},{"nama":"Kurikulum PAUD","sks":3,"nilai":"B"},{"nama":"Bermain dan Permainan Anak","sks":2,"nilai":"A"},{"nama":"Seni Anak Usia Dini","sks":2,"nilai":"A-"},{"nama":"Pendidikan Pancasila","sks":2,"nilai":"A-","umum":true},{"nama":"Bahasa Indonesia","sks":2,"nilai":"B+","umum":true},{"nama":"Bahasa Inggris","sks":2,"nilai":"A-"}],"cert":[],"bahasa":[{"nama":"Inggris","level":"Basic"}]},{"prodi":"Pendidikan Guru Pendidikan Anak Usia Dini (PGPAUD)","mk":[{"nama":"Psikologi Perkembangan Anak","sks":3,"nilai":"A-"},{"nama":"Perencanaan Pembelajaran PAUD","sks":3,"nilai":"B+"},{"nama":"Asesmen Perkembangan Anak Usia Dini","sks":3,"nilai":"B+"},{"nama":"Media Pembelajaran PAUD","sks":3,"nilai":"A"},{"nama":"Manajemen Kelas","sks":2,"nilai":"A-"},{"nama":"Kurikulum PAUD","sks":3,"nilai":"B+"},{"nama":"Bermain dan Permainan Anak","sks":2,"nilai":"A"},{"nama":"Seni Anak Usia Dini","sks":2,"nilai":"A"},{"nama":"Pendidikan Pancasila","sks":2,"nilai":"A-","umum":true},{"nama":"Bahasa Indonesia","sks":2,"nilai":"B+","umum":true},{"nama":"Bahasa Inggris","sks":2,"nilai":"B+"}],"cert":[{"nama":"Pelatihan Media Pembelajaran Anak","jenis":"Non-BNSP"}],"bahasa":[{"nama":"Inggris","level":"Intermediate"}]},{"prodi":"Pendidikan Guru Pendidikan Anak Usia Dini (PGPAUD)","mk":[{"nama":"Psikologi Perkembangan Anak","sks":3,"nilai":"B+"},{"nama":"Perencanaan Pembelajaran PAUD","sks":3,"nilai":"A-"},{"nama":"Asesmen Perkembangan Anak Usia Dini","sks":3,"nilai":"B-"},{"nama":"Media Pembelajaran PAUD","sks":3,"nilai":"B+"},{"nama":"Manajemen Kelas","sks":2,"nilai":"B"},{"nama":"Kurikulum PAUD","sks":3,"nilai":"B"},{"nama":"Bermain dan Permainan Anak","sks":2,"nilai":"A-"},{"nama":"Seni Anak Usia Dini","sks":2,"nilai":"A"},{"nama":"Pendidikan Pancasila","sks":2,"nilai":"A-","umum":true},{"nama":"Bahasa Indonesia","sks":2,"nilai":"B","umum":true},{"nama":"Bahasa Inggris","sks":2,"nilai":"B+"}],"cert":[],"bahasa":[{"nama":"Inggris","level":"Advanced"}]},{"prodi":"Pendidikan Guru Pendidikan Anak Usia Dini (PGPAUD)","mk":[{"nama":"Psikologi Perkembangan Anak","sks":3,"nilai":"A-"},{"nama":"Perencanaan Pembelajaran PAUD","sks":3,"nilai":"B+"},{"nama":"Asesmen Perkembangan Anak Usia Dini","sks":3,"nilai":"B"},{"nama":"Media Pembelajaran PAUD","sks":3,"nilai":"B+"},{"nama":"Manajemen Kelas","sks":2,"nilai":"A-"},{"nama":"Kurikulum PAUD","sks":3,"nilai":"A"},{"nama":"Bermain dan Permainan Anak","sks":2,"nilai":"A"},{"nama":"Seni Anak Usia Dini","sks":2,"nilai":"A-"},{"nama":"Pendidikan Pancasila","sks":2,"nilai":"B","umum":true},{"nama":"Bahasa Indonesia","sks":2,"nilai":"B","umum":true},{"nama":"Bahasa Inggris","sks":2,"nilai":"B"}],"cert":[],"bahasa":[{"nama":"Inggris","level":"Basic"}]},{"prodi":"Pendidikan Guru Pendidikan Anak Usia Dini (PGPAUD)","mk":[{"nama":"Psikologi Perkembangan Anak","sks":3,"nilai":"B"},{"nama":"Perencanaan Pembelajaran PAUD","sks":3,"nilai":"B+"},{"nama":"Asesmen Perkembangan Anak Usia Dini","sks":3,"nilai":"B"},{"nama":"Media Pembelajaran PAUD","sks":3,"nilai":"B"},{"nama":"Manajemen Kelas","sks":2,"nilai":"B"},{"nama":"Kurikulum PAUD","sks":3,"nilai":"B"},{"nama":"Bermain dan Permainan Anak","sks":2,"nilai":"B+"},{"nama":"Seni Anak Usia Dini","sks":2,"nilai":"B-"},{"nama":"Pendidikan Pancasila","sks":2,"nilai":"B+","umum":true},{"nama":"Bahasa Indonesia","sks":2,"nilai":"A-","umum":true},{"nama":"Bahasa Inggris","sks":2,"nilai":"A-"}],"cert":[],"bahasa":[{"nama":"Inggris","level":"Intermediate"}]},{"prodi":"Pendidikan Guru Pendidikan Anak Usia Dini (PGPAUD)","mk":[{"nama":"Psikologi Perkembangan Anak","sks":3,"nilai":"A"},{"nama":"Perencanaan Pembelajaran PAUD","sks":3,"nilai":"A"},{"nama":"Asesmen Perkembangan Anak Usia Dini","sks":3,"nilai":"A-"},{"nama":"Media Pembelajaran PAUD","sks":3,"nilai":"A"},{"nama":"Manajemen Kelas","sks":2,"nilai":"A"},{"nama":"Kurikulum PAUD","sks":3,"nilai":"A-"},{"nama":"Bermain dan Permainan Anak","sks":2,"nilai":"A"},{"nama":"Seni Anak Usia Dini","sks":2,"nilai":"A-"},{"nama":"Pendidikan Pancasila","sks":2,"nilai":"A-","umum":true},{"nama":"Bahasa Indonesia","sks":2,"nilai":"B+","umum":true},{"nama":"Bahasa Inggris","sks":2,"nilai":"B"}],"cert":[],"bahasa":[]},{"prodi":"Pendidikan Guru Sekolah Dasar (PGSD)","mk":[{"nama":"Perencanaan Pembelajaran SD","sks":3,"nilai":"A-"},{"nama":"Asesmen Pembelajaran SD","sks":3,"nilai":"B"},{"nama":"Pembelajaran Matematika SD","sks":3,"nilai":"B-"},{"nama":"Pembelajaran Bahasa Indonesia SD","sks":3,"nilai":"B+"},{"nama":"Pembelajaran IPA SD","sks":3,"nilai":"B-"},{"nama":"Media Pembelajaran SD","sks":2,"nilai":"A-"},{"nama":"Manajemen Kelas","sks":2,"nilai":"B"},{"nama":"Perkembangan Peserta Didik","sks":3,"nilai":"B"},{"nama":"Pendidikan Inklusif","sks":2,"nilai":"B-"},{"nama":"Microteaching","sks":2,"nilai":"B+"},{"nama":"Pendidikan Pancasila","sks":2,"nilai":"B","umum":true},{"nama":"Bahasa Indonesia","sks":2,"nilai":"A-","umum":true},{"nama":"Bahasa Inggris","sks":2,"nilai":"B"}],"cert":[{"nama":"Pelatihan Media Pembelajaran Digital","jenis":"Non-BNSP"}],"bahasa":[{"nama":"Inggris","level":"Basic"}]},{"prodi":"Pendidikan Guru Sekolah Dasar (PGSD)","mk":[{"nama":"Perencanaan Pembelajaran SD","sks":3,"nilai":"B+"},{"nama":"Asesmen Pembelajaran SD","sks":3,"nilai":"B+"},{"nama":"Pembelajaran Matematika SD","sks":3,"nilai":"B"},{"nama":"Pembelajaran Bahasa Indonesia SD","sks":3,"nilai":"B+"},{"nama":"Pembelajaran IPA SD","sks":3,"nilai":"B-"},{"nama":"Media Pembelajaran SD","sks":2,"nilai":"B+"},{"nama":"Manajemen Kelas","sks":2,"nilai":"B+"},{"nama":"Perkembangan Peserta Didik","sks":3,"nilai":"A-"},{"nama":"Pendidikan Inklusif","sks":2,"nilai":"B"},{"nama":"Microteaching","sks":2,"nilai":"A-"},{"nama":"Pendidikan Pancasila","sks":2,"nilai":"B+","umum":true},{"nama":"Bahasa Indonesia","sks":2,"nilai":"B","umum":true},{"nama":"Bahasa Inggris","sks":2,"nilai":"A-"}],"cert":[],"bahasa":[{"nama":"Inggris","level":"Advanced"}]},{"prodi":"Pendidikan Guru Sekolah Dasar (PGSD)","mk":[{"nama":"Perencanaan Pembelajaran SD","sks":3,"nilai":"B+"},{"nama":"Asesmen Pembelajaran SD","sks":3,"nilai":"B-"},{"nama":"Pembelajaran Matematika SD","sks":3,"nilai":"B"},{"nama":"Pembelajaran Bahasa Indonesia SD","sks":3,"nilai":"B"},{"nama":"Pembelajaran IPA SD","sks":3,"nilai":"B"},{"nama":"Media Pembelajaran SD","sks":2,"nilai":"A-"},{"nama":"Manajemen Kelas","sks":2,"nilai":"B+"},{"nama":"Perkembangan Peserta Didik","sks":3,"nilai":"B+"},{"nama":"Pendidikan Inklusif","sks":2,"nilai":"B+"},{"nama":"Microteaching","sks":2,"nilai":"A-"},{"nama":"Pendidikan Pancasila","sks":2,"nilai":"A-","umum":true},{"nama":"Bahasa Indonesia","sks":2,"nilai":"B+","umum":true},{"nama":"Bahasa Inggris","sks":2,"nilai":"A-"}],"cert":[],"bahasa":[{"nama":"Inggris","level":"Advanced"}]},{"prodi":"Pendidikan Guru Sekolah Dasar (PGSD)","mk":[{"nama":"Perencanaan Pembelajaran SD","sks":3,"nilai":"B+"},{"nama":"Asesmen Pembelajaran SD","sks":3,"nilai":"B+"},{"nama":"Pembelajaran Matematika SD","sks":3,"nilai":"A-"},{"nama":"Pembelajaran Bahasa Indonesia SD","sks":3,"nilai":"B+"},{"nama":"Pembelajaran IPA SD","sks":3,"nilai":"A-"},{"nama":"Media Pembelajaran SD","sks":2,"nilai":"A-"},{"nama":"Manajemen Kelas","sks":2,"nilai":"B+"},{"nama":"Perkembangan Peserta Didik","sks":3,"nilai":"B+"},{"nama":"Pendidikan Inklusif","sks":2,"nilai":"B-"},{"nama":"Microteaching","sks":2,"nilai":"A-"},{"nama":"Pendidikan Pancasila","sks":2,"nilai":"B","umum":true},{"nama":"Bahasa Indonesia","sks":2,"nilai":"A-","umum":true},{"nama":"Bahasa Inggris","sks":2,"nilai":"A-"}],"cert":[],"bahasa":[{"nama":"Inggris","level":"Intermediate"}]},{"prodi":"Pendidikan Guru Sekolah Dasar (PGSD)","mk":[{"nama":"Perencanaan Pembelajaran SD","sks":3,"nilai":"B+"},{"nama":"Asesmen Pembelajaran SD","sks":3,"nilai":"A-"},{"nama":"Pembelajaran Matematika SD","sks":3,"nilai":"B+"},{"nama":"Pembelajaran Bahasa Indonesia SD","sks":3,"nilai":"B+"},{"nama":"Pembelajaran IPA SD","sks":3,"nilai":"B+"},{"nama":"Media Pembelajaran SD","sks":2,"nilai":"A"},{"nama":"Manajemen Kelas","sks":2,"nilai":"A-"},{"nama":"Perkembangan Peserta Didik","sks":3,"nilai":"A-"},{"nama":"Pendidikan Inklusif","sks":2,"nilai":"B+"},{"nama":"Microteaching","sks":2,"nilai":"A"},{"nama":"Pendidikan Pancasila","sks":2,"nilai":"B+","umum":true},{"nama":"Bahasa Indonesia","sks":2,"nilai":"A-","umum":true},{"nama":"Bahasa Inggris","sks":2,"nilai":"B"}],"cert":[],"bahasa":[{"nama":"Inggris","level":"Basic"}]},{"prodi":"Pendidikan Guru Sekolah Dasar (PGSD)","mk":[{"nama":"Perencanaan Pembelajaran SD","sks":3,"nilai":"A"},{"nama":"Asesmen Pembelajaran SD","sks":3,"nilai":"A-"},{"nama":"Pembelajaran Matematika SD","sks":3,"nilai":"A-"},{"nama":"Pembelajaran Bahasa Indonesia SD","sks":3,"nilai":"A"},{"nama":"Pembelajaran IPA SD","sks":3,"nilai":"A-"},{"nama":"Media Pembelajaran SD","sks":2,"nilai":"B+"},{"nama":"Manajemen Kelas","sks":2,"nilai":"A-"},{"nama":"Perkembangan Peserta Didik","sks":3,"nilai":"A"},{"nama":"Pendidikan Inklusif","sks":2,"nilai":"B"},{"nama":"Microteaching","sks":2,"nilai":"A"},{"nama":"Pendidikan Pancasila","sks":2,"nilai":"A","umum":true},{"nama":"Bahasa Indonesia","sks":2,"nilai":"B","umum":true},{"nama":"Bahasa Inggris","sks":2,"nilai":"B+"}],"cert":[],"bahasa":[]}],"jumlah_jobseeker":{"Teknologi Rekayasa Sistem Elektronika":6,"Manajemen Pemasaran":6,"Pendidikan Guru Pendidikan Anak Usia Dini (PGPAUD)":6,"Pendidikan Guru Sekolah Dasar (PGSD)":6},"lamaran":{"Teknologi Rekayasa Sistem Elektronika":{"Diundang":1,"Ditinjau":1,"Dikirim":1,"Ditolak":1},"Manajemen Pemasaran":{"Ditinjau":1,"Diterima":1,"Dikirim":1},"Pendidikan Guru Pendidikan Anak Usia Dini (PGPAUD)":{"Diundang":1,"Dikirim":1},"Pendidikan Guru Sekolah Dasar (PGSD)":{"Diterima":1,"Ditinjau":1}}};
            const PR = {loaded: false, loading: false, demo: false, reqProdi: null, prodi: '', sources: [], agg: null, jml: 0, charts: {}};
            const READY = 0.75;    // bukti kuat: MK terkait bernilai >= B (3/4), atau sertifikat terkait
            const MIN_MHS = 3;
            const MIN_SUMBER = 2;  // kompetensi baru dianggap prioritas bila diminta minimal 2 lowongan/perusahaan     // kesiapan prodi baru ditampilkan bila ada >= 3 mahasiswa (menjaga anonimitas)
            const PRIO = (g) => g >= 40 ? 'Tinggi' : (g >= 20 ? 'Sedang' : 'Rendah');
            const PRIO_ORD = {Tinggi: 0, Sedang: 1, Rendah: 2};
            const PRIO_BADGE = {Tinggi: 'badge-red', Sedang: 'badge-orange', Rendah: 'badge-green'};
            const pc = (v) => v === null || v === undefined ? '-' : Math.round(v) + '%';
            const dec = (v) => Number(v).toFixed(2).replace('.', ',');
            const parseTgl = (s) => new Date(String(s || '').replace(' ', 'T'));
            const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const curProdi = () => { const p = sessionStorage.getItem('c-dfs_user_prodi') || ''; return prodiTercakup(p) ? p : ''; };

            // Agregat kesiapan prodi — logika yang sama dengan analisisProdi() di php/api.php (dipakai di mode demo)
            function prAgg(sources, studs) {
                const n = sources.length, ns = studs.length, cukup = ns >= MIN_MHS;
                const km = new Map();
                sources.forEach(s => new Set((s.kompetensi || []).map(k => String(k).trim()).filter(Boolean)).forEach(k => {
                    const key = k.toLowerCase();
                    if (!km.has(key)) km.set(key, {nama: k, n: 0});
                    km.get(key).n++;
                }));
                const komp = [...km.values()].map(k => {
                    let ready = null, certN = 0, mk = [];
                    if (cukup) {
                        const rel = new Map();
                        studs.forEach(st => (st.mk || []).forEach(m => { if (!m.umum && !rel.has(m.nama)) rel.set(m.nama, relScore(k.nama, m.nama)); }));
                        const maxRel = Math.max(0, ...rel.values());
                        const agg = new Map();
                        let ok = 0;
                        studs.forEach(st => {
                            let best = 0;
                            (st.mk || []).forEach(m => {
                                if (m.umum || maxRel <= 0 || (rel.get(m.nama) || 0) < 0.8 * maxRel) return;
                                best = Math.max(best, bobot(m) / 4);
                                const e = agg.get(m.nama) || {sum: 0, n: 0}; e.sum += bobot(m); e.n++; agg.set(m.nama, e);
                            });
                            const cert = (st.cert || []).some(c => related(k.nama, c.nama));
                            if (cert) certN++;
                            if (best >= READY || cert) ok++;
                        });
                        ready = 100 * ok / ns;
                        mk = [...agg.entries()].map(([nama, e]) => ({nama, avg: Math.round(e.sum / e.n * 100) / 100, n: e.n, r: rel.get(nama)}))
                            .sort((a, b) => b.r - a.r || b.n - a.n);
                    }
                    return {nama: k.nama, n: k.n, demand: n ? 100 * k.n / n : 0, ready, mk, certN};
                });
                const lm = new Map();
                sources.forEach(s => (s.bahasa || []).forEach(b => {
                    const key = normLang(b.nama);
                    if (!key) return;
                    const e = lm.get(key) || {nama: b.nama, level: b.level, n: 0};
                    e.n++;
                    if ((LEVEL_VAL[b.level] || 0) > (LEVEL_VAL[e.level] || 0)) e.level = b.level;
                    lm.set(key, e);
                }));
                const langs = [...lm.values()].map(b => ({...b, demand: 100 * b.n / n,
                    ready: cukup ? 100 * studs.filter(st => langReqEval(b, st).v >= 1).length / ns : null}));
                return {komp, langs, mahasiswa: ns, cukup};
            }

            async function prLoad() {
                const prodi = curProdi();
                PR.reqProdi = prodi;
                const res = await apiRequest('js_prodi', {prodi});
                if (res && res.success) {
                    PR.demo = false;
                    PR.prodi = res.prodi || '';
                    PR.sources = res.sources || [];
                    PR.agg = res.analisis || null;
                    PR.jml = res.jumlah_jobseeker || 0;
                } else {
                    PR.demo = true;
                    PR.prodi = prodi;
                    // Tanggal dibuat relatif terhadap hari ini agar grafik tren selalu terisi
                    PR.sources = PR_DEMO.sources.map((s, i) => {
                        const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - s.bulan_lalu); d.setDate(5 + (i * 3) % 20);
                        return {...s, id: 'D' + i, created_at: d.toISOString()};
                    }).filter(s => s.prodi === prodi);
                    PR.agg = prodi ? prAgg(PR.sources, PR_DEMO.students.filter(s => s.prodi === prodi)) : null;
                    PR.jml = PR_DEMO.jumlah_jobseeker[prodi] || 0;
                }
                PR.loaded = true;
            }
            // Muat ulang bila prodi Jobseeker berubah
            function prEnsure() {
                if (PR.loading || (PR.loaded && PR.reqProdi === curProdi())) return;
                PR.loading = true;
                prLoad().finally(() => { PR.loading = false; if (peran() === 'Jobseeker') jsRenderDash(); else cpRenderAll(); prRenderAll(); dsnRender(); });
            }

            // Bukti milik Jobseeker sendiri: hanya mata kuliah yang namanya paling mirip, atau sertifikat terkait
            function myEvidence(nama) {
                const mks = JM.mk.filter(m => !m.umum).map(m => ({m, r: relScore(nama, m.nama)}));
                const maxR = Math.max(0, ...mks.map(x => x.r));
                const dekat = maxR > 0 ? mks.filter(x => x.r >= 0.8 * maxR).sort((a, b) => bobot(b.m) - bobot(a.m)) : [];
                const cert = JM.cert.find(c => related(nama, c.nama));
                const v = Math.max(dekat.length ? bobot(dekat[0].m) / 4 : 0, cert ? (cert.jenis === 'BNSP' ? 1 : 0.8) : 0);
                return {v, mk: dekat.length ? dekat[0].m : null, cert};
            }
            const punyaData = () => JM.mk.length > 0;

            function prTrendRows(komp) {
                const months = [];
                const now = new Date();
                for (let i = 5; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    months.push({key: monthKey(d), label: d.toLocaleDateString('id-ID', {month: 'short', year: '2-digit'})});
                }
                const idx = Object.fromEntries(months.map((m, i) => [m.key, i]));
                const rows = komp.map(k => {
                    const c = [0, 0, 0, 0, 0, 0];
                    k.src.forEach(s => { const d = parseTgl(s.created_at); if (!isNaN(d) && idx[monthKey(d)] !== undefined) c[idx[monthKey(d)]]++; });
                    const prev = c[0] + c[1] + c[2], last = c[3] + c[4] + c[5];
                    const arah = !prev && last ? 'Baru' : (last > prev ? 'Naik' : (last < prev ? 'Turun' : 'Stabil'));
                    return {nama: k.nama, anda: k.anda, c, prev, last, total: prev + last, arah};
                });
                return {months, rows};
            }

            function prAnalyze() {
                if (!PR.loaded || !PR.agg || !PR.prodi) return null;
                const S = PR.sources, punya = punyaData();
                const me = {prodi: PR.prodi, mk: JM.mk, cert: JM.cert, bahasa: JM.bahasa};
                const komp = PR.agg.komp.map(k => {
                    const gap = k.ready === null ? null : Math.max(0, k.demand - k.ready);
                    const ev = punya ? myEvidence(k.nama) : null;
                    const src = S.filter(s => (s.kompetensi || []).some(x => String(x).trim().toLowerCase() === k.nama.toLowerCase()));
                    return {...k, gap, prio: gap === null ? null : PRIO(gap), ev, anda: ev ? ev.v >= READY : null, src};
                }).sort((a, b) => (b.gap ?? -1) - (a.gap ?? -1) || b.demand - a.demand || a.nama.localeCompare(b.nama));
                const langs = PR.agg.langs.map(b => {
                    const gap = b.ready === null ? null : Math.max(0, b.demand - b.ready);
                    const have = JM.bahasa.find(x => normLang(x.nama) === normLang(b.nama));
                    return {...b, gap, prio: gap === null ? null : PRIO(gap), have, anda: punya ? langReqEval(b, me).v >= 1 : null};
                }).sort((a, b) => b.demand - a.demand);
                const sumD = komp.reduce((s, k) => s + k.demand, 0);
                const index = PR.agg.cukup && sumD ? komp.reduce((s, k) => s + k.demand * k.ready, 0) / sumD : null;
                const trend = prTrendRows(komp);
                const arahOf = Object.fromEntries(trend.rows.map(r => [r.nama, r.arah]));
                const belum = komp.filter(k => k.anda === false).map(k => ({...k, tipe: 'kompetensi', arah: arahOf[k.nama]}))
                    .concat(langs.filter(b => b.anda === false).map(b => ({...b, tipe: 'bahasa'})))
                    .sort((a, b) => b.demand - a.demand);
                // Prioritas = diminta >= MIN_SUMBER sumber; yang baru diminta 1 perusahaan cukup dipantau
                const learn = belum.filter(k => k.n >= MIN_SUMBER), pantau = belum.filter(k => k.n < MIN_SUMBER);
                const a = {prodi: PR.prodi, S, komp, langs, index, cukup: PR.agg.cukup, ns: PR.agg.mahasiswa, punya, trend, learn, pantau,
                    nLow: S.filter(s => s.tipe === 'lowongan').length, nKeb: S.filter(s => s.tipe !== 'lowongan').length};
                a.recs = prRecs(a);
                return a;
            }

            // Rekomendasi kurikulum tingkat prodi (untuk dosen / koordinator prodi)
            function prRecs(a) {
                if (!a.cukup) return [];
                const recs = [];
                a.komp.filter(k => k.gap >= 20 && k.n >= MIN_SUMBER).forEach(k => {
                    if (k.mk.length) {
                        const avg = k.mk.reduce((s, m) => s + m.avg * m.n, 0) / k.mk.reduce((s, m) => s + m.n, 0);
                        recs.push({jenis: 'Perkuat Mata Kuliah', icon: 'fa-book-open', prio: k.prio,
                            judul: `Perkuat ${k.mk.slice(0, 2).map(m => m.nama).join(' & ')} untuk kompetensi ${k.nama}`,
                            alasan: `${pc(k.demand)} sumber industri meminta ${k.nama}, baru ${pc(k.ready)} mahasiswa memiliki bukti kuat. Rata-rata nilai MK terkait ${dec(avg)}.`,
                            aksi: `Tambahkan praktikum atau proyek berbasis kasus industri tentang ${k.nama}.`});
                    } else {
                        recs.push({jenis: 'Tambah MK / Modul Baru', icon: 'fa-circle-plus', prio: k.prio,
                            judul: `Tambahkan materi ${k.nama} ke kurikulum`,
                            alasan: `${pc(k.demand)} sumber industri meminta ${k.nama}, tetapi tidak ditemukan mata kuliah terkait di transkrip mahasiswa.`,
                            aksi: `Usulkan mata kuliah pilihan atau modul praktikum ${k.nama} (mis. 2–3 SKS).`});
                    }
                });
                const certCand = a.komp.filter(k => k.gap >= 20 && k.n >= MIN_SUMBER && !k.certN).slice(0, 2);
                if (certCand.length) recs.push({jenis: 'Integrasi Sertifikasi', icon: 'fa-certificate', prio: 'Sedang',
                    judul: `Jajaki sertifikasi kompetensi untuk ${certCand.map(k => k.nama).join(' dan ')}`,
                    alasan: 'Belum ada mahasiswa yang memiliki sertifikat terkait, padahal kompetensinya diminta industri.',
                    aksi: 'Kerja sama dengan LSP/BNSP atau mitra industri untuk skema sertifikasi yang relevan.'});
                a.langs.filter(b => b.gap >= 20 && b.n >= MIN_SUMBER).forEach(b => recs.push({jenis: 'Penguatan Bahasa', icon: 'fa-language', prio: b.prio,
                    judul: `Tingkatkan kemahiran Bahasa ${b.nama} hingga minimal ${b.level}`,
                    alasan: `${pc(b.demand)} sumber industri mensyaratkan Bahasa ${b.nama} (min. ${b.level}); baru ${pc(b.ready)} mahasiswa memenuhi.`,
                    aksi: `Sediakan kelas atau klub Bahasa ${b.nama} terapan sesuai bidang.`}));
                return recs.sort((x, y) => PRIO_ORD[x.prio] - PRIO_ORD[y.prio]);
            }

            // ---------- Render ----------
            function prChart(id, cfg) {
                if (PR.charts[id]) PR.charts[id].destroy();
                PR.charts[id] = new Chart(document.getElementById(id).getContext('2d'), cfg);
            }
            function prNoChart(id) { if (PR.charts[id]) { PR.charts[id].destroy(); delete PR.charts[id]; } }
            const prSetText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
            const andaCell = (v) => v === null ? '<span class="pr-anda na" title="Upload transkrip untuk melihat">—</span>'
                : (v ? '<span class="pr-anda ok"><i class="fa-solid fa-circle-check"></i> Sudah</span>' : '<span class="pr-anda no"><i class="fa-solid fa-circle-xmark"></i> Belum</span>');

            function prRenderGap(a) {
                const note = document.getElementById('prDataNote');
                const msg = [];
                if (PR.demo) msg.push('<strong>DATA CONTOH (fiktif).</strong> Server PHP/MySQL belum aktif, jadi halaman ini memakai data contoh.');
                if (!a.cukup) msg.push(`Kesiapan prodi baru ditampilkan bila minimal ${MIN_MHS} mahasiswa prodi Anda sudah mengunggah transkrip (saat ini ${a.ns}).`);
                else if (!PR.demo && (a.S.length < 5 || a.ns < 5)) msg.push(`Data masih sedikit (${a.S.length} sumber industri, ${a.ns} mahasiswa). Hasil bersifat indikatif.`);
                if (!a.punya && peran() === 'Jobseeker') msg.push('Upload transkrip di <a href="#" class="js-goto" data-goto="view-profil">Profil Kompetensi</a> agar kolom <strong>Anda</strong> terisi.');
                note.innerHTML = msg.length ? '<i class="fa-solid fa-circle-info"></i> <span>' + msg.join(' ') + '</span>' : '';
                note.classList.toggle('is-hidden', !msg.length);

                prSetText('prStatSumber', a.S.length);
                prSetText('prStatSumberDesc', `${a.nLow} lowongan aktif · ${a.nKeb} perusahaan tanpa lowongan`);
                prSetText('prStatIndeks', a.index === null ? '-' : pc(a.index));
                prSetText('prStatMhsDesc', a.cukup ? `dari ${a.ns} mahasiswa prodi (anonim)` : `menunggu ≥ ${MIN_MHS} mahasiswa`);
                const nk = a.komp.length + a.langs.length;
                const have = a.komp.filter(k => k.anda).length + a.langs.filter(b => b.anda).length;
                prSetText('prStatAnda', a.punya ? `${have}/${nk}` : '-');
                prSetText('prStatAndaDesc', a.punya ? 'kompetensi & bahasa yang diminta' : 'upload transkrip dahulu');
                prSetText('prStatBelajar', a.punya ? a.learn.length : '-');

                const top = [...a.komp].sort((x, y) => y.demand - x.demand).slice(0, 8);
                document.getElementById('prGapEmpty').classList.toggle('is-hidden', top.length > 0);
                document.getElementById('prGapChart').style.display = top.length ? '' : 'none';
                const vis = document.getElementById('view-pr-gap').classList.contains('active');
                if (top.length && vis) {
                    const ds = [{label: 'Permintaan industri', data: top.map(k => Math.round(k.demand)), backgroundColor: '#1d4ed8', borderRadius: 4, barPercentage: 0.8, categoryPercentage: 0.7}];
                    if (a.cukup) ds.push({label: 'Kesiapan mahasiswa prodi', data: top.map(k => Math.round(k.ready)), backgroundColor: '#10b981', borderRadius: 4, barPercentage: 0.8, categoryPercentage: 0.7});
                    prChart('prGapChart', {
                        type: 'bar',
                        data: {labels: top.map(k => (k.anda ? '✓ ' : '') + (k.nama.length > 30 ? k.nama.slice(0, 29) + '…' : k.nama)), datasets: ds},
                        options: {indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                            plugins: {legend: {display: false}, tooltip: {callbacks: {label: (c) => `${c.dataset.label}: ${c.raw}%`}}},
                            scales: {x: {min: 0, max: 100, ticks: {callback: (v) => v + '%'}, grid: {color: '#f1f5f9'}}, y: {grid: {display: false}, ticks: {font: {size: 11}}}}}
                    });
                } else if (!top.length) prNoChart('prGapChart');

                prSetText('prGapCount', `${a.komp.length} kompetensi · ${a.S.length} sumber`);
                document.getElementById('prGapBody').innerHTML = a.komp.length ? a.komp.map(k => `
                    <tr>
                        <td><strong>${esc(k.nama)}</strong></td>
                        <td class="text-center">${pc(k.demand)} <span class="jp-muted">(${k.n}/${a.S.length})</span></td>
                        <td class="text-center">${pc(k.ready)}</td>
                        <td class="text-center">${k.gap === null ? '-' : (k.n < MIN_SUMBER ? `<span class="badge pr-badge-1" title="Baru diminta 1 sumber, belum dijadikan prioritas">${Math.round(k.gap)} · 1 sumber</span>` : `<span class="badge ${PRIO_BADGE[k.prio]}">${Math.round(k.gap)}</span>`)}</td>
                        <td>${k.mk.length ? k.mk.slice(0, 2).map(m => `<span class="pr-mk">${esc(m.nama)}${m.n >= MIN_MHS ? ` <em>${dec(m.avg)}</em>` : ''}</span>`).join('') : `<span class="pr-mk none">${a.cukup ? 'Tidak ada MK terkait' : 'Belum ada data'}</span>`}</td>
                        <td class="text-center js-only">${andaCell(k.anda)}</td>
                    </tr>`).join('')
                    : '<tr><td colspan="6" class="text-center jp-muted" style="padding:24px;">Belum ada kebutuhan kompetensi dari Jobprovider untuk prodi Anda.</td></tr>';
                document.getElementById('prLangBody').innerHTML = a.langs.length ? a.langs.map(b => `
                    <tr>
                        <td><strong>Bahasa ${esc(b.nama)}</strong></td>
                        <td class="text-center">${esc(b.level)}</td>
                        <td class="text-center">${pc(b.demand)} <span class="jp-muted">(${b.n}/${a.S.length})</span></td>
                        <td class="text-center">${pc(b.ready)}</td>
                        <td class="text-center js-only">${andaCell(b.anda)}${b.have ? `<div class="jp-muted">${esc(b.have.level)}</div>` : ''}</td>
                    </tr>`).join('')
                    : '<tr><td colspan="5" class="text-center jp-muted" style="padding:20px;">Tidak ada persyaratan bahasa dari industri untuk prodi Anda.</td></tr>';
            }

            function prSaranBelajar(k, a) {
                const cp = k.tipe === 'bahasa' || !CP.cpl.length ? '' : (() => { const ms = cpmkOfKomp(k.nama); return ms.length
                    ? ` <span class="cpmk-tag">Terkait ${ms.map(m => `${esc(m.cpl)} · ${esc(m.kode)} (${esc(m.mata_kuliah)})`).join(', ')}</span>`
                    : ' <span class="cpmk-tag warn">Belum tercakup CPL prodi</span>'; })();
                return prSaranBelajarInti(k, a) + cp;
            }
            function prSaranBelajarInti(k, a) {
                if (k.tipe === 'bahasa') return `Tingkatkan Bahasa ${k.nama} hingga minimal <strong>${esc(k.level)}</strong> (Anda: ${k.have ? esc(k.have.level) : 'belum diisi'}). Ikuti kursus atau tes kemahiran, lalu perbarui di Job Matching.`;
                if (k.ev && k.ev.mk) return `Anda sudah menempuh <strong>${esc(k.ev.mk.nama)}</strong> (nilai ${esc(k.ev.mk.nilai)}). Perdalam lewat proyek atau praktik, atau ambil sertifikasi terkait agar buktinya lebih kuat.`;
                if (k.mk.length) return `Mahasiswa prodi Anda menempuh <strong>${k.mk.slice(0, 2).map(m => esc(m.nama)).join('</strong> / <strong>')}</strong>. Ambil bila masih tersedia, atau pelajari materinya lewat kursus.`;
                return 'Belum ada mata kuliah terkait di prodi Anda. Pelajari lewat kursus/pelatihan, proyek mandiri, atau sertifikasi kompetensi (BNSP/LSP bila tersedia).';
            }
            function prNarrative(a) {
                if (!a.S.length) return `Belum ada lowongan atau kompetensi dari Jobprovider untuk ${a.prodi}. Daftar ini akan terisi setelah perusahaan mengisi Kelola Lowongan.`;
                const top = [...a.komp].sort((x, y) => y.demand - x.demand).slice(0, 3);
                let t = `Untuk **${a.prodi}**, industri paling banyak meminta ${top.map(k => `**${k.nama}** (${pc(k.demand)})`).join(', ')}.`;
                if (!a.punya) return t + '\n\nUpload transkrip nilai di Job Matching agar C-DFS bisa menunjukkan kompetensi mana yang sudah dan belum Anda miliki.';
                const nk = a.komp.length + a.langs.length;
                t += ` Dari ${nk} kompetensi dan bahasa yang diminta, Anda sudah memiliki bukti untuk **${nk - a.learn.length - a.pantau.length}**.`;
                if (a.learn.length) t += '\n\nFokus belajar berikutnya:\n' + a.learn.slice(0, 3).map(k => `- ${k.tipe === 'bahasa' ? `Bahasa ${k.nama} (min. ${k.level})` : k.nama} — diminta ${pc(k.demand)} sumber industri${k.arah === 'Naik' || k.arah === 'Baru' ? `, tren ${k.arah.toLowerCase()}` : ''}`).join('\n');
                else t += a.pantau.length ? `\n\nBelum ada kompetensi yang diminta oleh 2 sumber atau lebih yang belum Anda miliki. ${a.pantau.length} kompetensi lain baru diminta satu perusahaan; cukup dipantau.` : '\n\nSemua kompetensi yang diminta sudah didukung bukti dari data Anda. Pertahankan, dan pantau tren skill di Dashboard.';
                if (PR.demo) t += '\n\nCatatan: dihitung dari DATA CONTOH.';
                return t;
            }
            function prRenderRek(a) {
                document.getElementById('prAiText').innerHTML = jmMd(prNarrative(a));
                prSetText('prAiSource', PR.demo ? 'Ringkasan otomatis · data contoh' : 'Ringkasan otomatis');
                const kartu = (k, i) => {
                    const per = [...new Set((k.src || []).map(s => s.perusahaan))].slice(0, 3);
                    return `
                    <div class="pr-learn ${k.n < MIN_SUMBER ? 'pantau' : ''}">
                        <div class="pr-learn-no">${i + 1}</div>
                        <div class="pr-learn-body">
                            <div class="pr-learn-head">
                                <strong>${k.tipe === 'bahasa' ? `<i class="fa-solid fa-language"></i> Bahasa ${esc(k.nama)} (min. ${esc(k.level)})` : esc(k.nama)}</strong>
                                <span class="pr-learn-tags">${k.arah === 'Naik' || k.arah === 'Baru' ? `<span class="badge badge-green"><i class="fa-solid fa-arrow-trend-up"></i> Tren ${k.arah.toLowerCase()}</span>` : ''}<span class="badge badge-blue">Diminta ${k.n} dari ${a.S.length} sumber (${pc(k.demand)})</span></span>
                            </div>
                            <div class="jm-bar"><div style="width:${Math.round(k.demand)}%"></div></div>
                            <p>${a.punya ? prSaranBelajar(k, a) : (k.mk && k.mk.length ? `Mata kuliah terkait: ${k.mk.slice(0, 2).map(m => esc(m.nama)).join(', ')}.` : 'Belum ada mata kuliah terkait di prodi Anda.')}</p>
                            ${per.length ? `<span class="jp-muted"><i class="fa-solid fa-building"></i> Diminta oleh: ${per.map(esc).join(', ')}</span>` : ''}
                        </div>
                    </div>`;
                };
                const semua = [...a.komp].sort((x, y) => y.demand - x.demand).map(k => ({...k, tipe: 'kompetensi'}));
                const utama = a.punya ? a.learn : semua.filter(k => k.n >= MIN_SUMBER);
                const pantau = a.punya ? a.pantau : semua.filter(k => k.n < MIN_SUMBER);
                document.getElementById('prLearnList').innerHTML =
                    `<h3 class="pr-sec-title">${a.punya ? `Prioritas belajar: diminta ${MIN_SUMBER}+ sumber, belum terlihat di data Anda (${utama.length})` : `Kompetensi yang diminta ${MIN_SUMBER}+ sumber untuk prodi Anda`}</h3>` +
                    (utama.length ? utama.map(kartu).join('') : `<div class="jp-empty-block"><i class="fa-solid fa-circle-check"></i>${a.S.length ? (a.punya ? `Tidak ada kompetensi yang diminta ${MIN_SUMBER} sumber atau lebih yang belum Anda miliki.` : `Belum ada kompetensi yang diminta ${MIN_SUMBER} sumber atau lebih.`) : 'Belum ada lowongan untuk prodi Anda.'}</div>`) +
                    (pantau.length ? `<details class="pr-pantau"><summary><i class="fa-solid fa-eye"></i> Pantau dulu: baru diminta 1 perusahaan (${pantau.length})</summary>
                        <p class="pr-pantau-note">Belum dijadikan prioritas karena baru satu sumber yang memintanya. Akan naik ke prioritas bila diminta perusahaan lain.</p>${pantau.map(kartu).join('')}</details>` : '');
                document.getElementById('prRekList').innerHTML = a.recs.length ? a.recs.map((r, i) => `
                    <div class="pr-rek">
                        <div class="pr-rek-icon"><i class="fa-solid ${r.icon}"></i></div>
                        <div class="pr-rek-body">
                            <div class="pr-rek-head"><span class="pr-rek-type">${i + 1}. ${esc(r.jenis)}</span><span class="badge ${PRIO_BADGE[r.prio]}">Prioritas ${r.prio}</span></div>
                            <h4>${esc(r.judul)}</h4>
                            <p>${esc(r.alasan)}</p>
                            <p class="pr-rek-aksi"><i class="fa-solid fa-arrow-right"></i> ${esc(r.aksi)}</p>
                        </div>
                    </div>`).join('')
                    : `<p class="jp-muted" style="padding:12px 4px;">${a.cukup ? 'Tidak ada gap prodi ≥ 20 poin.' : `Rekomendasi kurikulum muncul bila minimal ${MIN_MHS} mahasiswa prodi sudah mengunggah transkrip.`}</p>`;
            }

            function prRenderAll() {
                const prodi = curProdi();
                document.querySelectorAll('.pr-prodi-chip').forEach(c => { c.textContent = prodi ? `${kodeProdi(prodi)} · ${prodi}` : 'Prodi belum dipilih'; });
                document.querySelectorAll('.lbl-mitra').forEach(e => { e.textContent = prodi === PGSD || prodi === PAUD ? 'mitra / pengguna lulusan' : 'industri'; });
                document.querySelectorAll('.pr-noprodi').forEach(e => e.classList.toggle('is-hidden', !!prodi));
                document.querySelectorAll('.pr-body').forEach(e => e.classList.toggle('is-hidden', !prodi));
                if (!prodi) return;
                prEnsure();
                const a = prAnalyze();
                if (!a || PR.reqProdi !== prodi) return;
                prRenderGap(a);
                prRenderRek(a);
            }
            // Gambar ulang saat halaman dibuka (grafik hanya digambar pada halaman yang terlihat)
            document.querySelectorAll('.nav-item[data-target^="view-pr-"]').forEach(n => n.addEventListener('click', () => setTimeout(prRenderAll, 0)));


            // ---------- Tren Pekerjaan & Skill (kartu pertama Dashboard Jobseeker) ----------
            // Angka: WEF Future of Jobs Report 2025, perkiraan perubahan jumlah pekerjaan 2025–2030 (dikutip Euronews, 1 Feb 2025).
            // "prodi" = pemetaan relevansi oleh tim C-DFS (silakan disesuaikan dosen prodi).
            const TRSE = 'Teknologi Rekayasa Sistem Elektronika', MP = 'Manajemen Pemasaran', MAT = 'Matematika', PAUD = 'Pendidikan Guru Pendidikan Anak Usia Dini (PGPAUD)', PGSD = 'Pendidikan Guru Sekolah Dasar (PGSD)';
            const FS_JOBS = [
                {nama: 'Spesialis Big Data', v: 113, prodi: [MAT, MP]},
                {nama: 'Insinyur FinTech', v: 93, prodi: [MAT]},
                {nama: 'Spesialis AI & Machine Learning', v: 82, prodi: [MAT, TRSE]},
                {nama: 'Pengembang Software & Aplikasi', v: 57, prodi: [MAT, TRSE]},
                {nama: 'Spesialis Manajemen Keamanan', v: 53, prodi: [TRSE]},
                {nama: 'Spesialis Data Warehouse', v: 49, prodi: [MAT]},
                {nama: 'Spesialis Kendaraan Otonom & Listrik', v: 48, prodi: [TRSE]},
                {nama: 'Desainer UI/UX', v: 48, prodi: [MP]},
                {nama: 'Spesialis Internet of Things', v: 42, prodi: [TRSE]},
                {nama: 'Analis & Ilmuwan Data', v: 41, prodi: [MAT, MP]},
                {nama: 'Petugas Klerikal Pos', v: -34, prodi: []},
                {nama: 'Teller Bank', v: -31, prodi: [MAT]},
                {nama: 'Petugas Entri Data', v: -26, prodi: [MAT, MP, TRSE]},
                {nama: 'Kasir & Petugas Tiket', v: -20, prodi: [MP]},
                {nama: 'Asisten Administrasi & Sekretaris', v: -20, prodi: [MP, PGSD]},
                {nama: 'Pekerja Percetakan', v: -20, prodi: [MP]},
                {nama: 'Klerk Akuntansi & Penggajian', v: -18, prodi: [MAT]},
                {nama: 'Klerk Pencatatan Stok', v: -16, prodi: [TRSE]},
                {nama: 'Sales Door-to-door & Pedagang Keliling', v: -14, prodi: [MP]}
            ];
            let fsMode = null, fsChart = null, fsKey = '';
            // Satu pilihan cakupan (pojok kanan) untuk kedua grafik: Tren Pekerjaan & Skill dan Tumbuh & Gap Kompetensi
            const DASH = {mode: null, pilihan: false};
            const labelMitra = (prodi) => prodi === PGSD || prodi === PAUD ? 'mitra / pengguna lulusan' : 'mitra industri';
            function dashMode() {
                const prodi = curProdi();
                if (!DASH.pilihan || (DASH.mode === 'prodi' && !prodi)) DASH.mode = prodi ? 'prodi' : 'global';
                document.querySelectorAll('#dashSeg .seg-btn').forEach(b => {
                    b.classList.toggle('active', b.dataset.mode === DASH.mode);
                    b.disabled = b.dataset.mode === 'prodi' && !prodi;
                    if (b.dataset.mode === 'prodi') b.textContent = prodi ? `Prodi Saya · ${kodeProdi(prodi)}` : 'Prodi Saya';
                    b.title = b.disabled ? 'Pilih program studi dahulu' : '';
                });
                const sub = document.getElementById('dashModeSub');
                if (sub) sub.textContent = DASH.mode === 'prodi' ? `Ditampilkan untuk ${prodi}` : 'Ditampilkan untuk semua prodi (global)';
                return DASH.mode;
            }
            document.querySelectorAll('#dashSeg .seg-btn').forEach(b => b.addEventListener('click', () => {
                if (b.disabled) return; DASH.mode = b.dataset.mode; DASH.pilihan = true; fsRender(); gkRender();
            }));
            // Label persentase di ujung batang
            const fsLabelPlugin = {
                id: 'fsLabel',
                afterDatasetsDraw(chart) {
                    const {ctx} = chart;
                    const ds = chart.data.datasets[0];
                    ctx.save();
                    ctx.font = '600 11px Inter, sans-serif';
                    ctx.textBaseline = 'middle';
                    chart.getDatasetMeta(0).data.forEach((bar, i) => {
                        const v = ds.data[i];
                        ctx.fillStyle = v >= 0 ? '#15803d' : '#b91c1c';
                        // Layar sempit: label penurunan ditulis di kanan garis 0 agar tidak menabrak nama pekerjaan
                        const kanan = v >= 0 || chart.width < 420;
                        ctx.textAlign = kanan ? 'left' : 'right';
                        const x0 = chart.scales.x.getPixelForValue(0);
                        ctx.fillText((v > 0 ? '+' : '') + v + '%', v >= 0 ? bar.x + 6 : (kanan ? x0 + 6 : bar.x - 6), bar.y);
                    });
                    ctx.restore();
                }
            };
            function fsRender() {
                const prodi = curProdi();
                const relevan = FS_JOBS.filter(j => j.prodi.includes(prodi));
                const bisaProdi = relevan.some(j => j.v > 0);
                const mode = dashMode();
                fsMode = mode === 'prodi' && bisaProdi ? 'prodi' : 'global';
                const fallback = mode === 'prodi' && !bisaProdi;
                const key = fsMode + '|' + prodi + '|' + fallback;
                if (key === fsKey && fsChart) return;
                fsKey = key;
                const naik = (fsMode === 'prodi' ? relevan : FS_JOBS).filter(j => j.v > 0).sort((a, b) => b.v - a.v).slice(0, 6);
                const turun = (fsMode === 'prodi' ? relevan : FS_JOBS).filter(j => j.v < 0).sort((a, b) => a.v - b.v).slice(0, 6);
                const rows = naik.concat(turun.reverse());   // tumbuh di atas, penurunan terdalam paling bawah
                document.getElementById('fsSub').textContent = fsMode === 'prodi'
                    ? `Pekerjaan terkait ${kodeProdi(prodi)}: perkiraan perubahan jumlah 2025–2030`
                    : (fallback ? `WEF belum merinci pekerjaan ${kodeProdi(prodi)}; ditampilkan tren global 2025–2030` : 'Pekerjaan yang paling cepat tumbuh dan menurun di dunia: perkiraan perubahan jumlah 2025–2030');
                const box = document.getElementById('fsChartBox');
                const sempit = box.clientWidth < 440;
                // Di layar sempit nama pekerjaan dipecah menjadi beberapa baris agar tidak terpotong
                const bungkus = (t) => { if (!sempit) return t; const out = []; let cur = ''; t.split(' ').forEach(w => { if ((cur + ' ' + w).trim().length > 16) { if (cur) out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }); if (cur) out.push(cur); return out; };
                box.style.height = (rows.length * (sempit ? 40 : 30) + 40) + 'px';
                if (fsChart) fsChart.destroy();
                const maxPos = Math.max(0, ...rows.map(r => r.v)), maxNeg = Math.max(0, ...rows.map(r => -r.v));
                fsChart = new Chart(document.getElementById('fsChart').getContext('2d'), {
                    type: 'bar',
                    data: {labels: rows.map(r => bungkus(r.nama)), datasets: [{data: rows.map(r => r.v), backgroundColor: rows.map(r => r.v >= 0 ? '#16a34a' : '#dc2626'), borderRadius: 4, barPercentage: 0.7, categoryPercentage: 0.9}]},
                    plugins: [fsLabelPlugin],
                    options: {indexAxis: 'y', responsive: true, maintainAspectRatio: false, animation: {duration: 500},
                        layout: {padding: {left: 0, right: 8}},
                        plugins: {legend: {display: false}, tooltip: {callbacks: {label: (c) => `${c.raw > 0 ? '+' : ''}${c.raw}% jumlah pekerjaan (2025–2030)`}}},
                        scales: {
                            x: {min: -Math.ceil((maxNeg + (sempit ? 4 : 18)) / 10) * 10, max: Math.ceil((maxPos + (sempit ? 40 : 22)) / 10) * 10, ticks: {stepSize: 10, autoSkip: false, maxRotation: 0, callback: (v) => v % (sempit ? 100 : 50) === 0 ? (v > 0 ? '+' : '') + v + '%' : '', font: {size: 10}}, grid: {color: (c) => c.tick.value === 0 ? '#94a3b8' : (c.tick.value % 50 === 0 ? '#f1f5f9' : 'transparent')}},
                            y: {grid: {display: false}, ticks: {font: {size: sempit ? 10.5 : 11.5}, color: '#334155', autoSkip: false}}
                        }}
                });
                document.getElementById('fsSkills').innerHTML = '<strong>Skill:</strong>' +
                    '<span class="fs-chip up">AI &amp; Big Data +87%</span><span class="fs-chip up">Jaringan &amp; Keamanan Siber +70%</span><span class="fs-chip up">Literasi Teknologi +68%</span>' +
                    '<span class="fs-chip down">Ketangkasan Manual &amp; Presisi: 24% pemberi kerja memperkirakan menurun</span>';
                document.getElementById('fsSrc').innerHTML = 'Sumber: WEF <em>Future of Jobs Report 2025</em>. Persentase pekerjaan = perkiraan perubahan jumlah pekerjaan 2025–2030; persentase skill = selisih pemberi kerja yang memperkirakan naik dikurangi yang memperkirakan turun. ' +
                    'WEF memproyeksikan sampai 2030; arah sesudahnya hingga 10 tahun ke depan diperkirakan berlanjut, bukan angka pasti.' +
                    (fsMode === 'prodi' ? ' Pemetaan ke prodi disusun tim C-DFS.' : ((prodi === PGSD || prodi === PAUD) ? ' WEF belum merinci persentase untuk guru SD / PAUD; guru sekolah menengah dan dosen termasuk pekerjaan yang jumlahnya bertambah paling banyak.' : '')) +
                    (prodi ? ' <a href="#" class="js-goto" data-goto="view-pr-rekomendasi">Lihat kompetensi yang perlu Anda pelajari &rarr;</a>' : '');
            }

            // Kartu ringkas di Dashboard
            function jsRenderLearnCard() {
                const box = document.getElementById('jsLearnCard');
                if (!box) return;
                const a = curProdi() && PR.reqProdi === curProdi() ? prAnalyze() : null;
                if (!a || !a.S.length) { box.classList.add('is-hidden'); return; }
                box.classList.remove('is-hidden');
                const list = a.punya ? a.learn.slice(0, 3) : [...a.komp].filter(k => k.n >= MIN_SUMBER).sort((x, y) => y.demand - x.demand).slice(0, 3);
                box.innerHTML = `
                    <div class="card-header-flex"><h3 class="card-title"><i class="fa-solid fa-book-open-reader text-blue"></i> ${a.punya ? 'Kompetensi yang Perlu Anda Pelajari' : 'Kompetensi Paling Diminta untuk Prodi Anda'}</h3>
                        <button class="btn-outline-blue js-goto" data-goto="view-pr-rekomendasi" style="margin:0;">Lihat Semua <i class="fa-solid fa-arrow-right"></i></button></div>
                    ${list.length ? `<div class="js-learn">${list.map(k => `
                        <div class="js-learn-item"><strong>${k.tipe === 'bahasa' ? `Bahasa ${esc(k.nama)} (min. ${esc(k.level)})` : esc(k.nama)}</strong>
                            <span class="jp-muted">diminta ${(() => { const N = mitraSet(a.S).size; const n = k.tipe === 'bahasa' ? mitraSet(a.S.filter(x => (x.bahasa || []).some(b => normLang(b.nama) === normLang(k.nama)))).size : mitraMinta(a.S, k.nama); return `${n} dari ${N} ${labelMitra(a.prodi)}`; })()}${k.arah === 'Naik' || k.arah === 'Baru' ? ` · tren ${k.arah.toLowerCase()}` : ''}</span>
                            <div class="jm-bar"><div style="width:${Math.round(k.demand)}%"></div></div></div>`).join('')}</div>`
                    : `<p class="jp-muted"><i class="fa-solid fa-circle-check" style="color:#16a34a"></i> Tidak ada kompetensi prioritas (diminta ${MIN_SUMBER}+ sumber) yang belum Anda miliki.${a.pantau && a.pantau.length ? ` ${a.pantau.length} kompetensi lain baru diminta 1 perusahaan.` : ''}</p>`}`;
            }

            // ---------- Tumbuh & Gap Kompetensi (berdampingan dengan Tren di Dashboard) ----------
            //   Prodi  = kompetensi yang diminta industri untuk prodi Anda vs kesiapan mahasiswa prodi (agregat anonim)
            //   Global = keselarasan tiap prodi (kebutuhan industri yang sudah didukung bukti mahasiswa) + gap terbesarnya
            const GK = {loaded: false, loading: false, demo: false, list: [], chart: null, key: ''};
            async function gkLoad() {
                const res = await apiRequest('js_gap_global');
                if (res && res.success) {
                    GK.demo = false;
                    GK.list = (res.prodi || []).map(p => ({prodi: p.prodi, sumber: p.sumber, sources: p.sources || [], agg: p.analisis}));
                } else {
                    GK.demo = true;
                    GK.list = [...new Set(PR_DEMO.sources.map(s => s.prodi))].map(p => {
                        const S = PR_DEMO.sources.filter(s => s.prodi === p);
                        return {prodi: p, sumber: S.length, sources: S, agg: prAgg(S, PR_DEMO.students.filter(s => s.prodi === p))};
                    });
                }
                GK.loaded = true;
            }
            function gkEnsure() {
                if (GK.loaded || GK.loading) return;
                GK.loading = true;
                gkLoad().finally(() => { GK.loading = false; gkRender(); });
            }
            // Ringkasan satu prodi: keselarasan, gap terbesar, pekerjaan yang tumbuh (WEF)
            // Jumlah mitra (perusahaan/instansi berbeda) yang meminta suatu kompetensi
            const mitraSet = (sources) => new Set((sources || []).map(s => s.perusahaan));
            const mitraMinta = (sources, nama) => mitraSet((sources || []).filter(s => (s.kompetensi || []).some(x => String(x).trim().toLowerCase() === nama.toLowerCase()))).size;
            function gkRingkas(prodi, agg, sources) {
                const N = mitraSet(sources).size, ns = agg ? agg.mahasiswa : 0;
                const komp = ((agg && agg.komp) || []).map(k => ({...k, gap: k.ready === null || k.ready === undefined ? null : Math.max(0, k.demand - k.ready),
                    nm: mitraMinta(sources, k.nama), N, ns}));
                const sumD = komp.reduce((s, k) => s + k.demand, 0);
                const cukup = !!(agg && agg.cukup);
                const index = cukup && sumD ? komp.reduce((s, k) => s + k.demand * k.ready, 0) / sumD : null;
                const prioritas = komp.filter(k => k.n >= MIN_SUMBER);
                const top = [...(prioritas.length ? prioritas : komp)].sort((a, b) => (b.gap ?? -1) - (a.gap ?? -1) || b.demand - a.demand || a.nama.localeCompare(b.nama))[0] || null;
                const tumbuh = FS_JOBS.filter(j => j.v > 0 && j.prodi.includes(prodi)).sort((a, b) => b.v - a.v).slice(0, 2);
                return {prodi, komp, index, top, tumbuh, cukup, N, ns};
            }
            const gkTumbuhTxt = (r) => r.tumbuh.length ? r.tumbuh.map(j => `${esc(j.nama)} (+${j.v}%)`).join(', ')
                : ((r.prodi === PGSD || r.prodi === PAUD) ? 'Guru sekolah menengah dan dosen termasuk pekerjaan yang jumlahnya bertambah paling banyak (WEF); guru SD / PAUD belum dirinci.' : 'WEF belum merinci pekerjaan untuk prodi ini.');
            const nSiap = (k) => Math.round((k.ready || 0) * k.ns / 100);
            const gkGapTxt = (k, cukup, prodi) => !k ? `Belum ada kebutuhan dari ${labelMitra(prodi)}.`
                : `${esc(k.nama)} diminta ${k.nm} dari ${k.N} ${labelMitra(prodi)}` + (cukup ? `, baru ${nSiap(k)} dari ${k.ns} mahasiswa siap` : '') + (cukup && !k.mk.length ? ', belum ada mata kuliahnya.' : '.');
            // Label angka di ujung batang (semua dataset)
            const gkLabelPlugin = {
                id: 'gkLabel',
                afterDatasetsDraw(chart) {
                    const {ctx} = chart;
                    ctx.save();
                    ctx.font = '600 10.5px Inter, sans-serif';
                    ctx.textBaseline = 'middle';
                    chart.data.datasets.forEach((ds, di) => {
                        if (ds.noLabel) return;
                        const meta = chart.getDatasetMeta(di);
                        if (meta.hidden) return;
                        meta.data.forEach((bar, i) => {
                            const v = ds.data[i];
                            if (v === null || v === undefined) return;
                            const t = ds.labelFn ? ds.labelFn(v, i) : v + '%';
                            if (!t) return;
                            ctx.fillStyle = ds.labelColor || '#0b1220';
                            ctx.textAlign = 'left';
                            ctx.fillText(t, bar.x + 5, bar.y);
                        });
                    });
                    ctx.restore();
                }
            };
            function gkRender() {
                const card = document.getElementById('gkCard');
                if (!card) return;
                const prodi = curProdi();
                const a = prodi && PR.reqProdi === prodi ? prAnalyze() : null;
                const mode = dashMode();
                if (mode === 'global') gkEnsure();
                const box = document.getElementById('gkChartBox'), empty = document.getElementById('gkEmpty');
                const legend = document.getElementById('gkLegend'), foot = document.getElementById('gkFoot'), src = document.getElementById('gkSrc');
                const sempit = box.clientWidth < 440 && box.clientWidth > 0;
                const bungkus = (t, max) => { const out = []; let cur = ''; String(t).split(' ').forEach(w => { if ((cur + ' ' + w).trim().length > max) { if (cur) out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }); if (cur) out.push(cur); return out; };
                const kosong = (msg) => {
                    if (GK.chart) { GK.chart.destroy(); GK.chart = null; }
                    GK.key = '';
                    box.style.display = 'none'; legend.innerHTML = '';
                    empty.innerHTML = msg; empty.classList.remove('is-hidden');
                };
                let cfg = null, key = '';
                if (mode === 'prodi') {
                    if (!a) { kosong('<i class="fa-solid fa-spinner fa-spin"></i> Memuat data prodi…'); foot.innerHTML = ''; src.innerHTML = ''; return; }
                    if (!a.komp.length) { kosong(`<i class="fa-solid fa-briefcase"></i>Belum ada kebutuhan kompetensi dari ${labelMitra(prodi)} untuk ${esc(kodeProdi(prodi))}. Pilih <strong>Global</strong> untuk melihat semua prodi.`); foot.innerHTML = ''; src.innerHTML = ''; return; }
                    const r = gkRingkas(prodi, PR.agg, PR.sources);
                    const N = r.N, ns = a.ns;
                    a.komp.forEach(k => { k.nm = mitraMinta(PR.sources, k.nama); k.N = N; k.ns = ns; });
                    const rows = [...a.komp].sort((x, y) => (y.n >= MIN_SUMBER) - (x.n >= MIN_SUMBER) || (y.gap ?? -1) - (x.gap ?? -1) || y.demand - x.demand || x.nama.localeCompare(y.nama)).slice(0, 6);
                    document.getElementById('gkSub').textContent = `${kodeProdi(prodi)}: berapa ${labelMitra(prodi)} yang meminta, berapa mahasiswa prodi yang siap`;
                    legend.innerHTML = `<div class="legend-item"><div class="dot" style="background:#1d4ed8"></div> Diminta ${labelMitra(prodi)} (dari ${N})</div>` +
                        (a.cukup ? `<div class="legend-item"><div class="dot" style="background:#16a34a"></div> Mahasiswa prodi siap (dari ${ns})</div>` : '');
                    foot.innerHTML = `<p><b class="up">Tumbuh:</b> ${gkTumbuhTxt(r)}</p><p><b class="gap">Gap:</b> ${gkGapTxt(r.top, a.cukup, prodi)}</p>`;
                    src.innerHTML = `Sumber: lowongan &amp; kebutuhan kompetensi ${labelMitra(prodi)}; ditulis sebagai jumlah (mis. 2/3) karena sampelnya kecil. Siap = mahasiswa prodi (anonim) dengan mata kuliah terkait bernilai &ge; B atau sertifikat terkait` +
                        (a.cukup ? '' : ` — tampil bila minimal ${MIN_MHS} mahasiswa prodi sudah mengunggah transkrip`) + '. Tumbuh: WEF 2025.' +
                        (PR.demo ? ' <strong>DATA CONTOH.</strong>' : '') + ' <a href="#" class="js-goto" data-goto="view-pr-gap">Lihat detail gap &rarr;</a>';
                    const ds = [{label: 'Diminta', data: rows.map(k => N ? Math.round(100 * k.nm / N) : 0), backgroundColor: '#1d4ed8', labelColor: '#1d4ed8', borderRadius: 4, barPercentage: 0.85, categoryPercentage: 0.75,
                        labelFn: (v, i) => `${rows[i].nm}/${N} mitra`, tipFn: (i) => `Diminta ${rows[i].nm} dari ${N} ${labelMitra(prodi)}`}];
                    if (a.cukup) ds.push({label: 'Siap', data: rows.map(k => Math.round(k.ready)), backgroundColor: '#16a34a', labelColor: '#15803d', borderRadius: 4, barPercentage: 0.85, categoryPercentage: 0.75,
                        labelFn: (v, i) => `${nSiap(rows[i])}/${ns} mhs`, tipFn: (i) => `${nSiap(rows[i])} dari ${ns} mahasiswa prodi siap`});
                    key = 'p|' + prodi + '|' + JSON.stringify(ds.map(d => d.data)) + rows.map(k => k.nama).join() + sempit;
                    box.style.height = (rows.length * (a.cukup ? 44 : 30) + 40) + 'px';
                    cfg = {type: 'bar', data: {labels: rows.map(k => bungkus(k.nama, sempit ? 16 : 24)), datasets: ds}, plugins: [gkLabelPlugin],
                        options: {indexAxis: 'y', responsive: true, maintainAspectRatio: false, animation: {duration: 500},
                            plugins: {legend: {display: false}, tooltip: {callbacks: {label: (c) => c.dataset.tipFn(c.dataIndex)}}},
                            scales: {x: {min: 0, max: sempit ? 150 : 125, ticks: {stepSize: 50, callback: (v) => v <= 100 ? v + '%' : '', font: {size: 10}}, grid: {color: (c) => c.tick.value <= 100 ? '#f1f5f9' : 'transparent'}},
                                y: {grid: {display: false}, ticks: {font: {size: sempit ? 10.5 : 11.5}, color: '#334155', autoSkip: false}}}}};
                } else {
                    document.getElementById('gkSub').textContent = 'Semua prodi: kebutuhan mitra yang sudah didukung bukti mahasiswa, dan gap terbesarnya';
                    if (!GK.loaded) { kosong('<i class="fa-solid fa-spinner fa-spin"></i> Memuat data semua prodi…'); foot.innerHTML = ''; src.innerHTML = ''; return; }
                    const rs = GK.list.map(x => gkRingkas(x.prodi, x.agg, x.sources)).filter(r => r.komp.length)
                        .sort((x, y) => (y.prodi === prodi) - (x.prodi === prodi) || (x.index ?? 101) - (y.index ?? 101));
                    if (!rs.length) { kosong('<i class="fa-solid fa-briefcase"></i>Belum ada kebutuhan kompetensi dari mitra.'); foot.innerHTML = ''; src.innerHTML = ''; return; }
                    legend.innerHTML = '<div class="legend-item"><div class="dot" style="background:#16a34a"></div> Sudah didukung mahasiswa</div><div class="legend-item"><div class="dot" style="background:#fca5a5"></div> Gap</div>';
                    foot.innerHTML = rs.map(r => `<div class="gk-row${r.prodi === prodi ? ' mine' : ''}"><span class="ld-case-tag">${esc(jalurOf(r.prodi) === 'Vocational' ? 'Vokasi' : (jalurOf(r.prodi) || '-'))} · ${esc(kodeProdi(r.prodi))}</span>
                        <p><b class="up">Tumbuh:</b> ${gkTumbuhTxt(r)}</p><p><b class="gap">Gap:</b> ${gkGapTxt(r.top, r.cukup, r.prodi)}</p></div>`).join('');
                    src.innerHTML = 'Keselarasan = rata-rata kesiapan mahasiswa prodi, dibobot menurut seberapa sering kompetensi diminta industri (anonim, minimal ' + MIN_MHS + ' mahasiswa per prodi). Tumbuh: WEF 2025.' + (GK.demo ? ' <strong>DATA CONTOH.</strong>' : '');
                    const siap = rs.map(r => r.index === null ? null : Math.round(r.index));
                    key = 'g|' + prodi + '|' + JSON.stringify(siap) + rs.map(r => r.prodi).join() + sempit;
                    box.style.height = (rs.length * 46 + 40) + 'px';
                    cfg = {type: 'bar', data: {labels: rs.map(r => (r.prodi === prodi ? '★ ' : '') + kodeProdi(r.prodi)), datasets: [
                            {label: 'Sudah didukung', data: siap, backgroundColor: '#16a34a', stack: 's', borderRadius: 4, barPercentage: 0.7, labelColor: '#0b1220',
                                labelFn: (v, i) => ''},
                            {label: 'Gap', data: siap.map(v => v === null ? null : 100 - v), backgroundColor: '#fca5a5', stack: 's', borderRadius: 4, barPercentage: 0.7, labelColor: '#0b1220',
                                labelFn: (v, i) => `${siap[i]}% selaras`},
                            {label: 'Data mahasiswa belum cukup', data: siap.map(v => v === null ? 0 : null), backgroundColor: 'transparent', stack: 's', labelColor: '#64748b',
                                labelFn: (v, i) => 'data mahasiswa belum cukup'}]},
                        plugins: [gkLabelPlugin],
                        options: {indexAxis: 'y', responsive: true, maintainAspectRatio: false, animation: {duration: 500},
                            plugins: {legend: {display: false}, tooltip: {filter: (c) => c.raw !== null && c.datasetIndex < 2, callbacks: {title: (c) => rs[c[0].dataIndex].prodi, label: (c) => `${c.dataset.label}: ${c.raw}%`}}},
                            scales: {x: {stacked: true, min: 0, max: sempit ? 160 : 140, ticks: {stepSize: 50, callback: (v) => v <= 100 ? v + '%' : '', font: {size: 10}}, grid: {color: (c) => c.tick.value <= 100 ? '#f1f5f9' : 'transparent'}},
                                y: {stacked: true, grid: {display: false}, ticks: {font: {size: 12, weight: '600'}, color: '#0b1220'}}}}};
                }
                empty.classList.add('is-hidden'); box.style.display = '';
                if (key === GK.key && GK.chart) return;
                GK.key = key;
                if (GK.chart) GK.chart.destroy();
                GK.chart = new Chart(document.getElementById('gkChart').getContext('2d'), cfg);
            }

            // ==============================================================
            // 17. CPL & CPMK (Kompetensi Prodi → CPL & CPMK, kartu Kurikulum di Dashboard)
            //     CPL/CPMK diinput admin prodi dari RPS (tabel cpl & cpmk). Kebutuhan mitra dipetakan ke CPMK
            //     lewat kata kunci yang ditetapkan admin prodi → rantai: kebutuhan mitra → CPL → CPMK → mata kuliah.
            // ==============================================================
            const CPL_DEMO = {"Teknologi Rekayasa Sistem Elektronika":[{"kode":"CPL-1","deskripsi":"Mampu merancang, menganalisis, dan menguji rangkaian elektronika analog dan digital.","wef_pembanding":"Literasi teknologi","wef_arah":"naik","cpmk":[{"kode":"CPMK-1.1","deskripsi":"Menganalisis rangkaian listrik dan elektronika analog.","mata_kuliah":"Elektronika Analog","kata_kunci":"Elektronika Analog; Rangkaian Listrik"},{"kode":"CPMK-1.2","deskripsi":"Merancang rangkaian elektronika digital.","mata_kuliah":"Elektronika Digital","kata_kunci":"Elektronika Digital"},{"kode":"CPMK-1.3","deskripsi":"Melakukan pengukuran besaran elektronika dengan alat ukur yang tepat.","mata_kuliah":"Pengukuran Elektronika","kata_kunci":"Pengukuran Elektronika"}]},{"kode":"CPL-2","deskripsi":"Mampu mengembangkan sistem tertanam (embedded) dan Internet of Things.","wef_pembanding":"AI & big data","wef_arah":"naik","cpmk":[{"kode":"CPMK-2.1","deskripsi":"Memprogram mikrokontroler untuk membaca sensor dan mengendalikan aktuator.","mata_kuliah":"Sistem Mikrokontroler","kata_kunci":"Mikrokontroler; Pemrograman C; Sensor dan Transduser"},{"kode":"CPMK-2.2","deskripsi":"Membangun sistem embedded berbasis kebutuhan pengguna.","mata_kuliah":"Embedded System","kata_kunci":"Embedded System"},{"kode":"CPMK-2.3","deskripsi":"Mengintegrasikan perangkat ke jaringan dan platform IoT.","mata_kuliah":"Internet of Things","kata_kunci":"Internet of Things; Komputer dan Jaringan"}]},{"kode":"CPL-3","deskripsi":"Mampu menerapkan sistem kendali dan instrumentasi pada proses industri.","wef_pembanding":"Literasi teknologi","wef_arah":"naik","cpmk":[{"kode":"CPMK-3.1","deskripsi":"Menganalisis dan menala sistem kendali loop tertutup.","mata_kuliah":"Sistem Kendali","kata_kunci":"Sistem Kendali"},{"kode":"CPMK-3.2","deskripsi":"Memilih dan mengkalibrasi instrumen ukur industri.","mata_kuliah":"Instrumentasi Elektronika","kata_kunci":"Instrumentasi"}]},{"kode":"CPL-4","deskripsi":"Mampu melakukan pemeliharaan dan perbaikan perangkat elektronika sesuai prosedur K3.","wef_pembanding":"Ketangkasan manual & presisi","wef_arah":"turun","cpmk":[{"kode":"CPMK-4.1","deskripsi":"Melakukan diagnosis kerusakan dan perbaikan perangkat elektronika.","mata_kuliah":"Pemeliharaan dan Perbaikan Perangkat Elektronika","kata_kunci":"Pemeliharaan Perangkat Elektronika"}]}],"Manajemen Pemasaran":[{"kode":"CPL-1","deskripsi":"Mampu menyusun strategi pemasaran berdasarkan analisis perilaku konsumen.","wef_pembanding":"","wef_arah":null,"cpmk":[{"kode":"CPMK-1.1","deskripsi":"Menganalisis perilaku dan keputusan pembelian konsumen.","mata_kuliah":"Perilaku Konsumen","kata_kunci":"Perilaku Konsumen"},{"kode":"CPMK-1.2","deskripsi":"Menyusun rencana dan strategi pemasaran.","mata_kuliah":"Manajemen Pemasaran","kata_kunci":"Strategi Pemasaran"}]},{"kode":"CPL-2","deskripsi":"Mampu melakukan riset pemasaran dan menganalisis data pasar.","wef_pembanding":"AI & big data","wef_arah":"naik","cpmk":[{"kode":"CPMK-2.1","deskripsi":"Merancang dan melaksanakan riset pemasaran.","mata_kuliah":"Riset Pemasaran","kata_kunci":"Riset Pemasaran; Analisis Data Marketing"},{"kode":"CPMK-2.2","deskripsi":"Mengolah data pasar dengan statistika bisnis.","mata_kuliah":"Statistika Bisnis","kata_kunci":"Statistika Bisnis"}]},{"kode":"CPL-3","deskripsi":"Mampu merancang komunikasi pemasaran dan promosi.","wef_pembanding":"","wef_arah":null,"cpmk":[{"kode":"CPMK-3.1","deskripsi":"Merancang pesan dan bauran komunikasi pemasaran.","mata_kuliah":"Komunikasi Pemasaran","kata_kunci":"Komunikasi Pemasaran; Content Marketing"},{"kode":"CPMK-3.2","deskripsi":"Merancang materi periklanan.","mata_kuliah":"Periklanan","kata_kunci":"Periklanan"}]},{"kode":"CPL-4","deskripsi":"Mampu melakukan penjualan dan negosiasi bisnis secara etis.","wef_pembanding":"","wef_arah":null,"cpmk":[{"kode":"CPMK-4.1","deskripsi":"Mengelola proses penjualan dan target penjualan.","mata_kuliah":"Manajemen Penjualan","kata_kunci":"Penjualan; Technical Sales"},{"kode":"CPMK-4.2","deskripsi":"Melakukan negosiasi dan komunikasi bisnis.","mata_kuliah":"Negosiasi Bisnis","kata_kunci":"Negosiasi; Komunikasi Bisnis"}]},{"kode":"CPL-5","deskripsi":"Mampu mengelola merek dan materi promosi cetak.","wef_pembanding":"Pekerja percetakan","wef_arah":"turun","cpmk":[{"kode":"CPMK-5.1","deskripsi":"Mengelola identitas merek dan materi promosi cetak.","mata_kuliah":"Manajemen Merek","kata_kunci":"Manajemen Merek; Promosi Cetak"}]}],"Pendidikan Guru Pendidikan Anak Usia Dini (PGPAUD)":[{"kode":"CPL-1","deskripsi":"Mampu merancang dan melaksanakan pembelajaran yang sesuai tahap perkembangan anak usia dini.","wef_pembanding":"","wef_arah":null,"cpmk":[{"kode":"CPMK-1.1","deskripsi":"Menyusun perencanaan pembelajaran PAUD berbasis bermain.","mata_kuliah":"Perencanaan Pembelajaran PAUD","kata_kunci":"Perencanaan Pembelajaran PAUD"},{"kode":"CPMK-1.2","deskripsi":"Mengembangkan kegiatan bermain yang mendidik.","mata_kuliah":"Bermain dan Permainan Anak","kata_kunci":"Bermain dan Permainan Anak"}]},{"kode":"CPL-2","deskripsi":"Mampu menilai dan memantau tumbuh kembang anak usia dini.","wef_pembanding":"","wef_arah":null,"cpmk":[{"kode":"CPMK-2.1","deskripsi":"Melakukan asesmen perkembangan anak usia dini.","mata_kuliah":"Asesmen Perkembangan Anak Usia Dini","kata_kunci":"Asesmen Perkembangan Anak"},{"kode":"CPMK-2.2","deskripsi":"Menganalisis aspek perkembangan anak.","mata_kuliah":"Psikologi Perkembangan Anak","kata_kunci":"Psikologi Perkembangan Anak"}]},{"kode":"CPL-3","deskripsi":"Mampu mengembangkan media pembelajaran anak, termasuk media digital.","wef_pembanding":"Literasi teknologi","wef_arah":"naik","cpmk":[{"kode":"CPMK-3.1","deskripsi":"Merancang media pembelajaran PAUD.","mata_kuliah":"Media Pembelajaran PAUD","kata_kunci":"Media Pembelajaran"}]},{"kode":"CPL-4","deskripsi":"Mampu mengelola kelas dan lingkungan belajar anak usia dini.","wef_pembanding":"","wef_arah":null,"cpmk":[{"kode":"CPMK-4.1","deskripsi":"Mengelola kelas PAUD yang aman dan menyenangkan.","mata_kuliah":"Manajemen Kelas","kata_kunci":"Manajemen Kelas"}]},{"kode":"CPL-5","deskripsi":"Mampu mengekspresikan seni dan kreativitas anak.","wef_pembanding":"Ketangkasan manual & presisi","wef_arah":"turun","cpmk":[{"kode":"CPMK-5.1","deskripsi":"Membimbing kegiatan seni anak usia dini.","mata_kuliah":"Seni Anak Usia Dini","kata_kunci":"Seni Anak"}]}],"Pendidikan Guru Sekolah Dasar (PGSD)":[{"kode":"CPL-1","deskripsi":"Mampu merancang dan melaksanakan pembelajaran yang mendidik di sekolah dasar.","wef_pembanding":"","wef_arah":null,"cpmk":[{"kode":"CPMK-1.1","deskripsi":"Menyusun perencanaan pembelajaran SD.","mata_kuliah":"Perencanaan Pembelajaran SD","kata_kunci":"Perencanaan Pembelajaran SD"},{"kode":"CPMK-1.2","deskripsi":"Melaksanakan pembelajaran matematika SD.","mata_kuliah":"Pembelajaran Matematika SD","kata_kunci":"Pembelajaran Matematika SD"},{"kode":"CPMK-1.3","deskripsi":"Mempraktikkan keterampilan dasar mengajar.","mata_kuliah":"Microteaching","kata_kunci":"Praktik Mengajar"}]},{"kode":"CPL-2","deskripsi":"Mampu melakukan asesmen proses dan hasil belajar peserta didik.","wef_pembanding":"","wef_arah":null,"cpmk":[{"kode":"CPMK-2.1","deskripsi":"Menyusun dan menerapkan instrumen asesmen pembelajaran.","mata_kuliah":"Asesmen Pembelajaran SD","kata_kunci":"Asesmen Pembelajaran"}]},{"kode":"CPL-3","deskripsi":"Mampu mengelola kelas dan memahami perkembangan peserta didik.","wef_pembanding":"","wef_arah":null,"cpmk":[{"kode":"CPMK-3.1","deskripsi":"Mengelola kelas yang kondusif.","mata_kuliah":"Manajemen Kelas","kata_kunci":"Manajemen Kelas"},{"kode":"CPMK-3.2","deskripsi":"Menganalisis karakteristik perkembangan peserta didik SD.","mata_kuliah":"Perkembangan Peserta Didik","kata_kunci":"Perkembangan Peserta Didik"}]},{"kode":"CPL-4","deskripsi":"Mampu mengembangkan media pembelajaran, termasuk media digital.","wef_pembanding":"Literasi teknologi","wef_arah":"naik","cpmk":[{"kode":"CPMK-4.1","deskripsi":"Merancang media pembelajaran SD.","mata_kuliah":"Media Pembelajaran SD","kata_kunci":"Media Pembelajaran; Media Pembelajaran Digital"}]},{"kode":"CPL-5","deskripsi":"Mampu menyelenggarakan pembelajaran inklusif.","wef_pembanding":"","wef_arah":null,"cpmk":[{"kode":"CPMK-5.1","deskripsi":"Merancang layanan pembelajaran bagi peserta didik berkebutuhan khusus.","mata_kuliah":"Pendidikan Inklusif","kata_kunci":"Pendidikan Inklusif"}]}]};
            const CP = {loaded: false, loading: false, demo: false, contoh: false, err: '', prodi: null, cpl: []};
            const CP_MIN = 1.5;   // kemiripan minimal kata kunci CPMK vs nama kompetensi (2 = sama persis)
            async function cpLoad() {
                const prodi = curProdi();
                CP.prodi = prodi;
                const res = await apiRequest('js_cpl');
                if (res && res.success) { CP.demo = false; CP.err = ''; CP.cpl = res.cpl || []; CP.contoh = !!res.contoh; }
                else if (res && res.message && /migrasi_/.test(res.message)) { CP.demo = false; CP.err = res.message; CP.cpl = []; }
                else { CP.demo = true; CP.err = ''; CP.cpl = CPL_DEMO[prodi] || []; CP.contoh = true; }
                CP.loaded = true;
            }
            function cpEnsure() {
                if (CP.loading || (CP.loaded && CP.prodi === curProdi())) return;
                CP.loading = true;
                cpLoad().finally(() => { CP.loading = false; cpRenderAll(); dsnRender(); if (JM.results && JM.results.length && typeof jmRenderResults === 'function') jmRenderResults(); });
            }
            const cpKataKunci = (c) => String(c.kata_kunci || '').split(';').map(x => x.trim()).filter(Boolean).concat([c.mata_kuliah]);
            const cpMirip = (a, kws) => Math.max(0, ...kws.map(kw => relScore(a, kw)));
            // CPMK yang mata kuliahnya sama dengan nama MK di transkrip
            function cpmkOfMk(mk) {
                for (const c of CP.cpl) for (const m of (c.cpmk || [])) if (relScore(mk, m.mata_kuliah) >= CP_MIN) return {...m, cpl: c.kode};
                return null;
            }
            // CPMK yang terkait satu kompetensi (lewat kata kunci admin prodi)
            function cpmkOfKomp(nama) {
                const out = [];
                CP.cpl.forEach(c => (c.cpmk || []).forEach(m => { if (cpMirip(nama, cpKataKunci(m)) >= CP_MIN) out.push({...m, cpl: c.kode}); }));
                return out;
            }
            // Semester akademik: Gasal (Agu–Jan) / Genap (Feb–Jul)
            function semesterOf(d) {
                const m = d.getMonth() + 1, y = d.getFullYear();
                if (m >= 8) return {key: `${y}-1`, label: `Gasal ${y}/${y + 1}`};
                if (m === 1) return {key: `${y - 1}-1`, label: `Gasal ${y - 1}/${y}`};
                return {key: `${y - 1}-2`, label: `Genap ${y - 1}/${y}`};
            }
            function cpAnalyze() {
                const prodi = curProdi();
                if (!prodi || !CP.loaded || CP.prodi !== prodi || !PR.loaded || PR.reqProdi !== prodi) return null;
                const S = PR.sources || [];
                const N = mitraSet(S).size;
                const semKey = (s) => { const d = parseTgl(s.created_at); return isNaN(d) ? null : semesterOf(d); };
                const sems = [...new Map(S.map(semKey).filter(Boolean).map(x => [x.key, x])).values()].sort((a, b) => a.key.localeCompare(b.key));
                const kini = sems[sems.length - 1] || null, lalu = sems.length >= 2 ? sems[sems.length - 2] : null;
                // Kebutuhan mitra (kompetensi unik) dan pemetaannya ke CPMK/CPL
                const km = new Map();
                S.forEach(s => (s.kompetensi || []).forEach(k => {
                    const key = String(k).trim().toLowerCase(); if (!key) return;
                    const e = km.get(key) || {nama: String(k).trim(), src: []}; e.src.push(s); km.set(key, e);
                }));
                const komp = [...km.values()].map(k => {
                    const cpmk = cpmkOfKomp(k.nama);
                    const per = mitraSet(k.src);
                    const named = [...new Set(k.src.filter(s => Number(s.izin_nama) === 1).map(s => s.perusahaan))];
                    return {nama: k.nama, src: k.src, n: per.size, named, anonim: per.size - named.length, cpmk, cpl: [...new Set(cpmk.map(m => m.cpl))],
                        ev: punyaData() ? myEvidence(k.nama) : null};
                }).sort((a, b) => b.n - a.n || a.nama.localeCompare(b.nama));
                const cpl = CP.cpl.map(c => {
                    const terkait = komp.filter(k => k.cpl.includes(c.kode));
                    const mitra = new Set(terkait.flatMap(k => k.src.map(s => s.perusahaan)));
                    const hit = (sem) => sem ? new Set(terkait.flatMap(k => k.src.filter(s => { const x = semKey(s); return x && x.key === sem.key; }).map(s => s.perusahaan))).size : null;
                    const nKini = hit(kini), nLalu = hit(lalu);
                    const tren = lalu ? (nKini > nLalu ? 'naik' : (nKini < nLalu ? 'turun' : 'tetap')) : null;
                    let status, alasan;
                    if (!mitra.size) { status = 'Perlu ditinjau'; alasan = 'belum diminta mitra mana pun'; }
                    else if (c.wef_arah === 'turun') { status = 'Perlu ditinjau'; alasan = `WEF memperkirakan ${c.wef_pembanding.toLowerCase()} menurun`; }
                    else if (c.wef_arah === 'naik' || tren === 'naik') { status = 'Bertumbuh'; alasan = c.wef_arah === 'naik' ? `diminta mitra dan WEF memperkirakan ${c.wef_pembanding.toLowerCase()} naik` : 'jumlah mitra yang meminta naik dari periode lalu'; }
                    else { status = 'Stabil'; alasan = 'diminta mitra, tanpa pembanding tren'; }
                    const cpmk = (c.cpmk || []).map(m => ({...m, komp: terkait.filter(k => k.cpmk.some(x => x.kode === m.kode)),
                        anda: punyaData() ? JM.mk.some(x => !x.umum && relScore(m.mata_kuliah, x.nama) >= CP_MIN && bobot(x) / 4 >= READY) : null}));
                    return {...c, cpmk, terkait, n: mitra.size, nKini, nLalu, tren, status, alasan};
                });
                const belum = komp.filter(k => !k.cpl.length);
                return {prodi, N, S, komp, cpl, belum, kini, lalu};
            }
            const CP_STATUS = {'Bertumbuh': 'cp-up', 'Stabil': 'cp-flat', 'Perlu ditinjau': 'cp-review'};
            const cpDots = (n, N) => `<span class="cp-dots" aria-hidden="true">${Array.from({length: Math.min(N, 10)}, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`;
            const cpWef = (c) => c.wef_pembanding ? `<span class="cp-wef ${c.wef_arah || ''}">WEF: ${esc(c.wef_pembanding)} ${c.wef_arah === 'naik' ? '↑' : (c.wef_arah === 'turun' ? '↓' : '')}</span>` : '';
            const cpTren = (c, x) => x.lalu ? `<span class="cp-tren">${esc(x.lalu.label)}: ${c.nLalu} → ${esc(x.kini.label)}: ${c.nKini} mitra</span>` : '';
            const cpMitraTxt = (k) => (k.named.length ? k.named.map(n => esc(n.replace(/\s*\(Contoh\)$/, ''))).join(', ') : '') + (k.anonim ? `${k.named.length ? ' + ' : ''}${k.anonim} mitra tanpa nama` : '');

            function cpRenderDash() {
                const box = document.getElementById('cpDashCard');
                if (!box) return;
                const x = cpAnalyze();
                if (!x || !x.cpl.length) { box.classList.add('is-hidden'); return; }
                box.classList.remove('is-hidden');
                const lbl = labelMitra(x.prodi);
                box.innerHTML = `
                    <div class="card-header-flex"><div><h3 class="card-title"><i class="fa-solid fa-sitemap text-blue"></i> Kurikulum ${esc(kodeProdi(x.prodi))}: CPL yang Dibutuhkan Mitra</h3>
                        <p class="fs-sub">Dihitung dari kebutuhan ${x.N} ${lbl}. Ditulis sebagai jumlah, bukan persentase, karena sampelnya kecil.</p></div>
                        <button class="btn-outline-blue js-goto" data-goto="view-pr-cpl" style="margin:0;">Lihat CPL &amp; CPMK <i class="fa-solid fa-arrow-right"></i></button></div>
                    <div class="cp-rows">${x.cpl.map(c => `
                        <div class="cp-row">
                            <span class="cp-kode">${esc(c.kode)}</span>
                            <span class="cp-desc">${esc(c.deskripsi)}</span>
                            <span class="cp-n">${cpDots(c.n, x.N)} <b>${c.n} dari ${x.N}</b> mitra</span>
                            <span class="cp-status ${CP_STATUS[c.status]}" title="${esc(c.alasan)}">${c.status}</span>
                            ${cpWef(c)}
                        </div>`).join('')}</div>
                    ${x.belum.length ? `<p class="cp-belum"><i class="fa-solid fa-circle-exclamation"></i> <strong>${x.belum.length} kebutuhan mitra belum tercakup CPL mana pun:</strong> ${x.belum.slice(0, 4).map(k => esc(k.nama)).join(', ')}${x.belum.length > 4 ? ', …' : ''} — perlu ditinjau prodi.</p>` : ''}
                    <p class="fs-src">"Perlu ditinjau" bukan berarti dihapus: CPL itu belum diminta mitra atau WEF memperkirakan skill-nya menurun. ${x.lalu ? `Tren antarperiode membandingkan ${esc(x.lalu.label)} dengan ${esc(x.kini.label)}.` : 'Tren antarperiode muncul setelah ada data minimal dua periode; sementara memakai WEF 2025 sebagai pembanding.'}${CP.contoh ? ' <strong>CPL contoh</strong>, ganti dengan CPL resmi dari RPS.' : ''}</p>`;
            }

            function cpRenderPage() {
                const view = document.getElementById('view-pr-cpl');
                if (!view) return;
                const note = document.getElementById('cpNote');
                const x = cpAnalyze();
                const msg = [];
                if (CP.err) msg.push(esc(CP.err));
                if (CP.demo) msg.push('<strong>DATA CONTOH (fiktif).</strong>');
                else if (CP.contoh) msg.push('CPL &amp; CPMK <strong>contoh</strong>; ganti dengan CPL resmi dari RPS prodi.');
                if (CP.loaded && !CP.err && !CP.cpl.length && curProdi()) msg.push('CPL &amp; CPMK prodi ini belum diinput admin prodi.');
                note.innerHTML = msg.length ? '<i class="fa-solid fa-circle-info"></i> <span>' + msg.join(' ') + '</span>' : '';
                note.classList.toggle('is-hidden', !msg.length);
                const list = document.getElementById('cpList'), belumBox = document.getElementById('cpBelum'), ring = document.getElementById('cpRingkas');
                if (!x) { list.innerHTML = CP.loaded || !curProdi() ? '' : '<div class="jp-empty-block"><i class="fa-solid fa-spinner fa-spin"></i>Memuat…</div>'; belumBox.classList.add('is-hidden'); ring.textContent = ''; return; }
                const lbl = labelMitra(x.prodi);
                ring.innerHTML = `<strong>${x.cpl.filter(c => c.n > 0).length} dari ${x.cpl.length} CPL</strong> ${esc(kodeProdi(x.prodi))} dibutuhkan ${x.N} ${lbl}. Klik CPL untuk melihat CPMK dan mata kuliahnya.`;
                list.innerHTML = x.cpl.length ? x.cpl.map(c => `
                    <details class="cp-item">
                        <summary>
                            <span class="cp-kode">${esc(c.kode)}</span>
                            <span class="cp-desc">${esc(c.deskripsi)}</span>
                            <span class="cp-n">${cpDots(c.n, x.N)} <b>${c.n} dari ${x.N}</b> mitra</span>
                            <span class="cp-status ${CP_STATUS[c.status]}" title="${esc(c.alasan)}">${c.status}</span>
                            <i class="fa-solid fa-chevron-down cp-caret"></i>
                        </summary>
                        <ul class="cp-cpmk">${c.cpmk.map(m => `
                            <li>
                                <span class="cp-cpmk-kode">${esc(m.kode)}</span>
                                <span class="cp-cpmk-txt">${esc(m.deskripsi)} <small>MK: ${esc(m.mata_kuliah)}${m.komp.length ? ` · diminta: ${m.komp.map(k => esc(k.nama)).join(', ')}` : ''}</small></span>
                                ${m.anda === null ? '' : (m.anda ? '<span class="cp-anda ok" title="Sudah Anda tempuh dengan nilai ≥ B">✓</span>' : '<span class="cp-anda" title="Belum terlihat di transkrip Anda">–</span>')}
                                ${peran() === 'Dosen' && m.id ? `<span class="cp-edit-btns"><button type="button" class="jp-btn-sm" data-cp="cpmk-edit" data-cpl="${c.id}" data-id="${m.id}" title="Ubah CPMK"><i class="fa-solid fa-pen"></i></button><button type="button" class="jp-btn-sm danger" data-cp="cpmk-del" data-id="${m.id}" title="Hapus CPMK"><i class="fa-regular fa-trash-can"></i></button></span>` : ''}
                            </li>`).join('')}</ul>
                        ${peran() === 'Dosen' && c.id ? `<div class="cp-edit-bar"><button type="button" class="jp-btn-sm primary" data-cp="cpmk-add" data-cpl="${c.id}"><i class="fa-solid fa-plus"></i> CPMK</button><button type="button" class="jp-btn-sm" data-cp="cpl-edit" data-id="${c.id}"><i class="fa-solid fa-pen"></i> Ubah CPL</button><button type="button" class="jp-btn-sm danger" data-cp="cpl-del" data-id="${c.id}"><i class="fa-regular fa-trash-can"></i> Hapus CPL</button></div>` : ''}
                        <p class="cp-alasan">${esc(c.status)}: ${esc(c.alasan)}.${c.wef_pembanding ? ` Pembanding WEF: ${esc(c.wef_pembanding)} ${c.wef_arah === 'naik' ? '↑' : (c.wef_arah === 'turun' ? '↓' : '')}.` : ''}</p>
                    </details>`).join('') : '<div class="jp-empty-block"><i class="fa-solid fa-sitemap"></i>Belum ada CPL untuk prodi ini.</div>';
                belumBox.classList.toggle('is-hidden', !x.belum.length);
                belumBox.innerHTML = x.belum.length ? `<strong><i class="fa-solid fa-circle-exclamation"></i> Diminta mitra, belum ada di CPL mana pun (${x.belum.length})</strong>
                    <ul>${x.belum.map(k => `<li>${esc(k.nama)} <span>${k.n} dari ${x.N} mitra</span></li>`).join('')}</ul>
                    <small>Usulan untuk ditinjau prodi: tambahkan ke CPL / CPMK yang sesuai.</small>` : '';
            }
            function cpRenderAll() { cpEnsure(); cpRenderDash(); cpRenderPage(); }
            document.querySelectorAll('.nav-item[data-target="view-pr-cpl"]').forEach(n => n.addEventListener('click', () => setTimeout(cpRenderAll, 0)));

            // ==============================================================
            // 16. TRACER STUDY ALUMNI (menu Jobseeker)
            //     Data dari tracer study prodi (tabel tracer_alumni). Mode demo memakai data contoh di bawah.
            // ==============================================================
            const TRACER_DEMO = [{"prodi":"Teknologi Rekayasa Sistem Elektronika","tahun_lulus":2025,"status":"Belum Bekerja","masa_tunggu":null,"sesuai":null,"mitra":"","wirausaha":0},{"prodi":"Teknologi Rekayasa Sistem Elektronika","tahun_lulus":2024,"status":"Belum Bekerja","masa_tunggu":null,"sesuai":null,"mitra":"","wirausaha":0},{"prodi":"Teknologi Rekayasa Sistem Elektronika","tahun_lulus":2025,"status":"Belum Bekerja","masa_tunggu":null,"sesuai":null,"mitra":"","wirausaha":0},{"prodi":"Teknologi Rekayasa Sistem Elektronika","tahun_lulus":2023,"status":"Bekerja","masa_tunggu":2,"sesuai":1,"mitra":"","wirausaha":1},{"prodi":"Teknologi Rekayasa Sistem Elektronika","tahun_lulus":2024,"status":"Bekerja","masa_tunggu":10,"sesuai":1,"mitra":"PT Surya Daya Energi (Contoh)","wirausaha":0},{"prodi":"Teknologi Rekayasa Sistem Elektronika","tahun_lulus":2025,"status":"Bekerja","masa_tunggu":10,"sesuai":1,"mitra":"PT Elektra Nusantara (Contoh)","wirausaha":0},{"prodi":"Teknologi Rekayasa Sistem Elektronika","tahun_lulus":2023,"status":"Bekerja","masa_tunggu":4,"sesuai":1,"mitra":"PT Elektra Nusantara (Contoh)","wirausaha":0},{"prodi":"Teknologi Rekayasa Sistem Elektronika","tahun_lulus":2024,"status":"Bekerja","masa_tunggu":3,"sesuai":1,"mitra":"PT Mitra Otomasi Jaya (Contoh)","wirausaha":0},{"prodi":"Teknologi Rekayasa Sistem Elektronika","tahun_lulus":2025,"status":"Bekerja","masa_tunggu":2,"sesuai":1,"mitra":"PT Surya Daya Energi (Contoh)","wirausaha":0},{"prodi":"Teknologi Rekayasa Sistem Elektronika","tahun_lulus":2023,"status":"Bekerja","masa_tunggu":4,"sesuai":0,"mitra":"","wirausaha":0},{"prodi":"Teknologi Rekayasa Sistem Elektronika","tahun_lulus":2024,"status":"Bekerja","masa_tunggu":5,"sesuai":1,"mitra":"PT Mitra Otomasi Jaya (Contoh)","wirausaha":0},{"prodi":"Teknologi Rekayasa Sistem Elektronika","tahun_lulus":2025,"status":"Bekerja","masa_tunggu":4,"sesuai":1,"mitra":"PT Elektra Nusantara (Contoh)","wirausaha":0},{"prodi":"Teknologi Rekayasa Sistem Elektronika","tahun_lulus":2023,"status":"Bekerja","masa_tunggu":10,"sesuai":0,"mitra":"","wirausaha":0},{"prodi":"Teknologi Rekayasa Sistem Elektronika","tahun_lulus":2024,"status":"Bekerja","masa_tunggu":1,"sesuai":1,"mitra":"PT Elektra Nusantara (Contoh)","wirausaha":0},{"prodi":"Teknologi Rekayasa Sistem Elektronika","tahun_lulus":2025,"status":"Bekerja","masa_tunggu":8,"sesuai":1,"mitra":"PT Mitra Otomasi Jaya (Contoh)","wirausaha":0},{"prodi":"Teknologi Rekayasa Sistem Elektronika","tahun_lulus":2023,"status":"Bekerja","masa_tunggu":5,"sesuai":1,"mitra":"PT Elektra Nusantara (Contoh)","wirausaha":0},{"prodi":"Manajemen Pemasaran","tahun_lulus":2025,"status":"Belum Bekerja","masa_tunggu":null,"sesuai":null,"mitra":"","wirausaha":0},{"prodi":"Manajemen Pemasaran","tahun_lulus":2024,"status":"Belum Bekerja","masa_tunggu":null,"sesuai":null,"mitra":"","wirausaha":0},{"prodi":"Manajemen Pemasaran","tahun_lulus":2025,"status":"Belum Bekerja","masa_tunggu":null,"sesuai":null,"mitra":"","wirausaha":0},{"prodi":"Manajemen Pemasaran","tahun_lulus":2024,"status":"Belum Bekerja","masa_tunggu":null,"sesuai":null,"mitra":"","wirausaha":0},{"prodi":"Manajemen Pemasaran","tahun_lulus":2024,"status":"Bekerja","masa_tunggu":8,"sesuai":1,"mitra":"","wirausaha":1},{"prodi":"Manajemen Pemasaran","tahun_lulus":2025,"status":"Bekerja","masa_tunggu":3,"sesuai":1,"mitra":"","wirausaha":0},{"prodi":"Manajemen Pemasaran","tahun_lulus":2023,"status":"Bekerja","masa_tunggu":3,"sesuai":1,"mitra":"PT Analitika Data Indonesia (Contoh)","wirausaha":0},{"prodi":"Manajemen Pemasaran","tahun_lulus":2024,"status":"Bekerja","masa_tunggu":2,"sesuai":0,"mitra":"","wirausaha":0},{"prodi":"Manajemen Pemasaran","tahun_lulus":2025,"status":"Bekerja","masa_tunggu":2,"sesuai":0,"mitra":"","wirausaha":0},{"prodi":"Manajemen Pemasaran","tahun_lulus":2023,"status":"Bekerja","masa_tunggu":6,"sesuai":0,"mitra":"","wirausaha":0},{"prodi":"Manajemen Pemasaran","tahun_lulus":2024,"status":"Bekerja","masa_tunggu":1,"sesuai":1,"mitra":"CV Niaga Digital Kreatif (Contoh)","wirausaha":0},{"prodi":"Manajemen Pemasaran","tahun_lulus":2025,"status":"Bekerja","masa_tunggu":4,"sesuai":1,"mitra":"","wirausaha":1},{"prodi":"Manajemen Pemasaran","tahun_lulus":2023,"status":"Bekerja","masa_tunggu":5,"sesuai":0,"mitra":"","wirausaha":0},{"prodi":"Manajemen Pemasaran","tahun_lulus":2024,"status":"Bekerja","masa_tunggu":5,"sesuai":1,"mitra":"","wirausaha":0},{"prodi":"Manajemen Pemasaran","tahun_lulus":2025,"status":"Bekerja","masa_tunggu":3,"sesuai":1,"mitra":"","wirausaha":0},{"prodi":"Pendidikan Guru Pendidikan Anak Usia Dini (PGPAUD)","tahun_lulus":2025,"status":"Belum Bekerja","masa_tunggu":null,"sesuai":null,"mitra":"","wirausaha":0},{"prodi":"Pendidikan Guru Pendidikan Anak Usia Dini (PGPAUD)","tahun_lulus":2024,"status":"Belum Bekerja","masa_tunggu":null,"sesuai":null,"mitra":"","wirausaha":0},{"prodi":"Pendidikan Guru Pendidikan Anak Usia Dini (PGPAUD)","tahun_lulus":2025,"status":"Bekerja","masa_tunggu":10,"sesuai":1,"mitra":"Daycare Pelangi Nusantara (Contoh)","wirausaha":0},{"prodi":"Pendidikan Guru Pendidikan Anak Usia Dini (PGPAUD)","tahun_lulus":2023,"status":"Bekerja","masa_tunggu":4,"sesuai":0,"mitra":"","wirausaha":0},{"prodi":"Pendidikan Guru Pendidikan Anak Usia Dini (PGPAUD)","tahun_lulus":2024,"status":"Bekerja","masa_tunggu":3,"sesuai":1,"mitra":"Daycare Pelangi Nusantara (Contoh)","wirausaha":0},{"prodi":"Pendidikan Guru Pendidikan Anak Usia Dini (PGPAUD)","tahun_lulus":2025,"status":"Bekerja","masa_tunggu":3,"sesuai":1,"mitra":"","wirausaha":0},{"prodi":"Pendidikan Guru Pendidikan Anak Usia Dini (PGPAUD)","tahun_lulus":2023,"status":"Bekerja","masa_tunggu":3,"sesuai":1,"mitra":"","wirausaha":0},{"prodi":"Pendidikan Guru Pendidikan Anak Usia Dini (PGPAUD)","tahun_lulus":2024,"status":"Bekerja","masa_tunggu":3,"sesuai":1,"mitra":"","wirausaha":0},{"prodi":"Pendidikan Guru Pendidikan Anak Usia Dini (PGPAUD)","tahun_lulus":2025,"status":"Bekerja","masa_tunggu":8,"sesuai":0,"mitra":"","wirausaha":0},{"prodi":"Pendidikan Guru Pendidikan Anak Usia Dini (PGPAUD)","tahun_lulus":2023,"status":"Bekerja","masa_tunggu":6,"sesuai":1,"mitra":"Yayasan Pendidikan Ceria (Contoh)","wirausaha":0},{"prodi":"Pendidikan Guru Pendidikan Anak Usia Dini (PGPAUD)","tahun_lulus":2024,"status":"Bekerja","masa_tunggu":2,"sesuai":1,"mitra":"Yayasan Pendidikan Ceria (Contoh)","wirausaha":0},{"prodi":"Pendidikan Guru Pendidikan Anak Usia Dini (PGPAUD)","tahun_lulus":2025,"status":"Bekerja","masa_tunggu":3,"sesuai":1,"mitra":"Yayasan Pendidikan Ceria (Contoh)","wirausaha":0},{"prodi":"Pendidikan Guru Pendidikan Anak Usia Dini (PGPAUD)","tahun_lulus":2023,"status":"Bekerja","masa_tunggu":10,"sesuai":1,"mitra":"Daycare Pelangi Nusantara (Contoh)","wirausaha":0},{"prodi":"Pendidikan Guru Pendidikan Anak Usia Dini (PGPAUD)","tahun_lulus":2024,"status":"Bekerja","masa_tunggu":3,"sesuai":1,"mitra":"Daycare Pelangi Nusantara (Contoh)","wirausaha":0},{"prodi":"Pendidikan Guru Sekolah Dasar (PGSD)","tahun_lulus":2025,"status":"Belum Bekerja","masa_tunggu":null,"sesuai":null,"mitra":"","wirausaha":0},{"prodi":"Pendidikan Guru Sekolah Dasar (PGSD)","tahun_lulus":2024,"status":"Belum Bekerja","masa_tunggu":null,"sesuai":null,"mitra":"","wirausaha":0},{"prodi":"Pendidikan Guru Sekolah Dasar (PGSD)","tahun_lulus":2025,"status":"Bekerja","masa_tunggu":2,"sesuai":1,"mitra":"","wirausaha":0},{"prodi":"Pendidikan Guru Sekolah Dasar (PGSD)","tahun_lulus":2023,"status":"Bekerja","masa_tunggu":2,"sesuai":1,"mitra":"","wirausaha":0},{"prodi":"Pendidikan Guru Sekolah Dasar (PGSD)","tahun_lulus":2024,"status":"Bekerja","masa_tunggu":2,"sesuai":1,"mitra":"SD Cendekia Nusantara (Contoh)","wirausaha":0},{"prodi":"Pendidikan Guru Sekolah Dasar (PGSD)","tahun_lulus":2025,"status":"Bekerja","masa_tunggu":10,"sesuai":1,"mitra":"SD Cendekia Nusantara (Contoh)","wirausaha":0},{"prodi":"Pendidikan Guru Sekolah Dasar (PGSD)","tahun_lulus":2023,"status":"Bekerja","masa_tunggu":3,"sesuai":1,"mitra":"","wirausaha":0},{"prodi":"Pendidikan Guru Sekolah Dasar (PGSD)","tahun_lulus":2024,"status":"Bekerja","masa_tunggu":2,"sesuai":1,"mitra":"","wirausaha":0},{"prodi":"Pendidikan Guru Sekolah Dasar (PGSD)","tahun_lulus":2025,"status":"Bekerja","masa_tunggu":3,"sesuai":1,"mitra":"","wirausaha":0},{"prodi":"Pendidikan Guru Sekolah Dasar (PGSD)","tahun_lulus":2023,"status":"Bekerja","masa_tunggu":5,"sesuai":1,"mitra":"SD Cendekia Nusantara (Contoh)","wirausaha":0},{"prodi":"Pendidikan Guru Sekolah Dasar (PGSD)","tahun_lulus":2024,"status":"Bekerja","masa_tunggu":3,"sesuai":1,"mitra":"","wirausaha":0},{"prodi":"Pendidikan Guru Sekolah Dasar (PGSD)","tahun_lulus":2025,"status":"Bekerja","masa_tunggu":2,"sesuai":1,"mitra":"SD Cendekia Nusantara (Contoh)","wirausaha":0},{"prodi":"Pendidikan Guru Sekolah Dasar (PGSD)","tahun_lulus":2023,"status":"Bekerja","masa_tunggu":5,"sesuai":1,"mitra":"","wirausaha":0},{"prodi":"Pendidikan Guru Sekolah Dasar (PGSD)","tahun_lulus":2024,"status":"Bekerja","masa_tunggu":2,"sesuai":1,"mitra":"SD Cendekia Nusantara (Contoh)","wirausaha":0},{"prodi":"Pendidikan Guru Sekolah Dasar (PGSD)","tahun_lulus":2025,"status":"Bekerja","masa_tunggu":8,"sesuai":1,"mitra":"SD Cendekia Nusantara (Contoh)","wirausaha":0}];
            const TR = {loaded: false, loading: false, demo: false, contoh: false, err: '', rows: [], mode: null, tahun: '', charts: {}};
            async function trLoad() {
                const res = await apiRequest('js_tracer');
                if (res && res.success) { TR.demo = false; TR.err = ''; TR.rows = res.alumni || []; TR.contoh = !!res.contoh; }
                else if (res && res.message && /migrasi_/.test(res.message)) { TR.demo = false; TR.err = res.message; TR.rows = []; }
                else { TR.demo = true; TR.err = ''; TR.rows = TRACER_DEMO; TR.contoh = true; }
                TR.loaded = true;
            }
            function trEnsure() {
                if (TR.loaded || TR.loading) return;
                TR.loading = true;
                trLoad().finally(() => { TR.loading = false; trRender(); dsnRender(); });
            }
            document.querySelectorAll('#trSeg .seg-btn').forEach(b => b.addEventListener('click', () => { if (b.disabled) return; TR.mode = b.dataset.mode; trRender(); }));
            document.getElementById('trTahun').addEventListener('change', (e) => { TR.tahun = e.target.value; trRender(); });
            function trChart(id, cfg) {
                if (TR.charts[id]) TR.charts[id].destroy();
                TR.charts[id] = new Chart(document.getElementById(id).getContext('2d'), cfg);
            }
            function trRender() {
                const view = document.getElementById('view-tracer');
                if (!view) return;
                trEnsure();
                const note = document.getElementById('trNote');
                if (!TR.loaded) { note.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Memuat data tracer study…</span>'; note.classList.remove('is-hidden'); return; }
                const prodi = curProdi();
                // Hanya prodi yang tercakup C-DFS dan memiliki data tracer study yang ditampilkan
                const rowsAll = TR.rows.filter(r => prodiTercakup(r.prodi));
                const adaProdi = !!prodi && rowsAll.some(r => r.prodi === prodi);
                if (!TR.mode || (TR.mode === 'prodi' && !adaProdi)) TR.mode = adaProdi ? 'prodi' : 'global';
                document.querySelectorAll('#trSeg .seg-btn').forEach(b => {
                    b.classList.toggle('active', b.dataset.mode === TR.mode);
                    b.disabled = b.dataset.mode === 'prodi' && !adaProdi;
                    if (b.dataset.mode === 'prodi') b.textContent = prodi ? `Prodi Saya · ${kodeProdi(prodi)}` : 'Prodi Saya';
                    b.title = b.disabled ? (prodi ? 'Belum ada data tracer study untuk prodi ini' : 'Pilih program studi dahulu') : '';
                });
                const msg = [];
                if (TR.err) msg.push(esc(TR.err));
                if (TR.demo) msg.push('<strong>DATA CONTOH (fiktif).</strong> Server PHP/MySQL belum aktif.');
                else if (TR.contoh) msg.push('Menampilkan data tracer study <strong>contoh (fiktif)</strong> dari data_contoh.sql.');
                if (!TR.err && !rowsAll.length) msg.push('Belum ada data tracer study. Prodi dapat mengimpor hasil tracer study ke tabel <code>tracer_alumni</code>.');
                const rawProdi = sessionStorage.getItem('c-dfs_user_prodi') || '';
                if (rawProdi && !prodi) msg.push(`Prodi ${esc(rawProdi)} belum tercakup C-DFS. Ditampilkan data ${PRODI_TERCAKUP_TXT}.`);
                else if (prodi && !adaProdi && rowsAll.length) msg.push(`Belum ada data tracer study untuk ${esc(kodeProdi(prodi))}; ditampilkan semua prodi.`);
                note.innerHTML = msg.length ? '<i class="fa-solid fa-circle-info"></i> <span>' + msg.join(' ') + '</span>' : '';
                note.classList.toggle('is-hidden', !msg.length);

                const base = TR.mode === 'prodi' ? rowsAll.filter(r => r.prodi === prodi) : rowsAll;
                const tahunList = [...new Set(base.map(r => r.tahun_lulus))].sort((a, b) => b - a);
                if (TR.tahun && !tahunList.includes(Number(TR.tahun))) TR.tahun = '';
                document.getElementById('trTahun').innerHTML = '<option value="">Semua</option>' + tahunList.map(t => `<option value="${t}"${String(t) === TR.tahun ? ' selected' : ''}>${t}</option>`).join('');
                const rows = TR.tahun ? base.filter(r => String(r.tahun_lulus) === TR.tahun) : base;

                const kerja = rows.filter(r => r.status === 'Bekerja'), belum = rows.length - kerja.length;
                const tunggu = kerja.filter(r => r.masa_tunggu !== null && r.masa_tunggu !== undefined).map(r => Number(r.masa_tunggu));
                const avgT = tunggu.length ? tunggu.reduce((a, b) => a + b, 0) / tunggu.length : null;
                const dgSesuai = kerja.filter(r => r.sesuai !== null && r.sesuai !== undefined);
                const nSesuai = dgSesuai.filter(r => Number(r.sesuai) === 1).length;
                const pct = (n, d = rows.length) => d ? Math.round(100 * n / d) + '%' : '-';
                const th = tahunList.length ? (TR.tahun || (tahunList.length > 1 ? `${tahunList[tahunList.length - 1]}–${tahunList[0]}` : tahunList[0])) : '-';
                prSetText('trTotal', rows.length);
                prSetText('trTotalDesc', `${TR.mode === 'prodi' ? kodeProdi(prodi) : 'semua prodi'} · lulusan ${th}`);
                prSetText('trKerja', kerja.length);
                prSetText('trKerjaDesc', `${pct(kerja.length)} · ${kerja.filter(r => Number(r.wirausaha) === 1).length} berwirausaha`);
                prSetText('trBelum', belum);
                prSetText('trBelumDesc', `${pct(belum)} dari alumni terlacak`);
                prSetText('trTunggu', avgT === null ? '-' : avgT.toFixed(1).replace('.', ',') + ' bln');
                prSetText('trTungguDesc', tunggu.length ? `${tunggu.filter(t => t <= 6).length} dari ${tunggu.length} bekerja ≤ 6 bulan` : 'sejak lulus sampai bekerja');

                // Per prodi: % sudah bekerja + mitra (hanya yang mengizinkan namanya tampil)
                const ps = [...new Set(rows.map(r => r.prodi))];
                const per = ps.map(p => {
                    const a = rows.filter(r => r.prodi === p), k = a.filter(r => r.status === 'Bekerja');
                    const m = new Map(); k.forEach(r => { if (r.mitra) m.set(r.mitra, (m.get(r.mitra) || 0) + 1); });
                    const diMitra = [...m.values()].reduce((x, y) => x + y, 0);
                    return {p, n: a.length, k: k.length, v: a.length ? Math.round(100 * k.length / a.length) : 0, mitra: [...m.entries()].sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0])), lain: k.length - diMitra};
                }).sort((a, b) => (b.p === prodi) - (a.p === prodi) || b.v - a.v);
                document.getElementById('trProdiList').innerHTML = per.length ? per.map(x => `
                    <div class="tr-prodi${x.p === prodi ? ' mine' : ''}">
                        <div class="tr-prodi-head"><strong>${esc(kodeProdi(x.p))}</strong><span>${esc(x.p.replace(/\s*\(.*\)$/, ''))}</span><b>${x.v}%</b></div>
                        <div class="tr-prodi-bar" role="img" aria-label="${x.v}% sudah bekerja"><i style="width:${x.v}%"></i></div>
                        <small>${x.k} dari ${x.n} alumni sudah bekerja</small>
                        <div class="tr-mitra"><span class="tr-mitra-lbl">${x.p === PGSD || x.p === PAUD ? 'Mitra / pengguna lulusan' : 'Mitra'}:</span>
                            ${x.mitra.length ? x.mitra.map(([nm, c]) => `<span class="tr-mitra-chip">${esc(nm.replace(/\s*\(Contoh\)$/, ''))} <em>${c}</em></span>`).join('') : '<span class="jp-muted">belum ada alumni di mitra yang mengizinkan namanya tampil</span>'}
                            ${x.lain ? `<span class="tr-mitra-chip lain">tempat kerja lain <em>${x.lain}</em></span>` : ''}</div>
                    </div>`).join('') : '<div class="jp-empty-block"><i class="fa-solid fa-users"></i>Belum ada data.</div>';

                const sesuaiEl = document.getElementById('trSesuai');
                sesuaiEl.textContent = dgSesuai.length ? `${nSesuai} dari ${dgSesuai.length} alumni yang bekerja (${pct(nSesuai, dgSesuai.length)}) bekerja sesuai bidang prodinya.` : '';
                if (!view.classList.contains('active')) return;
                trChart('trDonut', {type: 'doughnut', data: {labels: ['Sudah bekerja', 'Belum bekerja'], datasets: [{data: [kerja.length, belum], backgroundColor: ['#16a34a', '#dc2626'], borderWidth: 2, borderColor: '#fff'}]},
                    plugins: [{id: 'trCenter', afterDraw(c) {
                        const {ctx} = c, m = c.getDatasetMeta(0).data[0]; if (!m) return;
                        ctx.save(); ctx.textAlign = 'center'; ctx.fillStyle = '#0b1220';
                        ctx.font = '800 22px Inter, sans-serif'; ctx.textBaseline = 'bottom'; ctx.fillText(pct(kerja.length), m.x, m.y + 4);
                        ctx.font = '500 11px Inter, sans-serif'; ctx.textBaseline = 'top'; ctx.fillText('sudah bekerja', m.x, m.y + 6); ctx.restore();
                    }}],
                    options: {responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: {legend: {display: false}, tooltip: {callbacks: {label: (c) => `${c.label}: ${c.raw} alumni`}}}}});
                const thAsc = [...new Set(rows.map(r => r.tahun_lulus))].sort((a, b) => a - b);
                const kBy = thAsc.map(t => rows.filter(r => r.tahun_lulus === t && r.status === 'Bekerja').length);
                const bBy = thAsc.map(t => rows.filter(r => r.tahun_lulus === t && r.status !== 'Bekerja').length);
                document.getElementById('trTahunBox').style.height = '240px';
                trChart('trTahunChart', {type: 'bar', data: {labels: thAsc.map(String), datasets: [
                        {label: 'Sudah bekerja', data: kBy, backgroundColor: '#16a34a', stack: 's', borderRadius: 4, barPercentage: 0.6},
                        {label: 'Belum bekerja', data: bBy, backgroundColor: '#fca5a5', stack: 's', borderRadius: 4, barPercentage: 0.6}]},
                    options: {responsive: true, maintainAspectRatio: false, animation: {duration: 400},
                        plugins: {legend: {position: 'bottom', labels: {boxWidth: 10, font: {size: 11}}}, tooltip: {callbacks: {label: (c) => `${c.dataset.label}: ${c.raw} alumni`}}},
                        scales: {x: {stacked: true, grid: {display: false}, title: {display: true, text: 'Tahun lulus', font: {size: 11}}}, y: {stacked: true, beginAtZero: true, ticks: {precision: 0}, grid: {color: '#f1f5f9'}, title: {display: true, text: 'Alumni', font: {size: 11}}}}}});
                const bins = [['≤ 3 bln', t => t <= 3], ['4–6 bln', t => t >= 4 && t <= 6], ['> 6 bln', t => t > 6]];
                document.getElementById('trTungguBox').style.height = '200px';
                trChart('trTungguChart', {type: 'bar', data: {labels: bins.map(b => b[0]), datasets: [{data: bins.map(b => tunggu.filter(b[1]).length), backgroundColor: ['#16a34a', '#f59e0b', '#dc2626'], borderRadius: 4, barPercentage: 0.6,
                        labelFn: (v) => `${v} alumni`, labelColor: '#0b1220'}]}, plugins: [gkLabelPlugin],
                    options: {indexAxis: 'y', responsive: true, maintainAspectRatio: false, animation: {duration: 400},
                        plugins: {legend: {display: false}, tooltip: {callbacks: {label: (c) => `${c.raw} alumni`}}},
                        scales: {x: {beginAtZero: true, suggestedMax: Math.max(1, ...bins.map(b => tunggu.filter(b[1]).length)) * 1.4, ticks: {precision: 0}, grid: {color: '#f1f5f9'}}, y: {grid: {display: false}}}}});
            }
            document.querySelectorAll('.nav-item[data-target="view-tracer"]').forEach(n => n.addEventListener('click', () => setTimeout(trRender, 0)));

            // ==============================================================
            // 18. PERAN, NAVIGASI TAB, MODAL FORMULIR
            // ==============================================================
            function peran() { return sessionStorage.getItem('c-dfs_user_role') || 'Jobseeker'; }
            // Tampilkan satu halaman tanpa mengubah menu aktif (dipakai tab & tautan)
            function showView(id) {
                const el = document.getElementById(id);
                if (!el) return;
                document.querySelectorAll('.view-section').forEach(v => v.classList.toggle('active', v === el));
                document.querySelectorAll(`.view-tabs .tab-btn`).forEach(b => b.classList.toggle('active', b.dataset.view === id));
                if (id.startsWith('view-pr-')) setTimeout(() => { prRenderAll(); if (id === 'view-pr-cpl') cpRenderAll(); }, 0);
                if (id === 'view-tracer') setTimeout(trRender, 0);
                if (id.startsWith('view-jp-') && typeof jpRenderAll === 'function' && JP.loaded !== false) setTimeout(jpRenderAll, 0);
                window.scrollTo(0, 0);
            }
            document.querySelectorAll('.view-tabs').forEach(bar => bar.addEventListener('click', (e) => {
                const b = e.target.closest('.tab-btn[data-view]'); if (b) showView(b.dataset.view);
            }));
            // Halaman yang dibuka lewat menu juga menyalakan tab yang sesuai
            document.querySelectorAll('.sidebar-nav .nav-item[data-target]').forEach(n => n.addEventListener('click', () => {
                document.querySelectorAll('.view-tabs .tab-btn').forEach(b => b.classList.toggle('active', b.dataset.view === n.dataset.target));
            }));

            // ---------- Modal formulir sederhana ----------
            const MODAL = {onSubmit: null, wajib: false};
            const modalEl = document.getElementById('cdfsModal');
            function tutupModal() { if (MODAL.wajib) return; modalEl.classList.remove('show'); modalEl.setAttribute('aria-hidden', 'true'); }
            // fields: [{name, label, type: text|email|password|select|textarea|info, options:[[value,label]], value, placeholder, help, required}]
            function openForm({title, desc = '', fields = [], ok = 'Simpan', cancel = 'Batal', wajib = false, onSubmit}) {
                MODAL.onSubmit = onSubmit; MODAL.wajib = wajib;
                document.getElementById('cdfsModalTitle').textContent = title;
                document.getElementById('cdfsModalDesc').innerHTML = desc;
                document.getElementById('cdfsModalErr').textContent = '';
                document.getElementById('cdfsModalOk').textContent = ok;
                document.getElementById('cdfsModalCancel').textContent = cancel;
                document.getElementById('cdfsModalCancel').classList.toggle('is-hidden', wajib || !cancel);
                document.getElementById('cdfsModalX').classList.toggle('is-hidden', wajib);
                document.getElementById('cdfsModalFields').innerHTML = fields.map(f => {
                    const id = 'mf_' + f.name;
                    const req = f.required ? ' required' : '';
                    let inp;
                    if (f.type === 'info') return `<div class="mf-info">${f.html}</div>`;
                    if (f.type === 'select') inp = `<select id="${id}" name="${f.name}"${req}>${f.options.map(([v, l]) => `<option value="${escHtml(v)}"${String(f.value ?? '') === String(v) ? ' selected' : ''}>${escHtml(l)}</option>`).join('')}</select>`;
                    else if (f.type === 'textarea') inp = `<textarea id="${id}" name="${f.name}" rows="3" placeholder="${escHtml(f.placeholder || '')}"${req}>${escHtml(f.value || '')}</textarea>`;
                    else inp = `<input id="${id}" name="${f.name}" type="${f.type || 'text'}" value="${escHtml(f.value || '')}" placeholder="${escHtml(f.placeholder || '')}"${req}${f.type === 'password' ? ' autocomplete="new-password"' : ''} />`;
                    return `<label class="mf" for="${id}"><span>${escHtml(f.label)}${f.required ? ' <b>*</b>' : ''}</span>${inp}${f.help ? `<small>${f.help}</small>` : ''}</label>`;
                }).join('');
                modalEl.classList.add('show'); modalEl.setAttribute('aria-hidden', 'false');
                const first = modalEl.querySelector('input,select,textarea'); if (first) setTimeout(() => first.focus(), 50);
            }
            document.getElementById('cdfsModalForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const form = e.target, err = document.getElementById('cdfsModalErr');
                const vals = Object.fromEntries([...form.querySelectorAll('[name]')].map(x => [x.name, x.value.trim()]));
                const kosong = [...form.querySelectorAll('[required]')].find(x => !x.value.trim());
                if (kosong) { err.textContent = 'Lengkapi kolom bertanda *.'; kosong.focus(); return; }
                const btn = document.getElementById('cdfsModalOk'); btn.disabled = true;
                try {
                    const msg = MODAL.onSubmit ? await MODAL.onSubmit(vals) : null;
                    if (msg) { err.textContent = msg; return; }
                    MODAL.wajib = false; tutupModal();
                } finally { btn.disabled = false; }
            });
            ['cdfsModalX', 'cdfsModalCancel'].forEach(id => document.getElementById(id).addEventListener('click', tutupModal));
            modalEl.addEventListener('click', (e) => { if (e.target === modalEl) tutupModal(); });
            function infoModal(title, html) { openForm({title, desc: html, fields: [], ok: 'Tutup', cancel: '', onSubmit: async () => null}); }

            // ---------- Ganti password (semua peran) ----------
            function bukaGantiPassword(wajib = false) {
                openForm({title: wajib ? 'Ganti Password Sementara' : 'Ganti Password', wajib,
                    desc: wajib ? 'Akun Anda dibuat oleh admin dengan password sementara. Ganti dulu sebelum melanjutkan.' : '',
                    fields: [{name: 'lama', label: wajib ? 'Password sementara' : 'Password lama', type: 'password', required: true},
                        {name: 'baru', label: 'Password baru', type: 'password', required: true, help: 'Minimal 8 karakter, memuat huruf dan angka.'},
                        {name: 'baru2', label: 'Ulangi password baru', type: 'password', required: true}],
                    ok: 'Simpan Password',
                    onSubmit: async (v) => {
                        if (v.baru !== v.baru2) return 'Ulangi password baru belum sama.';
                        const res = await apiRequest('ganti_password', {lama: v.lama, baru: v.baru});
                        if (!res) return 'Server belum aktif.';
                        if (!res.success) return res.message;
                        showToast('Password berhasil diganti'); return null;
                    }});
            }
            // Menu profil pojok kanan: identitas + "Kelola Profil" (ganti password, logout)
            document.querySelectorAll('.user-profile .dropdown-menu').forEach(m => {
                m.insertAdjacentHTML('afterbegin', `<div class="dd-head"><span class="dd-av"></span><div><b class="dd-name">-</b><small class="dd-sub">-</small><span class="dd-role">-</span></div></div>
                    <div class="dd-title">Kelola Profil</div>
                    <a href="#" class="js-ganti-pw"><i class="fa-solid fa-key"></i> Ganti Password</a>`);
                m.addEventListener('click', (e) => { if (!e.target.closest('a')) e.stopPropagation(); });
            });
            const PERAN_NAMA = {Jobseeker: 'Mahasiswa', Jobprovider: 'Mitra', Dosen: 'Dosen / Prodi', Admin: 'Admin'};
            function isiMenuProfil() {
                const nama = sessionStorage.getItem('c-dfs_user_name') || 'Pengguna';
                const email = sessionStorage.getItem('c-dfs_user_email') || '';
                const role = PERAN_NAMA[peran()] || '';
                const ini = nama.replace(/\(.*?\)/g, '').trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || 'U';
                document.querySelectorAll('.dd-name').forEach(e => e.textContent = nama);
                document.querySelectorAll('.dd-sub').forEach(e => e.textContent = email);
                document.querySelectorAll('.dd-role').forEach(e => e.textContent = role);
                document.querySelectorAll('.dd-av, .user-profile .avatar').forEach(e => e.textContent = ini);
            }
            document.addEventListener('click', (e) => { const b = e.target.closest('.js-ganti-pw'); if (b) { e.preventDefault(); bukaGantiPassword(false); } });

            // ---------- Ajukan kemitraan (landing & halaman masuk) ----------
            function bukaAjukanMitra() {
                openForm({title: 'Ajukan Kemitraan C-DFS',
                    desc: 'Untuk perusahaan, sekolah / lembaga pendidikan, dan instansi. Admin C-DFS memeriksa data Anda (mis. NIB atau NPSN), lalu mengirimkan akun ke email yang Anda isi.',
                    fields: [{name: 'nama_instansi', label: 'Nama perusahaan / instansi', required: true, placeholder: 'mis. PT Contoh Sejahtera'},
                        {name: 'jenis', label: 'Jenis', type: 'select', options: [['Perusahaan', 'Perusahaan'], ['Sekolah / Lembaga Pendidikan', 'Sekolah / lembaga pendidikan'], ['Instansi Pemerintah', 'Instansi pemerintah'], ['Lainnya', 'Lainnya']]},
                        {name: 'nib_npsn', label: 'NIB (perusahaan) / NPSN (sekolah)', placeholder: 'Untuk verifikasi admin'},
                        {name: 'kontak_nama', label: 'Nama kontak (HR / penanggung jawab)', required: true},
                        {name: 'email', label: 'Email kantor', type: 'email', required: true, help: 'Sebaiknya email domain perusahaan / sekolah, bukan email pribadi.'},
                        {name: 'telepon', label: 'Telepon / WhatsApp'},
                        {name: 'prodi_minat', label: 'Prodi yang dituju', type: 'select', options: [['', 'Belum tahu / beberapa prodi']].concat(allProdi().map(p => [p.nama, `${p.kode} — ${p.nama}`]))},
                        {name: 'pesan', label: 'Kebutuhan singkat', type: 'textarea', placeholder: 'mis. butuh teknisi otomasi, ingin magang bersama'}],
                    ok: 'Kirim Pengajuan',
                    onSubmit: async (v) => {
                        const res = await apiRequest('ajukan_mitra', v);
                        if (!res) return 'Server belum aktif. Pengajuan hanya bisa dikirim saat aplikasi berjalan di Laragon / server.';
                        if (!res.success) return res.message;
                        setTimeout(() => infoModal('Pengajuan Terkirim', escHtml(res.message)), 50); return null;
                    }});
            }
            document.addEventListener('click', (e) => { const b = e.target.closest('.ld-go-mitra'); if (b) { e.preventDefault(); bukaAjukanMitra(); } });

            // ==============================================================
            // 19. DOSEN / PRODI
            // ==============================================================
            function initDosen() {
                const nama = sessionStorage.getItem('c-dfs_user_name') || 'Dosen';
                document.querySelectorAll('.user-name').forEach(el => el.textContent = nama);
                prRenderAll(); prEnsure(); cpEnsure(); trEnsure(); dsnRender();
            }
            const barMini = (label, n1, N1, n2, N2) => `
                <div class="dsn-gap-row"><span>${esc(label)}</span><div class="bars">
                    <i class="b" style="width:${N1 ? Math.max(2, 100 * n1 / N1) : 0}%"></i><em class="b">${n1}/${N1} mitra</em>
                    ${N2 ? `<i class="g" style="width:${Math.max(2, 100 * n2 / N2)}%"></i><em class="g">${n2}/${N2} mhs siap</em>` : ''}</div></div>`;
            function dsnRender() {
                if (peran() !== 'Dosen') return;
                const prodi = curProdi(), note = document.getElementById('dsnNote');
                const a = prodi && PR.reqProdi === prodi ? prAnalyze() : null;
                const msg = [];
                if (!prodi) msg.push('Akun dosen belum dikaitkan ke prodi yang tercakup. Hubungi admin.');
                if (PR.demo) msg.push('<strong>DATA CONTOH (fiktif).</strong>');
                if (a && !a.cukup) msg.push(`Kesiapan mahasiswa tampil bila minimal ${MIN_MHS} mahasiswa prodi sudah mengunggah transkrip terverifikasi (saat ini ${a.ns}).`);
                note.innerHTML = msg.length ? '<i class="fa-solid fa-circle-info"></i> <span>' + msg.join(' ') + '</span>' : '';
                note.classList.toggle('is-hidden', !msg.length);
                if (!a) return;
                const N = mitraSet(a.S).size;
                a.komp.forEach(k => { k.nm = mitraMinta(a.S, k.nama); });
                prSetText('dsnIdx', a.index === null ? '-' : pc(a.index));
                prSetText('dsnMitraLbl', labelMitra(prodi).replace(/^./, c => c.toUpperCase()));
                prSetText('dsnMitra', N);
                prSetText('dsnMhs', a.ns);
                prSetText('dsnMhsDesc', `transkrip terverifikasi (anonim) · ${PR.jml || 0} mahasiswa terdaftar`);
                const prio = a.komp.filter(k => k.n >= MIN_SUMBER && (k.gap ?? 0) >= 20);
                prSetText('dsnGapN', a.cukup ? prio.length : '-');
                const top = [...a.komp].sort((x, y) => (y.n >= MIN_SUMBER) - (x.n >= MIN_SUMBER) || (y.gap ?? -1) - (x.gap ?? -1) || y.demand - x.demand).slice(0, 5);
                document.getElementById('dsnGap').innerHTML = top.length ? `<div class="dsn-legend"><span><b class="b"></b>diminta ${labelMitra(prodi)}</span><span><b class="g"></b>mahasiswa siap</span></div>` +
                    top.map(k => barMini(k.nama, k.nm, N, a.cukup ? Math.round(k.ready * a.ns / 100) : 0, a.cukup ? a.ns : 0)).join('') : '<p class="jp-muted">Belum ada kebutuhan mitra.</p>';
                document.getElementById('dsnRek').innerHTML = a.recs.length ? a.recs.slice(0, 3).map(r => `
                    <div class="dsn-rek"><div class="t">${esc(r.jenis)} <span class="badge ${PRIO_BADGE[r.prio]}">Prioritas ${r.prio}</span></div><b>${esc(r.judul)}</b><span>${esc(r.aksi)}</span></div>`).join('')
                    : `<p class="jp-muted">${a.cukup ? 'Tidak ada gap prodi ≥ 20 poin.' : 'Rekomendasi muncul setelah data mahasiswa cukup.'}</p>`;
                // Tracer ringkas
                const tr = TR.loaded ? TR.rows.filter(r => r.prodi === prodi) : [];
                const k = tr.filter(r => r.status === 'Bekerja'), tg = k.filter(r => r.masa_tunggu !== null && r.masa_tunggu !== undefined).map(r => Number(r.masa_tunggu));
                const m = new Map(); k.forEach(r => { if (r.mitra) m.set(r.mitra, (m.get(r.mitra) || 0) + 1); });
                const p = tr.length ? Math.round(100 * k.length / tr.length) : 0;
                document.getElementById('dsnTracer').innerHTML = !TR.loaded ? '<p class="jp-muted">Memuat…</p>' : (tr.length ? `
                    <div class="dsn-donut" style="--p:${p}"><div>${p}%</div></div>
                    <div class="dsn-tr-txt"><p><b>${k.length}</b> dari ${tr.length} alumni sudah bekerja · <b>${tr.length - k.length}</b> belum</p>
                    <p>Masa tunggu rata-rata <b>${tg.length ? (tg.reduce((x, y) => x + y, 0) / tg.length).toFixed(1).replace('.', ',') : '-'} bulan</b></p>
                    <p>Di mitra: ${m.size ? [...m.entries()].sort((x, y) => y[1] - x[1]).map(([n, c]) => `${esc(n.replace(/\s*\(Contoh\)$/, ''))} (${c})`).join(', ') : '-'}</p></div>`
                    : '<p class="jp-muted">Belum ada data tracer study prodi. Unggah di menu Tracer Study.</p>');
                // Mitra prodi
                const per = new Map();
                a.S.forEach(src => {
                    const e = per.get(src.perusahaan) || {nama: src.perusahaan, izin: Number(src.izin_nama) === 1, low: [], komp: new Set(), bahasa: new Set()};
                    if (src.tipe === 'lowongan') e.low.push(src.posisi);
                    (src.kompetensi || []).forEach(x => e.komp.add(x)); (src.bahasa || []).forEach(b => e.bahasa.add(`${b.nama} ${b.level}`));
                    per.set(src.perusahaan, e);
                });
                document.getElementById('dsnMitraList').innerHTML = per.size ? [...per.values()].sort((x, y) => y.komp.size - x.komp.size).map(e => `
                    <div class="chart-card dsn-mitra">
                        <div class="card-header-flex"><h3 class="card-title"><i class="fa-solid fa-building text-blue"></i> ${esc(e.nama)}</h3>
                            <span class="badge ${e.izin ? 'badge-green' : 'badge-orange'}">${e.izin ? 'Nama boleh ditampilkan' : 'Nama tidak ditampilkan ke mahasiswa'}</span></div>
                        <p class="jp-muted">${e.low.length ? `${e.low.length} lowongan aktif: ${e.low.map(esc).join(', ')}` : 'Belum membuka lowongan; menyampaikan kebutuhan kompetensi.'}</p>
                        <div class="dsn-chips">${[...e.komp].map(x => `<span class="pr-mk">${esc(x)}</span>`).join('')}${[...e.bahasa].map(x => `<span class="pr-mk">Bahasa ${esc(x)}</span>`).join('')}</div>
                    </div>`).join('') : `<div class="jp-empty-block"><i class="fa-solid fa-handshake"></i>Belum ada ${labelMitra(prodi)} untuk prodi ini.</div>`;
            }
            // ---------- Kelola CPL & CPMK ----------
            const cariCpl = (id) => CP.cpl.find(c => String(c.id) === String(id));
            const cariCpmk = (id) => { for (const c of CP.cpl) for (const m of (c.cpmk || [])) if (String(m.id) === String(id)) return {c, m}; return null; };
            async function cpSimpan(action, data, ok) {
                const res = await apiRequest(action, data);
                if (!res) return 'Server belum aktif.';
                if (!res.success) return res.message;
                showToast(ok); CP.loaded = false; cpEnsure(); return null;
            }
            const formCpl = (c = {}) => openForm({title: c.id ? `Ubah ${c.kode}` : 'Tambah CPL',
                fields: [{name: 'kode', label: 'Kode CPL', value: c.kode || `CPL-${CP.cpl.length + 1}`, required: true},
                    {name: 'deskripsi', label: 'Rumusan CPL (dari RPS)', type: 'textarea', value: c.deskripsi, required: true},
                    {name: 'wef_pembanding', label: 'Pembanding skill WEF (opsional)', value: c.wef_pembanding, placeholder: 'mis. AI & big data, Literasi teknologi'},
                    {name: 'wef_arah', label: 'Arah menurut WEF', type: 'select', value: c.wef_arah || '', options: [['', 'Tidak ada pembanding'], ['naik', 'Naik'], ['turun', 'Turun']]}],
                onSubmit: (v) => cpSimpan('dsn_cpl_save', {...v, id: c.id || 0}, c.id ? 'CPL diperbarui' : 'CPL ditambahkan')});
            const formCpmk = (cplId, m = {}) => openForm({title: m.id ? `Ubah ${m.kode}` : `Tambah CPMK untuk ${(cariCpl(cplId) || {}).kode || ''}`,
                fields: [{name: 'kode', label: 'Kode CPMK', value: m.kode, required: true, placeholder: 'mis. CPMK-2.4'},
                    {name: 'deskripsi', label: 'Rumusan CPMK', type: 'textarea', value: m.deskripsi, required: true},
                    {name: 'mata_kuliah', label: 'Mata kuliah', value: m.mata_kuliah, required: true, help: 'Tulis sama seperti di transkrip agar bisa dicocokkan.'},
                    {name: 'kata_kunci', label: 'Kata kunci kebutuhan mitra', value: m.kata_kunci, help: 'Pisahkan dengan titik koma, mis. <em>PLC; Otomasi Industri; SCADA</em>. Dipakai memetakan kebutuhan mitra ke CPMK ini.'}],
                onSubmit: (v) => cpSimpan('dsn_cpmk_save', {...v, id: m.id || 0, cpl_id: cplId}, m.id ? 'CPMK diperbarui' : 'CPMK ditambahkan')});
            document.getElementById('cpAddCpl').addEventListener('click', () => formCpl());
            document.getElementById('cpList').addEventListener('click', async (e) => {
                const b = e.target.closest('[data-cp]'); if (!b) return;
                e.preventDefault(); e.stopPropagation();
                const act = b.dataset.cp;
                if (act === 'cpl-edit') formCpl(cariCpl(b.dataset.id));
                else if (act === 'cpmk-add') formCpmk(b.dataset.cpl);
                else if (act === 'cpmk-edit') { const x = cariCpmk(b.dataset.id); if (x) formCpmk(x.c.id, x.m); }
                else if (act === 'cpl-del') { const c = cariCpl(b.dataset.id); if (c && confirm(`Hapus ${c.kode} beserta semua CPMK-nya?`)) { const m = await cpSimpan('dsn_cpl_delete', {id: c.id}, 'CPL dihapus'); if (m) alert(m); } }
                else if (act === 'cpmk-del') { const x = cariCpmk(b.dataset.id); if (x && confirm(`Hapus ${x.m.kode}?`)) { const m = await cpSimpan('dsn_cpmk_delete', {id: x.m.id}, 'CPMK dihapus'); if (m) alert(m); } }
            });
            // ---------- Unggah tracer study (CSV) ----------
            function bacaCsv(teks) {
                const baris = teks.replace(/^﻿/, '').split(/\r?\n/).filter(x => x.trim());
                if (!baris.length) return [];
                const sep = (baris[0].match(/;/g) || []).length > (baris[0].match(/,/g) || []).length ? ';' : ',';
                const pecah = (l) => { const out = []; let cur = '', q = false; for (let i = 0; i < l.length; i++) { const ch = l[i];
                    if (ch === '"') { if (q && l[i + 1] === '"') { cur += '"'; i++; } else q = !q; } else if (ch === sep && !q) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out.map(x => x.trim()); };
                const head = pecah(baris[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'));
                return baris.slice(1).map(l => { const v = pecah(l); return Object.fromEntries(head.map((h, i) => [h, v[i] ?? ''])); });
            }
            document.getElementById('trTemplate').addEventListener('click', (e) => {
                e.preventDefault();
                const csv = 'nama,tahun_lulus,status,perusahaan,posisi,masa_tunggu,sesuai_bidang\nNama Alumni 1,2025,Bekerja,PT Contoh,Teknisi,3,ya\nNama Alumni 2,2025,Belum Bekerja,,,,\nNama Alumni 3,2024,Wirausaha,Usaha Sendiri,Wirausaha,2,ya\n';
                const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], {type: 'text/csv'})); a.download = 'template_tracer_study.csv'; a.click();
            });
            document.getElementById('trUpload').addEventListener('click', async () => {
                const f = document.getElementById('trFile').files[0], info = document.getElementById('trUploadInfo');
                if (!f) return showToast('Pilih file CSV dahulu');
                const rows = bacaCsv(await f.text());
                if (!rows.length) { info.textContent = 'File kosong atau format tidak dikenali.'; return; }
                const mode = document.getElementById('trMode').value;
                if (mode === 'ganti' && !confirm('Ganti SEMUA data tracer study prodi Anda dengan isi file ini?')) return;
                const res = await apiRequest('dsn_tracer_import', {rows, mode});
                if (!res) { info.textContent = 'Server belum aktif.'; return; }
                if (!res.success) { info.textContent = res.message; return; }
                info.innerHTML = `<span style="color:#15803d;font-weight:600"><i class="fa-solid fa-circle-check"></i> ${res.masuk} baris tersimpan</span>${res.dilewati ? ` · ${res.dilewati} baris dilewati (nama / tahun / status tidak valid)` : ''}`;
                document.getElementById('trFile').value = '';
                TR.loaded = false; TR.mode = null; trEnsure();
            });

            // ==============================================================
            // 20. ADMIN
            // ==============================================================
            const ADM = {data: null};
            async function initAdmin() {
                const nama = sessionStorage.getItem('c-dfs_user_name') || 'Admin';
                document.querySelectorAll('.user-name').forEach(el => el.textContent = nama);
                const res = await apiRequest('adm_bootstrap');
                const note = document.getElementById('admNote');
                if (!res || !res.success) {
                    note.innerHTML = '<i class="fa-solid fa-circle-info"></i> <span>' + (res ? esc(res.message) : 'Halaman admin membutuhkan server (Laragon / hosting) dan database.') + '</span>';
                    note.classList.remove('is-hidden'); return;
                }
                note.classList.add('is-hidden');
                ADM.data = res; admRender();
            }
            const PERAN_LBL = {Jobprovider: 'Mitra', Dosen: 'Dosen / Prodi', Admin: 'Admin'};
            function admRender() {
                const d = ADM.data; if (!d) return;
                const n = (r) => d.users.filter(u => u.role === r).length, baru = d.pengajuan.filter(p => p.status === 'Baru').length;
                document.getElementById('admStats').innerHTML = [
                    ['bg-blue-light', 'fa-user-graduate', 'Mahasiswa', d.jumlah_mahasiswa, 'daftar sendiri (email UM)'],
                    ['bg-green-light', 'fa-building', 'Mitra', n('Jobprovider'), 'dibuat admin'],
                    ['bg-orange-light', 'fa-chalkboard-user', 'Dosen / Prodi', n('Dosen'), 'dibuat admin'],
                    ['bg-red-light', 'fa-inbox', 'Pengajuan Baru', baru, '<a href="#" class="js-goto" data-goto="view-adm-pengajuan">periksa &rarr;</a>']]
                    .map(([bg, ic, l, v, ds]) => `<div class="stat-card"><div class="stat-icon ${bg}"><i class="fa-solid ${ic}"></i></div><div class="stat-info"><p class="stat-label">${l}</p><h3 class="stat-value">${v}</h3><p class="stat-desc">${ds}</p></div></div>`).join('');
                document.getElementById('admUserBody').innerHTML = d.users.map(u => `
                    <tr class="${u.aktif ? '' : 'adm-off'}">
                        <td><strong>${esc(u.name)}</strong>${u.wajib_ganti_pw ? '<div class="jp-muted">password sementara</div>' : ''}</td>
                        <td>${esc(u.email)}</td>
                        <td><span class="badge ${u.role === 'Dosen' ? 'badge-orange' : (u.role === 'Admin' ? 'badge-red' : 'badge-blue')}">${PERAN_LBL[u.role] || esc(u.role)}</span></td>
                        <td>${u.role === 'Dosen' ? esc(kodeProdi(u.prodi || '')) : esc(u.instansi)}${u.role === 'Jobprovider' && u.izin_nama ? ' <span class="jp-muted">· nama boleh tampil</span>' : ''}</td>
                        <td class="text-center">${u.aktif ? '<span class="badge badge-green">Aktif</span>' : '<span class="badge badge-red">Nonaktif</span>'}</td>
                        <td class="text-center adm-btns">${u.role === 'Admin' ? '' : `<button type="button" class="jp-btn-sm" data-adm="reset" data-id="${u.id}">Reset password</button><button type="button" class="jp-btn-sm ${u.aktif ? 'danger' : ''}" data-adm="toggle" data-id="${u.id}" data-aktif="${u.aktif ? 0 : 1}">${u.aktif ? 'Nonaktifkan' : 'Aktifkan'}</button>`}</td>
                    </tr>`).join('');
                document.getElementById('admPjList').innerHTML = d.pengajuan.length ? d.pengajuan.map(p => `
                    <div class="chart-card adm-pj ${p.status !== 'Baru' ? 'selesai' : ''}">
                        <div class="card-header-flex"><h3 class="card-title">${esc(p.nama_instansi)}</h3><span class="badge ${p.status === 'Baru' ? 'badge-orange' : (p.status === 'Disetujui' ? 'badge-green' : 'badge-red')}">${esc(p.status)}</span></div>
                        <div class="adm-pj-grid">
                            <span>Jenis</span><b>${esc(p.jenis)}</b><span>NIB / NPSN</span><b>${esc(p.nib_npsn || '-')}</b>
                            <span>Kontak</span><b>${esc(p.kontak_nama)} · ${esc(p.email)}${p.telepon ? ' · ' + esc(p.telepon) : ''}</b>
                            <span>Prodi dituju</span><b>${esc(p.prodi_minat ? kodeProdi(p.prodi_minat) : '-')}</b><span>Kebutuhan</span><b>${esc(p.pesan || '-')}</b>
                            <span>Diajukan</span><b>${esc(fmtTgl(p.created_at) || p.created_at)}</b>
                        </div>
                        ${p.status === 'Baru' ? `<div class="adm-pj-act"><button type="button" class="jp-btn-sm primary" data-pj="buat" data-id="${p.id}"><i class="fa-solid fa-user-plus"></i> Verifikasi &amp; buat akun</button><button type="button" class="jp-btn-sm danger" data-pj="tolak" data-id="${p.id}">Tolak</button></div>` : ''}
                    </div>`).join('') : '<div class="jp-empty-block"><i class="fa-solid fa-inbox"></i>Belum ada pengajuan kemitraan.</div>';
            }
            function tampilPasswordBaru(email, pw) {
                infoModal('Akun Siap', `Berikan data berikut kepada pengguna. Password ini hanya ditampilkan sekali dan wajib diganti saat login pertama.<div class="adm-cred"><span>Email</span><b>${esc(email)}</b><span>Password sementara</span><b>${esc(pw)}</b></div>`);
            }
            function formAkun(role, pre = {}) {
                const fields = [{name: 'name', label: role === 'Dosen' ? 'Nama dosen / koordinator' : 'Nama kontak akun (HR / penanggung jawab)', value: pre.name, required: true},
                    {name: 'email', label: 'Email', type: 'email', value: pre.email, required: true}];
                if (role === 'Dosen') fields.push({name: 'prodi', label: 'Prodi', type: 'select', required: true, options: allProdi().map(p => [p.nama, `${p.kode} — ${p.nama}`])});
                else fields.push({name: 'instansi', label: 'Nama resmi mitra', value: pre.instansi, required: true, help: 'Cek penulisan resmi (PT / CV / nama sekolah). Akan dirapikan otomatis.'},
                    {name: 'izin_nama', label: 'Nama boleh ditampilkan sebagai mitra?', type: 'select', value: '0', options: [['0', 'Belum (mitra dapat mengubahnya sendiri)'], ['1', 'Ya, sudah ada izin tertulis']]});
                openForm({title: role === 'Dosen' ? 'Buat Akun Dosen / Prodi' : 'Buat Akun Mitra', fields, ok: 'Buat Akun',
                    desc: pre.pengajuan_id ? 'Data diambil dari pengajuan kemitraan. Pastikan NIB / NPSN sudah diperiksa.' : '',
                    onSubmit: async (v) => {
                        const res = await apiRequest('adm_create', {...v, role, izin_nama: v.izin_nama === '1', pengajuan_id: pre.pengajuan_id || 0});
                        if (!res) return 'Server belum aktif.';
                        if (!res.success) return res.message;
                        setTimeout(() => tampilPasswordBaru(res.email, res.password), 50);
                        initAdmin(); return null;
                    }});
            }
            document.getElementById('admNewMitra').addEventListener('click', () => formAkun('Jobprovider'));
            document.getElementById('admNewDosen').addEventListener('click', () => formAkun('Dosen'));
            document.getElementById('admUserBody').addEventListener('click', async (e) => {
                const b = e.target.closest('[data-adm]'); if (!b) return;
                const u = ADM.data.users.find(x => String(x.id) === b.dataset.id); if (!u) return;
                if (b.dataset.adm === 'reset') {
                    if (!confirm(`Buat password sementara baru untuk ${u.email}?`)) return;
                    const res = await apiRequest('adm_reset', {id: u.id});
                    if (res && res.success) { tampilPasswordBaru(u.email, res.password); initAdmin(); } else alert((res && res.message) || 'Gagal.');
                } else {
                    const res = await apiRequest('adm_toggle', {id: u.id, aktif: b.dataset.aktif === '1'});
                    if (res && res.success) { showToast(b.dataset.aktif === '1' ? 'Akun diaktifkan' : 'Akun dinonaktifkan'); initAdmin(); } else alert((res && res.message) || 'Gagal.');
                }
            });
            document.getElementById('admPjList').addEventListener('click', async (e) => {
                const b = e.target.closest('[data-pj]'); if (!b) return;
                const p = ADM.data.pengajuan.find(x => String(x.id) === b.dataset.id); if (!p) return;
                if (b.dataset.pj === 'buat') formAkun('Jobprovider', {name: p.kontak_nama, email: p.email, instansi: p.nama_instansi, pengajuan_id: p.id});
                else if (confirm(`Tolak pengajuan ${p.nama_instansi}?`)) {
                    const res = await apiRequest('adm_pengajuan_status', {id: p.id, status: 'Ditolak'});
                    if (res && res.success) { showToast('Pengajuan ditolak'); initAdmin(); }
                }
            });
            // Profil mitra
            function jpRenderProfil() {
                prSetText('jpPfNama', sessionStorage.getItem('c-dfs_user_instansi') || '-');
                prSetText('jpPfEmail', sessionStorage.getItem('c-dfs_user_email') || '-');
            }

            // ==============================================================
            // 11. INISIALISASI
            // ==============================================================
            showLanding();

            if (window.location.search.includes('dashboard')) {
                showDashboard();
            }

            if (window.location.search.includes('login')) {
                showAuth();
                setMode('login');
            }

        });
