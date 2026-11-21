# Statistictable — Dokumen Desain

Tanggal: 2026-11-22
Status: menunggu persetujuan
Pemilik: pengguna (pemakaian pribadi, dipublikasikan sebagai situs statis)

---

## 1. Intent dan alasannya

Saat ini untuk mencari satu nilai kritis, pemilik proyek membuka mesin pencari,
memilih satu tabel statistik dari hasil pencarian, lalu membacanya — berulang
untuk setiap uji dan setiap nilai. Tabel yang ditemukan berupa gambar atau PDF
hasil scan buku, sering buram, tidak bisa dicari, dan tidak konsisten antar
sumber.

Yang dibangun: satu situs yang memuat tabel-tabel statistik parametrik dan
nonparametrik secara lengkap, dengan dua cara pakai pada layar yang sama —
**grid penuh seperti buku** (untuk dibaca, dicetak, dilampirkan) dan **kotak
cari nilai** (masukkan df/α, langsung dapat angka yang dicari).

Yang membuatnya berbeda dari tabel PDF di internet: angkanya dihitung dari
rumus distribusinya, sehingga presisi dan jangkauan parameter tidak dibatasi
oleh apa yang tercetak di buku, dan setiap tabel punya halaman panduan singkat
cara membacanya.

## 2. Goals

1. Menemukan nilai kritis apa pun dalam maksimal tiga interaksi: buka situs →
   pilih/cari tabel → isi parameter.
2. Tabel lengkap: 26 tabel (daftar di §6), parametrik dan nonparametrik.
3. Tampilan grid yang bisa dicetak rapi ke A4 dan diunduh CSV.
4. Angka dapat dipercaya: setiap nilai yang dihitung diuji terhadap nilai tabel
   buku yang dipublikasikan.
5. Nyaman di HP (dipakai di kelas/lab) dan bisa dibuka offline setelah kunjungan
   pertama.

## 3. Non-goals (v1)

- **Bukan** aplikasi hitung statistik. Tidak ada input data mentah → uji →
  output. Hanya tabel dan nilai kritis.
- Tanpa login, akun, sinkronisasi, atau basis data.
- Tanpa mode gelap (desain putih dulu; ditambahkan nanti kalau diminta).
- Tanpa versi bahasa Inggris. UI berbahasa Indonesia, nama uji memakai istilah
  standar (Mann-Whitney, Kruskal-Wallis, dst.).
- Tanpa iklan dan tanpa analitik pihak ketiga.

## 4. Anti-goals (dianggap gagal walau teknisnya jalan)

- Angka yang berbeda dari tabel buku tanpa penjelasan. Kalau metode komputasi
  menghasilkan nilai berbeda, halaman tabel harus menyebutkannya.
- Grid yang harus di-zoom di HP karena lebar tetap.
- Situs yang butuh internet setiap kali dibuka.
- Tabel yang tidak punya keterangan satu-ekor/dua-ekor, karena inilah kesalahan
  pemakaian paling umum.

## 5. Pendekatan

### 5.1 Arah visual (dipilih: B — Editorial Minimal)

Tiga arah disiapkan dan ditunjukkan di browser: A Klasik Akademik (serif, garis
tipis), B Editorial Minimal (ruang kosong, angka besar), C Card Dashboard
(sidebar + kartu). Pengguna memilih **B**.

Alasan B cocok: tabel adalah konten padat angka; semakin sedikit chrome, semakin
mudah mata menemukan sel. Hijau dan emas dipakai hemat sebagai penanda, bukan
sebagai dekorasi, sehingga tetap "minimalis dominan putih".

Yang ditinggalkan dari A dan C: serif badan teks ala buku (A) dan sidebar
kategori permanen (C) memakan ruang horizontal yang dibutuhkan tabel di HP.
Kategori tetap ada, tapi sebagai baris tab di atas judul, bukan sidebar.

### 5.2 Arsitektur data (dipilih: komputasi runtime + kurasi untuk tabel tertentu)

Alternatif yang dipertimbangkan:

1. **Scan/gambar tabel** seperti sumber aslinya — cepat dibuat, tapi tidak bisa
   dicari, tidak presisi, tidak bisa dicetak tajam. Ditolak.
