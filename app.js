/* Pramuka Mars — PWA latihan orientasi Pramuka di Mars (NASA Mars Trek + HiRISE). */
(function () {
  "use strict";
  const R_MARS = 3389.5; // km, jari-jari rata-rata Mars
  const KM_PER_DERAJAT = (2 * Math.PI * R_MARS) / 360; // ±59,16 km
  const rad = (d) => (d * Math.PI) / 180, deg = (r) => (r * 180) / Math.PI;
  const $ = (s) => document.querySelector(s);
  const fmt = (n, d = 0) => n.toLocaleString("id-ID", { maximumFractionDigits: d, minimumFractionDigits: d });

  // ---------- geometri bola Mars
  function jarakKm(a, b) {
    const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return 2 * R_MARS * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  function arah(a, b) { // arah kompas awal (derajat dari utara, searah jarum jam)
    const y = Math.sin(rad(b.lon - a.lon)) * Math.cos(rad(b.lat));
    const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lon - a.lon));
    return (deg(Math.atan2(y, x)) + 360) % 360;
  }
  const selisihSudut = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
  const koordTeks = (lat, lon) => `${fmt(Math.abs(lat), 2)}° ${lat >= 0 ? "LU" : "LS"}, ${fmt(Math.abs(lon), 2)}° ${lon >= 0 ? "BT" : "BB"}`;
  const MATA_ANGIN = ["U", "TL", "T", "TG", "S", "BD", "B", "BL"];
  const mataAngin = (b) => MATA_ANGIN[Math.round(b / 45) % 8];

  // ---------- penyimpanan (aman bila localStorage tidak tersedia)
  const KUNCI = "pramuka-mars-v1";
  let skor = {};
  try { skor = JSON.parse(localStorage.getItem(KUNCI) || "{}") || {}; } catch (e) { skor = {}; }
  function simpan() { try { localStorage.setItem(KUNCI, JSON.stringify(skor)); } catch (e) { /* mode privat */ } perbaruiTotal(); }
  function perbaruiTotal() { $("#totalBintang").textContent = "★ " + Object.values(skor).reduce((a, b) => a + b, 0); }

  function toast(t) { const el = $("#toast"); el.textContent = t; el.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(() => (el.hidden = true), 2600); }

  // ---------- peta (proyeksi ekuirektangular, cocok dengan ubin Mars Trek "default028mm")
  const peta = L.map("peta", { crs: L.CRS.EPSG4326, minZoom: 0, maxZoom: 9, zoomSnap: 0.5, worldCopyJump: false,
    maxBounds: [[-95, -200], [95, 200]], attributionControl: true, zoomControl: true });
  const TREK = "https://trek.nasa.gov/tiles/Mars/EQ/";
  const atrib = 'Peta: <a href="https://trek.nasa.gov/mars/" target="_blank" rel="noopener">NASA Mars Trek</a>';
  const lapisan = {
    viking: L.tileLayer(TREK + "Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg",
      { maxNativeZoom: 7, maxZoom: 9, noWrap: true, bounds: [[-90, -180], [90, 180]], attribution: atrib + " · Viking MDIM2.1 (NASA/USGS)" }),
    mola: L.tileLayer(TREK + "Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg",
      { maxNativeZoom: 6, maxZoom: 9, noWrap: true, bounds: [[-90, -180], [90, 180]], attribution: atrib + " · MOLA (NASA/MGS)" }),
  };
  let gagalUbin = 0;
  Object.values(lapisan).forEach((l) => l.on("tileerror", () => { if (++gagalUbin === 6) toast("Sebagian ubin peta gagal dimuat. Periksa koneksi internet."); }));
  lapisan.viking.addTo(peta);
  peta.fitBounds([[-60, -180], [60, 180]]);
  function pilihLapisan(nama) {
    Object.entries(lapisan).forEach(([k, l]) => (k === nama ? l.addTo(peta) : peta.removeLayer(l)));
    document.querySelectorAll(".lapisan button").forEach((b) => b.classList.toggle("on", b.dataset.lapis === nama));
  }
  document.querySelectorAll(".lapisan button").forEach((b) => (b.onclick = () => pilihLapisan(b.dataset.lapis)));

  // grid koordinat setiap 30°
  const grid = L.layerGroup().addTo(peta);
  for (let lat = -60; lat <= 60; lat += 30) {
    L.polyline([[lat, -180], [lat, 180]], { color: lat === 0 ? "#fde047" : "#fff", weight: lat === 0 ? 1.2 : 0.6, opacity: 0.5, interactive: false, dashArray: lat === 0 ? null : "4 6" }).addTo(grid);
    L.marker([lat, -178], { icon: L.divIcon({ className: "", html: `<span style="color:#fff;font:600 10px system-ui;text-shadow:0 0 3px #000">${lat === 0 ? "0°" : Math.abs(lat) + "°" + (lat > 0 ? "LU" : "LS")}</span>` }), interactive: false }).addTo(grid);
  }
  for (let lon = -150; lon <= 180; lon += 30) {
    L.polyline([[-90, lon], [90, lon]], { color: lon === 0 ? "#fde047" : "#fff", weight: lon === 0 ? 1.2 : 0.6, opacity: 0.5, interactive: false, dashArray: lon === 0 ? null : "4 6" }).addTo(grid);
    if (lon < 180) L.marker([-56, lon + 1], { icon: L.divIcon({ className: "", html: `<span style="color:#fff;font:600 10px system-ui;text-shadow:0 0 3px #000">${lon === 0 ? "0°" : Math.abs(lon) + "°" + (lon > 0 ? "BT" : "BB")}</span>` }), interactive: false }).addTo(grid);
  }

  // skala peta khusus Mars (Leaflet bawaan memakai ukuran Bumi)
  const Skala = L.Control.extend({
    options: { position: "bottomleft" },
    onAdd() { this._d = L.DomUtil.create("div", "skala-mars"); peta.on("zoomend moveend", () => this.update()); this.update(); return this._d; },
    update() {
      const lat = peta.getCenter().lat, z = peta.getZoom();
      const kmPerPx = (180 / (256 * 2 ** z)) * KM_PER_DERAJAT * Math.cos(rad(lat));
      const maksKm = kmPerPx * 110;
      const pangkat = 10 ** Math.floor(Math.log10(maksKm)), opsi = [1, 2, 5, 10].map((m) => m * pangkat);
      const km = opsi.filter((o) => o <= maksKm).pop() || pangkat;
      this._d.style.width = Math.round(km / kmPerPx) + "px";
      this._d.textContent = fmt(km) + " km";
    },
  });
  new Skala().addTo(peta);
  // tampilkan koordinat kursor/ketukan terakhir
  const Koord = L.Control.extend({ options: { position: "bottomleft" },
    onAdd() { this._d = L.DomUtil.create("div", "skala-mars"); this._d.style.border = "0"; this._d.style.borderRadius = "6px"; this._d.textContent = "Ketuk peta untuk melihat koordinat"; return this._d; } });
  const koord = new Koord().addTo(peta);
  peta.on("mousemove click", (e) => (koord._d.textContent = koordTeks(e.latlng.lat, e.latlng.lng)));

  // ---------- lapisan misi
  const lapisMisi = L.layerGroup().addTo(peta);
  const pin = (emoji) => L.divIcon({ className: "pin", html: `<div>${emoji}</div>`, iconSize: [24, 24], iconAnchor: [12, 22] });
  function tandaSitus(key, emoji = "🚩", popup = true) {
    const s = SITUS[key];
    const m = L.marker([s.lat, s.lon], { icon: pin(emoji) }).addTo(lapisMisi);
    m.bindTooltip(s.nama, { permanent: true, direction: "right", className: "label-situs", offset: [8, -10] });
    if (popup) m.bindPopup(popupSitus(key));
    return m;
  }
  function popupSitus(key) {
    const s = SITUS[key];
    return `<b>${s.nama}</b><br><small>${koordTeks(s.lat, s.lon)}</small><p style="margin:6px 0">${s.info}</p>` +
      (s.hirise ? `<a href="${s.hirise}" target="_blank" rel="noopener">📷 ${s.hiriseJudul}</a><br><small>NASA/JPL-Caltech/UArizona</small>` : "");
  }
  function mawarKompas(latlng) {
    let t = "";
    for (let d = 0; d < 360; d += 10) {
      const p = d % 90 === 0 ? 22 : d % 30 === 0 ? 14 : 8, a = rad(d);
      t += `<line x1="${Math.sin(a) * (100 - p)}" y1="${-Math.cos(a) * (100 - p)}" x2="${Math.sin(a) * 100}" y2="${-Math.cos(a) * 100}" stroke="#fff" stroke-width="${d % 90 ? 1.2 : 2.5}"/>`;
      if (d % 30 === 0) t += `<text x="${Math.sin(a) * 118}" y="${-Math.cos(a) * 118 + 4}" fill="#fde047" font-size="12" font-weight="700" text-anchor="middle">${d}°</text>`;
    }
    t += `<text x="0" y="-76" fill="#fff" font-size="16" font-weight="800" text-anchor="middle">U</text><circle r="100" fill="rgba(28,25,23,.25)" stroke="#fff" stroke-width="1.5"/>`;
    const sz = peta.getSize(), d = Math.round(Math.max(150, Math.min(260, Math.min(sz.x, sz.y) * 0.75)));
    const svg = `<svg width="${d}" height="${d}" viewBox="-130 -130 260 260">${t}</svg>`;
    return L.marker(latlng, { icon: L.divIcon({ className: "mawar", html: svg, iconSize: [d, d], iconAnchor: [d / 2, d / 2] }), interactive: false }).addTo(lapisMisi);
  }

  // ---------- UI
  let tabAktif = "misi", misiAktif = null, klikPeta = null, tebakan = null;
  peta.on("click", (e) => klikPeta && klikPeta(e.latlng));
  document.querySelectorAll(".tabs button").forEach((b) => (b.onclick = () => bukaTab(b.dataset.tab)));
  function bukaTab(t) {
    tabAktif = t; misiAktif = null; klikPeta = null; lapisMisi.clearLayers();
    document.querySelectorAll(".tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === t));
    ({ misi: tabMisi, jelajah: tabJelajah, lencana: tabLencana, tentang: tabTentang })[t]();
    setTimeout(() => peta.invalidateSize(), 50);
  }
  const pane = $("#pane");
  const bintangHtml = (n) => `<span class="bintang">${"★".repeat(n)}<span class="kosong">${"★".repeat(3 - n)}</span></span>`;

  function tabMisi() {
    const selesai = MISI.filter((m) => skor[m.id]).length;
    pane.innerHTML = `<h2>Misi Orientasi Mars</h2><p>Selesaikan ${MISI.length} misi untuk meraih lencana <b>Pramuka Mars Utama</b>. Selesai: ${selesai}/${MISI.length}.</p>
      <div class="daftar">${MISI.map((m, i) => `<button class="kartu" data-id="${m.id}"><span class="ik">${m.ikon}</span><b>${i + 1}. ${m.judul}</b>${bintangHtml(skor[m.id] || 0)}</button>`).join("")}</div>`;
    pane.querySelectorAll(".kartu").forEach((k) => (k.onclick = () => mulaiMisi(k.dataset.id)));
    peta.flyToBounds([[-60, -180], [60, 180]], { duration: 0.6 });
  }

  function mulaiMisi(id) {
    const m = MISI.find((x) => x.id === id); misiAktif = m; tebakan = null; lapisMisi.clearLayers(); klikPeta = null;
    if (m.lapisan) pilihLapisan(m.lapisan);
    let input = "";
    if (m.jenis === "tandai") {
      input = `<p class="kecil">Ketuk peta untuk menaruh bendera 🚩. Perbesar peta agar lebih teliti.</p><div class="baris"><span id="posisi" class="kecil">Belum ada bendera.</span></div>
        <div class="baris"><button class="btn" id="kirim" disabled>Kirim jawaban</button><button class="btn sek" id="petunjuk">Petunjuk</button><button class="btn sek" id="kembali">Kembali</button></div>`;
      peta.flyToBounds([[-60, -180], [60, 180]], { duration: 0.6 });
      klikPeta = (ll) => {
        tebakan = { lat: ll.lat, lon: ll.lng };
        lapisMisi.clearLayers(); L.marker(ll, { icon: pin("🚩") }).addTo(lapisMisi);
        $("#posisi").textContent = "Bendera di " + koordTeks(ll.lat, ll.lng); $("#kirim").disabled = false;
      };
    } else if (m.jenis === "kompas" || m.jenis === "jarak") {
      const a = SITUS[m.dari], b = SITUS[m.ke];
      tandaSitus(m.dari, "🏕️", false); tandaSitus(m.ke, "🎯", false);
      L.polyline([[a.lat, a.lon], [b.lat, b.lon]], { color: "#fde047", weight: 3, dashArray: "8 8" }).addTo(lapisMisi);
      peta.flyToBounds(L.latLngBounds([[a.lat, a.lon], [b.lat, b.lon]]).pad(m.jenis === "kompas" ? 0.6 : 0.5), { duration: 0.6 });
      if (m.jenis === "kompas") peta.once("moveend", () => mawarKompas([a.lat, a.lon]));
      const sat = m.jenis === "kompas" ? "derajat" : "km";
      input = `<div class="baris"><label>Jawaban: <input type="number" id="jawab" inputmode="decimal" min="0" ${m.jenis === "kompas" ? 'max="360"' : ""} step="any"> ${sat}</label></div>
        <div class="baris"><button class="btn" id="kirim">Kirim jawaban</button><button class="btn sek" id="petunjuk">Petunjuk</button><button class="btn sek" id="kembali">Kembali</button></div>`;
    } else if (m.jenis === "sandi") {
      input = `<div class="baris"><label>Terjemahan: <input type="text" id="jawab" autocomplete="off" autocapitalize="characters"></label></div>
        <div class="baris"><button class="btn" id="kirim">Kirim jawaban</button><button class="btn sek" id="petunjuk">Petunjuk</button><button class="btn sek" id="kembali">Kembali</button></div>
        <div class="tabel-morse">${Object.entries(MORSE).map(([h, s]) => `<span><b>${h}</b> ${s}</span>`).join("")}</div>`;
    }
    setTimeout(() => peta.invalidateSize(), 50);
    pane.innerHTML = `<h2>${m.ikon} ${m.judul}</h2><div class="tugas">${m.tugas}</div>${input}<div id="hasil"></div><p class="ilmu">${m.ilmu}</p>`;
    $("#kembali").onclick = () => bukaTab("misi");
    $("#petunjuk").onclick = () => toast("Petunjuk: " + m.petunjuk);
    $("#kirim").onclick = () => nilai(m);
    const j = $("#jawab"); if (j) j.addEventListener("keydown", (e) => e.key === "Enter" && nilai(m));
  }

  function bintangDari(err, batas) { return err <= batas[0] ? 3 : err <= batas[1] ? 2 : err <= batas[2] ? 1 : 0; }

  function nilai(m) {
    let n = 0, pesan = "", kunci = "";
    if (m.jenis === "tandai") {
      if (!tebakan) return;
      const s = SITUS[m.target], e = jarakKm(tebakan, s);
      n = bintangDari(e, m.skor);
      pesan = `Benderamu berjarak <b>${fmt(e)} km</b> dari ${s.nama}.`;
      kunci = `Lokasi sebenarnya: ${koordTeks(s.lat, s.lon)}.`;
      const t = tandaSitus(m.target, "⭐"); L.polyline([[tebakan.lat, tebakan.lon], [s.lat, s.lon]], { color: "#fff", weight: 1.5, dashArray: "3 5" }).addTo(lapisMisi);
      peta.flyToBounds(L.latLngBounds([[tebakan.lat, tebakan.lon], [s.lat, s.lon]]).pad(0.8), { duration: 0.8, maxZoom: 6 });
      setTimeout(() => t.openPopup(), 900);
      klikPeta = null;
    } else if (m.jenis === "kompas") {
      const v = parseFloat($("#jawab").value); if (isNaN(v)) return toast("Isi jawaban dalam derajat (0–360).");
      const benar = arah(SITUS[m.dari], SITUS[m.ke]), e = selisihSudut(v, benar);
      n = bintangDari(e, m.skor);
      pesan = `Jawabanmu ${fmt(v)}°, meleset <b>${fmt(e)}°</b>.`;
      kunci = `Arah sebenarnya ±${fmt(benar)}° (${mataAngin(benar)}).`;
    } else if (m.jenis === "jarak") {
      const v = parseFloat($("#jawab").value); if (isNaN(v) || v <= 0) return toast("Isi jawaban dalam kilometer.");
      const benar = jarakKm(SITUS[m.dari], SITUS[m.ke]), e = (Math.abs(v - benar) / benar) * 100;
      n = bintangDari(e, m.skor);
      pesan = `Jawabanmu ${fmt(v)} km, selisih <b>${fmt(e)}%</b>.`;
      kunci = `Jarak sebenarnya ±${fmt(benar)} km (lintasan lingkaran besar di permukaan Mars).`;
    } else if (m.jenis === "sandi") {
      const v = ($("#jawab").value || "").trim().toUpperCase().replace(/\s+/g, "");
      n = v === m.jawaban ? 3 : 0;
      pesan = n ? "Sandi berhasil diterjemahkan!" : "Belum tepat. Cocokkan tiap kelompok titik-garis dengan tabel.";
      kunci = n ? "Jezero adalah tujuan rover Perseverance. Ketuk tab Jelajah untuk melihatnya." : "";
    }
    const lama = skor[m.id] || 0;
    if (n > lama) { skor[m.id] = n; simpan(); }
    const ok = n > 0;
    $("#hasil").innerHTML = `<div class="hasil ${ok ? "ok" : "coba"}"><div class="big">${bintangHtml(n)}</div><p>${pesan}</p>${ok ? `<p>${kunci}</p>` : "<p>Coba lagi, kamu pasti bisa!</p>"}
      <div class="baris">${ok ? `<button class="btn" id="lanjut">Misi berikutnya</button>` : ""}<button class="btn sek" id="ulang">Ulangi</button></div></div>`;
    $("#ulang").onclick = () => mulaiMisi(m.id);
    if (ok) {
      const i = MISI.indexOf(m);
      $("#lanjut").onclick = () => (i + 1 < MISI.length ? mulaiMisi(MISI[i + 1].id) : bukaTab("lencana"));
      if (!lama) toast(`🏅 Lencana baru: ${m.lencana}`);
      if (MISI.every((x) => skor[x.id]) && !lama) setTimeout(() => toast("🎖️ Selamat! Kamu meraih lencana Pramuka Mars Utama"), 2800);
    }
  }

  // ---------- Jelajah bebas + alat ukur
  function tabJelajah() {
    Object.keys(SITUS).forEach((k) => tandaSitus(k));
    pane.innerHTML = `<h2>Jelajah Bebas</h2><p>Ketuk bendera untuk membaca kisah tiap lokasi. Gunakan <b>alat ukur</b> untuk berlatih menghitung jarak dan arah sendiri.</p>
      <div class="baris"><button class="btn" id="ukurBtn">📐 Mulai mengukur</button></div><div id="ukurHasil" class="ukur" hidden></div>
      <h3>Lokasi</h3><div class="daftar">${Object.entries(SITUS).map(([k, s]) => `<button class="kartu" data-k="${k}"><b>${s.nama}</b><span class="kecil">${koordTeks(s.lat, s.lon)}</span></button>`).join("")}</div>`;
    pane.querySelectorAll(".kartu").forEach((b) => (b.onclick = () => { const s = SITUS[b.dataset.k]; peta.flyTo([s.lat, s.lon], 5, { duration: 0.8 }); setTimeout(() => L.popup().setLatLng([s.lat, s.lon]).setContent(popupSitus(b.dataset.k)).openOn(peta), 900); }));
    let titik = [], garis = null, mk = [];
    $("#ukurBtn").onclick = () => {
      titik = []; mk.forEach((x) => lapisMisi.removeLayer(x)); mk = []; if (garis) lapisMisi.removeLayer(garis);
      const out = $("#ukurHasil"); out.hidden = false; out.textContent = "Ketuk titik awal di peta.";
      klikPeta = (ll) => {
        titik.push({ lat: ll.lat, lon: ll.lng }); mk.push(L.marker(ll, { icon: pin(titik.length === 1 ? "🏕️" : "🎯") }).addTo(lapisMisi));
        if (titik.length === 1) { out.textContent = "Ketuk titik tujuan."; return; }
        const [a, b] = titik; garis = L.polyline([[a.lat, a.lon], [b.lat, b.lon]], { color: "#fde047", weight: 3, dashArray: "8 8" }).addTo(lapisMisi);
        const br = arah(a, b);
        out.innerHTML = `Jarak: <b>${fmt(jarakKm(a, b))} km</b> · Arah: <b>${fmt(br)}° (${mataAngin(br)})</b><br><span class="kecil">Dengan kecepatan rover Perseverance ±150 m/jam (perkiraan), perjalanan ini butuh ±${fmt(jarakKm(a, b) / 0.15 / 24)} hari tanpa henti.</span>`;
        klikPeta = null;
      };
    };
  }

  function tabLencana() {
    const semua = MISI.every((m) => skor[m.id]);
    pane.innerHTML = `<h2>Lencana Kecakapan</h2><p>Raih lencana dengan menyelesaikan misi (minimal ★1). Bintang tertinggi tersimpan di perangkat ini.</p>
      <div class="lencana-grid">${MISI.map((m) => `<div class="lencana ${skor[m.id] ? "dapat" : ""}"><div class="emblem">${m.ikon}</div><b>${m.lencana}</b><small>${skor[m.id] ? bintangHtml(skor[m.id]) : "Belum diraih"}</small></div>`).join("")}
      <div class="lencana ${semua ? "dapat" : ""}"><div class="emblem">🎖️</div><b>Pramuka Mars Utama</b><small>${semua ? "Semua misi selesai!" : "Selesaikan semua misi"}</small></div></div>
      <div class="baris" style="margin-top:12px"><button class="btn sek" id="reset">Mulai ulang dari nol</button></div>`;
    $("#reset").onclick = () => { if (Object.keys(skor).length && window.confirm("Hapus semua bintang dan lencana?")) { skor = {}; simpan(); tabLencana(); } };
  }

  function tabTentang() {
    pane.innerHTML = `<h2>Tentang Pramuka Mars</h2>
      <p>Keterampilan orientasi Pramuka (membaca koordinat, kompas, skala peta, dan sandi) adalah keterampilan yang sama yang dipakai perencana misi NASA saat menjelajah Mars. Aplikasi ini mengajak anggota Pramuka dan siswa SMP berlatih di peta Mars sungguhan.</p>
      <h3>Sumber data</h3>
      <ul class="kecil">
        <li>Ubin peta: <a href="https://trek.nasa.gov/mars/" target="_blank" rel="noopener">NASA Mars Trek</a> (NASA/JPL-Caltech, layanan WMTS).</li>
        <li>Mozaik warna Viking MDIM2.1 232 m (NASA/USGS Astrogeology), relief warna MOLA 463 m (NASA Mars Global Surveyor).</li>
        <li>Foto resolusi tinggi: <a href="https://www.uahirise.org/" target="_blank" rel="noopener">HiRISE</a>, kredit NASA/JPL-Caltech/UArizona (domain publik).</li>
        <li>Koordinat situs pendaratan adalah perkiraan dari publikasi misi NASA, untuk keperluan latihan.</li>
      </ul>
      <h3>Cara memasang</h3>
      <p class="kecil">Buka di Chrome ponsel, lalu pilih menu ⋮ → <b>Tambahkan ke layar utama</b>. Setelah pernah dibuka, aplikasi tetap bisa dipakai tanpa internet (ubin peta yang pernah dilihat ikut tersimpan).</p>
      <p class="kecil">Dibuat sebagai latihan tim Program Studi Sistem Informasi, Fakultas Teknik, Universitas Widyatama untuk NASA Space Apps Challenge 2026 (challenge <i>Interplanetary Survival Guide: Martian Map</i>). Bukan aplikasi resmi NASA maupun Gerakan Pramuka.</p>`;
  }

  // ---------- offline & service worker
  const cekOnline = () => ($("#offline").hidden = navigator.onLine);
  window.addEventListener("resize", () => peta.invalidateSize()); window.addEventListener("online", cekOnline); window.addEventListener("offline", cekOnline); cekOnline();
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => { try { navigator.serviceWorker.register("sw.js").catch(() => {}); } catch (e) { /* abaikan */ } });
  }

  perbaruiTotal();
  bukaTab("misi");
  window.__pramuka = { jarakKm, arah, SITUS, peta }; // untuk pengujian otomatis // untuk pengujian
})();
