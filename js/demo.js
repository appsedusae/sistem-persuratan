/* MODE DEMO — hanya dimuat bila GAS_URL kosong. Meniru jawaban backend dengan data contoh di memori browser.
 * Tidak ada data yang dikirim ke mana pun, dan perubahan hilang saat halaman dimuat ulang. */
(function () {
  'use strict';
  const kini = new Date(), y = kini.getFullYear();
  const iso = (bln, tgl, jam) => new Date(y, bln, tgl, jam || 9).toISOString();
  const hari = d => d.toISOString().slice(0, 10);
  const AKUN = {
    ADMIN: { email: 'admin@contoh.org', nama: 'Admin Persuratan', role: 'ADMIN', asal: 'Sekretariat' },
    PIMPINAN: { email: 'pimpinan@contoh.org', nama: 'Dr. Contoh Pimpinan, M.Si.', role: 'PIMPINAN', asal: 'Kepala Lembaga' },
    USER: { email: 'pemohon@contoh.org', nama: 'Pemohon Contoh', role: 'USER', asal: 'Unit Program' }
  };
  const f = (k, label, tipe, wajib) => ({ k, label, tipe: tipe || 'teks', wajib: wajib !== false, opsi: [] });
  const DB = {
    organisasi: 'Organisasi Contoh',
    templates: [
      { kode: 'ST', nama_jenis: 'Surat Tugas', deskripsi: 'Penugasan resmi staf atau delegasi untuk kegiatan tertentu.', id_template: 'DOKUMEN-CONTOH-ST', format_nomor: '{no:000}/{kode}/{bulan_romawi}/{tahun}', reset_nomor: 'TAHUNAN', pejabat: 'pimpinan@contoh.org', pemohon_boleh: true, aktif: true,
        isian: [f('nama_personel', 'Nama yang ditugaskan'), f('jabatan_personel', 'Jabatan / Unit'), f('keperluan', 'Keperluan dan rincian tugas', 'paragraf'), f('tempat_kegiatan', 'Tempat kegiatan'), f('tanggal_mulai', 'Tanggal mulai', 'tanggal'), f('tanggal_selesai', 'Tanggal selesai', 'tanggal')] },
      { kode: 'UND', nama_jenis: 'Surat Undangan', deskripsi: 'Undangan rapat atau kegiatan resmi organisasi.', id_template: 'DOKUMEN-CONTOH-UND', format_nomor: '{no:000}/{kode}/{bulan_romawi}/{tahun}', reset_nomor: 'TAHUNAN', pejabat: 'pimpinan@contoh.org', pemohon_boleh: true, aktif: true,
        isian: [f('perihal', 'Perihal'), f('tujuan', 'Pihak yang diundang'), f('acara', 'Nama acara', 'paragraf'), f('tanggal_acara', 'Tanggal acara', 'tanggal'), f('tempat_acara', 'Tempat')] },
      { kode: 'PBR', nama_jenis: 'Surat Pemberitahuan', deskripsi: 'Pemberitahuan resmi kepada pihak internal atau eksternal.', id_template: 'DOKUMEN-CONTOH-PBR', format_nomor: '{kode}-{no:000}/{tahun}', reset_nomor: 'BULANAN', pejabat: 'pimpinan@contoh.org', pemohon_boleh: false, aktif: true,
        isian: [f('perihal', 'Perihal'), f('tujuan', 'Pihak yang dituju'), f('isi_pemberitahuan', 'Isi pemberitahuan', 'paragraf')] }
    ],
    pejabat: [{ email: 'pimpinan@contoh.org', nama: 'Dr. Contoh Pimpinan, M.Si.', jabatan: 'Kepala Lembaga', nip: '197001011995031001', jenis_surat: '', ada_ttd: true, ada_cap: true }],
    pengguna: [
      { email: 'admin@contoh.org', role: 'ADMIN', status: 'AKTIF', tanggal: iso(0, 5), nama: 'Admin Persuratan', asal: 'Sekretariat' },
      { email: 'pimpinan@contoh.org', role: 'PIMPINAN', status: 'AKTIF', tanggal: iso(0, 6), nama: 'Dr. Contoh Pimpinan, M.Si.', asal: 'Kepala Lembaga' },
      { email: 'pemohon@contoh.org', role: 'USER', status: 'AKTIF', tanggal: iso(1, 2), nama: 'Pemohon Contoh', asal: 'Unit Program' },
      { email: 'mitra.luar@gmail.com', role: 'USER', status: 'MENUNGGU', tanggal: kini.toISOString(), nama: 'Mitra Luar', asal: '' },
      { email: 'lama@gmail.com', role: 'USER', status: 'BLOKIR', tanggal: iso(2, 9), nama: 'Akun Lama', asal: 'Eksternal' }
    ],
    nomor: [], surat: [], log: []
  };
  const ROMAWI = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const tpl = k => DB.templates.find(t => t.kode === k);
  function nomor(t, d) {
    const per = t.reset_nomor === 'BULANAN' ? 'BLN-' + hari(d).slice(0, 7) : t.reset_nomor === 'TAHUNAN' ? 'THN-' + d.getFullYear() : 'SEMUA';
    let r = DB.nomor.find(x => x.jenis === t.kode && x.periode === per);
    if (!r) DB.nomor.push(r = { jenis: t.kode, periode: per, terakhir: 0 });
    r.terakhir = Number(r.terakhir) + 1;
    const b = d.getMonth() + 1;
    return t.format_nomor.replace(/\{no(?::(0+))?\}/g, (m, z) => String(r.terakhir).padStart(z ? z.length : 1, '0')).replace(/\{kode\}/g, t.kode)
      .replace(/\{bulan_romawi\}/g, ROMAWI[b]).replace(/\{bulan\}/g, String(b).padStart(2, '0')).replace(/\{tahun\}/g, d.getFullYear());
  }
  // Data contoh tersebar sepanjang tahun berjalan
  const perihal = ['Pendampingan kegiatan lapangan', 'Rapat koordinasi program', 'Narasumber pelatihan', 'Monitoring dan evaluasi', 'Libur bersama', 'Workshop penyusunan laporan'];
  const asal = ['Unit Program', 'Sekretariat', 'Unit Keuangan', 'Mitra Eksternal'];
  let urut = 0;
  for (let b = 0; b <= kini.getMonth(); b++) {
    const jml = 2 + (b * 7) % 4;
    for (let i = 0; i < jml; i++) {
      const t = DB.templates[(b + i) % 3], d = new Date(y, b, 3 + i * 6, 9 + i);
      if (d > kini) continue;
      const lama = (kini - d) / 864e5;
      const st = lama > 12 ? (urut % 9 === 4 ? 'DITOLAK' : 'TERBIT') : lama > 5 ? 'MENUNGGU_VERIFIKASI' : lama > 2 ? 'DIPROSES' : 'DIAJUKAN';
      const milik = urut % 3 === 0 ? AKUN.USER : { email: 'staf' + (urut % 4) + '@contoh.org', nama: 'Staf ' + (urut % 4 + 1), asal: asal[urut % 4] };
      const isian = {};
      t.isian.forEach(x => { isian[x.k] = x.tipe === 'tanggal' ? hari(new Date(d.getTime() + 7 * 864e5)) : x.k === 'perihal' || x.k === 'keperluan' ? perihal[urut % 6] : 'Contoh ' + x.label.toLowerCase(); });
      const s = { id: 'REG-' + hari(d).replace(/-/g, '') + '-D' + String(100 + urut), tanggal: d.toISOString(), kode: t.kode, jenis: t.nama_jenis, email: milik.email, nama_pemohon: milik.nama, asal: milik.asal,
        perihal: perihal[urut % 6], isian, status: st, nomor: '', tanggal_surat: '', pejabat_email: t.pejabat, pejabat_nama: DB.pejabat[0].nama, verifikator: '', waktu_verifikasi: '', catatan: '', tautan: '' };
      if (st !== 'DIAJUKAN' && st !== 'DIPROSES') { s.nomor = nomor(t, d); s.tanggal_surat = hari(d); }
      if (st === 'TERBIT') { s.waktu_verifikasi = new Date(d.getTime() + (6 + urut % 30) * 36e5).toISOString(); s.verifikator = t.pejabat; s.tautan = location.origin + location.pathname + '?v=' + s.id + '.demo'; }
      if (st === 'DITOLAK') s.catatan = 'Lampiran pendukung belum lengkap.';
      DB.surat.push(s); urut++;
    }
  }
  DB.surat.sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1));

  let sesi = null, versi = 1;
  const salin = o => JSON.parse(JSON.stringify(o));
  const galat = (code, message) => { const e = new Error(message); e.code = code; return e; };
  const catat = (aksi, id, ket) => DB.log.unshift({ waktu: new Date().toISOString(), email: sesi.email, aksi, id: id || '', ket: ket || '' });
  const cari = id => { const s = DB.surat.find(x => x.id === id); if (!s) throw galat('TIDAK_DITEMUKAN', 'Surat tidak ditemukan.'); return s; };
  const lihat = s => sesi.role === 'ADMIN' || s.email === sesi.email || (sesi.role === 'PIMPINAN' && s.pejabat_email === sesi.email);
  const PDF = 'JVBERi0xLjEKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iagozIDAgb2JqPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9NZWRpYUJveFswIDAgNTk1IDg0Ml0+PmVuZG9iagp0cmFpbGVyPDwvUm9vdCAxIDAgUj4+CiUlRU9G';

  const RUTE = {
    'auth.config': () => ({ clientId: '', organisasi: DB.organisasi, daftarMandiri: true }),
    'auth.login': d => { sesi = AKUN[d.demoRole] || AKUN.USER; return { status: 'AKTIF', token: 'demo-' + sesi.role, user: salin(sesi) }; },
    'boot': d => {
      const v = versi + '|' + sesi.role;
      if (d.v === v) return { unchanged: true, v };
      const admin = sesi.role === 'ADMIN';
      const o = { v, organisasi: DB.organisasi, user: sesi, surat: DB.surat.filter(lihat), pejabat: DB.pejabat,
        templates: DB.templates.filter(t => admin || (t.aktif && (sesi.role === 'PIMPINAN' || t.pemohon_boleh))) };
      if (admin) { o.pengguna = DB.pengguna; o.nomor = DB.nomor; }
      return salin(o);
    },
    'surat.ajukan': d => {
      const t = tpl(d.kode), now = new Date();
      const s = { id: 'REG-' + hari(now).replace(/-/g, '') + '-D' + (200 + DB.surat.length), tanggal: now.toISOString(), kode: t.kode, jenis: t.nama_jenis, email: sesi.email, nama_pemohon: sesi.nama, asal: sesi.asal,
        perihal: d.isian.perihal || d.isian.keperluan || t.nama_jenis, isian: d.isian, status: 'DIAJUKAN', nomor: '', tanggal_surat: '', pejabat_email: t.pejabat, pejabat_nama: DB.pejabat[0].nama, verifikator: '', waktu_verifikasi: '', catatan: '', tautan: '' };
      DB.surat.unshift(s); versi++; catat('ajukan', s.id, s.perihal);
      return d.langsung && sesi.role === 'ADMIN' ? RUTE['surat.proses']({ id: s.id, kirim: true }) : salin(s);
    },
    'surat.proses': d => {
      const s = cari(d.id), t = tpl(s.kode);
      if (s.status !== 'DIAJUKAN' && s.status !== 'DIPROSES') throw galat('STATUS_TIDAK_SESUAI', 'Status surat sudah berubah.');
      if (d.isian) s.isian = d.isian;
      s.status = 'DIPROSES';
      if (d.kirim) { const ts = d.tanggal_surat || hari(new Date()); s.tanggal_surat = ts; s.nomor = nomor(t, new Date(ts + 'T12:00:00')); s.status = 'MENUNGGU_VERIFIKASI'; if (d.pejabat_email) s.pejabat_email = d.pejabat_email; }
      versi++; catat('proses', s.id, d.kirim ? 'Nomor ' + s.nomor : 'Pemeriksaan disimpan'); return salin(s);
    },
    'surat.tolak': d => { const s = cari(d.id); s.status = 'DITOLAK'; s.catatan = d.catatan; s.verifikator = sesi.email; versi++; catat('tolak', s.id, d.catatan); return salin(s); },
    'surat.setujui': d => { const s = cari(d.id); s.status = 'TERBIT'; s.verifikator = sesi.email; s.waktu_verifikasi = new Date().toISOString(); s.tautan = location.origin + location.pathname + '?v=' + s.id + '.demo'; versi++; catat('verifikasi', s.id, 'Surat ' + s.nomor + ' terbit'); return salin(s); },
    'surat.batal': d => { const s = cari(d.id); s.status = 'DIBATALKAN'; s.catatan = d.alasan; s.tautan = ''; versi++; catat('batal', s.id, d.alasan); return salin(s); },
    'surat.unduh': d => { const s = cari(d.id); catat('unduh', s.id, s.nomor); return { nama: 'DEMO-' + s.nomor.replace(/\//g, '-') + '.pdf', mime: 'application/pdf', b64: PDF }; },
    'surat.pratinjau': d => ({ nama: 'PRATINJAU-' + d.id + '.pdf', mime: 'application/pdf', b64: PDF }),
    'template.pindai': d => { const t = DB.templates.find(x => x.id_template === d.id_template); return { id_template: d.id_template || 'DOKUMEN-CONTOH', nama: 'Template — Contoh', isian: t ? t.isian.map(x => x.k) : ['perihal', 'tujuan', 'isi_surat', 'tanggal_kegiatan'], sistem: ['nomor_surat', 'tanggal_surat', 'ttd', 'cap', 'qr'] }; },
    'template.simpan': d => { const t = salin(d); delete t.baru; t.kode = String(t.kode).toUpperCase(); const i = DB.templates.findIndex(x => x.kode === t.kode); if (i > -1) DB.templates[i] = t; else DB.templates.push(t); versi++; return salin(t); },
    'pengguna.simpan': d => { let p = DB.pengguna.find(x => x.email === d.email); if (!p) DB.pengguna.push(p = { email: d.email, tanggal: new Date().toISOString(), nama: '', asal: '' }); Object.assign(p, d); versi++; catat('ubah pengguna', '', d.email + ' -> ' + d.role + ' / ' + d.status); return salin(p); },
    'pejabat.simpan': d => { let p = DB.pejabat.find(x => x.email === d.email); if (!p) DB.pejabat.push(p = { email: d.email, ada_ttd: false, ada_cap: false }); Object.assign(p, { nama: d.nama, jabatan: d.jabatan, nip: d.nip, jenis_surat: d.jenis_surat }); if (d.ttd) p.ada_ttd = true; if (d.cap) p.ada_cap = true; versi++; return true; },
    'log.list': () => salin(DB.log),
    'migrasi.jalankan': d => ({ dryRun: d.dryRun !== false, nama: 'Database lama (contoh)', hasil: [{ sheet: 'Pengguna', sumber: 42, inserted: 37, updated: 2, skipped: 3 }, { sheet: 'Pengajuan', sumber: 310, inserted: 310, updated: 0, skipped: 0 }, { sheet: 'Log', tidakAda: true }] }),
    'verifikasi': d => {
      const id = String(d.kode || '').split('.')[0], s = DB.surat.find(x => x.id === id);
      if (!s || !s.nomor) return { sah: false };
      const r = { nomor: s.nomor, jenis: s.jenis, tanggal_surat: s.tanggal_surat, status: s.status };
      return s.status === 'TERBIT' ? Object.assign({ sah: true, penandatangan: DB.pejabat[0].nama + ', ' + DB.pejabat[0].jabatan }, r) : Object.assign({ sah: false }, r);
    }
  };

  window.DEMO_API = function (action, data, token) {
    return new Promise(ok => setTimeout(() => {
      try {
        if (!sesi && token) sesi = AKUN[String(token).replace('demo-', '')] || null;
        const publik = action === 'auth.config' || action === 'auth.login' || action === 'verifikasi';
        if (!publik && !sesi) throw galat('UNAUTHENTICATED', 'Sesi berakhir. Silakan masuk kembali.');
        if (!RUTE[action]) throw galat('ACTION_TIDAK_DIKENAL', 'Permintaan tidak dikenal.');
        ok({ success: true, data: RUTE[action](data || {}) });
      } catch (e) { ok({ success: false, code: e.code || 'ERROR', message: e.message }); }
    }, action === 'surat.setujui' ? 900 : 250));
  };
})();