2. **JSON hasil generate saat build** — cepat dibuka, tapi jangkauan df/α
   terbatas pada yang di-generate, dan lookup "df apa pun" jadi tidak mungkin.
   Ditolak sebagai satu-satunya sumber.
3. **Modul matematika murni di runtime** (dipilih) — satu set fungsi distribusi
   dipakai bersama oleh grid dan kotak cari. Grid dirender sesuai permintaan
   (df 1–200 tetap instan), lookup menerima df berapa pun.

Karena beberapa tabel standar (Durbin-Watson, Tukey q, Dunnett, Shapiro-Wilk,
Lillefors, Hartley F-max) berbasis simulasi dan tidak punya bentuk tertutup
sederhana, tabel-tabel itu **dikurasi** sebagai data JSON dari tabel
terpublikasi, dengan sumber dicantumkan di halaman tabelnya. Sisanya dihitung.

## 6. Inventaris tabel

26 halaman tabel. Kolom **hasil** menentukan bentuk kotak hasil di §8.2.

### Parametrik (12)

| # | Tabel | Parameter | Hasil | Metode |
|---|-------|-----------|-------|--------|
| 1 | z — normal standar | α, ekor | satu angka | hitung (Φ⁻¹) |
| 2 | t — Student | df, α, ekor | satu angka | hitung (inverse incomplete beta) |
| 3 | F — Fisher | df1, df2, α | satu angka | hitung (inverse incomplete beta) |
| 4 | χ² — Chi-square | df, α | satu angka | hitung (inverse incomplete gamma) |
| 5 | r — Pearson | df, α | satu angka | hitung (transformasi t) |
| 6 | Binomial | n, p, k | peluang | hitung (kumulatif eksak) |
| 7 | Poisson | λ, k | peluang | hitung (kumulatif eksak) |
| 8 | Durbin-Watson | n, k, α | pasangan (dL, dU) | kurasi |
| 9 | q — Tukey HSD | k, df, α | satu angka | kurasi |
| 10 | Dunnett | k, df, α | satu angka | kurasi |
| 11 | F-max (Hartley) | k, df, α | satu angka | kurasi |
| 12 | Toleransi (k-factor) | n, γ, P, sisi | satu angka | kurasi |

### Nonparametrik (14)

| # | Tabel | Parameter | Hasil | Metode |
|---|-------|-----------|-------|--------|
| 13 | U — Mann-Whitney | n1, n2, α, ekor | satu angka | hitung (eksak ≤20, normal approx di atasnya) |
| 14 | T — Wilcoxon | n, α, ekor | satu angka | hitung (eksak ≤25, normal approx di atasnya) |
| 15 | H — Kruskal-Wallis | k, n per grup, α | satu angka | hitung (approx χ²) |
| 16 | χ²r — Friedman | k, n, α | satu angka | hitung (approx χ²) |
| 17 | ρ — Spearman | n, α, ekor | satu angka | hitung (permutasi eksak ≤10, approx t) |
| 18 | τ — Kendall | n, α, ekor | satu angka | hitung (approx normal) |
| 19 | W — Kendall (concordance) | k, n, α | satu angka | hitung (approx χ²) |
| 20 | D — K-S satu sampel | n, α | satu angka | hitung (eksak kecil, asymptotik besar) |
| 21 | D — K-S dua sampel | n1, n2, α | satu angka | hitung (asymptotik) |
| 22 | W — Shapiro-Wilk | n, α | satu angka | kurasi |
| 23 | L — Lillefors | n, α | satu angka | kurasi |
| 24 | Q — Cochran | k, n, α | satu angka | hitung (approx χ²) |
| 25 | Sign test & McNemar | n, α, ekor | satu angka | hitung (binomial eksak) |
| 26 | Runs test (Wald-Wolfowitz) | n1, n2, α | pasangan (r bawah, r atas) | hitung (approx normal) |

Catatan: **Sign test dan McNemar satu halaman dengan dua mode**, karena
keduanya memakai distribusi binomial yang sama; McNemar memakai jumlah pasangan
diskordan sebagai n. Menambah tabel baru = satu entri registry + modul
matematika/kurasi + panduan; layout tidak berubah.

### 6.1 Aturan grid: satu grid per halaman

Setiap halaman menampilkan **satu grid**, bukan satu grid per α. Parameter
pembeda dipilih di atas grid sebagai tab/selector dan disimpan di URL:

