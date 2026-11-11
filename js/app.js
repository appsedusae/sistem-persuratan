/* Sistem Persuratan — frontend SPA (vanilla JS).
 * Prinsip kecepatan: data dimuat SEKALI lewat satu panggilan "boot", disimpan di localStorage,
 * lalu semua perpindahan menu dan filter berjalan di browser tanpa menunggu server.
 * Aksi tulis memakai optimistic UI. Pembaruan latar belakang hanya mengunduh data bila versinya berubah.
 */
(function () {
  'use strict';
  const DEMO = !window.GAS_URL;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const LS = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* penyimpanan penuh atau diblokir */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* abaikan */ } }
  };

  // ---------- Ikon garis (inline, tanpa pustaka) ----------
  const IK = {
    grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z', plus: 'M12 5v14M5 12h14',
    filePlus: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M12 12v6M9 15h6',
    file: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h6',
    history: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2', inbox: 'M3 13l3-8h12l3 8v6H3zM3 13h5l1 3h6l1-3h5',
    hash: 'M5 9h14M5 15h14M10 4L8 20M16 4l-2 16', check: 'M5 12l5 5L20 7',
    shield: 'M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.500-8-9V6zM8.5 12l2.5 2.5 4.5-5',
    users: 'M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M21 20v-1a4 4 0 0 0-3-3.900M15.5 4.200a3.5 3.5 0 0 1 0 6.600',
    list: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
    help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M9.5 9.5a2.5 2.5 0 1 1 3.5 2.300c-.7.4-1 1-1 1.700M12 17h.01',
    qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h3v3h-3zM20 14v.01M20 20v.01M17 20h.01M20 17h.01',
    search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14M20 20l-4-4', bell: 'M6 9a6 6 0 1 1 12 0c0 6 2.5 7 2.5 7h-17S6 15 6 9M10 20a2 2 0 0 0 4 0',
    download: 'M12 4v11M7 11l5 5 5-5M4 20h16', eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
    x: 'M6 6l12 12M18 6L6 18', logout: 'M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 8l4 4-4 4M20 12H9', menu: 'M4 6h16M4 12h16M4 18h16',
    clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 7v5l3 2', alert: 'M12 4l9 16H3zM12 10v4M12 17h.01',
    upload: 'M12 16V5M7 9l5-5 5 5M4 20h16', print: 'M7 8V4h10v4M7 17H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M7 14h10v6H7z',
    send: 'M21 3L3 10l7 3 3 7zM10 13l5-5', chart: 'M4 20V10M10 20V4M16 20v-7M21 20H3', mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
    db: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
    edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4', ban: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M5.6 5.6l12.8 12.8', right: 'M9 6l6 6-6 6',
    left: 'M15 6l-6 6 6 6', trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13'
  };
  const ic = (n, c) => `<svg class="ic ${c || ''}" viewBox="0 0 24 24" aria-hidden="true"><path d="${IK[n] || ''}"/></svg>`;

  // ---------- State ----------
  const S = { token: LS.get('sp_token'), user: LS.get('sp_user'), cfg: LS.get('sp_cfg'), D: null, rute: 'dashboard', f: {}, tertunda: false };
  if (S.user && S.token) S.D = LS.get('sp_boot_' + S.user.email);
  const D = () => S.D;
  const F = (k, def) => (S.f[k] || (S.f[k] = def || {}));

  // ---------- API ----------
  const inflight = {};
  let epoch = 0;
  async function kirim(action, data) {
    if (DEMO) return window.DEMO_API(action, data || {}, S.token);
    const res = await fetch(window.GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // wajib text/plain agar tidak memicu preflight CORS
      body: JSON.stringify({ action, data: data || {}, token: S.token })
    });
    return res.json();
  }
  function api(action, data) {
    const baca = /^(boot|log\.list|auth\.config|verifikasi)$/.test(action);
    if (!baca) epoch++;
    const k = epoch + '|' + action + '|' + JSON.stringify(data || {});
    if (baca && inflight[k]) return inflight[k]; // permintaan kembar menumpang promise yang sama
    const p = kirim(action, data).then(r => {
      if (!r || !r.success) { const e = new Error((r && r.message) || 'Permintaan gagal.'); e.code = r && r.code; throw e; }
      return r.data;
    });
    if (baca) { inflight[k] = p; p.then(() => delete inflight[k], () => delete inflight[k]); }
    return p;
  }
  function tangani(e) {
    if (e && (e.code === 'UNAUTHENTICATED' || e.code === 'FORBIDDEN' || e.code === 'PENDING_APPROVAL')) {
      keluar(e.code === 'PENDING_APPROVAL' ? 'tunggu' : e.code === 'FORBIDDEN' ? 'tolak' : '');
    }
    toast((e && e.message) || 'Terjadi kesalahan jaringan. Periksa koneksi Anda.', 'galat');
  }

  // ---------- Utilitas ----------
  const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const BLNP = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const ROMAWI = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const keTgl = s => new Date(String(s).length === 10 ? s + 'T00:00:00' : s);
  function tgl(s, panjang) {
    if (!s) return '—';
    const d = keTgl(s);
    if (isNaN(d)) return esc(s);
    return d.getDate() + ' ' + (panjang ? BLNP : BLN)[d.getMonth()] + ' ' + d.getFullYear();
  }
  function lalu(s) {
    const m = Math.round((Date.now() - keTgl(s)) / 60000);
    if (isNaN(m)) return '';
    if (m < 1) return 'baru saja';
    if (m < 60) return m + ' mnt lalu';
    if (m < 1440) return Math.round(m / 60) + ' jam lalu';
    return tgl(s);
  }
  const hariIni = () => { const d = new Date(); return HARI[d.getDay()] + ', ' + d.getDate() + ' ' + BLNP[d.getMonth()] + ' ' + d.getFullYear(); };
  const isoHari = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const inisial = n => (String(n || '?').replace(/[^A-Za-z ]/g, '').trim().split(/\s+/).slice(0, 2).map(x => x[0]).join('') || '?').toUpperCase();
  const PERAN = { ADMIN: 'Admin', PIMPINAN: 'Pimpinan', USER: 'Pemohon' };
  const ST = {
    DIAJUKAN: ['Diajukan', 's-aju'], DIPROSES: ['Diproses', 's-pro'], MENUNGGU_VERIFIKASI: ['Menunggu Verifikasi', 's-ver'],
    TERBIT: ['Terbit', 's-ok'], DITOLAK: ['Ditolak', 's-no'], DIBATALKAN: ['Dibatalkan', 's-no']
  };
  const lencana = (st, teks) => `<span class="lc ${(ST[st] || ['', 's-aju'])[1]}"><i></i>${esc(teks || (ST[st] || [st])[0])}</span>`;
  const tplDari = kode => D().templates.find(t => t.kode === kode);
  const suratDari = id => D().surat.find(s => s.id === id);
  const adalah = r => S.user.role === r;

  function formatNomor(pola, n, kode, d) {
    const b = d.getMonth() + 1;
    return String(pola || '').replace(/\{no(?::(0+))?\}/g, (m, z) => String(n).padStart(z ? z.length : 1, '0'))
      .replace(/\{kode\}/g, kode).replace(/\{bulan_romawi\}/g, ROMAWI[b]).replace(/\{bulan\}/g, String(b).padStart(2, '0')).replace(/\{tahun\}/g, d.getFullYear());
  }
  function nomorBerikut(tpl, tglStr) {
    const d = tglStr ? keTgl(tglStr) : new Date();
    const per = tpl.reset_nomor === 'BULANAN' ? 'BLN-' + isoHari(d).slice(0, 7) : tpl.reset_nomor === 'TAHUNAN' ? 'THN-' + d.getFullYear() : 'SEMUA';
    const r = (D().nomor || []).find(x => x.jenis === tpl.kode && x.periode === per);
    return formatNomor(tpl.format_nomor, (r ? Number(r.terakhir) || 0 : 0) + 1, tpl.kode, d);
  }

  function toast(pesan, jenis) {
    const el = document.createElement('div');
    el.className = 'toast ' + (jenis || 'ok');
    el.innerHTML = ic(jenis === 'galat' ? 'alert' : 'check') + '<span></span>';
    el.lastChild.textContent = pesan;
    $('#toast').appendChild(el);
    setTimeout(() => el.classList.add('hilang'), 3800);
    setTimeout(() => el.remove(), 4300);
  }
  function modal(html, kelas) {
    $('#lapis').innerHTML = `<div class="tirai-modal" data-act="tutup"></div><div class="modal ${kelas || ''}" role="dialog" aria-modal="true">${html}</div>`;
    const a = $('#lapis [autofocus]'); if (a) a.focus();
  }
  const tutup = () => { $('#lapis').innerHTML = ''; if (S.tertunda) render(); };
  const sibuk = (el, ya) => { if (el) { el.disabled = !!ya; el.classList.toggle('sibuk', !!ya); } };
  const kosong = (judul, teks, cta) => `<div class="kosong">${ic('mail')}<b>${esc(judul)}</b><p>${esc(teks || '')}</p>${cta || ''}</div>`;
  function unduhBerkas(nama, mime, bagian) {
    const url = URL.createObjectURL(new Blob(bagian, { type: mime }));
    const a = document.createElement('a');
    a.href = url; a.download = nama; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
  function unduhB64(o) {
    const bin = atob(o.b64), u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    unduhBerkas(o.nama, o.mime, [u8]);
  }
  const bacaFile = f => new Promise((ok, no) => {
    const r = new FileReader();
    r.onload = () => ok({ b64: String(r.result).split(',')[1], mime: f.type });
    r.onerror = no; r.readAsDataURL(f);
  });

  // ---------- Sinkronisasi (stale-while-revalidate) ----------
  function simpanBoot() { LS.set('sp_boot_' + S.user.email, S.D); }
  async function sinkron(paksa) {
    if (!S.token) return;
    try {
      const d = await api('boot', { v: paksa || !S.D ? '' : S.D.v });
      if (d.unchanged) return;
      S.user = Object.assign({}, S.user, d.user); LS.set('sp_user', S.user);
      S.D = d; simpanBoot(); render();
    } catch (e) { if (e.code) tangani(e); else if (!S.D) toast('Tidak dapat menghubungi server. Periksa koneksi.', 'galat'); }
  }
  let aktif = Date.now();
  ['click', 'keydown', 'pointermove'].forEach(ev => addEventListener(ev, () => { aktif = Date.now(); }, { passive: true }));
  (function jadwal() {
    // Polling adaptif: 25 detik saat aktif, 90 detik saat diam, berhenti saat tab tidak terlihat
    setTimeout(async () => { if (document.visibilityState === 'visible') await sinkron(); jadwal(); }, Date.now() - aktif < 120000 ? 25000 : 90000);
  })();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') sinkron(); });

  function buang(row) { const i = D().surat.indexOf(row); if (i > -1) D().surat.splice(i, 1); }
  function gantiSurat(row) {
    const i = D().surat.findIndex(s => s.id === row.id);
    if (i > -1) D().surat[i] = row; else D().surat.unshift(row);
    simpanBoot();
  }
  // Aksi tulis dengan optimistic UI: tampilan berubah dulu, dibatalkan bila server menolak
  async function ubahSurat(action, data, patch, pesan) {
    const s = suratDari(data.id), lama = Object.assign({}, s);
    Object.assign(s, patch, { _sibuk: true });
    tutup(); render(true);
    try {
      gantiSurat(await api(action, data));
      toast(pesan);
      render(true); sinkron();
      return true;
    } catch (e) {
      Object.keys(s).forEach(k => delete s[k]); Object.assign(s, lama);
      render(true); tangani(e);
      return false;
    }
  }

  // ---------- Menu & kerangka ----------
  const MENU = [
    ['MENU', [['dashboard', 'Dashboard', 'grid', ''], ['ajukan', 'Ajukan Surat', 'filePlus', ''], ['riwayat', 'Riwayat Pengajuan', 'history', '']]],
    ['PERSURATAN', [['kelola', 'Kelola Surat', 'inbox', 'A'], ['template', 'Template', 'file', 'A'], ['nomor', 'Nomor Surat', 'hash', 'A'], ['laporan', 'Laporan & Rekap', 'chart', 'AP']]],
    ['PIMPINAN', [['verifikasi', 'Verifikasi Surat', 'shield', 'P']]],
    ['PENGATURAN', [['pengguna', 'Kelola Pengguna', 'users', 'A'], ['log', 'Log Aktivitas', 'list', 'A'], ['migrasi', 'Migrasi Data', 'db', 'A']]],
    ['LAINNYA', [['bantuan', 'Bantuan', 'help', ''], ['cek', 'Cek Keaslian Surat', 'qr', '']]]
  ];
  const boleh = k => !k || k.indexOf(S.user.role[0]) > -1;
  const JUDUL = {};
  MENU.forEach(g => g[1].forEach(m => { JUDUL[m[0]] = m; }));
  function ruteSah() {
    const r = (location.hash.replace(/^#\/?/, '').split('?')[0]) || 'dashboard';
    return JUDUL[r] && boleh(JUDUL[r][3]) ? r : 'dashboard';
  }
  const pergi = r => { if (ruteSah() === r) render(true); else location.hash = '#/' + r; };
  addEventListener('hashchange', () => { if (S.token) { $('#lapis').innerHTML = ''; render(true); scrollTo(0, 0); } });

  function antre() {
    if (adalah('ADMIN')) return D().surat.filter(s => s.status === 'DIAJUKAN' || s.status === 'DIPROSES').length;
    if (adalah('PIMPINAN')) return D().surat.filter(s => s.status === 'MENUNGGU_VERIFIKASI' && s.pejabat_email === S.user.email).length;
    return 0;
  }

  function render(paksa) {
    if (S.publik) return;
    if (!S.token || !S.user) return renderMasuk();
    // Jangan menimpa formulir yang sedang diisi saat data latar belakang masuk
    const fokus = document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
    if (!paksa && (fokus || $('#lapis').children.length)) { S.tertunda = true; return; }
    S.tertunda = false;
    const app = $('#app');
    if (!S.D) { app.innerHTML = '<div class="kanvas"><div class="rangka"><div class="tulang besar"></div></div></div>'; return; }
    const r = S.rute = ruteSah(), n = antre();
    const nav = MENU.map(g => {
      const item = g[1].filter(m => boleh(m[3]));
      return item.length ? `<p class="grup">${g[0]}</p>` + item.map(m =>
        `<a class="mn ${m[0] === r ? 'on' : ''}" href="#/${m[0]}">${ic(m[2])}<span>${m[1]}</span>${(m[0] === 'kelola' || m[0] === 'verifikasi') && n ? `<b class="cacah">${n}</b>` : ''}</a>`).join('') : '';
    }).join('');
    app.innerHTML = `<div class="kanvas"><div class="rangka">
      <aside class="sisi" id="sisi">
        <a class="merek" href="#/dashboard"><span class="logo">${ic('mail')}</span><span><b>Sistem Persuratan</b><small>${esc(D().organisasi)}</small></span></a>
        <nav>${nav}</nav>
        <div class="gelap"><b>${ic('qr')} Cek Keaslian Surat</b><p>Pindai QR atau masukkan kode verifikasi surat.</p><a class="tb utama penuh kecil" href="#/cek">Buka Pengecekan</a></div>
      </aside>
      <div class="tirai" data-act="menu"></div>
      <main class="utama">
        <header class="atas">
          <button class="bulat hp" data-act="menu" aria-label="Buka menu">${ic('menu')}</button>
          <div class="judul"><h1>${JUDUL[r][1]}</h1><p>${hariIni()}${DEMO ? ' · <b class="demo">MODE DEMO</b>' : ''}</p></div>
          <a class="bulat" href="#/${adalah('PIMPINAN') ? 'verifikasi' : adalah('ADMIN') ? 'kelola' : 'riwayat'}" aria-label="Surat menunggu" title="Surat menunggu">${ic('bell')}${n ? '<i class="titik"></i>' : ''}</a>
          <div class="akun">${S.user.foto ? `<img src="${esc(S.user.foto)}" alt="" referrerpolicy="no-referrer">` : `<span class="ava">${inisial(S.user.nama || S.user.email)}</span>`}
            <span><b>${esc(S.user.nama || S.user.email)}</b><small>${PERAN[S.user.role]}</small></span></div>
          <button class="bulat" data-act="keluar" aria-label="Keluar" title="Keluar">${ic('logout')}</button>
        </header>
        <section id="hal">${HAL[r]()}</section>
      </main></div></div>`;
    if (PASCA[r]) PASCA[r]();
  }

  // ---------- Komponen bersama ----------
  function barisSurat(list, o) {
    o = o || {};
    const maks = F('maks', { n: 100 }).n;
    if (!list.length) return kosong(o.kosong || 'Belum ada surat', o.teks || 'Surat yang sesuai akan tampil di sini.', o.cta);
    return `<div class="tblw"><table class="tbl"><thead><tr><th>Nomor / Registrasi</th><th>Jenis</th><th>Perihal</th>${o.pemohon ? '<th>Pemohon</th>' : ''}<th>Tanggal</th><th>Status</th><th class="r">Aksi</th></tr></thead><tbody>` +
      list.slice(0, maks).map(s => {
        const batal = s.status === 'DITOLAK' || s.status === 'DIBATALKAN';
        return `<tr data-act="bukaSurat" data-id="${esc(s.id)}" tabindex="0">
        <td data-l="Nomor"><b class="mono ${batal ? 'coret' : ''}">${s.nomor ? esc(s.nomor) : '<i class="redup">Belum bernomor</i>'}</b><small class="mono">${esc(s.id)}</small></td>
        <td data-l="Jenis"><span class="chip">${esc(s.jenis)}</span></td>
        <td data-l="Perihal"><span class="potong">${esc(s.perihal)}</span>${batal && s.catatan ? `<small class="merah">${esc(s.catatan)}</small>` : ''}</td>
        ${o.pemohon ? `<td data-l="Pemohon">${esc(s.nama_pemohon || s.email)}<small>${esc(s.asal || s.email)}</small></td>` : ''}
        <td data-l="Tanggal">${tgl(s.tanggal)}</td>
        <td data-l="Status">${s._sibuk ? lencana(s.status, 'Menyimpan…') : lencana(s.status)}</td>
        <td class="r" data-l="Aksi">${s.status === 'TERBIT'
          ? `<button class="bulat isi" data-act="unduh" data-id="${esc(s.id)}" title="Unduh PDF" aria-label="Unduh PDF">${ic('download')}</button>`
          : `<button class="bulat" disabled title="Tersedia setelah surat terbit" aria-label="PDF belum tersedia">${ic('download')}</button>`}
          <button class="bulat" data-act="bukaSurat" data-id="${esc(s.id)}" title="Lihat detail" aria-label="Lihat detail">${ic('eye')}</button></td></tr>`;
      }).join('') + '</tbody></table></div>' +
      (list.length > maks ? `<p class="tengah"><button class="tb" data-act="lebih">Tampilkan ${Math.min(100, list.length - maks)} berikutnya</button></p>` : `<p class="catkaki">Menampilkan ${list.length} surat</p>`);
  }
  function saring(list, f) {
    const q = (f.q || '').toLowerCase();
    return list.filter(s => (!f.status || s.status === f.status) && (!f.jenis || s.kode === f.jenis) && (!f.tahun || String(s.tanggal).slice(0, 4) === String(f.tahun)) &&
      (!q || [s.nomor, s.id, s.perihal, s.jenis, s.nama_pemohon, s.email, s.asal].join(' ').toLowerCase().indexOf(q) > -1));
  }
  function alatSaring(kunci, o) {
    const f = F(kunci);
    const jenis = [...new Set(D().surat.map(s => s.kode + '|' + s.jenis))];
    return `<div class="alat"><label class="cari">${ic('search')}<input type="search" placeholder="Cari nomor, perihal, atau pemohon…" value="${esc(f.q || '')}" data-saring="${kunci}.q" aria-label="Cari surat"></label>
      <select data-saring="${kunci}.jenis" aria-label="Jenis surat"><option value="">Semua jenis</option>${jenis.map(j => { const p = j.split('|'); return `<option value="${esc(p[0])}" ${f.jenis === p[0] ? 'selected' : ''}>${esc(p[1])}</option>`; }).join('')}</select>
      ${o && o.tanpaStatus ? '' : `<select data-saring="${kunci}.status" aria-label="Status"><option value="">Semua status</option>${Object.keys(ST).map(k => `<option value="${k}" ${f.status === k ? 'selected' : ''}>${ST[k][0]}</option>`).join('')}</select>`}
      ${(o && o.kanan) || ''}</div>`;
  }
  // Pratinjau isian dalam bentuk lembar surat (tata letak asli mengikuti template Google Docs)
  function kertas(tpl, isian, s) {
    s = s || {};
    const pj = (D().pejabat || []).find(p => p.email === (s.pejabat_email || tpl.pejabat)) || {};
    return `<div class="kertas"><div class="kop"><b>${esc(D().organisasi)}</b><small>Kop dan tata letak mengikuti template Google Docs</small></div>
      <h3>${esc(tpl.nama_jenis)}</h3><p class="nmr">Nomor: ${s.nomor ? esc(s.nomor) : '<i>ditetapkan otomatis saat diproses admin</i>'}</p>
      <dl>${tpl.isian.map(f => `<div><dt>${esc(f.label)}</dt><dd class="${isian[f.k] ? '' : 'hampa'}">${isian[f.k] ? esc(f.tipe === 'tanggal' ? tgl(isian[f.k], true) : isian[f.k]) : 'belum diisi'}</dd></div>`).join('')}</dl>
      <div class="ttd"><span>${s.tanggal_surat ? tgl(s.tanggal_surat, true) : 'Tanggal surat'}</span><span>${esc(pj.jabatan || 'Pejabat penandatangan')}</span>
        <em>${s.status === 'TERBIT' ? 'Tanda tangan, stempel, dan QR sudah dibubuhkan pada PDF' : 'Tanda tangan, stempel, dan QR dibubuhkan otomatis setelah disetujui pimpinan'}</em><b>${esc(pj.nama || '—')}</b></div></div>`;
  }
  function kolomIsian(tpl, isian, awalan) {
    return tpl.isian.map(f => {
      const v = isian[f.k] || '', a = `name="${esc(f.k)}" id="${awalan}${esc(f.k)}" ${f.wajib ? 'required' : ''}`;
      const ctl = f.tipe === 'paragraf' ? `<textarea ${a} rows="4" maxlength="5000">${esc(v)}</textarea>`
        : f.tipe === 'tanggal' ? `<input type="date" ${a} value="${esc(v)}">`
          : f.tipe === 'pilihan' ? `<select ${a}><option value="">Pilih…</option>${(f.opsi || []).map(o => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`
            : `<input type="text" ${a} value="${esc(v)}" maxlength="500" autocomplete="off">`;
      return `<div class="kol ${f.tipe === 'paragraf' ? 'lebar' : ''}"><label for="${awalan}${esc(f.k)}">${esc(f.label)}${f.wajib ? ' <i class="wajib">*</i>' : ''}</label>${ctl}</div>`;
    }).join('');
  }
  const dataForm = form => { const o = {}; new FormData(form).forEach((v, k) => { o[k] = typeof v === 'string' ? v.trim() : v; }); return o; };

  // ---------- Grafik (SVG buatan sendiri, tanpa pustaka) ----------
  function grafikBulan(list, tahun) {
    const a = Array(12).fill(0), b = Array(12).fill(0);
    list.forEach(s => {
      const d = keTgl(s.tanggal);
      if (d.getFullYear() !== tahun) return;
      a[d.getMonth()]++; if (s.status === 'TERBIT') b[d.getMonth()]++;
    });
    const maks = Math.max(4, ...a), H = 170, langkah = Math.ceil(maks / 4), atas = langkah * 4;
    const y = v => 12 + H - (v / atas) * H;
    let g = '';
    for (let i = 0; i <= 4; i++) g += `<line x1="34" x2="716" y1="${y(i * langkah)}" y2="${y(i * langkah)}" class="grid"/><text x="26" y="${y(i * langkah) + 4}" text-anchor="end" class="sumbu">${i * langkah}</text>`;
    a.forEach((v, i) => {
      const x = 48 + i * 56;
      g += `<g class="bt"><title>${BLNP[i]} ${tahun}: ${v} diajukan, ${b[i]} terbit</title>
        <rect x="${x}" y="${y(v)}" width="14" height="${Math.max(0, 12 + H - y(v))}" rx="7" class="b1"/>
        <rect x="${x + 18}" y="${y(b[i])}" width="14" height="${Math.max(0, 12 + H - y(b[i]))}" rx="7" class="b2"/>
        <text x="${x + 16}" y="206" text-anchor="middle" class="sumbu">${BLN[i]}</text></g>`;
    });
    return `<svg viewBox="0 0 720 214" class="grafik" role="img" aria-label="Jumlah surat diajukan dan terbit per bulan tahun ${tahun}">${g}</svg>
      <p class="legenda"><span><i class="k1"></i>Surat diajukan</span><span><i class="k2"></i>Surat terbit</span></p>`;
  }
  function donutJenis(list) {
    const hit = {};
    list.forEach(s => { hit[s.jenis] = (hit[s.jenis] || 0) + 1; });
    const top = Object.keys(hit).map(k => [k, hit[k]]).sort((x, y) => y[1] - x[1]);
    const total = list.length || 1, warna = ['d1', 'd2', 'd3'];
    const cincin = top.slice(0, 3).map((t, i) => {
      const r = 72 - i * 17, c = 2 * Math.PI * r;
      return `<circle cx="90" cy="90" r="${r}" class="jalur"/><circle cx="90" cy="90" r="${r}" class="${warna[i]}" stroke-dasharray="${(t[1] / total) * c} ${c}" transform="rotate(-90 90 90)"/>`;
    }).join('');
    return `<div class="donut"><svg viewBox="0 0 180 180" role="img" aria-label="Sebaran surat per jenis">${cincin || '<circle cx="90" cy="90" r="72" class="jalur"/>'}
        <text x="90" y="86" text-anchor="middle" class="dt">${list.length}</text><text x="90" y="104" text-anchor="middle" class="sumbu">total surat</text></svg></div>
      <ul class="daftar">${top.slice(0, 5).map((t, i) => `<li><i class="${warna[i] || 'd4'}"></i><span>${esc(t[0])}</span><b>${t[1]}</b><em>${Math.round(t[1] / total * 100)}%</em></li>`).join('') || '<li class="redup">Belum ada data</li>'}</ul>`;
  }

  // ---------- Halaman ----------
  const HAL = {}, PASCA = {};

  HAL.dashboard = function () {
    const all = D().surat, now = new Date(), y = now.getFullYear(), m = now.getMonth();
    const diBulan = (yy, mm) => all.filter(s => { const d = keTgl(s.tanggal); return d.getFullYear() === yy && d.getMonth() === mm; }).length;
    const ini = diBulan(y, m), kemarin = m ? diBulan(y, m - 1) : diBulan(y - 1, 11);
    const delta = kemarin ? Math.round((ini - kemarin) / kemarin * 100) : null;
    const n = st => all.filter(s => st.indexOf(s.status) > -1).length;
    const kartu = adalah('USER')
      ? [['Pengajuan Saya', all.length, 'mail', 'seluruh pengajuan'], ['Sedang Diproses', n(['DIAJUKAN', 'DIPROSES', 'MENUNGGU_VERIFIKASI']), 'clock', 'admin dan pimpinan'], ['Terbit', n(['TERBIT']), 'shield', 'siap diunduh'], ['Ditolak', n(['DITOLAK', 'DIBATALKAN']), 'alert', 'lihat catatan']]
      : [['Total Surat', all.length, 'file', 'seluruh arsip'], ['Menunggu Diproses', n(['DIAJUKAN', 'DIPROSES']), 'clock', 'perlu penomoran admin'], ['Menunggu Verifikasi', n(['MENUNGGU_VERIFIKASI']), 'edit', 'antrean pimpinan'], ['Surat Terbit', n(['TERBIT']), 'shield', 'siap unduh dan ber-QR']];
    // Warna kartu ringkasan mengikuti makna: kuning = menunggu, langit = verifikasi, hijau = terbit, merah = ditolak
    const tinta = adalah('USER') ? ['', 'kuning', 'hijau', 'merah'] : ['', 'kuning', 'langit', 'hijau'];
    let kanan;
    if (adalah('PIMPINAN')) {
      const q = all.filter(s => s.status === 'MENUNGGU_VERIFIKASI' && s.pejabat_email === S.user.email);
      kanan = `<div class="kartu"><div class="kj"><div><h2>Antrean Verifikasi <b class="cacah">${q.length}</b></h2><p>Surat yang menunggu persetujuan Anda</p></div></div>
        ${q.slice(0, 4).map(s => `<a class="antre" href="#/verifikasi" data-act="pilihVer" data-id="${esc(s.id)}"><small class="mono">${esc(s.nomor)}</small><b>${esc(s.perihal)}</b><span>${esc(s.nama_pemohon || s.email)} · ${lalu(s.tanggal)}</span></a>`).join('') || '<p class="redup">Tidak ada surat menunggu.</p>'}</div>`;
    } else if (adalah('ADMIN')) {
      const asal = {};
      all.forEach(s => { const k = s.asal || 'Tanpa keterangan'; asal[k] = (asal[k] || 0) + 1; });
      const top = Object.keys(asal).map(k => [k, asal[k]]).sort((a, b) => b[1] - a[1]).slice(0, 5), mx = top.length ? top[0][1] : 1;
      kanan = `<div class="kartu"><div class="kj"><div><h2>Asal Pemohon</h2><p>Unit atau instansi terbanyak</p></div></div>
        <ul class="bilah">${top.map(t => `<li><span>${esc(t[0])}</span><b>${t[1]}</b><i><u style="width:${Math.round(t[1] / mx * 100)}%"></u></i></li>`).join('') || '<li class="redup">Belum ada data</li>'}</ul></div>`;
    } else {
      kanan = `<div class="kartu"><div class="kj"><div><h2>Pengajuan Terbaru</h2><p>Status surat Anda</p></div></div>
        ${all.slice(0, 5).map(s => `<a class="antre" href="#" data-act="bukaSurat" data-id="${esc(s.id)}"><b>${esc(s.perihal)}</b><span>${esc(s.jenis)} · ${lalu(s.tanggal)}</span>${lencana(s.status)}</a>`).join('') || '<p class="redup">Belum ada pengajuan.</p>'}</div>`;
    }
    return `<div class="dash"><div class="kiri">
        <div class="stat4">${kartu.map((k, i) => `<div class="kartu stat ${i ? 'tinta ' + tinta[i] : 'sorot'}"><span class="ubin">${ic(k[2])}</span>${!i && delta !== null ? `<em class="delta ${delta < 0 ? 'turun' : ''}">${delta > 0 ? '+' : ''}${delta}%</em>` : ''}
          <p>${k[0]}</p><b>${k[1]}</b><small>${!i && delta !== null ? 'pengajuan bulan ini vs bulan lalu' : k[3]}</small></div>`).join('')}</div>
        <div class="kartu"><div class="kj"><div><h2>Statistik Surat per Bulan</h2><p>Pengajuan masuk dibanding surat terbit, tahun ${y}</p></div>
          <a class="tb utama" href="#/ajukan">${ic('plus')}Ajukan Surat</a></div>${all.length ? grafikBulan(all, y) : kosong('Belum ada data surat', 'Grafik akan terisi setelah ada pengajuan.', '<a class="tb utama" href="#/ajukan">Ajukan Surat</a>')}</div>
      </div><div class="kanan"><div class="kartu"><div class="kj"><div><h2>Surat per Jenis</h2><p>Sebaran jenis surat</p></div></div>${donutJenis(all)}</div>${kanan}</div></div>`;
  };

  HAL.ajukan = function () {
    const f = F('ajukan', { kode: '', isian: {} });
    const pilihan = D().templates.filter(t => t.aktif && (t.pemohon_boleh || adalah('ADMIN')));
    const tpl = pilihan.find(t => t.kode === f.kode);
    if (!tpl) {
      return `<div class="kartu"><div class="kj"><div><h2>Pilih jenis surat</h2><p>Formulir akan menyesuaikan jenis surat yang dipilih.</p></div></div>
        ${pilihan.length ? `<div class="pilih">${pilihan.map(t => `<button class="jenis" data-act="pilihJenis" data-kode="${esc(t.kode)}"><span class="ubin">${ic('file')}</span><b>${esc(t.nama_jenis)} <i class="chip">${esc(t.kode)}</i></b><small>${esc(t.deskripsi || 'Surat resmi organisasi')}</small>${t.pemohon_boleh ? '' : '<em class="lc s-pro"><i></i>Khusus admin</em>'}</button>`).join('')}</div>`
          : kosong('Belum ada template surat', adalah('ADMIN') ? 'Tambahkan template di menu Template.' : 'Hubungi admin untuk mengaktifkan template surat.')}</div>`;
    }
    return `<div class="dua"><form class="kartu" data-submit="kirimAjukan" data-masuk="ajukan">
        <div class="pita"><span class="ubin">${ic('file')}</span><div><b>${esc(tpl.nama_jenis)} <i class="chip terang">${esc(tpl.kode)}</i></b><small>${esc(tpl.deskripsi)}</small></div>
          <button type="button" class="tb kaca" data-act="pilihJenis" data-kode="">Ganti jenis</button></div>
        <div class="grid2">${kolomIsian(tpl, f.isian, 'aj-')}</div>
        ${adalah('ADMIN') ? `<label class="centang"><input type="checkbox" name="_langsung" ${f.langsung ? 'checked' : ''}> Buat langsung: beri nomor dan teruskan ke pimpinan sekarang</label>` : ''}
        <div class="aksi"><a class="tb" href="#/riwayat">Batal</a><button class="tb utama" type="submit">${ic('send')}Ajukan Surat</button></div>
      </form>
      <div class="lengket"><p class="label">${ic('eye')} Pratinjau isian</p><div id="pratinjau">${kertas(tpl, f.isian)}</div>
        <p class="info">${ic('help')}Nomor, tanda tangan, stempel, dan QR ditambahkan otomatis setelah surat diproses dan disetujui.</p></div></div>`;
  };

  const sumberRiwayat = () => D().surat.filter(s => s.email === S.user.email);
  const tabelRiwayat = () => barisSurat(saring(sumberRiwayat(), F('riwayat')), { kosong: 'Belum ada pengajuan', teks: 'Ajukan surat pertama Anda, lalu pantau statusnya di sini.', cta: '<a class="tb utama" href="#/ajukan">Ajukan Surat</a>' });
  HAL.riwayat = () => `<div class="kartu">${alatSaring('riwayat', { kanan: `<button class="tb" data-act="rekap" data-sumber="riwayat">${ic('download')}Unduh Rekap</button><a class="tb utama" href="#/ajukan">${ic('plus')}Ajukan Surat</a>` })}<div id="tbl">${tabelRiwayat()}</div></div>`;

  const tabelKelola = () => barisSurat(saring(D().surat, F('kelola')), { pemohon: true, kosong: 'Tidak ada surat pada tampilan ini' });
  HAL.kelola = function () {
    const f = F('kelola'), all = D().surat;
    const tab = [['', 'Semua'], ['DIAJUKAN', 'Diajukan'], ['DIPROSES', 'Diproses'], ['MENUNGGU_VERIFIKASI', 'Menunggu Verifikasi'], ['TERBIT', 'Terbit'], ['DITOLAK', 'Ditolak'], ['DIBATALKAN', 'Dibatalkan']];
    return `<div class="kartu"><div class="tab">${tab.map(t => `<button class="${(f.status || '') === t[0] ? 'on' : ''}" data-act="tabKelola" data-st="${t[0]}">${t[1]} <b>${t[0] ? all.filter(s => s.status === t[0]).length : all.length}</b></button>`).join('')}</div>
      ${alatSaring('kelola', { tanpaStatus: true, kanan: `<button class="tb" data-act="rekap" data-sumber="kelola">${ic('download')}Unduh Rekap</button><button class="tb utama" data-act="buatLangsung">${ic('plus')}Buat Surat Langsung</button>` })}<div id="tbl">${tabelKelola()}</div></div>`;
  };

  HAL.verifikasi = function () {
    const q = D().surat.filter(s => s.status === 'MENUNGGU_VERIFIKASI' && s.pejabat_email === S.user.email);
    const f = F('ver');
    const s = q.find(x => x.id === f.id) || q[0];
    if (!s) return `<div class="kartu">${kosong('Tidak ada surat menunggu verifikasi', 'Surat yang dikirim admin kepada Anda akan muncul di sini.')}</div>`;
    const tpl = tplDari(s.kode) || { nama_jenis: s.jenis, isian: Object.keys(s.isian).map(k => ({ k, label: k })) };
    return `<div class="ver"><div class="antrean"><div class="kartu"><h2>Antrean Surat <b class="cacah">${q.length}</b></h2></div>
        ${q.map(x => `<button class="kartu item ${x.id === s.id ? 'on' : ''}" data-act="pilihVer" data-id="${esc(x.id)}"><span class="chip">${esc(x.jenis)}</span><small class="mono">${esc(x.nomor)}</small><b>${esc(x.perihal)}</b><span>${esc(x.nama_pemohon || x.email)} · ${lalu(x.tanggal)}</span></button>`).join('')}</div>
      <div><div class="kartu bungkus">${kertas(tpl, s.isian, s)}</div>
        <div class="kartu batang"><button class="tb" data-act="pratinjauPdf" data-id="${esc(s.id)}">${ic('eye')}Lihat PDF dari template</button><span class="isi-rata"></span>
          <button class="tb bahaya" data-act="tolak" data-id="${esc(s.id)}">${ic('x')}Tolak</button>
          <button class="tb utama" data-act="setujui" data-id="${esc(s.id)}" ${s._sibuk ? 'disabled' : ''}>${ic('shield')}${s._sibuk ? 'Menerbitkan…' : 'Setujui dan Bubuhkan TTD'}</button></div></div></div>`;
  };

  HAL.template = function () {
    const e = S.f.tpl, list = D().templates;
    const kiri = `<div class="tumpuk">${list.map(t => `<button class="kartu item ${e && e.kode === t.kode && !e.baru ? 'on' : ''}" data-act="suntingTpl" data-kode="${esc(t.kode)}"><span class="kode">${esc(t.kode)}</span><b>${esc(t.nama_jenis)}</b>
        <small class="mono">${esc(t.format_nomor)}</small><span>${t.aktif ? lencana('TERBIT', 'Aktif') : lencana('DIAJUKAN', 'Nonaktif')} ${t.pemohon_boleh ? '' : lencana('DIPROSES', 'Khusus admin')}</span></button>`).join('')}
      <button class="tb utama penuh" data-act="tplBaru">${ic('plus')}Tambah Template</button></div>`;
    if (!e) return `<div class="tplw">${kiri}<div class="kartu">${kosong('Pilih template untuk disunting', 'Atau tambahkan template baru dari dokumen Google Docs yang berisi penanda {{...}}.')}</div></div>`;
    const token = ['{no:000}', '{no}', '{kode}', '{bulan_romawi}', '{bulan}', '{tahun}'];
    return `<div class="tplw">${kiri}<form class="kartu" data-submit="simpanTpl" data-masuk="tpl">
      <div class="kj"><div><h2>${e.baru ? 'Template baru' : 'Sunting ' + esc(e.nama_jenis)}</h2><p>Dokumen master, isian, format nomor, dan penandatangan</p></div></div>
      <h3 class="bagian">1 · Informasi dasar</h3>
      <div class="grid2"><div class="kol"><label for="t-kode">Kode surat</label><input id="t-kode" name="kode" value="${esc(e.kode)}" maxlength="6" required ${e.baru ? '' : 'readonly'} placeholder="ST"></div>
        <div class="kol"><label for="t-nama">Nama jenis surat</label><input id="t-nama" name="nama_jenis" value="${esc(e.nama_jenis)}" required maxlength="80" placeholder="Surat Tugas"></div>
        <div class="kol lebar"><label for="t-des">Deskripsi singkat</label><input id="t-des" name="deskripsi" value="${esc(e.deskripsi)}" maxlength="200"></div></div>
      <h3 class="bagian">2 · Dokumen Google Docs</h3>
      <div class="baris"><input name="id_template" value="${esc(e.id_template)}" placeholder="Tempel tautan atau ID dokumen Google Docs" required aria-label="Tautan dokumen template">
        <button type="button" class="tb" data-act="pindaiTpl">${ic('search')}Pindai Penanda</button></div>
      <p class="petunjuk">Penanda sistem yang diisi otomatis: <code>{{nomor_surat}}</code> <code>{{tanggal_surat}}</code> <code>{{nama_pejabat}}</code> <code>{{jabatan_pejabat}}</code> <code>{{nip_pejabat}}</code> <code>{{ttd}}</code> <code>{{cap}}</code> <code>{{qr}}</code></p>
      <div class="isian">${e.isian.map((f, i) => `<div class="brs"><code>{{${esc(f.k)}}}</code><input value="${esc(f.label)}" data-tf="${i}.label" aria-label="Label ${esc(f.k)}">
          <select data-tf="${i}.tipe" aria-label="Tipe ${esc(f.k)}">${['teks', 'paragraf', 'tanggal', 'pilihan'].map(t => `<option ${f.tipe === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
          ${f.tipe === 'pilihan' ? `<input value="${esc((f.opsi || []).join(', '))}" data-tf="${i}.opsi" placeholder="Pilihan, pisahkan dengan koma" aria-label="Pilihan ${esc(f.k)}">` : ''}
          <label class="centang"><input type="checkbox" data-tf="${i}.wajib" ${f.wajib ? 'checked' : ''}> Wajib</label>
          <button type="button" class="bulat" data-act="hapusIsian" data-i="${i}" aria-label="Hapus isian">${ic('trash')}</button></div>`).join('') || '<p class="redup">Belum ada isian. Tekan "Pindai Penanda" untuk membaca penanda dari dokumen.</p>'}</div>
      <h3 class="bagian">3 · Format nomor surat</h3>
      <p class="token">${token.map(t => `<button type="button" class="chip" data-act="token" data-t="${t}">${t}</button>`).join('')}</p>
      <div class="grid2"><div class="kol"><label for="t-pola">Pola nomor</label><input id="t-pola" class="mono" name="format_nomor" value="${esc(e.format_nomor)}" required></div>
        <div class="kol"><label for="t-reset">Nomor urut kembali ke 1</label><select id="t-reset" name="reset_nomor">${[['TAHUNAN', 'Setiap tahun'], ['BULANAN', 'Setiap bulan'], ['TIDAK', 'Tidak pernah']].map(o => `<option value="${o[0]}" ${e.reset_nomor === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></div></div>
      <div class="contoh"><small>Contoh nomor berikutnya</small><b class="mono" id="contohNomor">${esc(nomorBerikut(e))}</b></div>
      <h3 class="bagian">4 · Penandatangan dan akses</h3>
      <div class="grid2"><div class="kol"><label for="t-pj">Pejabat penandatangan</label><select id="t-pj" name="pejabat"><option value="">Belum dipilih</option>${(D().pejabat || []).map(p => `<option value="${esc(p.email)}" ${e.pejabat === p.email ? 'selected' : ''}>${esc(p.nama)} — ${esc(p.jabatan)}</option>`).join('')}</select></div>
        <div class="kol"><label class="centang"><input type="checkbox" name="pemohon_boleh" ${e.pemohon_boleh ? 'checked' : ''}> Pemohon boleh mengajukan</label>
          <label class="centang"><input type="checkbox" name="aktif" ${e.aktif !== false ? 'checked' : ''}> Template aktif</label></div></div>
      <div class="aksi"><button type="button" class="tb" data-act="batalTpl">Batal</button><button class="tb utama" type="submit">${ic('check')}Simpan Template</button></div></form></div>`;
  };

  HAL.nomor = function () {
    const batal = D().surat.filter(s => s.nomor && (s.status === 'DITOLAK' || s.status === 'DIBATALKAN'));
    const nm = D().nomor || [];
    return `<div class="info besar">${ic('help')}Nomor yang sudah dikeluarkan tidak dipakai ulang. Nomor surat yang ditolak atau dibatalkan ditandai BATAL.</div>
      <div class="dua rata"><div class="kartu"><div class="kj"><div><h2>Penghitung Nomor</h2><p>Nomor terakhir per jenis dan periode</p></div></div>
        ${nm.length ? `<div class="tblw"><table class="tbl polos"><thead><tr><th>Jenis</th><th>Periode</th><th>Nomor terakhir</th><th>Pola</th></tr></thead><tbody>${nm.map(r => { const t = tplDari(r.jenis); return `<tr><td data-l="Jenis"><span class="chip">${esc(r.jenis)}</span></td><td data-l="Periode">${esc(String(r.periode).replace(/^(THN|BLN)-/, ''))}</td><td data-l="Terakhir"><b class="mono besar">${esc(r.terakhir)}</b></td><td data-l="Pola" class="mono">${esc(t ? t.format_nomor : '')}</td></tr>`; }).join('')}</tbody></table></div>` : kosong('Belum ada nomor terbit', 'Penghitung muncul setelah admin memberi nomor pertama.')}</div>
      <div class="kartu"><div class="kj"><div><h2>Nomor Dibatalkan</h2><p>Tidak akan digunakan kembali</p></div></div>
        ${batal.map(s => `<div class="antre"><b class="mono coret">${esc(s.nomor)}</b><span>${esc(s.catatan)}</span><small>${tgl(s.tanggal)}</small></div>`).join('') || '<p class="redup">Tidak ada nomor yang dibatalkan.</p>'}</div></div>`;
  };

  const sumberPengguna = () => {
    const f = F('pengguna', { tab: 'semua' }), q = (f.q || '').toLowerCase();
    return (D().pengguna || []).filter(p => (f.tab !== 'menunggu' || p.status === 'MENUNGGU') && (!q || [p.email, p.nama, p.asal].join(' ').toLowerCase().indexOf(q) > -1));
  };
  function tabelPengguna() {
    const f = F('pengguna', { tab: 'semua' });
    if (f.tab === 'pejabat') {
      const pj = D().pejabat || [];
      return (pj.length ? `<div class="tblw"><table class="tbl polos"><thead><tr><th>Pejabat</th><th>Jabatan</th><th>Jenis surat</th><th>Tanda tangan</th><th>Stempel</th><th class="r">Aksi</th></tr></thead><tbody>${pj.map(p => `<tr>
        <td data-l="Pejabat"><b>${esc(p.nama)}</b><small>${esc(p.email)}</small></td><td data-l="Jabatan">${esc(p.jabatan)}<small>${p.nip ? 'NIP ' + esc(p.nip) : ''}</small></td>
        <td data-l="Jenis surat">${esc(p.jenis_surat || 'Semua jenis')}</td><td data-l="Tanda tangan">${p.ada_ttd ? lencana('TERBIT', 'Terunggah') : lencana('DITOLAK', 'Belum ada')}</td><td data-l="Stempel">${p.ada_cap ? lencana('TERBIT', 'Terunggah') : lencana('DIAJUKAN', 'Belum ada')}</td>
        <td class="r" data-l="Aksi"><button class="tb kecil" data-act="formPejabat" data-email="${esc(p.email)}">${ic('edit')}Sunting</button></td></tr>`).join('')}</tbody></table></div>`
        : kosong('Belum ada pejabat penandatangan', 'Tambahkan pejabat beserta gambar tanda tangan dan stempelnya.'));
    }
    const list = sumberPengguna();
    if (!list.length) return kosong('Tidak ada pengguna pada tampilan ini', '');
    return `<div class="tblw"><table class="tbl polos"><thead><tr><th>Pengguna</th><th>Asal</th><th>Peran</th><th>Status</th><th>Terdaftar</th><th class="r">Aksi</th></tr></thead><tbody>${list.map(p => {
      const kunci = p.role === 'ADMIN' || p.email === S.user.email;
      const st = p.status === 'AKTIF' ? lencana('TERBIT', 'Aktif') : p.status === 'MENUNGGU' ? lencana('DIPROSES', 'Menunggu') : lencana('DITOLAK', 'Diblokir');
      return `<tr class="${p.status === 'MENUNGGU' ? 'sorotan' : ''}"><td data-l="Pengguna"><span class="org"><span class="ava kecil">${inisial(p.nama || p.email)}</span><span><b>${esc(p.nama || '(belum ada nama)')}</b><small>${esc(p.email)}</small></span></span></td>
        <td data-l="Asal">${esc(p.asal || '—')}</td>
        <td data-l="Peran">${kunci ? `<span class="chip" title="${p.role === 'ADMIN' ? 'Diatur lewat ADMIN_EMAILS' : 'Tidak dapat mengubah akun sendiri'}">${PERAN[p.role]}</span>` : `<select data-ubah="peran" data-email="${esc(p.email)}" aria-label="Peran ${esc(p.email)}"><option value="USER" ${p.role === 'USER' ? 'selected' : ''}>Pemohon</option><option value="PIMPINAN" ${p.role === 'PIMPINAN' ? 'selected' : ''}>Pimpinan</option></select>`}</td>
        <td data-l="Status">${st}</td><td data-l="Terdaftar">${tgl(p.tanggal)}</td>
        <td class="r" data-l="Aksi">${kunci ? '' : p.status === 'MENUNGGU' ? `<button class="tb utama kecil" data-act="statusPengguna" data-email="${esc(p.email)}" data-st="AKTIF">${ic('check')}Setujui</button> <button class="tb bahaya kecil" data-act="statusPengguna" data-email="${esc(p.email)}" data-st="BLOKIR">Tolak</button>`
          : p.status === 'AKTIF' ? `<button class="tb bahaya kecil" data-act="statusPengguna" data-email="${esc(p.email)}" data-st="BLOKIR">${ic('ban')}Blokir</button>` : `<button class="tb kecil" data-act="statusPengguna" data-email="${esc(p.email)}" data-st="AKTIF">Buka akses</button>`}</td></tr>`;
    }).join('')}</tbody></table></div>`;
  }
  HAL.pengguna = function () {
    const f = F('pengguna', { tab: 'semua' }), u = D().pengguna || [], n = st => u.filter(p => p.status === st).length;
    return `<div class="stat3"><div class="kartu mini tinta hijau"><span class="ubin hijau">${ic('check')}</span><div><b>${n('AKTIF')}</b><small>Akun aktif</small></div></div>
        <div class="kartu mini tinta kuning"><span class="ubin kuning">${ic('clock')}</span><div><b>${n('MENUNGGU')}</b><small>Menunggu persetujuan</small></div></div>
        <div class="kartu mini tinta merah"><span class="ubin merahm">${ic('ban')}</span><div><b>${n('BLOKIR')}</b><small>Diblokir</small></div></div></div>
      <div class="kartu"><div class="tab">${[['semua', 'Semua Pengguna', u.length], ['menunggu', 'Menunggu Persetujuan', n('MENUNGGU')], ['pejabat', 'Pejabat Penandatangan', (D().pejabat || []).length]].map(t => `<button class="${f.tab === t[0] ? 'on' : ''}" data-act="tabPengguna" data-tab="${t[0]}">${t[1]} <b>${t[2]}</b></button>`).join('')}</div>
        <div class="alat">${f.tab === 'pejabat' ? '<span class="isi-rata"></span>' : `<label class="cari">${ic('search')}<input type="search" placeholder="Cari nama, email, atau asal…" value="${esc(f.q || '')}" data-saring="pengguna.q" aria-label="Cari pengguna"></label>`}
          ${f.tab === 'pejabat' ? `<button class="tb utama" data-act="formPejabat" data-email="">${ic('plus')}Tambah Pejabat</button>` : `<button class="tb utama" data-act="formPengguna">${ic('plus')}Tambah Pengguna</button>`}</div>
        <div id="tbl">${tabelPengguna()}</div></div>`;
  };

  const sumberLaporan = () => saring(D().surat, F('laporan', { tahun: new Date().getFullYear() }));
  const tabelLaporan = () => barisSurat(sumberLaporan(), { pemohon: true });
  HAL.laporan = function () {
    const f = F('laporan', { tahun: new Date().getFullYear() }), list = sumberLaporan();
    const tahun = [...new Set(D().surat.map(s => String(s.tanggal).slice(0, 4)).concat(String(new Date().getFullYear())))].sort().reverse();
    const terbit = list.filter(s => s.status === 'TERBIT'), gagal = list.filter(s => s.status === 'DITOLAK' || s.status === 'DIBATALKAN').length;
    const jam = terbit.filter(s => s.waktu_verifikasi).map(s => (keTgl(s.waktu_verifikasi) - keTgl(s.tanggal)) / 36e5).filter(x => x >= 0);
    const rata = jam.length ? jam.reduce((a, b) => a + b, 0) / jam.length : null;
    return `<div class="stat4"><div class="kartu stat tinta biru"><span class="ubin">${ic('file')}</span><p>Total permohonan</p><b>${list.length}</b><small>sesuai filter</small></div>
        <div class="kartu stat sorot"><span class="ubin">${ic('shield')}</span><p>Surat terbit</p><b>${terbit.length}</b><small>${list.length ? Math.round(terbit.length / list.length * 100) : 0}% dari permohonan</small></div>
        <div class="kartu stat tinta langit"><span class="ubin">${ic('clock')}</span><p>Rata-rata waktu proses</p><b>${rata === null ? '—' : rata < 48 ? rata.toFixed(1) + ' jam' : (rata / 24).toFixed(1) + ' hari'}</b><small>pengajuan sampai terbit</small></div>
        <div class="kartu stat tinta merah"><span class="ubin">${ic('alert')}</span><p>Ditolak atau dibatalkan</p><b>${gagal}</b><small>${list.length ? Math.round(gagal / list.length * 100) : 0}% dari permohonan</small></div></div>
      <div class="dash"><div class="kiri"><div class="kartu"><div class="kj"><div><h2>Tren Pengajuan dan Penerbitan</h2><p>Tahun ${esc(f.tahun)}</p></div></div>${grafikBulan(list, Number(f.tahun))}</div></div>
        <div class="kanan"><div class="kartu"><div class="kj"><div><h2>Sebaran Jenis Surat</h2><p>Sesuai filter</p></div></div>${donutJenis(list)}</div></div></div>
      <div class="kartu">${alatSaring('laporan', { kanan: `<select data-saring="laporan.tahun" aria-label="Tahun">${tahun.map(t => `<option ${String(f.tahun) === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
        <button class="tb" data-act="rekap" data-sumber="laporan">${ic('download')}Unduh Excel (CSV)</button><button class="tb" data-act="cetak">${ic('print')}Cetak / PDF</button>` })}<div id="tbl">${tabelLaporan()}</div></div>`;
  };

  HAL.log = function () {
    const L = S.log;
    const warna = { ajukan: 's-aju', proses: 's-pro', verifikasi: 's-ok', tolak: 's-no', batal: 's-no', unduh: 's-ver' };
    return `<div class="kartu"><div class="kj"><div><h2>Jejak Aktivitas</h2><p>300 catatan terbaru</p></div><button class="tb" data-act="muatLog">Muat ulang</button></div>
      ${!L ? '<div class="tulang"></div><div class="tulang"></div><div class="tulang"></div>' : L.length ? `<div class="tblw"><table class="tbl polos"><thead><tr><th>Waktu</th><th>Pengguna</th><th>Aksi</th><th>Surat</th><th>Keterangan</th></tr></thead><tbody>${L.map(r => `<tr><td data-l="Waktu">${tgl(r.waktu)}<small>${isNaN(keTgl(r.waktu)) ? '' : keTgl(r.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</small></td><td data-l="Pengguna">${esc(r.email)}</td>
        <td data-l="Aksi"><span class="lc ${warna[r.aksi] || 's-aju'}"><i></i>${esc(r.aksi)}</span></td><td data-l="Surat" class="mono">${esc(r.id)}</td><td data-l="Keterangan"><span class="potong">${esc(r.ket)}</span></td></tr>`).join('')}</tbody></table></div>` : kosong('Belum ada aktivitas', '')}</div>`;
  };
  PASCA.log = () => { if (!S.log) AKSI.muatLog(); };

  HAL.migrasi = function () {
    const h = S.f.migrasi;
    return `<div class="kartu sempit"><div class="kj"><div><h2>Migrasi dari spreadsheet versi lama</h2><p>Spreadsheet lama hanya dibaca, tidak pernah diubah. Impor aman diulang: data yang sama tidak akan ganda.</p></div></div>
      <form data-submit="migrasi"><div class="kol lebar"><label for="m-src">Tautan atau ID spreadsheet lama</label><input id="m-src" name="sumber" required placeholder="https://docs.google.com/spreadsheets/d/…"></div>
        <div class="aksi kiri"><button class="tb" type="submit" name="mode" value="pindai">${ic('search')}Pindai dulu (tanpa menulis)</button><button class="tb utama" type="submit" name="mode" value="impor">${ic('db')}Impor sekarang</button></div></form>
      ${h ? `<h3 class="bagian">${h.dryRun ? 'Hasil pindai' : 'Hasil impor'} — ${esc(h.nama)}</h3><div class="tblw"><table class="tbl polos"><thead><tr><th>Sheet</th><th>Baris sumber</th><th>${h.dryRun ? 'Akan ditambah' : 'Ditambah'}</th><th>${h.dryRun ? 'Akan diperbarui' : 'Diperbarui'}</th><th>Dilewati</th></tr></thead><tbody>
        ${h.hasil.map(r => r.tidakAda ? `<tr><td>${esc(r.sheet)}</td><td colspan="4" class="redup">Sheet tidak ada di sumber</td></tr>` : `<tr><td data-l="Sheet"><b>${esc(r.sheet)}</b></td><td data-l="Sumber">${r.sumber}</td><td data-l="Ditambah">${r.inserted}</td><td data-l="Diperbarui">${r.updated}</td><td data-l="Dilewati">${r.skipped}</td></tr>`).join('')}</tbody></table></div>` : ''}
      <p class="info">${ic('help')}Jalankan "Pindai" lebih dulu. Menjelang peralihan, jalankan "Impor" sekali lagi untuk mengambil data baru yang masuk ke sistem lama.</p></div>`;
  };

  HAL.bantuan = () => `<div class="dua rata"><div class="kartu"><div class="kj"><div><h2>Alur surat</h2><p>Dari pengajuan sampai terbit</p></div></div><ol class="langkah">
      <li><b>Ajukan</b>Pemohon memilih jenis surat dan mengisi formulir.</li><li><b>Diproses admin</b>Admin memeriksa isian dan memberi nomor surat.</li>
      <li><b>Verifikasi pimpinan</b>Pimpinan menyetujui. Tanda tangan, stempel, dan QR terbubuh otomatis.</li><li><b>Terbit</b>Pemohon mengunduh PDF dari Riwayat Pengajuan.</li></ol></div>
    <div class="kartu"><div class="kj"><div><h2>Pertanyaan umum</h2><p>Hal yang sering ditanyakan</p></div></div>
      <details><summary>Mengapa tombol unduh belum aktif?</summary><p>PDF hanya tersedia setelah surat berstatus Terbit, yaitu setelah disetujui pimpinan.</p></details>
      <details><summary>Surat saya ditolak, apa yang harus dilakukan?</summary><p>Buka detail surat untuk membaca catatan penolakan, lalu ajukan surat baru dengan perbaikan.</p></details>
      <details><summary>Bagaimana memeriksa keaslian surat?</summary><p>Pindai QR pada surat, atau buka menu Cek Keaslian Surat dan masukkan kode verifikasinya.</p></details>
      <details><summary>Apa arti pemeriksaan keaslian?</summary><p>Pemeriksaan memastikan surat diterbitkan oleh sistem ini dan datanya tidak berubah. Pengakuan hukum tanda tangan mengikuti kebijakan organisasi.</p></details></div></div>`;

  function hasilCek(r) {
    if (!r) return '';
    if (r.sah) return `<div class="hasil sah"><span>${ic('check')}</span><h2>Surat Sah dan Terdaftar</h2><dl><div><dt>Nomor surat</dt><dd class="mono">${esc(r.nomor)}</dd></div><div><dt>Jenis</dt><dd>${esc(r.jenis)}</dd></div><div><dt>Tanggal surat</dt><dd>${tgl(r.tanggal_surat, true)}</dd></div><div><dt>Penandatangan</dt><dd>${esc(r.penandatangan || '—')}</dd></div><div><dt>Status</dt><dd>${lencana('TERBIT')}</dd></div></dl>
      <p>Pemeriksaan ini memastikan surat diterbitkan oleh sistem dan datanya tidak berubah.</p></div>`;
    return `<div class="hasil tidak"><span>${ic('x')}</span><h2>${r.status === 'DIBATALKAN' ? 'Surat Sudah Dibatalkan' : 'Surat Tidak Ditemukan atau Tidak Sah'}</h2>
      <p>${r.status === 'DIBATALKAN' ? 'Surat nomor ' + esc(r.nomor) + ' pernah diterbitkan tetapi sudah dibatalkan dan tidak berlaku.' : r.berubah ? 'Data surat pada sistem tidak cocok dengan kode verifikasi. Hubungi organisasi penerbit.' : 'Periksa kembali kode verifikasi, atau hubungi organisasi penerbit surat.'}</p></div>`;
  }
  const formCek = kode => `<form data-submit="cek" class="cekform"><label for="c-kode">Kode verifikasi</label><div class="baris"><input id="c-kode" name="kode" class="mono" value="${esc(kode || '')}" placeholder="REG-20261111-XXXXX.kode" required autocomplete="off"><button class="tb utama" type="submit">${ic('search')}Periksa</button></div></form><div id="hasilcek">${hasilCek(S.f.cek)}</div>`;
  HAL.cek = () => `<div class="kartu sempit"><div class="kj"><div><h2>Cek Keaslian Surat</h2><p>Masukkan kode verifikasi yang tertera pada tautan QR surat.</p></div></div>${formCek()}</div>`;

  // ---------- Detail surat (laci samping) ----------
  function laciSurat(id) {
    const s = suratDari(id);
    if (!s) return;
    const tpl = tplDari(s.kode) || { kode: s.kode, nama_jenis: s.jenis, isian: Object.keys(s.isian).map(k => ({ k, label: k, tipe: 'teks' })), format_nomor: '', reset_nomor: 'TAHUNAN' };
    const bisaProses = adalah('ADMIN') && (s.status === 'DIAJUKAN' || s.status === 'DIPROSES');
    const jejak = [['Diajukan', s.tanggal, s.nama_pemohon || s.email]];
    if (s.nomor) jejak.push(['Diberi nomor ' + s.nomor, s.tanggal_surat, 'Admin']);
    if (s.status === 'TERBIT' || s.status === 'DIBATALKAN') jejak.push(['Disetujui dan terbit', s.waktu_verifikasi, s.pejabat_nama || s.verifikator]);
    if (s.status === 'DITOLAK') jejak.push(['Ditolak', '', s.verifikator]);
    if (s.status === 'DIBATALKAN') jejak.push(['Dibatalkan', '', 'Admin']);
    const badan = bisaProses
      ? `<form data-submit="prosesSurat" data-id="${esc(s.id)}" id="fproses"><h3 class="bagian">Isian surat</h3><div class="grid2">${kolomIsian(tpl, s.isian, 'pr-')}</div>
          <h3 class="bagian">Penomoran dan penandatangan</h3><div class="grid2">
          <div class="kol"><label for="pr-pj">Pejabat penandatangan</label><select id="pr-pj" name="_pejabat" required><option value="">Pilih pejabat…</option>${(D().pejabat || []).map(p => `<option value="${esc(p.email)}" ${(s.pejabat_email || tpl.pejabat) === p.email ? 'selected' : ''}>${esc(p.nama)} — ${esc(p.jabatan)}</option>`).join('')}</select></div>
          <div class="kol"><label for="pr-tgl">Tanggal surat</label><input type="date" id="pr-tgl" name="_tanggal" value="${isoHari(new Date())}" required></div></div>
          <div class="contoh"><small>Nomor yang akan diberikan</small><b class="mono">${esc(tpl.format_nomor ? nomorBerikut(tpl) : '—')}</b></div></form>`
      : `<h3 class="bagian">Isian surat</h3><dl class="rinci">${tpl.isian.map(f => `<div><dt>${esc(f.label)}</dt><dd>${esc(f.tipe === 'tanggal' ? tgl(s.isian[f.k], true) : s.isian[f.k]) || '—'}</dd></div>`).join('')}</dl>
         <h3 class="bagian">Informasi surat</h3><dl class="rinci"><div><dt>Nomor</dt><dd class="mono">${esc(s.nomor) || '—'}</dd></div><div><dt>Tanggal surat</dt><dd>${tgl(s.tanggal_surat, true)}</dd></div><div><dt>Penandatangan</dt><dd>${esc(s.pejabat_nama || s.pejabat_email) || '—'}</dd></div></dl>
         ${s.catatan ? `<div class="catatan">${ic('alert')}<div><b>Catatan</b>${esc(s.catatan)}</div></div>` : ''}
         ${s.tautan ? `<div class="contoh"><small>Tautan cek keaslian (isi QR pada surat)</small><a class="mono pecah" href="${esc(s.tautan)}" target="_blank" rel="noopener">${esc(s.tautan)}</a></div>` : ''}`;
    let aksi = '';
    if (bisaProses) aksi = `<button class="tb utama penuh" type="submit" form="fproses" name="mode" value="kirim">${ic('send')}Beri Nomor dan Kirim ke Pimpinan</button>
      <div class="dua-tb"><button class="tb" type="submit" form="fproses" name="mode" value="simpan">Simpan Pemeriksaan</button><button class="tb bahaya" data-act="tolak" data-id="${esc(s.id)}">Tolak Pengajuan</button></div>`;
    else if (s.status === 'TERBIT') aksi = `<button class="tb utama penuh" data-act="unduh" data-id="${esc(s.id)}">${ic('download')}Unduh PDF</button>${adalah('ADMIN') ? `<button class="tb bahaya penuh" data-act="batalkan" data-id="${esc(s.id)}">Batalkan Surat</button>` : ''}`;
    else if (s.status === 'MENUNGGU_VERIFIKASI' && adalah('ADMIN')) aksi = `<div class="dua-tb"><button class="tb" data-act="pratinjauPdf" data-id="${esc(s.id)}">${ic('eye')}Pratinjau PDF</button><button class="tb bahaya" data-act="tolak" data-id="${esc(s.id)}">Tolak</button></div>`;
    else if (s.status === 'MENUNGGU_VERIFIKASI' && adalah('PIMPINAN') && s.pejabat_email === S.user.email) aksi = `<a class="tb utama penuh" href="#/verifikasi" data-act="pilihVer" data-id="${esc(s.id)}">${ic('shield')}Buka di Verifikasi Surat</a>`;
    modal(`<header><div><small class="mono">${esc(s.id)}</small><h2>${esc(s.jenis)}</h2>${lencana(s.status)}</div><button class="bulat" data-act="tutup" aria-label="Tutup">${ic('x')}</button></header>
      <div class="isi"><div class="pemohon"><span class="ava">${inisial(s.nama_pemohon || s.email)}</span><div><b>${esc(s.nama_pemohon || s.email)}</b><small>${esc(s.asal || '')}</small><small class="mono">${esc(s.email)}</small></div></div>
        ${badan}<h3 class="bagian">Riwayat</h3><ol class="jejak">${jejak.map(j => `<li><b>${esc(j[0])}</b><span>${esc(j[2] || '')}${j[1] ? ' · ' + tgl(j[1]) : ''}</span></li>`).join('')}</ol></div>
      ${aksi ? `<footer>${aksi}</footer>` : ''}`, 'laci');
  }
  function tanyaAlasan(judul, teks, tombol, lanjut) {
    modal(`<header><div><h2>${esc(judul)}</h2></div><button class="bulat" data-act="tutup" aria-label="Tutup">${ic('x')}</button></header>
      <form class="isi" id="falasan"><p>${esc(teks)}</p><div class="kol lebar"><label for="alasan">Alasan</label><textarea id="alasan" name="alasan" rows="4" required maxlength="500" autofocus></textarea></div></form>
      <footer><div class="dua-tb"><button class="tb" data-act="tutup">Batal</button><button class="tb bahaya isi-penuh" type="submit" form="falasan">${esc(tombol)}</button></div></footer>`, 'kecil');
    $('#falasan').addEventListener('submit', e => { e.preventDefault(); lanjut(dataForm(e.target).alasan); });
  }

  // ---------- Aksi ----------
  const AKSI = {
    tutup,
    menu() { document.body.classList.toggle('menu-buka'); },
    keluar() { keluar(); },
    lebih() { F('maks', { n: 100 }).n += 100; segarTabel(); },
    bukaSurat(el) { laciSurat(el.dataset.id); },
    pilihJenis(el) { S.f.ajukan = { kode: el.dataset.kode, isian: {}, langsung: S.f.ajukan && S.f.ajukan.langsung }; render(true); },
    buatLangsung() { S.f.ajukan = { kode: '', isian: {}, langsung: true }; pergi('ajukan'); },
    tabKelola(el) { F('kelola').status = el.dataset.st; render(true); },
    tabPengguna(el) { F('pengguna').tab = el.dataset.tab; render(true); },
    pilihVer(el) { F('ver').id = el.dataset.id; tutup(); if (S.rute === 'verifikasi') render(true); },
    cetak() { print(); },

    async kirimAjukan(form, ev) {
      const f = F('ajukan'), tpl = tplDari(f.kode), d = dataForm(form), isian = {};
      tpl.isian.forEach(x => { isian[x.k] = d[x.k] || ''; });
      const btn = ev.submitter; sibuk(btn, true);
      // Baris sementara langsung tampil di Riwayat, lalu diganti data asli dari server
      const tmp = { id: 'mengirim-' + Date.now(), tanggal: new Date().toISOString(), kode: tpl.kode, jenis: tpl.nama_jenis, email: S.user.email, nama_pemohon: S.user.nama, asal: S.user.asal, perihal: isian.perihal || isian.keperluan || tpl.nama_jenis, isian, status: 'DIAJUKAN', nomor: '', _sibuk: true };
      D().surat.unshift(tmp);
      S.f.ajukan = null; pergi(adalah('ADMIN') && d._langsung ? 'kelola' : 'riwayat');
      try {
        const row = await api('surat.ajukan', { kode: tpl.kode, isian, langsung: !!d._langsung });
        buang(tmp); gantiSurat(row);
        toast(row.status === 'MENUNGGU_VERIFIKASI' ? 'Surat dibuat dan dikirim ke pimpinan.' : 'Pengajuan terkirim.'); render(true); sinkron();
      } catch (e) {
        buang(tmp);
        S.f.ajukan = { kode: tpl.kode, isian, langsung: !!d._langsung }; pergi('ajukan'); tangani(e);
      }
    },
    prosesSurat(form, ev) {
      const d = dataForm(form), s = suratDari(form.dataset.id), tpl = tplDari(s.kode), isian = {}, kirim = ev.submitter && ev.submitter.value === 'kirim';
      tpl.isian.forEach(x => { isian[x.k] = d[x.k] || ''; });
      const pj = (D().pejabat || []).find(p => p.email === d._pejabat) || {};
      ubahSurat('surat.proses', { id: s.id, isian, pejabat_email: d._pejabat, tanggal_surat: d._tanggal, kirim },
        kirim ? { status: 'MENUNGGU_VERIFIKASI', isian, pejabat_email: d._pejabat, pejabat_nama: pj.nama, nomor: nomorBerikut(tpl, d._tanggal), tanggal_surat: d._tanggal } : { status: 'DIPROSES', isian },
        kirim ? 'Nomor diberikan. Surat dikirim ke pimpinan.' : 'Pemeriksaan disimpan.');
    },
    tolak(el) {
      const id = el.dataset.id;
      tanyaAlasan('Tolak surat ini?', 'Pemohon akan melihat alasan penolakan. Nomor yang sudah diberikan ditandai BATAL dan tidak dipakai ulang.', 'Ya, Tolak',
        alasan => ubahSurat('surat.tolak', { id, catatan: alasan }, { status: 'DITOLAK', catatan: alasan }, 'Surat ditolak.'));
    },
    batalkan(el) {
      const id = el.dataset.id;
      tanyaAlasan('Batalkan surat terbit?', 'Surat tidak dapat diunduh lagi dan pemeriksaan QR akan menyatakan surat sudah dibatalkan. Nomor ditandai BATAL.', 'Ya, Batalkan',
        alasan => ubahSurat('surat.batal', { id, alasan }, { status: 'DIBATALKAN', catatan: alasan }, 'Surat dibatalkan.'));
    },
    setujui(el) {
      const s = suratDari(el.dataset.id);
      modal(`<header><div><h2>Setujui surat ini?</h2></div><button class="bulat" data-act="tutup" aria-label="Tutup">${ic('x')}</button></header>
        <div class="isi"><p>Tanda tangan, stempel, dan QR akan dibubuhkan otomatis, lalu pemohon dapat mengunduh PDF. Surat terbit tidak dapat diubah.</p>
          <dl class="rinci"><div><dt>Nomor</dt><dd class="mono">${esc(s.nomor)}</dd></div><div><dt>Jenis</dt><dd>${esc(s.jenis)}</dd></div><div><dt>Perihal</dt><dd>${esc(s.perihal)}</dd></div></dl></div>
        <footer><div class="dua-tb"><button class="tb" data-act="tutup">Batal</button><button class="tb utama" data-act="setujuiYa" data-id="${esc(s.id)}">${ic('shield')}Ya, Setujui</button></div></footer>`, 'kecil');
    },
    setujuiYa(el) { ubahSurat('surat.setujui', { id: el.dataset.id }, {}, 'Surat terbit. Pemohon sudah dapat mengunduh PDF.'); },
    async unduh(el) {
      sibuk(el, true);
      try { unduhB64(await api('surat.unduh', { id: el.dataset.id })); toast('PDF diunduh.'); } catch (e) { tangani(e); }
      sibuk(el, false);
    },
    async pratinjauPdf(el) {
      sibuk(el, true); toast('Menyiapkan PDF dari template, mohon tunggu…');
      try { unduhB64(await api('surat.pratinjau', { id: el.dataset.id })); } catch (e) { tangani(e); }
      sibuk(el, false);
    },
    rekap(el) {
      const list = el.dataset.sumber === 'riwayat' ? saring(sumberRiwayat(), F('riwayat')) : el.dataset.sumber === 'laporan' ? sumberLaporan() : saring(D().surat, F('kelola'));
      const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
      const baris = [['Nomor Surat', 'ID Registrasi', 'Jenis', 'Perihal', 'Pemohon', 'Email', 'Asal', 'Tanggal Pengajuan', 'Tanggal Surat', 'Status', 'Penandatangan', 'Catatan']]
        .concat(list.map(s => [s.nomor, s.id, s.jenis, s.perihal, s.nama_pemohon, s.email, s.asal, String(s.tanggal).slice(0, 10), s.tanggal_surat, (ST[s.status] || [s.status])[0], s.pejabat_nama, s.catatan]));
      unduhBerkas('rekap-surat-' + isoHari(new Date()) + '.csv', 'text/csv;charset=utf-8', ['﻿' + baris.map(r => r.map(q).join(';')).join('\r\n')]);
      toast('Rekap ' + list.length + ' surat diunduh.');
    },

    // Template
    suntingTpl(el) { S.f.tpl = JSON.parse(JSON.stringify(tplDari(el.dataset.kode))); render(true); },
    tplBaru() { S.f.tpl = { baru: true, kode: '', nama_jenis: '', deskripsi: '', id_template: '', isian: [], format_nomor: '{no:000}/{kode}/{bulan_romawi}/{tahun}', reset_nomor: 'TAHUNAN', pejabat: '', pemohon_boleh: true, aktif: true }; render(true); },
    batalTpl() { S.f.tpl = null; render(true); },
    hapusIsian(el) { S.f.tpl.isian.splice(Number(el.dataset.i), 1); render(true); },
    token(el) { const e = S.f.tpl; e.format_nomor = (e.format_nomor || '') + el.dataset.t; const i = $('#t-pola'); i.value = e.format_nomor; $('#contohNomor').textContent = nomorBerikut(e); i.focus(); },
    async pindaiTpl(el) {
      const e = S.f.tpl; sibuk(el, true);
      try {
        const r = await api('template.pindai', { id_template: e.id_template });
        e.id_template = r.id_template;
        const judul = k => k.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());
        e.isian = r.isian.map(k => e.isian.find(f => f.k === k) || { k, label: judul(k), tipe: /tanggal/.test(k) ? 'tanggal' : /keperluan|isi|rincian|acara|uraian/.test(k) ? 'paragraf' : 'teks', wajib: true, opsi: [] });
        if (!e.nama_jenis) e.nama_jenis = r.nama.replace(/^Template\s*[—-]\s*/i, '');
        toast(r.isian.length + ' penanda isian dan ' + r.sistem.length + ' penanda sistem ditemukan.'); render(true);
      } catch (err) { tangani(err); sibuk(el, false); }
    },
    async simpanTpl(form, ev) {
      const e = S.f.tpl, btn = ev.submitter; sibuk(btn, true);
      try {
        const t = await api('template.simpan', e);
        const i = D().templates.findIndex(x => x.kode === t.kode);
        if (i > -1) D().templates[i] = t; else D().templates.push(t);
        simpanBoot(); S.f.tpl = null; toast('Template ' + t.kode + ' disimpan.'); render(true); sinkron();
      } catch (err) { tangani(err); sibuk(btn, false); }
    },

    // Pengguna & pejabat
    async statusPengguna(el) {
      const p = D().pengguna.find(x => x.email === el.dataset.email), lama = p.status;
      p.status = el.dataset.st; render(true);
      try { await api('pengguna.simpan', { email: p.email, role: p.role, status: p.status }); simpanBoot(); toast(p.status === 'AKTIF' ? 'Akun diaktifkan.' : 'Akun diblokir.'); }
      catch (e) { p.status = lama; render(true); tangani(e); }
    },
    formPengguna() {
      modal(`<header><div><h2>Tambah Pengguna</h2></div><button class="bulat" data-act="tutup" aria-label="Tutup">${ic('x')}</button></header>
        <form class="isi" id="fpengguna" data-submit="simpanPengguna"><p>Pengguna tetap masuk dengan akun Google miliknya. Akun yang ditambahkan admin langsung aktif.</p>
          <div class="kol lebar"><label for="u-email">Email akun Google</label><input id="u-email" type="email" name="email" required autofocus></div>
          <div class="kol lebar"><label for="u-nama">Nama lengkap</label><input id="u-nama" name="nama" maxlength="120"></div>
          <div class="kol lebar"><label for="u-asal">Asal unit atau instansi</label><input id="u-asal" name="asal" maxlength="160"></div>
          <div class="kol lebar"><label for="u-role">Peran</label><select id="u-role" name="role"><option value="USER">Pemohon</option><option value="PIMPINAN">Pimpinan</option></select></div></form>
        <footer><div class="dua-tb"><button class="tb" data-act="tutup">Batal</button><button class="tb utama" type="submit" form="fpengguna">Simpan</button></div></footer>`, 'kecil');
    },
    async simpanPengguna(form, ev) {
      const d = dataForm(form); sibuk(ev.submitter, true);
      try { await api('pengguna.simpan', Object.assign(d, { status: 'AKTIF' })); tutup(); toast('Pengguna ditambahkan.'); await sinkron(true); }
      catch (e) { tangani(e); sibuk(ev.submitter, false); }
    },
    formPejabat(el) {
      const p = (D().pejabat || []).find(x => x.email === el.dataset.email) || {};
      modal(`<header><div><h2>${p.email ? 'Sunting' : 'Tambah'} Pejabat Penandatangan</h2></div><button class="bulat" data-act="tutup" aria-label="Tutup">${ic('x')}</button></header>
        <form class="isi" id="fpejabat" data-submit="simpanPejabat"><p>Pejabat otomatis berperan Pimpinan. Gambar tanda tangan dan stempel disimpan di folder Drive privat dan hanya dibubuhkan setelah pejabat menyetujui surat.</p>
          <div class="kol lebar"><label for="p-email">Email akun Google pejabat</label><input id="p-email" type="email" name="email" value="${esc(p.email || '')}" required ${p.email ? 'readonly' : 'autofocus'}></div>
          <div class="kol lebar"><label for="p-nama">Nama lengkap dan gelar</label><input id="p-nama" name="nama" value="${esc(p.nama || '')}" required></div>
          <div class="grid2"><div class="kol"><label for="p-jab">Jabatan</label><input id="p-jab" name="jabatan" value="${esc(p.jabatan || '')}"></div><div class="kol"><label for="p-nip">NIP</label><input id="p-nip" name="nip" value="${esc(p.nip || '')}"></div></div>
          <div class="kol lebar"><label for="p-js">Kode jenis surat yang boleh diverifikasi</label><input id="p-js" name="jenis_surat" value="${esc(p.jenis_surat || '')}" placeholder="Contoh: ST,UND — kosongkan untuk semua jenis"></div>
          <div class="grid2"><div class="kol"><label for="p-ttd">Gambar tanda tangan (PNG/JPG, maks. 1 MB)${p.ada_ttd ? ' — sudah ada' : ''}</label><input id="p-ttd" type="file" name="ttd" accept="image/png,image/jpeg"></div>
            <div class="kol"><label for="p-cap">Gambar stempel (opsional)${p.ada_cap ? ' — sudah ada' : ''}</label><input id="p-cap" type="file" name="cap" accept="image/png,image/jpeg"></div></div></form>
        <footer><div class="dua-tb"><button class="tb" data-act="tutup">Batal</button><button class="tb utama" type="submit" form="fpejabat">Simpan</button></div></footer>`);
    },
    async simpanPejabat(form, ev) {
      const d = dataForm(form); sibuk(ev.submitter, true);
      try {
        for (const k of ['ttd', 'cap']) {
          const f = d[k];
          if (f && f.size) { if (f.size > 1e6) throw new Error('Ukuran gambar maksimal 1 MB.'); d[k] = await bacaFile(f); } else delete d[k];
        }
        await api('pejabat.simpan', d); tutup(); toast('Pejabat disimpan.'); await sinkron(true);
      } catch (e) { tangani(e); sibuk(ev.submitter, false); }
    },
    async muatLog() { try { S.log = await api('log.list'); if (S.rute === 'log') render(true); } catch (e) { tangani(e); } },
    async migrasi(form, ev) {
      const impor = ev.submitter && ev.submitter.value === 'impor';
      if (impor && !confirm('Impor akan menulis data ke spreadsheet aplikasi ini. Lanjutkan?')) return;
      sibuk(ev.submitter, true);
      try { S.f.migrasi = await api('migrasi.jalankan', { sumber: dataForm(form).sumber, dryRun: !impor }); toast(impor ? 'Impor selesai.' : 'Pindai selesai.'); if (impor) await sinkron(true); render(true); }
      catch (e) { tangani(e); sibuk(ev.submitter, false); }
    },
    async cek(form, ev) {
      let kode = dataForm(form).kode;
      const m = kode.match(/[?&]v=([^&#]+)/); if (m) kode = decodeURIComponent(m[1]);
      sibuk(ev.submitter, true);
      try { S.f.cek = await api('verifikasi', { kode }); } catch (e) { S.f.cek = null; toast(e.message, 'galat'); }
      sibuk(ev.submitter, false);
      $('#hasilcek').innerHTML = hasilCek(S.f.cek);
    },
    demoMasuk(el) { masukDengan({ demoRole: el.dataset.role }); }
  };

  const TABEL = { riwayat: tabelRiwayat, kelola: tabelKelola, laporan: tabelLaporan, pengguna: tabelPengguna };
  function segarTabel() { const t = $('#tbl'); if (t && TABEL[S.rute]) t.innerHTML = TABEL[S.rute](); }

  // ---------- Delegasi event ----------
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    if (el.tagName === 'A' && el.getAttribute('href') === '#') e.preventDefault();
    if (el.closest('.sisi') || el.classList.contains('tirai')) document.body.classList.remove('menu-buka');
    if (AKSI[el.dataset.act] && el.tagName !== 'FORM') AKSI[el.dataset.act](el, e);
  });
  document.addEventListener('click', e => { if (e.target.closest('.sisi a')) document.body.classList.remove('menu-buka'); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && $('#lapis').children.length) tutup();
    if (e.key === 'Enter' && e.target.matches && e.target.matches('tr[data-act]')) AKSI.bukaSurat(e.target);
  });
  document.addEventListener('submit', e => {
    const f = e.target.closest('form[data-submit]');
    if (!f) return;
    e.preventDefault();
    AKSI[f.dataset.submit](f, e);
  });
  function masukan(e) {
    const el = e.target;
    if (el.dataset.saring) { // filter tabel: hanya isi tabel yang digambar ulang, fokus input tidak hilang
      const p = el.dataset.saring.split('.');
      F(p[0])[p[1]] = el.value; F('maks', { n: 100 }).n = 100;
      if (p[1] === 'tahun') render(true); else segarTabel();
      return;
    }
    if (el.dataset.tf) { // baris isian pada editor template
      const p = el.dataset.tf.split('.'), f = S.f.tpl.isian[Number(p[0])];
      f[p[1]] = p[1] === 'wajib' ? el.checked : p[1] === 'opsi' ? el.value.split(',').map(x => x.trim()).filter(Boolean) : el.value;
      if (p[1] === 'tipe' && e.type === 'change') render(true);
      return;
    }
    const form = el.closest('form[data-masuk]');
    if (!form) return;
    if (form.dataset.masuk === 'ajukan') {
      const f = F('ajukan'), d = dataForm(form);
      f.langsung = !!d._langsung; delete d._langsung; f.isian = d;
      const tpl = tplDari(f.kode);
      requestAnimationFrame(() => { const p = $('#pratinjau'); if (p && tpl) p.innerHTML = kertas(tpl, f.isian); });
    } else if (form.dataset.masuk === 'tpl') {
      const t = S.f.tpl;
      if (el.type === 'checkbox') t[el.name] = el.checked; else if (el.name) t[el.name] = el.name === 'kode' ? el.value.toUpperCase() : el.value;
      const c = $('#contohNomor'); if (c) c.textContent = nomorBerikut(t);
    }
  }
  document.addEventListener('input', masukan);
  document.addEventListener('change', async e => {
    const el = e.target;
    if (el.dataset.ubah === 'peran') {
      const p = D().pengguna.find(x => x.email === el.dataset.email), lama = p.role;
      p.role = el.value;
      try { await api('pengguna.simpan', { email: p.email, role: p.role, status: p.status }); simpanBoot(); toast('Peran diperbarui.'); }
      catch (err) { p.role = lama; render(true); tangani(err); }
      return;
    }
    if (el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'date') masukan(e);
  });

  // ---------- Masuk & keluar ----------
  function keluar(alasan) {
    if (S.user) LS.del('sp_boot_' + S.user.email);
    LS.del('sp_token'); LS.del('sp_user');
    S.token = null; S.user = null; S.D = null; S.log = null; S.f = {};
    $('#lapis').innerHTML = '';
    try { if (window.google && google.accounts) google.accounts.id.disableAutoSelect(); } catch (e) { /* abaikan */ }
    renderMasuk(alasan);
  }
  async function masukDengan(data) {
    const kotak = $('#gbtn'); if (kotak) kotak.classList.add('memuat');
    try {
      const r = await api('auth.login', data);
      if (r.status === 'MENUNGGU') return renderMasuk('tunggu', r.email);
      S.token = r.token; S.user = r.user; LS.set('sp_token', r.token); LS.set('sp_user', r.user);
      S.D = LS.get('sp_boot_' + r.user.email);
      if (!location.hash) history.replaceState(null, '', '#/dashboard');
      render(true); await sinkron(true);
    } catch (e) {
      if (e.code === 'FORBIDDEN') renderMasuk('tolak'); else { toast(e.message, 'galat'); if (kotak) kotak.classList.remove('memuat'); }
    }
  }
  function renderMasuk(keadaan, email) {
    const org = (S.cfg && S.cfg.organisasi) || 'Organisasi';
    const kanan = keadaan === 'tunggu'
      ? `<div class="status-masuk"><span class="ubin kuning besar">${ic('clock')}</span><h1>Akun menunggu persetujuan admin</h1><p>Pendaftaran${email ? ' <b>' + esc(email) + '</b>' : ''} sudah tercatat. Anda dapat masuk setelah admin menyetujui akun ini.</p><button class="tb" data-act="keluar">Kembali</button></div>`
      : keadaan === 'tolak'
        ? `<div class="status-masuk"><span class="ubin merahm besar">${ic('ban')}</span><h1>Akses ditolak</h1><p>Akun Google ini belum diizinkan memakai aplikasi. Hubungi admin, atau masuk dengan akun lain.</p><button class="tb" data-act="keluar">Ganti akun Google</button></div>`
        : `<h1>Masuk ke Sistem Persuratan</h1><p class="redup">Gunakan akun Google organisasi atau akun Google Anda. Tidak ada sandi baru yang perlu dibuat.</p>
          ${DEMO ? `<div class="demo-kotak"><b>Mode demo</b><p>Backend belum dihubungkan (GAS_URL kosong). Coba aplikasi dengan data contoh:</p>
              <div class="demo-tb"><button class="tb utama" data-act="demoMasuk" data-role="ADMIN">Masuk sebagai Admin</button><button class="tb" data-act="demoMasuk" data-role="PIMPINAN">Pimpinan</button><button class="tb" data-act="demoMasuk" data-role="USER">Pemohon</button></div></div>`
            : `<div id="gbtn" class="gbtn"><span class="putar"></span></div><p class="kecil redup">${S.cfg && S.cfg.daftarMandiri ? 'Akun dari luar organisasi akan aktif setelah disetujui admin.' : 'Hanya akun yang sudah terdaftar yang dapat masuk.'}</p>`}
          <a class="cekluar" href="?v=">${ic('qr')}<span><b>Cek keaslian surat</b><small>Tanpa perlu masuk</small></span>${ic('right')}</a>`;
    $('#app').innerHTML = `<div class="kanvas masuk"><div class="rangka-masuk">
      <div class="promo"><div class="merek terang"><span class="logo">${ic('mail')}</span><span><b>Sistem Persuratan</b><small>${esc(org)}</small></span></div>
        <h2>Surat resmi, cepat dan terstandar</h2>
        <ul><li>${ic('check')}Isi formulir, surat dibuat otomatis dari template resmi</li><li>${ic('check')}Nomor surat otomatis, tanpa nomor ganda</li><li>${ic('check')}Tanda tangan, stempel, dan QR keaslian terbubuh setelah disetujui pimpinan</li></ul></div>
      <div class="panel">${kanan}</div></div></div>`;
    if (!DEMO && !keadaan) pasangGoogle();
  }
  async function pasangGoogle() {
    try {
      if (!S.cfg || !S.cfg.clientId) { S.cfg = await api('auth.config'); LS.set('sp_cfg', S.cfg); }
      else api('auth.config').then(c => { S.cfg = c; LS.set('sp_cfg', c); }).catch(() => { });
      if (!S.cfg.clientId) throw new Error('GOOGLE_CLIENT_ID belum diisi di Script Properties backend.');
      if (!window.google || !google.accounts) {
        await new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = ok; s.onerror = () => no(new Error('Gagal memuat layanan login Google. Periksa koneksi.')); document.head.appendChild(s); });
      }
      const kotak = $('#gbtn'); if (!kotak) return;
      google.accounts.id.initialize({ client_id: S.cfg.clientId, callback: r => masukDengan({ credential: r.credential }), auto_select: true, cancel_on_tap_outside: false });
      kotak.innerHTML = '';
      google.accounts.id.renderButton(kotak, { theme: 'filled_blue', size: 'large', shape: 'pill', text: 'continue_with', locale: 'id', width: Math.min(340, kotak.clientWidth || 320) });
    } catch (e) {
      const kotak = $('#gbtn'); if (kotak) { kotak.className = 'catatan'; kotak.textContent = e.message; }
    }
  }

  // ---------- Halaman publik cek keaslian (?v=...) ----------
  function renderPublik(kode) {
    S.publik = true;
    $('#app').innerHTML = `<div class="kanvas masuk"><div class="publik"><a class="merek" href="./"><span class="logo">${ic('mail')}</span><span><b>Sistem Persuratan</b><small>Cek keaslian surat</small></span></a>
      <div class="kartu">${formCek(kode)}</div><p class="tengah"><a href="./">Masuk ke aplikasi</a></p></div></div>`;
    if (kode) $('.cekform').requestSubmit();
  }

  // ---------- Mulai ----------
  async function mulai() {
    if (DEMO) await new Promise(ok => { const s = document.createElement('script'); s.src = 'js/demo.js'; s.onload = ok; document.head.appendChild(s); });
    const v = new URLSearchParams(location.search).get('v');
    if (v !== null) return renderPublik(v);
    render(true);          // tampil seketika dari cache lokal bila ada
    if (S.token) sinkron(); // lalu perbarui di latar belakang
  }
  mulai();
})();
