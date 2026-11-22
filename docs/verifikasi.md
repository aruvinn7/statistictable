# Verifikasi angka

Tanggal: 2026-11-22. Semua nilai dihitung ulang dari definisi distribusi; tidak ada
angka yang ditranskripsi tanpa pengujian. Tujuh tabel tanpa bentuk tertutup
memakai data di `src/lib/tables/data/` yang dibangkitkan oleh
`scripts/build-critical-tables.py` (`npm run build:tables`, butuh numpy + scipy).

## Tabel hitung (formula langsung)

| Tabel | Parameter | Nilai acuan | Nilai aplikasi | Status |
|---|---|---|---|---|
| t | df 30, α .05, dua ekor | 2.042 | 2.042 | cocok |
| t | df 1, α .05, dua ekor | 12.706 | 12.706 | cocok |
| F | df1 5, df2 20, α .05 | 2.711 | 2.711 | cocok |
| χ² | df 10, α .05 | 18.307 | 18.307 | cocok |
| r | df 30, α .05, dua ekor | 0.349 | 0.349 | cocok |
| Binomial | n 10, p .5, k 3 | P(X=3)=0.1172; P(X≤3)=0.1719 | sama | cocok |
| Poisson | λ 3, k 2 | P(X=2)=0.2240; P(X≤2)=0.4232 | sama | cocok |
| Mann-Whitney | n1 8, n2 8, α .05 | U ≤ 13 | 13 | cocok |
| Wilcoxon | n 10, α .05 | T ≤ 8 | 8 | cocok |
| Spearman | n 10, α .05, dua ekor | 0.648 | 0.648 | cocok |
| K-S satu sampel | n 20, α .05 | 0.294 | 0.294 | cocok |

Nilai acuan berasal dari tabel buku standar (NIST/SEMATECH, Siegel & Castellan,
Zar) dan diuji di `src/lib/stats/__tests__/`.

## Tabel kritikal terhitung

| Tabel | Jangkar | Acuan tabel | Aplikasi | Status |
|---|---|---|---|---|
| Durbin-Watson | n 15, k 1, α .05 | 1.08 / 1.36 | 1.077 / 1.361 | cocok (2 desimal) |
| Durbin-Watson | n 20, k 2, α .05 | 1.10 / 1.54 | 1.100 / 1.537 | cocok |
| Durbin-Watson | n 50, k 4, α .05 | 1.38 / 1.72 | 1.378 / 1.721 | cocok |
| Tukey q | k 3, df 10, α .05 | 3.88 | 3.880 | cocok |
| Tukey q | k 5, df 20, α .05 | 4.23 | 4.230 | cocok |
| Dunnett | k 2, df 30, α .05 | 2.042 (= t dua sisi) | 2.042 | cocok |
| Dunnett | k 3, df 10, α .05 | 2.57 | 2.568 | cocok |
| F-max | k 3, df 10, α .05 | 4.85 (simulasi 4.856) | 4.845 | cocok |
| Toleransi | n 10, γ .95, P .99, satu sisi | 3.981 | 3.981 | cocok, cakupan simulasi 0.9496 |
| Toleransi | n 10, γ .95, P .99, dua sisi | 4.443 | 4.443 | cocok, cakupan simulasi 0.950 |
| Shapiro-Wilk | n 10, α .05 | 0.842 | 0.845 | selisih 0.003 |
| Shapiro-Wilk | n 20, α .05 | 0.905 | 0.904 | selisih 0.001 |
| Lilliefors | n 4, α .05 | 0.375 | 0.375 | cocok |
| Lilliefors | n 10, α .05 | 0.258 | 0.262 | selisih 0.004 |
| Lilliefors | n 20, α .05 | 0.190 | 0.192 | selisih 0.002 |

Catatan metode:

- **Durbin-Watson**: dL/dU adalah batas untuk semua matriks prediktor, dihitung
  dengan integral Imhof atas dua himpunan nilai eigen ekstrem (arah intersep
  dibuang). Bukan p-value untuk satu matriks X tertentu.
- **Tukey q, Dunnett, F-max**: kuantil dari distribusi studentized range,
  t multivariat ekuikorelasi 0.5, dan maksimum rasio varians.
- **Toleransi**: definisi yang dipakai adalah "interval memuat paling sedikit
  proporsi P dengan keyakinan γ". Satu sisi memakai kuantil t non-sentral; dua
  sisi diselesaikan dari definisi cakupan. Definisi dicantumkan di halaman tabel.
- **Shapiro-Wilk**: kuantil distribusi nol dari 400.000 simulasi per n memakai
  koefisien a Royston. Karena koefisien itu pendekatan, nilai untuk n besar
  dapat berbeda sampai sekitar 0.005 dari tabel cetak.
- **Lilliefors**: 400.000 simulasi per n dengan mean dan simpangan baku
  diestimasi dari sampel, selisih ≤ 0.003 dari tabel cetak.

Seed simulasi tetap (20261122/20261123), sehingga data dapat direproduksi.

## Pemeriksaan manual UI

- `/` menampilkan 26 tabel, 26 tersedia, pencarian alias berjalan.
- `/t/t?df=30&alpha=0.05&tails=2` menampilkan 2.042 dan baris df 30 tersorot.
- `/t/f` menggulir horizontal di dalam grid tanpa melebarkan halaman.
- `/t/durbin-watson?n=15&k=1&alpha=0.05` menampilkan 1.077 / 1.361.
- `/t/toleransi?n=10&gamma=0.95&P=0.99&sisi=2` menampilkan 4.443.
- Input tidak valid menampilkan pesan, bukan angka; parameter di luar jangkauan
  dan sel yang tidak tersedia (mis. DW n 6, k 5) tidak menghasilkan angka.
- `Ctrl+K` atau `/` mencari "mann whitney", "chi kuadrat", "x2", dan
  "chikuadrat"; hasil membuka tabel yang benar.
- Mode p-value: t = 2.042, df 30, dua ekor → p = 0.0500; z = 1.96 → 0.0500;
  F = 2.711 (5, 20) → 0.0500; χ² = 18.307, df 10 → 0.0500.
- Klik sel menandai baris/kolom dan menyalin; tombol panah berpindah sel,
  Enter menyalin, Escape melepas penanda.
- Preferensi 3/4/6 desimal dan notasi ilmiah tersimpan di browser; tampilan
  t df 30 pada 6 desimal = 2.042272.
- Parameter di luar batas (mis. Tukey df 61) menampilkan saran "Isi df
  terdekat = 60"; setelah diklik grid menggulir ke baris df 60.
- Favorit dan riwayat tersimpan lokal; glosarium tersedia di
  `/tentang#glosarium` dan dari kotak cari.
- Tata letak diperiksa pada lebar 360, 390, 768, dan 1280 px tanpa gulir
  horizontal halaman; grid bergulir di dalam wadahnya sendiri.
- Build produksi menghasilkan `dist/manifest.webmanifest` dan `dist/sw.js`.
  Pendaftaran service worker memakai mode prompt agar banner versi baru dapat
  ditampilkan.