- **α** menjadi tab di atas grid (mis. `α .05 | .01`), kecuali tabel yang
  memang berkolom α (z, t, r).
- **Ekor** (one/two-tailed) menjadi toggle di kotak cari dan memengaruhi
  angka; grid menampilkan dua-ekor sebagai default dengan keterangan jelas.
- **F** (dua dimensi df) memakai α sebagai tab, df1 sebagai baris, df2 sebagai
  kolom — persis seperti tabel buku.

Jangkauan grid sengaja dibatasi seperti buku, karena grid untuk dibaca dan
dicetak, sedangkan nilai di luar jangkauan tetap bisa dicari lewat kotak cari
(tabel hitung):

| Tabel | Jangkauan grid |
|---|---|
| z | baris 0.0–3.9, kolom desimal kedua 0.00–0.09 |
| t | df 1–100, lalu 120, 200, ∞ |
| F | df1 1–20 × df2 1–60, per α |
| χ² | df 1–100 |
| r | df 1–100 |
| Binomial | satu n per tampilan (n 2–25), baris k, kolom p |
| Poisson | satu λ per tampilan (λ 0.1–10), baris k 0–20 |
| DW | n 6–100, k 1–5, per α |
| Tukey q | k 2–10, df 1–60, per α |
| Dunnett | k 2–10, df 1–60, per α |
| F-max | k 2–10, df 1–60, per α |
| Toleransi | n 2–50, per γ/P |
| U | n1, n2 ≤ 20 (bagian eksak) |
| Wilcoxon T | n 5–25 |
| Kruskal-Wallis H | k 3–10, n per grup 2–10 |
| Friedman | k 3–10, n 2–30 |
| Spearman ρ | n 4–30 |
| Kendall τ | n 4–30 |
| Kendall W | k 3–10, n 2–10 |
| K-S satu sampel | n 1–50 |
| K-S dua sampel | n1, n2 ≤ 20 |
| Cochran Q | k 3–10 |
| Sign/McNemar | n 1–50 |
| Runs | n1, n2 ≤ 20 |
| Shapiro-Wilk | n 3–50 |
| Lillefors | n 4–30 |

### 6.2 Tabel kurasi dan nilai di luar tabel

Kotak cari pada tabel kurasi bekerja begini, dan ini ditulis di halaman tabel:

1. Parameter persis ada di tabel sumber → tampilkan nilai tabel, tanpa tanda.
2. Parameter di antara dua titik tabel → **interpolasi linear** pada sumbu
   terdekat, angka diberi awalan `≈` dan keterangan "interpolasi antar nilai
   tabel".
3. Parameter di luar jangkauan tabel sumber → **tidak menampilkan angka**;
   pesan "di luar jangkauan tabel" + arahkan ke grid.

Tidak ada angka kurasi yang dihasilkan dari aproksimasi tanpa label `≈`.

### 6.3 Arketipe kedua: tabel peluang (Binomial & Poisson)

Binomial dan Poisson bukan tabel nilai kritis — tidak punya α atau ekor.
Keduanya memakai arketipe halaman "tabel peluang":

- Grid: baris = k, kolom = p (Binomial) atau λ (Poisson); n (atau λ) dipilih
  di atas grid.
- Kotak cari menerima n/λ dan k, lalu mengembalikan dua angka: `P(X = k)` dan
  `P(X ≤ k)`, dengan keterangan mana yang mana.
- Tidak ada baris yang di-highlight dari kotak cari untuk tabel ini; cukup
  angka hasilnya.

## 7. Stack dan struktur

- **Vite + React 19 + TypeScript**, situs statis (tanpa server).
- **Tailwind CSS v4** untuk styling.
- **shadcn/ui** untuk komponen interaktif: Command (pencarian ⌘K), Select,
  Input, Button, Dialog, Tooltip, Tabs, Sonner (toast). Tema di-override ke
  palet proyek; komponen yang tidak dipakai tidak di-install.
- **Font**: Inter (UI) + Instrument Serif (judul dan angka hasil), di-self-host
  lewat `@fontsource` agar tetap jalan offline.
- **PWA**: `vite-plugin-pwa`, precache shell + data tabel; installable di HP.
- **Deploy**: **Vercel** sebagai target utama (rewrite SPA untuk deep link
  `?df=30`). Kalau nanti pindah ke GitHub Pages, tambahkan `404.html` sebagai
  fallback route dan sesuaikan `base` + scope PWA — bukan sekadar ganti config.
- **Test**: Vitest untuk modul matematika, dengan fixture nilai tabel buku.

```
src/
  lib/dist/          # normal, studentT, fisherF, chiSquare, binomial,
                     # poisson, mannWhitney, wilcoxon, spearman, kendall,
                     # ks, runs  (fungsi murni, tanpa React)
  lib/tables/        # registry: id, nama, grup, parameter, renderer, panduan
  lib/tables/curated/ # JSON tabel kurasi + catatan sumber
  components/        # TableShell, LookupBar, TableGrid, GuidePanel, ...
  pages/             # Home, TablePage, About
  data/guides/       # teks panduan per tabel
```

## 8. Layar dan perilaku

### 8.1 Beranda (`/`)

- Judul besar, satu baris pencarian besar ("Cari tabel: t, Mann-Whitney, χ²…").
- Baris tab kategori: **Semua · Parametrik · Nonparametrik**.
- Daftar tabel sebagai kartu tipis: simbol besar (t, F, U), nama, satu baris
  keterangan. Bukan grid kartu berbayang — cukup garis pemisah, sesuai arah B.
- "Terakhir dibuka" dari localStorage, maksimal 5, di atas daftar.

### 8.2 Halaman tabel (`/t/:id`)

Urutan dari atas ke bawah:

1. Breadcrumb kecil: `Parametrik / t`.
2. Judul: `Tabel t` + subjudul satu baris.
3. **Kotak cari nilai** sebaris: label kecil uppercase, input bergaris bawah,
   hasil di kanan dengan angka serif besar berwarna hijau + keterangan
   (`t kritis · two-tailed`). Bentuk hasil mengikuti kolom "Hasil" di §6:
   - satu angka → satu angka besar + keterangan;
   - pasangan (Durbin-Watson, Runs) → dua angka sejajar dengan label kecil
     (`dL 1.63` dan `dU 1.72`), keduanya ikut tersalin;
   - peluang (Binomial/Poisson) → `P(X = k)` sebagai angka utama dan
     `P(X ≤ k)` sebagai angka kedua yang lebih kecil.
   Enter langsung menghitung; untuk tabel kritis hasil juga meng-highlight
   baris di grid dan menggulir ke sana.
4. **Panduan singkat** (accordion, tertutup secara default): untuk apa, cara
   membaca, catatan satu/dua ekor, satu contoh angka.
5. **Grid tabel**: header kolom sticky, kolom df sticky saat horizontal scroll,
   angka `tabular-nums`, baris terpilih disorot krem dengan garis emas 2px di
   kiri. Klik sel = salin nilai + toast.
6. **Aksi**: `Salin baris`, `Unduh CSV`, `Print / PDF`.
7. **Catatan metode & sumber**: untuk tabel hitung, tulis rumus dan presisi;
   untuk tabel kurasi, tulis sumber tabelnya.

State lookup disimpan di URL (`?df=30&alpha=0.05&tail=2`) sehingga hasil bisa
di-bookmark dan dibagikan.

### 8.3 Pencarian ⌘K

Palet perintah (shadcn Command) dengan alias: "u", "mann whitney", "wilcoxon",
"peringkat bertanda", "chi kuadrat", "anova", dll. Mencari nama tabel, simbol,
dan alias sekaligus.

### 8.4 Tentang (`/tentang`)

Apa ini, apa yang bukan, metodologi komputasi, daftar sumber tabel kurasi,
cara verifikasi, dan batasan (mis. K-S dua sampel memakai aproksimasi
asymptotik).

## 9. Sistem visual (arah B)

| Peran | Nilai |
|---|---|
| Latar | `#FFFFFF` / `#FFFDFD` |
| Teks utama | `#1B2018` |
| Teks sekunder | `#8A8D83` |
| Hijau (aktif, angka hasil, tautan) | `#136207` |
| Emas (garis tab aktif, penanda baris) | `#D6B238` |
| Emas tua (aksen kecil) | `#CC9A00` |
| Krem (isi baris disorot) | `#FFF6E3` |
| Garis rambut | `#EEE9DE` / header `#DCD6C6` |
| Krem tua | `#EDE6D6` |

- Label mikro: 9.5–10px, uppercase, letter-spacing .14–.18em, warna sekunder.
- Angka: `tabular-nums`, desimal selalu titik (`2.042`), tanpa format locale.
- Angka: `tabular-nums`; angka hasil memakai Instrument Serif ukuran besar.
- Sudut kecil (4–8px), tanpa bayangan kecuali header sticky.
- Lebar konten maksimum 1120px; tabel boleh lebih lebar dan scroll sendiri.
- Fokus keyboard terlihat (ring hijau), kontras teks minimal AA.

## 10. Cetak

Stylesheet `@media print` khusus: sembunyikan navigasi, kotak cari, dan aksi;
judul tabel + catatan α/ekor di atas; header kolom berulang tiap halaman;
baris terpilih tetap ditandai; margin A4; hitam-putih tetap terbaca.

Tabel panjang (mis. t sampai df 100) **boleh beberapa halaman**; yang wajib
adalah tidak ada kolom yang terpotong horizontal dan header kolom berulang di
setiap halaman. Tabel lebar (F) dicetak landscape dengan skala font turun satu
tingkat bila perlu.

## 11. Verifikasi angka

- `src/lib/dist/*` diuji dengan Vitest memakai fixture nilai dari tabel buku
  (t df 1–30, F, χ², U, T, ρ, D) dengan toleransi 0,0005.
- Untuk tabel kurasi, JSON disimpan apa adanya beserta sitasi; tidak ada nilai
  yang dikarang. Nilai yang dihitung dan dikurasi dicek silang di titik-titik
  yang tumpang tindih.
- Halaman Tentang menyatakan bahwa tabel kurasi berasal dari sumber tercetak,
  sedangkan sisanya dihitung.
- **Gerbang verifikasi:** sebelum rilis, pemilik proyek mengecek sampel angka
  (mis. 10 sel per tabel kurasi, 5 per tabel hitung) terhadap sumbernya.
  Hasil pengecekan dicatat di `docs/verifikasi.md`.

## 12. Kriteria selesai v1

1. 26 tabel dapat dibuka, dicari, dan di-lookup.
2. Lookup menghasilkan nilai yang cocok dengan fixture tabel buku.
3. Grid tercetak ke A4 tanpa kolom terpotong; tabel panjang boleh beberapa
   halaman dengan header kolom berulang; grid terbaca di HP tanpa zoom
   horizontal untuk tabel 4–6 kolom.
4. Setelah kunjungan pertama, situs terbuka offline di HP.
5. Tidak ada halaman yang menampilkan angka tanpa satuan parameternya jelas
   (α/ekor untuk tabel kritis, p/λ/k untuk tabel peluang), dan angka hasil
   interpolasi selalu bertanda `≈`.

## 13. Risiko dan hal yang perlu diputuskan saat membangun

- **Sumber angka (diputuskan).** Tabel kurasi dan fixture verifikasi memakai
  tabel terpublikasi standar (NIST/SEMATECH, Siegel & Castellan, Zar, Field),
  sitasi per tabel tampil di halaman tabel dan di berkas fixture. Pemilik
  proyek memverifikasi sampel angka sebelum rilis. Registry tetap punya status
  `tersedia | menunggu-sumber` sebagai jaring pengaman.
- **Pemisah desimal (diputuskan): titik** (`2.042`) di layar dan di grid,
  mengikuti tabel buku. CSV memakai koma sebagai pemisah kolom dan mengutip
  nilai yang perlu. Tidak ada format angka otomatis mengikuti locale.
- **Distribusi eksak sampel kecil** (U, T, ρ, K-S) lebih rumit daripada
  aproksimasi normal. Batas "eksak sampai n sekian, aproksimasi di atasnya"
  dicantumkan di panduan tiap tabel agar tidak menyesatkan.
- **Volume konten panduan** 26 tabel cukup banyak; panduan ditulis ringkas
  (3–5 kalimat + contoh) agar tidak menjadi proyek penulisan.

## 14. Yang diserahkan ke builder

- Nama merek final dan domain (sementara: "Statistictable").
- Pemilihan pustaka matematika vs implementasi sendiri (keputusan builder;
  syaratnya: teruji terhadap fixture).
- Rincian animasi/transisi (minimal; tidak boleh mengganggu pembacaan).
- Susunan persis alias pencarian per tabel.
