# Statistictable — Plan 1: Fondasi & Tabel Hitung

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Situs statis berbahasa Indonesia berisi 19 tabel statistik yang dihitung dari rumus, dengan grid penuh, kotak cari nilai, pencarian ⌘K, cetak A4, dan mode offline.

**Architecture:** Vite + React SPA tanpa backend. Modul matematika murni di `src/lib/stats/` dipakai bersama oleh grid dan kotak cari. Setiap tabel dideskripsikan satu `TableDef` di registry; halaman tabel generik merender lookup, panduan, dan grid dari definisi itu.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, react-router-dom, Vitest, vite-plugin-pwa, @fontsource.

**Spec:** `docs/superpowers/specs/2026-11-22-statistictable-design.md`

## Global Constraints

- UI berbahasa Indonesia. Nama uji memakai istilah standar (Mann-Whitney, Kruskal-Wallis, dst.).
- Desimal selalu titik: `2.042`. Tidak ada format locale otomatis. Angka kritis 3 desimal; peluang 4 desimal.
- Tanpa backend, tanpa login, tanpa basis data, tanpa mode gelap, tanpa analitik.
- Palet: hijau `#136207`, emas `#D6B238`, emas tua `#CC9A00`, krem `#FFF6E3`, krem tua `#EDE6D6`, latar `#FFFDFD`, teks `#1B2018`, sekunder `#8A8D83`, garis `#EEE9DE` / `#DCD6C6`.
- Semua fungsi di `src/lib/stats/` murni: tanpa import React, tanpa akses DOM, tanpa `Date`/`Math.random`.
- Semua angka di tabel memakai `font-variant-numeric: tabular-nums`.
- Toleransi fixture matematika: `5e-4`.
- Lebar konten maksimum 1120px; grid boleh lebih lebar dan menggulir di dalam kontainernya sendiri.
- Setiap halaman tabel wajib menampilkan satuan parameternya (α/ekor, atau p/λ/k) di dekat angka hasil.
- Tabel kurasi memakai status `menunggu-sumber`; Plan 1 tidak mengisinya dengan angka.

## Review Focus

1. **Parameter tidak valid** (df ≤ 0, α di luar (0,1), n di bawah minimum) → kotak cari menampilkan pesan validasi berbahasa Indonesia, bukan `NaN`/`Infinity`.
2. **Deep link rusak** (`/t/t?df=abc`, `?alpha=9`) → jatuh ke nilai default + pesan, halaman tetap tampil.
3. **Nilai ekstrem** (α 0.001, df 1, df 1000, n 200) → hasil tetap berhingga, grid tidak error.
4. **Tabel lebar di HP** (F: 61 kolom) → gulir horizontal hanya di dalam grid, header kolom dan kolom pertama tetap terlihat, halaman tidak melebar.
5. **Salin/CSV** → angka tersalin `2.042` (titik), CSV berkoma sebagai pemisah kolom dan mengutip sel yang mengandung koma.

## File Structure

```
src/
  main.tsx                     # bootstrap + RouterProvider
  App.tsx                      # rute
  index.css                    # Tailwind + token desain
  components/
    layout/SiteHeader.tsx
    search/CommandPalette.tsx
    table/LookupBar.tsx
    table/ResultDisplay.tsx
    table/TableGrid.tsx
    table/GuidePanel.tsx
    table/TableActions.tsx
    home/TableList.tsx
    home/RecentTables.tsx
    ui/...                     # hasil shadcn
  pages/
    Home.tsx
    TablePage.tsx
    About.tsx
    NotFound.tsx
  lib/
    format.ts                  # formatNumber, formatProbability, toCsv
    useRecentTables.ts
    stats/
      special.ts  normal.ts  t.ts  f.ts  chi.ts  binomial.ts  poisson.ts
      mann-whitney.ts  wilcoxon.ts  approx.ts  kendall-tau.ts  runs.ts
      sign.ts  spearman.ts  ks.ts
      __tests__/  fixtures.ts
    tables/
      types.ts  registry.ts  computed.ts  guides.ts
scripts/
  build-spearman-exact.mjs     # generate JSON eksak Spearman n<=10
```

---

### Task 1: Scaffold, token desain, shell

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `.gitignore`, `vercel.json`
- Create: `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/components/layout/SiteHeader.tsx`, `src/pages/Home.tsx`, `src/test/setup.ts`
- Test: `src/components/layout/SiteHeader.test.tsx`

**Interfaces:**
- Produces: `SiteHeader` (tanpa props), rute `/`, `/t/:id`, `/tentang`, `*`.

- [ ] **Step 1: Init repo dan proyek**

```bash
git init
npm create vite@latest . -- --template react-ts
npm install
npm install -D tailwindcss @tailwindcss/vite vitest jsdom @testing-library/react @testing-library/jest-dom
npm install react-router-dom @fontsource-variable/inter @fontsource/instrument-serif
```

- [ ] **Step 2: Pasang shadcn/ui**

```bash
npx shadcn@latest init -d
npx shadcn@latest add button command dialog input select tabs accordion tooltip sonner --yes
```

- [ ] **Step 3: Konfigurasi Vite + alias + Vitest**

`vite.config.ts` memakai `defineConfig` dari `vitest/config`, plugin `react()`, `tailwindcss()`, alias `@` → `./src`, dan `test: { environment: 'jsdom', globals: true, setupFiles: './src/test/setup.ts' }`.

- [ ] **Step 4: Tulis test yang gagal**

```tsx
// src/components/layout/SiteHeader.test.tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SiteHeader } from './SiteHeader'

test('menampilkan merek dan tombol pencarian', () => {
  render(<MemoryRouter><SiteHeader /></MemoryRouter>)
  expect(screen.getByText('Statistictable')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /cari tabel/i })).toBeInTheDocument()
})
```

- [ ] **Step 5: Jalankan, pastikan gagal**

Run: `npx vitest run src/components/layout/SiteHeader.test.tsx`
Expected: FAIL — modul tidak ditemukan.

- [ ] **Step 6: Implementasi**

`src/index.css`: `@import "tailwindcss";` + blok `@theme` berisi token Global Constraints (`--color-ink`, `--color-muted`, `--color-green`, `--color-gold`, `--color-gold-deep`, `--color-cream`, `--color-cream-2`, `--color-paper`, `--color-hair`, `--color-hair-strong`, `--font-sans: "Inter Variable", ui-sans-serif, system-ui, sans-serif`, `--font-display: "Instrument Serif", Georgia, serif`). Di `:root` override variabel shadcn: `--background`, `--foreground`, `--primary`, `--primary-foreground`, `--border`, `--ring`, `--radius`.

`SiteHeader`: `<header>` setinggi 56px, garis bawah `--color-hair`, merek serif hijau "Statistictable" (tautan ke `/`), kanan: tombol `Cari tabel…` dengan ikon kaca pembesar dan `aria-label="Cari tabel"`, tautan `Tentang`.

`App.tsx`: `BrowserRouter` + `Routes` (`/` Home, `/t/:id` TablePage, `/tentang` About, `*` NotFound), `SiteHeader` di atas `main` dengan `max-w-[1120px] mx-auto px-6`.

`src/test/setup.ts`: `import '@testing-library/jest-dom/vitest'`.

`.gitignore`: `node_modules`, `dist`, `.superpowers`, `*.local`.

- [ ] **Step 7: Jalankan, pastikan lulus**

Run: `npx vitest run src/components/layout/SiteHeader.test.tsx && npm run build`
Expected: PASS, build sukses.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold vite react app with design tokens and shell"
```

---

### Task 2: Fungsi khusus (gamma, beta, erf)

**Files:**
- Create: `src/lib/stats/special.ts`
- Test: `src/lib/stats/__tests__/special.test.ts`

**Interfaces:**
- Produces:
  - `logGamma(x: number): number`
  - `regularizedBeta(a: number, b: number, x: number): number` — I_x(a,b)
  - `inverseRegularizedBeta(p: number, a: number, b: number): number`
  - `regularizedGammaP(a: number, x: number): number` — P(a,x)
  - `inverseRegularizedGammaP(p: number, a: number): number`
  - `erf(x: number): number`

- [ ] **Step 1: Tulis test yang gagal**

```ts
import { describe, expect, test } from 'vitest'
import { logGamma, regularizedBeta, regularizedGammaP, inverseRegularizedGammaP, erf } from '../special'

describe('special', () => {
  test('logGamma cocok dengan faktorial', () => {
    expect(Math.exp(logGamma(6))).toBeCloseTo(120, 6)
    expect(logGamma(0.5)).toBeCloseTo(Math.log(Math.sqrt(Math.PI)), 8)
  })
  test('regularizedBeta simetris', () => {
    expect(regularizedBeta(2, 3, 0.4)).toBeCloseTo(0.5248, 4)
    expect(regularizedBeta(2, 3, 0.4) + regularizedBeta(3, 2, 0.6)).toBeCloseTo(1, 8)
  })
  test('regularizedGammaP', () => {
    expect(regularizedGammaP(1, 1)).toBeCloseTo(0.6321205588, 8)
  })
  test('inverseRegularizedGammaP membalik P', () => {
    expect(inverseRegularizedGammaP(0.95, 10)).toBeCloseTo(18.307, 3)
  })
  test('erf', () => {
    expect(erf(0)).toBe(0)
    expect(erf(1)).toBeCloseTo(0.8427007929, 8)
  })
})
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `npx vitest run src/lib/stats/__tests__/special.test.ts`
Expected: FAIL — modul tidak ditemukan.

- [ ] **Step 3: Implementasi**

Lanczos untuk `logGamma`; pecahan lanjut (continued fraction) untuk beta dan gamma; `inverseRegularizedBeta`/`inverseRegularizedGammaP` dengan bisection 200 iterasi pada selang `[1e-12, 1e6]`, toleransi `1e-12`; `erf` dari `regularizedGammaP(0.5, x*x)` dengan tanda. Semua fungsi melempar `RangeError` untuk domain di luar definisi.

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `npx vitest run src/lib/stats/__tests__/special.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stats/special.ts src/lib/stats/__tests__/special.test.ts
git commit -m "feat(stats): add gamma beta and erf special functions"
```

---

### Task 3: Distribusi normal dan t

**Files:**
- Create: `src/lib/stats/normal.ts`, `src/lib/stats/t.ts`, `src/lib/stats/__tests__/fixtures.ts`
- Test: `src/lib/stats/__tests__/normal-t.test.ts`

**Interfaces:**
- Consumes: `regularizedBeta`, `inverseRegularizedBeta`, `erf` dari Task 2.
- Produces:
  - `normalCdf(z: number): number`, `normalQuantile(p: number): number`
  - `tCdf(t: number, df: number): number`, `tQuantile(p: number, df: number): number`
  - `tCritical(alpha: number, df: number, tails: 1 | 2): number`

- [ ] **Step 1: Tulis fixture dan test yang gagal**

```ts
// src/lib/stats/__tests__/fixtures.ts
export const PUBLISHED = {
  z975: 1.959964,
  t: { '1|0.05|2': 12.706, '30|0.05|2': 2.042, '30|0.05|1': 1.697, '60|0.01|2': 2.660 },
} as const
```

```ts
// src/lib/stats/__tests__/normal-t.test.ts
import { expect, test } from 'vitest'
import { normalCdf, normalQuantile } from '../normal'
import { tCritical, tCdf } from '../t'
import { PUBLISHED } from './fixtures'

test('normal', () => {
  expect(normalCdf(0)).toBeCloseTo(0.5, 10)
  expect(normalCdf(1.96)).toBeCloseTo(0.975, 4)
  expect(normalQuantile(0.975)).toBeCloseTo(PUBLISHED.z975, 6)
})

test('t kritis cocok dengan tabel buku', () => {
  expect(tCritical(0.05, 1, 2)).toBeCloseTo(12.706, 3)
  expect(tCritical(0.05, 30, 2)).toBeCloseTo(2.042, 3)
  expect(tCritical(0.05, 30, 1)).toBeCloseTo(1.697, 3)
  expect(tCritical(0.01, 60, 2)).toBeCloseTo(2.660, 3)
})

test('tCdf berhingga di nilai ekstrem', () => {
  expect(Number.isFinite(tCdf(1e6, 1))).toBe(true)
  expect(tCdf(0, 30)).toBeCloseTo(0.5, 10)
})

test('df tidak valid ditolak', () => {
  expect(() => tCritical(0.05, 0, 2)).toThrow(RangeError)
})
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `npx vitest run src/lib/stats/__tests__/normal-t.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementasi**

`normalCdf` dari `erf`; `normalQuantile` dari inverse `erf` (bisection). `tCdf` memakai `regularizedBeta(df/2, 1/2, df/(df+t²))` dengan penyesuaian tanda; `tQuantile` = `inverseRegularizedBeta`. `tCritical` memetakan ekor: `tails === 2 ? tQuantile(1 - alpha/2, df) : tQuantile(1 - alpha, df)`. Lempar `RangeError` bila `df <= 0` atau `alpha` di luar `(0,1)`.

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `npx vitest run src/lib/stats/__tests__/normal-t.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stats/normal.ts src/lib/stats/t.ts src/lib/stats/__tests__/
git commit -m "feat(stats): add normal and student t distributions"
```

---

### Task 4: Distribusi F dan chi-square

**Files:**
- Create: `src/lib/stats/f.ts`, `src/lib/stats/chi.ts`
- Test: `src/lib/stats/__tests__/f-chi.test.ts`

**Interfaces:**
- Consumes: `regularizedBeta`, `regularizedGammaP`, `inverseRegularizedGammaP`.
- Produces:
  - `fCdf(x: number, df1: number, df2: number): number`, `fCritical(alpha: number, df1: number, df2: number): number`
  - `chiSquareCdf(x: number, df: number): number`, `chiSquareQuantile(p: number, df: number): number`, `chiSquareCritical(alpha: number, df: number): number`

- [ ] **Step 1: Tulis test yang gagal**

```ts
import { expect, test } from 'vitest'
import { fCritical } from '../f'
import { chiSquareCritical } from '../chi'

test('F kritis', () => {
  expect(fCritical(0.05, 5, 20)).toBeCloseTo(2.711, 3)
  expect(fCritical(0.01, 1, 10)).toBeCloseTo(10.04, 2)
})
test('chi-square kritis', () => {
  expect(chiSquareCritical(0.05, 10)).toBeCloseTo(18.307, 3)
  expect(chiSquareCritical(0.01, 1)).toBeCloseTo(6.635, 3)
})
test('parameter tidak valid ditolak', () => {
  expect(() => fCritical(0.05, 0, 10)).toThrow(RangeError)
  expect(() => chiSquareCritical(0.05, -1)).toThrow(RangeError)
})
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `npx vitest run src/lib/stats/__tests__/f-chi.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementasi**

`fCdf` dari `regularizedBeta(df1/2, df2/2, df1*x/(df1*x+df2))`; `fCritical` = inverse dengan bisection pada `[0, 1e6]`. `chiSquareCdf` dari `regularizedGammaP(df/2, x/2)`; `chiSquareCritical` = `inverseRegularizedGammaP(1-alpha, df/2) * 2`. Lempar `RangeError` untuk df ≤ 0.

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `npx vitest run src/lib/stats/__tests__/f-chi.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stats/f.ts src/lib/stats/chi.ts src/lib/stats/__tests__/f-chi.test.ts
git commit -m "feat(stats): add F and chi-square distributions"
```

---

### Task 5: Binomial dan Poisson

**Files:**
- Create: `src/lib/stats/binomial.ts`, `src/lib/stats/poisson.ts`
- Test: `src/lib/stats/__tests__/discrete.test.ts`

**Interfaces:**
- Produces:
  - `binomialPmf(n: number, p: number, k: number): number`, `binomialCdf(n: number, p: number, k: number): number`
  - `binomialCritical(n: number, alpha: number, tails: 1 | 2): number` — k terbesar dengan `P(X ≤ k) ≤ alpha` (ekor kiri)
  - `poissonPmf(lambda: number, k: number): number`, `poissonCdf(lambda: number, k: number): number`

- [ ] **Step 1: Tulis test yang gagal**

```ts
import { expect, test } from 'vitest'
import { binomialCdf, binomialPmf, binomialCritical } from '../binomial'
import { poissonCdf, poissonPmf } from '../poisson'

test('binomial', () => {
  expect(binomialPmf(10, 0.5, 5)).toBeCloseTo(0.246094, 6)
  expect(binomialCdf(10, 0.5, 3)).toBeCloseTo(0.171875, 6)
  expect(binomialCdf(10, 0.5, 10)).toBeCloseTo(1, 10)
})
test('poisson', () => {
  expect(poissonPmf(2, 3)).toBeCloseTo(0.180447, 6)
  expect(poissonCdf(3, 2)).toBeCloseTo(0.857123, 6)
})
test('kritis binomial', () => {
  expect(binomialCritical(10, 0.05, 1)).toBe(1)
  expect(binomialCritical(10, 0.05, 2)).toBe(1)
})
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `npx vitest run src/lib/stats/__tests__/discrete.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementasi**

Hitung `pmf` lewat `exp(logGamma(n+1) - logGamma(k+1) - logGamma(n-k+1) + k*log(p) + (n-k)*log1p(-p))`, lalu `cdf` sebagai jumlah kumulatif (n ≤ 500 aman). Poisson memakai `exp(-lambda + k*log(lambda) - logGamma(k+1))`. `binomialCritical` memindai k dari 0 ke n dan mengembalikan k terakhir yang memenuhi; `alpha` untuk dua ekor dibagi dua.

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `npx vitest run src/lib/stats/__tests__/discrete.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stats/binomial.ts src/lib/stats/poisson.ts src/lib/stats/__tests__/discrete.test.ts
git commit -m "feat(stats): add binomial and poisson distributions"
```

---

### Task 6: Distribusi eksak Mann-Whitney dan Wilcoxon

**Files:**
- Create: `src/lib/stats/mann-whitney.ts`, `src/lib/stats/wilcoxon.ts`
- Test: `src/lib/stats/__tests__/rank-exact.test.ts`

**Interfaces:**
- Produces:
  - `mannWhitneyCounts(n1: number, n2: number): Float64Array` — jumlah susunan untuk U = 0..n1*n2
  - `mannWhitneyCritical(n1: number, n2: number, alpha: number, tails: 1 | 2): number`
  - `wilcoxonCounts(n: number): Float64Array` — jumlah susunan untuk W+ = 0..n(n+1)/2
  - `wilcoxonCritical(n: number, alpha: number, tails: 1 | 2): number`

- [ ] **Step 1: Tulis test yang gagal**

```ts
import { expect, test } from 'vitest'
import { mannWhitneyCounts, mannWhitneyCritical } from '../mann-whitney'
import { wilcoxonCounts, wilcoxonCritical } from '../wilcoxon'

test('jumlah susunan Mann-Whitney = C(n1+n2, n1)', () => {
  const c = mannWhitneyCounts(4, 4)
  expect(c.reduce((a, b) => a + b, 0)).toBe(70)
})
test('U kritis cocok tabel buku', () => {
  expect(mannWhitneyCritical(8, 8, 0.05, 2)).toBe(13)
  expect(mannWhitneyCritical(5, 5, 0.05, 2)).toBe(2)
})
test('jumlah susunan Wilcoxon = 2^n', () => {
  const c = wilcoxonCounts(5)
  expect(c.reduce((a, b) => a + b, 0)).toBe(32)
})
test('T kritis cocok tabel buku', () => {
  expect(wilcoxonCritical(10, 0.05, 2)).toBe(8)
  expect(wilcoxonCritical(8, 0.05, 1)).toBe(6)
})
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `npx vitest run src/lib/stats/__tests__/rank-exact.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementasi**

Mann-Whitney: DP q-binomial `dp[i][j]` berupa array panjang `i*j+1`; transisi menambah A: `dp[i][j][u] += dp[i-1][j][u]`, menambah B: `dp[i][j][u+i] += dp[i][j-1][u]`. Wilcoxon: subset-sum atas `1..n`, `dp[i][s] += dp[i-1][s] + dp[i-1][s-i]`.

`mannWhitneyCritical`: hitung ekor bawah kumulatif `P(U ≤ u)`, kembalikan u terbesar dengan `P ≤ alpha/tails`. `wilcoxonCritical`: sama pada `W+`.

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `npx vitest run src/lib/stats/__tests__/rank-exact.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stats/mann-whitney.ts src/lib/stats/wilcoxon.ts src/lib/stats/__tests__/rank-exact.test.ts
git commit -m "feat(stats): add exact Mann-Whitney and Wilcoxon distributions"
```

---

### Task 7: Uji berbasis chi-square (H, Friedman, Kendall W, Cochran Q)

**Files:**
- Create: `src/lib/stats/approx.ts`
- Test: `src/lib/stats/__tests__/approx.test.ts`

**Interfaces:**
- Consumes: `chiSquareCritical` dari Task 4.
- Produces:
  - `kruskalWallisCritical(k: number, n: number, alpha: number): number`
  - `friedmanCritical(k: number, n: number, alpha: number): number`
  - `kendallWCritical(k: number, n: number, alpha: number): number`
  - `cochranQCritical(k: number, n: number, alpha: number): number`

- [ ] **Step 1: Tulis test yang gagal**

```ts
import { expect, test } from 'vitest'
import { kruskalWallisCritical, friedmanCritical, kendallWCritical, cochranQCritical } from '../approx'

test('semua memakai df = k - 1', () => {
  expect(kruskalWallisCritical(3, 5, 0.05)).toBeCloseTo(5.991, 3)
  expect(friedmanCritical(4, 10, 0.05)).toBeCloseTo(7.815, 3)
  expect(kendallWCritical(3, 5, 0.01)).toBeCloseTo(9.210, 3)
  expect(cochranQCritical(4, 10, 0.05)).toBeCloseTo(7.815, 3)
})
test('k < 2 ditolak', () => {
  expect(() => kruskalWallisCritical(1, 5, 0.05)).toThrow(RangeError)
})
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `npx vitest run src/lib/stats/__tests__/approx.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementasi**

Keempatnya memanggil `chiSquareCritical(alpha, k - 1)` setelah memvalidasi `k >= 2` dan `n >= 1`. Parameter `n` diterima untuk keseragaman antarmuka, belum memengaruhi angka; beri komentar satu baris yang menyebut hal itu.

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `npx vitest run src/lib/stats/__tests__/approx.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stats/approx.ts src/lib/stats/__tests__/approx.test.ts
git commit -m "feat(stats): add chi-square based nonparametric tests"
```

---

### Task 8: Kendall tau, runs test, sign/McNemar

**Files:**
- Create: `src/lib/stats/kendall-tau.ts`, `src/lib/stats/runs.ts`, `src/lib/stats/sign.ts`
- Test: `src/lib/stats/__tests__/normal-approx.test.ts`

**Interfaces:**
- Consumes: `normalQuantile`, `binomialCritical`.
- Produces:
  - `kendallTauCriticalS(n: number, alpha: number, tails: 1 | 2): number` — S kritis
  - `runsCritical(n1: number, n2: number, alpha: number): { lower: number; upper: number }`
  - `signTestCritical(n: number, alpha: number, tails: 1 | 2): number`

- [ ] **Step 1: Tulis test yang gagal**

```ts
import { expect, test } from 'vitest'
import { kendallTauCriticalS } from '../kendall-tau'
import { runsCritical } from '../runs'
import { signTestCritical } from '../sign'

test('Kendall tau memakai aproksimasi normal', () => {
  const s = kendallTauCriticalS(10, 0.05, 2)
  expect(s).toBeGreaterThan(0)
  expect(s % 1).toBe(0)
})
test('runs mengembalikan pasangan bawah/atas', () => {
  const r = runsCritical(10, 10, 0.05)
  expect(r.lower).toBeLessThan(r.upper)
  expect(r.lower).toBeGreaterThan(1)
})
test('sign test = binomial p 0.5', () => {
  expect(signTestCritical(10, 0.05, 2)).toBe(1)
  expect(() => signTestCritical(0, 0.05, 2)).toThrow(RangeError)
})
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `npx vitest run src/lib/stats/__tests__/normal-approx.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementasi**

`kendallTauCriticalS`: `sd = Math.sqrt(n*(n-1)*(2*n+5)/18)`, `z = normalQuantile(1 - alpha/tails)`, hasil `Math.ceil(z*sd - 0.5)` (koreksi kontinuitas), minimal 0.
`runsCritical`: `m = 2*n1*n2/(n1+n2) + 1`, `v = 2*n1*n2*(2*n1*n2-n1-n2) / ((n1+n2)**2 * (n1+n2-1))`, `z = normalQuantile(1 - alpha/2)`, `lower = Math.ceil(m - z*Math.sqrt(v))`, `upper = Math.floor(m + z*Math.sqrt(v))`.
`signTestCritical`: `binomialCritical(n, alpha, tails)` dengan p 0.5 (delegasikan ke `binomialCritical` yang sudah memakai p 0.5 secara internal, atau tambahkan parameter p default 0.5).

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `npx vitest run src/lib/stats/__tests__/normal-approx.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stats/kendall-tau.ts src/lib/stats/runs.ts src/lib/stats/sign.ts src/lib/stats/__tests__/normal-approx.test.ts
git commit -m "feat(stats): add kendall tau runs and sign test"
```

---

### Task 9: Spearman (eksak n<=10 lewat skrip build)

**Files:**
- Create: `scripts/build-spearman-exact.mjs`
- Create: `src/lib/stats/spearman.ts`, `src/lib/stats/spearman-exact.json` (hasil skrip)
- Test: `src/lib/stats/__tests__/spearman.test.ts`

**Interfaces:**
- Consumes: `tCritical`.
- Produces: `spearmanCritical(n: number, alpha: number, tails: 1 | 2): number`

- [ ] **Step 1: Tulis skrip generator**

Skrip menghitung distribusi persis ρ untuk n = 4..10 dengan menyusun semua permutasi `n!` (maksimum 3.628.800 untuk n=10), menghitung `rho = 1 - 6*Σd²/(n*(n³-n))`, mengumpulkan nilai absolut, lalu menyimpan kuantil `1 - alpha/tails` untuk alpha `[0.10, 0.05, 0.025, 0.01, 0.005]`. Output: `{ "4": { "0.05": 1 }, ... }` ke `src/lib/stats/spearman-exact.json`. Tambahkan skrip `"build:spearman": "node scripts/build-spearman-exact.mjs"` ke `package.json`.

- [ ] **Step 2: Jalankan generator**

Run: `npm run build:spearman`
Expected: `src/lib/stats/spearman-exact.json` terbentuk, n=4..10 ada.

- [ ] **Step 3: Tulis test yang gagal**

```ts
import { expect, test } from 'vitest'
import { spearmanCritical } from '../spearman'

test('Spearman eksak untuk n kecil', () => {
  expect(spearmanCritical(10, 0.05, 2)).toBeCloseTo(0.648, 3)
  expect(spearmanCritical(6, 0.05, 2)).toBeCloseTo(0.886, 3)
})
test('di atas 10 memakai aproksimasi t', () => {
  const r = spearmanCritical(30, 0.05, 2)
  expect(r).toBeGreaterThan(0.3)
  expect(r).toBeLessThan(0.45)
})
test('n terlalu kecil ditolak', () => {
  expect(() => spearmanCritical(3, 0.05, 2)).toThrow(RangeError)
})
```

- [ ] **Step 4: Jalankan, pastikan gagal**

Run: `npx vitest run src/lib/stats/__tests__/spearman.test.ts`
Expected: FAIL — modul belum ada.

- [ ] **Step 5: Implementasi**

`spearmanCritical` membaca JSON untuk `n <= 10` (kuantil terdekat dari daftar alpha; bila alpha tidak ada di daftar, ambil alpha terdekat ke atas dan beri `note` interpolasi di pemanggil), dan untuk `n > 10` memakai `t = tCritical(alpha, n - 2, tails); r = t / Math.sqrt(t*t + (n-2))`. Lempar `RangeError` untuk `n < 4`.

- [ ] **Step 6: Jalankan, pastikan lulus**

Run: `npx vitest run src/lib/stats/__tests__/spearman.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add scripts/build-spearman-exact.mjs src/lib/stats/spearman.ts src/lib/stats/spearman-exact.json src/lib/stats/__tests__/spearman.test.ts package.json
git commit -m "feat(stats): add spearman critical values with exact small-sample table"
```

---

### Task 10: Kolmogorov-Smirnov satu dan dua sampel

**Files:**
- Create: `src/lib/stats/ks.ts`
- Test: `src/lib/stats/__tests__/ks.test.ts`

**Interfaces:**
- Produces:
  - `ksOneSampleCritical(n: number, alpha: number): number`
  - `ksTwoSampleCritical(n1: number, n2: number, alpha: number): number`

- [ ] **Step 1: Tulis test yang gagal**

```ts
import { expect, test } from 'vitest'
import { ksOneSampleCritical, ksTwoSampleCritical } from '../ks'

test('K-S satu sampel cocok tabel buku', () => {
  expect(ksOneSampleCritical(20, 0.05)).toBeCloseTo(0.294, 3)
  expect(ksOneSampleCritical(10, 0.01)).toBeCloseTo(0.490, 3)
})
test('K-S dua sampel memakai aproksimasi asymptotik', () => {
  const d = ksTwoSampleCritical(10, 10, 0.05)
  expect(d).toBeCloseTo(1.36 * Math.sqrt(20 / 100), 3)
})
test('n tidak valid ditolak', () => {
  expect(() => ksOneSampleCritical(0, 0.05)).toThrow(RangeError)
})
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `npx vitest run src/lib/stats/__tests__/ks.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementasi**

Satu sampel: CDF eksak `P(D_n <= d)` dengan metode matriks Marsaglia–Tsang–Wang (matriks `(2k-1)x(2k-1)`, `k = ceil(n*d)`), lalu cari `d` lewat bisection pada `[0,1]` sampai `P = 1 - alpha` dengan toleransi `1e-10`. Dua sampel: `c = alpha <= 0.01 ? 1.63 : 1.36; D = c * Math.sqrt((n1+n2)/(n1*n2))`.

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `npx vitest run src/lib/stats/__tests__/ks.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stats/ks.ts src/lib/stats/__tests__/ks.test.ts
git commit -m "feat(stats): add kolmogorov-smirnov critical values"
```

---

### Task 11: Registry tabel + 19 definisi

**Files:**
- Create: `src/lib/tables/types.ts`, `src/lib/tables/computed.ts`, `src/lib/tables/registry.ts`, `src/lib/tables/guides.ts`
- Test: `src/lib/tables/__tests__/registry.test.ts`

**Interfaces:**
- Consumes: semua fungsi `src/lib/stats/`.
- Produces:
  - `TableDef`, `LookupField`, `LookupResult`, `GridModel`, `GridSelector`, `TableStatus`
  - `TABLES: TableDef[]`, `getTable(id: string): TableDef | undefined`, `searchTables(query: string): TableDef[]`

```ts
// src/lib/tables/types.ts
export type TableGroup = 'parametrik' | 'nonparametrik'
export type TableStatus = 'tersedia' | 'menunggu-sumber'
export type ResultKind = 'scalar' | 'pair' | 'probability'

export interface LookupField {
  key: string
  label: string
  kind: 'number' | 'select'
  min?: number
  max?: number
  step?: number
  options?: { value: string; label: string }[]
  default: string
}

export interface LookupValue { value: number; label: string }
export interface LookupResult {
  kind: ResultKind
  primary: LookupValue
  secondary?: LookupValue
  interpolated?: boolean
  note?: string
}
export type LookupOutcome = LookupResult | { error: string }

export interface GridColumn { key: string; label: string }
export interface GridRow { key: string; label: string; cells: (number | null)[] }
export interface GridModel {
  rowHeader: string
  columns: GridColumn[]
  rows: GridRow[]
  caption?: string
}
export interface GridSelector {
  key: string
  label: string
  options: { value: string; label: string }[]
  default: string
}

export interface TableDef {
  id: string
  symbol: string
  name: string
  subtitle: string
  group: TableGroup
  aliases: string[]
  status: TableStatus
  fields: LookupField[]
  gridSelectors: GridSelector[]
  lookup: (input: Record<string, string>) => LookupOutcome
  buildGrid: (controls: Record<string, string>) => GridModel
  guide: string[]          // paragraf panduan
  method: string           // catatan metode & sumber
}
```

- [ ] **Step 1: Tulis test yang gagal**

```ts
import { expect, test } from 'vitest'
import { TABLES, getTable, searchTables } from '../registry'

test('semua id unik dan 19 tabel tersedia di plan 1', () => {
  const ids = TABLES.map(t => t.id)
  expect(new Set(ids).size).toBe(ids.length)
  expect(TABLES).toHaveLength(26)
  expect(TABLES.filter(t => t.status === 'tersedia')).toHaveLength(19)
})
test('pencarian memakai alias', () => {
  expect(searchTables('mann whitney').map(t => t.id)).toContain('mann-whitney')
  expect(searchTables('chi kuadrat').map(t => t.id)).toContain('chi-square')
  expect(searchTables('u').map(t => t.id)).toContain('mann-whitney')
})
test('lookup t dari string', () => {
  const t = getTable('t')!
  const out = t.lookup({ df: '30', alpha: '0.05', tails: '2' })
  expect('error' in out).toBe(false)
  expect((out as any).primary.value).toBeCloseTo(2.042, 3)
})
test('lookup menolak input tidak valid dengan pesan', () => {
  const out = getTable('t')!.lookup({ df: 'abc', alpha: '0.05', tails: '2' })
  expect('error' in out && (out as any).error).toMatch(/angka/)
})
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `npx vitest run src/lib/tables/__tests__/registry.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementasi `types.ts` persis seperti blok di atas**

- [ ] **Step 4: Implementasi `computed.ts`**

Satu helper `defineTable(def)` yang mengembalikan `TableDef`. Semua lookup mem-parse input lewat `parseNumber(input, key, { min, max })` (di `src/lib/tables/parse.ts`) yang mengembalikan `{ value }` atau `{ error: 'Masukkan angka untuk <label>.' }`, dan `parseAlpha` yang menerima `0 < alpha < 1` atau error `'Alpha harus antara 0 dan 1.'`.

Nama tampil selalu `Tabel <simbol> — <uji>`: `Tabel z — Normal standar`, `Tabel t — Student`, `Tabel F — Fisher`, `Tabel χ² — Chi-square`, `Tabel r — Pearson`, `Tabel U — Mann-Whitney`, `Tabel T — Wilcoxon`, `Tabel H — Kruskal-Wallis`, dan seterusnya. `symbol` adalah bagian sebelum tanda pisah (`U`, `t`, `χ²`).

Definisi per tabel (id — field `key:default` — jangkauan grid):

| id | fields | grid |
|---|---|---|
| `z` | alpha:0.05, tails:2 | baris 0.0–3.9 (1 desimal), kolom .00–.09 |
| `t` | df:30, alpha:0.05, tails:2 | df 1–100 + 120,200,∞; kolom α .10/.05/.025/.01 |
| `f` | df1:5, df2:20, alpha:0.05 | df1 1–20 × df2 1–60, tab α .05/.01 |
| `chi-square` | df:10, alpha:0.05 | df 1–100, kolom α .10/.05/.025/.01 |
| `r-pearson` | df:30, alpha:0.05, tails:2 | df 1–100, kolom α .10/.05/.01 |
| `binomial` | n:10, p:0.5, k:3 | n selector 2–25, baris k 0..n, kolom p .05..0.95 |
| `poisson` | lambda:3, k:2 | λ selector 0.1–10, baris k 0–20 |
| `mann-whitney` | n1:8, n2:8, alpha:0.05, tails:2 | n1 1–20 baris, n2 1–20 kolom |
| `wilcoxon` | n:10, alpha:0.05, tails:2 | n 5–25, kolom α .05/.01 (dua ekor) |
| `kruskal-wallis` | k:3, n:5, alpha:0.05 | k 3–10 baris, n 2–10 kolom |
| `friedman` | k:3, n:10, alpha:0.05 | k 3–10 baris, n 2–30 kolom |
| `spearman` | n:10, alpha:0.05, tails:2 | n 4–30, kolom α .10/.05/.01 |
| `kendall-tau` | n:10, alpha:0.05, tails:2 | n 4–30, kolom α .10/.05/.01 |
| `kendall-w` | k:3, n:5, alpha:0.05 | k 3–10 baris, n 2–10 kolom |
| `ks-satu-sampel` | n:20, alpha:0.05 | n 1–50, kolom α .10/.05/.01 |
| `ks-dua-sampel` | n1:10, n2:10, alpha:0.05 | n1 1–20 baris, n2 1–20 kolom |
| `cochran-q` | k:3, n:10, alpha:0.05 | k 3–10 baris, n 2–30 kolom |
| `sign-mcnemar` | mode:sign, n:10, alpha:0.05, tails:2 | n 1–50, kolom α .10/.05/.01 |
| `runs` | n1:10, n2:10, alpha:0.05 | n1 1–20 baris, n2 1–20 kolom |

Bentuk hasil: `runs` → `kind: 'pair'` dengan `primary` = batas bawah dan `secondary` = batas atas; `binomial`/`poisson` → `kind: 'probability'` dengan `primary` = `P(X=k)` dan `secondary` = `P(X≤k)`, label keduanya eksplisit; sisanya `kind: 'scalar'`.

Tujuh tabel kurasi (`durbin-watson`, `tukey-q`, `dunnett`, `f-max`, `toleransi`, `shapiro-wilk`, `lillefors`) didefinisikan dengan `status: 'menunggu-sumber'`, `lookup` yang mengembalikan `{ error: 'Tabel ini menunggu sumber angkanya.' }`, dan `buildGrid` yang mengembalikan grid kosong satu baris (`—`). Plan 2 menggantinya.

- [ ] **Step 5: Implementasi `registry.ts` dan `guides.ts`**

`TABLES` = gabungan `COMPUTED_TABLES` dan `PENDING_TABLES`, diurutkan parametrik lalu nonparametrik sesuai §6. `searchTables` mencocokkan lowercase dari `name`, `symbol`, `id`, dan `aliases` (substring), mengembalikan maksimal 8 hasil. `guides.ts` menyimpan 19 array paragraf panduan (3–5 kalimat: untuk apa, cara membaca, catatan ekor) dan `method` satu kalimat.

- [ ] **Step 6: Jalankan, pastikan lulus**

Run: `npx vitest run src/lib/tables/__tests__/registry.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/tables/
git commit -m "feat(tables): add table registry with 19 computed tables"
```

---

### Task 12: Halaman tabel — lookup, hasil, validasi

**Files:**
- Create: `src/pages/TablePage.tsx`, `src/components/table/LookupBar.tsx`, `src/components/table/ResultDisplay.tsx`, `src/lib/format.ts`
- Modify: `src/App.tsx` (rute `/t/:id` memakai `TablePage`)
- Test: `src/components/table/LookupBar.test.tsx`, `src/pages/TablePage.test.tsx`

**Interfaces:**
- Consumes: `getTable`, `LookupOutcome`, `TableDef`.
- Produces: `TablePage` (tanpa props), `LookupBar({ table, values, onChange, onSubmit, outcome })`, `ResultDisplay({ outcome })`, `formatNumber(v: number): string` (3 desimal, `<0.001`), `formatProbability(v: number): string` (4 desimal).

- [ ] **Step 1: Tulis test yang gagal**

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { LookupBar } from './LookupBar'
import { getTable } from '@/lib/tables/registry'

test('menampilkan input df dan hasil', () => {
  const table = getTable('t')!
  const values = { df: '30', alpha: '0.05', tails: '2' }
  render(
    <LookupBar table={table} values={values} onChange={() => {}} onSubmit={() => {}}
      outcome={table.lookup(values)} />,
  )
  expect(screen.getByLabelText('df')).toHaveValue(30)
  expect(screen.getByText('2.042')).toBeInTheDocument()
  expect(screen.getByText(/two-tailed/i)).toBeInTheDocument()
})

test('error ditampilkan sebagai pesan, bukan angka', () => {
  const table = getTable('t')!
  render(
    <LookupBar table={table} values={{ df: 'abc', alpha: '0.05', tails: '2' }}
      onChange={() => {}} onSubmit={() => {}} outcome={table.lookup({ df: 'abc', alpha: '0.05', tails: '2' })} />,
  )
  expect(screen.getByRole('alert')).toHaveTextContent(/angka/i)
})
```

```tsx
// src/pages/TablePage.test.tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { TablePage } from './TablePage'

test('deep link rusak tidak membuat halaman kosong', () => {
  render(
    <MemoryRouter initialEntries={['/t/t?df=abc&alpha=0.05&tails=2']}>
      <Routes><Route path="/t/:id" element={<TablePage />} /></Routes>
    </MemoryRouter>,
  )
  expect(screen.getByRole('heading', { name: /tabel t/i })).toBeInTheDocument()
  expect(screen.getByRole('alert')).toBeInTheDocument()
})
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `npx vitest run src/components/table/LookupBar.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementasi `format.ts`, `LookupBar`, `ResultDisplay`**

`formatNumber(v)`: `Math.abs(v) < 0.001 && v !== 0 ? '<0.001' : v.toFixed(3)`. `formatProbability(v)`: `v.toFixed(4)`. Keduanya selalu memakai titik.

Field dari `table.fields` dirender berurutan: label uppercase 9.5px, input `number` (dengan `aria-label` = `field.label`) atau `select`. Enter dan tombol `Hitung` memanggil `onSubmit`. `ResultDisplay` menangani tiga `kind`: `scalar` satu angka serif 40px hijau; `pair` dua angka sejajar dengan label kecil; `probability` angka utama + angka kedua 18px. Label ekor: `tails === '2'` → `two-tailed`, selain itu `one-tailed`. `error` dirender sebagai `<p role="alert">` merah gelap, dan angka lama tidak ditampilkan.

- [ ] **Step 4: Implementasi `TablePage`**

`useParams` → `getTable`; `id` tidak dikenal → `<NotFound />`. State nilai diinisialisasi dari `fields[].default`, lalu ditimpa `useSearchParams` bila ada; nilai URL yang tidak bisa di-parse dibiarkan masuk state apa adanya agar pesan validasi muncul dan halaman tetap dirender. `onSubmit` menulis `searchParams` dan menghitung `outcome`. Halaman diawali breadcrumb kecil (`Parametrik / t`) dan `<h1>` berisi `table.name`.

- [ ] **Step 5: Jalankan, pastikan lulus**

Run: `npx vitest run src/components/table/LookupBar.test.tsx src/pages/TablePage.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/pages/TablePage.tsx src/components/table/ src/App.tsx
git commit -m "feat(ui): add table page with lookup bar and result display"
```

---

### Task 13: Grid tabel

**Files:**
- Create: `src/components/table/TableGrid.tsx`
- Modify: `src/pages/TablePage.tsx` (render grid di bawah lookup)
- Test: `src/components/table/TableGrid.test.tsx`

**Interfaces:**
- Consumes: `GridModel`.
- Produces: `TableGrid({ model, highlightRow, onCellClick })` dengan `highlightRow?: string`, `onCellClick?: (value: number) => void`.

- [ ] **Step 1: Tulis test yang gagal**

```tsx
import { render, screen } from '@testing-library/react'
import { TableGrid } from './TableGrid'
import { getTable } from '@/lib/tables/registry'

test('merender header dan baris yang disorot', () => {
  const model = getTable('t')!.buildGrid({ alpha: '0.05' })
  render(<TableGrid model={model} highlightRow="30" />)
  expect(screen.getByRole('columnheader', { name: 'df' })).toBeInTheDocument()
  const row = screen.getByText('30').closest('tr')!
  expect(row).toHaveAttribute('data-highlighted', 'true')
})

test('grid menggulir di dalam kontainernya sendiri', () => {
  const model = getTable('f')!.buildGrid({ alpha: '0.05' })
  const { container } = render(<TableGrid model={model} />)
  expect(container.firstElementChild).toHaveClass('overflow-auto')
})
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `npx vitest run src/components/table/TableGrid.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementasi**

Wrapper `div.overflow-auto.max-h-[70vh]`; `<table className="tabular-nums">`; `thead` sticky (`sticky top-0 bg-paper`); kolom pertama sticky kiri (`sticky left-0 bg-paper`). Baris dengan `key === highlightRow` mendapat `data-highlighted="true"`, latar `--color-cream`, dan `box-shadow: inset 2px 0 0 var(--color-gold)`. Sel `null` dirender `—`. Klik sel memanggil `onCellClick` bila ada. `gridSelectors` dirender sebagai baris tab di atas grid.

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `npx vitest run src/components/table/TableGrid.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/table/TableGrid.tsx src/pages/TablePage.tsx
git commit -m "feat(ui): add scrollable table grid with sticky headers"
```

---

### Task 14: Salin, CSV, cetak

**Files:**
- Create: `src/components/table/TableActions.tsx`
- Modify: `src/lib/format.ts` (tambah `toCsv`), `src/pages/TablePage.tsx`
- Test: `src/lib/format.test.ts`

**Interfaces:**
- Consumes: `formatNumber`, `formatProbability`, `GridModel`.
- Produces:
  - `toCsv(model: GridModel): string`
  - `TableActions({ model, highlightRow })`

- [ ] **Step 1: Tulis test yang gagal**

```ts
import { expect, test } from 'vitest'
import { formatNumber, formatProbability, toCsv } from './format'

test('desimal selalu titik', () => {
  expect(formatNumber(2.0422)).toBe('2.042')
  expect(formatNumber(0.0004)).toBe('<0.001')
  expect(formatProbability(0.171875)).toBe('0.1719')
})
test('CSV memakai koma dan mengutip sel berkoma', () => {
  const csv = toCsv({ rowHeader: 'df', columns: [{ key: 'a', label: 'α .05' }],
    rows: [{ key: '1', label: '1', cells: [12.706] }] })
  expect(csv.split('\n')[0]).toBe('df,"α .05"')
  expect(csv.split('\n')[1]).toBe('1,12.706')
})
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `npx vitest run src/lib/format.test.ts`
Expected: FAIL — `toCsv` belum ada.

- [ ] **Step 3: Implementasi `toCsv`**

Header `rowHeader` + label kolom, baris `label` + sel terformat; bungkus dengan `"` bila mengandung `,`, `"`, atau baris baru (escape `"` → `""`). Sel `null` menjadi string kosong.

- [ ] **Step 4: Implementasi `TableActions`**

Tiga tombol: `Salin baris` (menyalin baris ter-highlight sebagai TSV, atau seluruh grid bila tidak ada highlight), `Unduh CSV` (Blob + `URL.createObjectURL`, nama `tabel-<id>.csv`), `Print / PDF` (`window.print()`). Toast via `sonner`.

- [ ] **Step 5: Tambahkan CSS cetak**

Di `src/index.css`, `@media print`: sembunyikan `header`, `[data-print="hide"]`; grid `overflow: visible`, `max-height: none`; `thead` `display: table-header-group`; `tr` `break-inside: avoid`; ukuran A4 margin 12mm; tabel lebar (`.table-wide`) `page-break-before: always` + font 9px.

- [ ] **Step 6: Jalankan, pastikan lulus**

Run: `npx vitest run src/lib/format.test.ts && npm run build`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/format.ts src/components/table/TableActions.tsx src/pages/TablePage.tsx src/index.css
git commit -m "feat: add copy csv and print actions"
```

---

### Task 15: Beranda

**Files:**
- Create: `src/pages/Home.tsx`, `src/components/home/TableList.tsx`, `src/components/home/RecentTables.tsx`, `src/lib/useRecentTables.ts`
- Test: `src/pages/Home.test.tsx`

**Interfaces:**
- Consumes: `TABLES`, `searchTables`.
- Produces: `Home` (tanpa props), `useRecentTables(): { recent: string[]; push: (id: string) => void }` (localStorage key `st.recent`, maksimum 5).

- [ ] **Step 1: Tulis test yang gagal**

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Home } from './Home'

test('menampilkan pencarian, tab kategori, dan daftar tabel', () => {
  render(<MemoryRouter><Home /></MemoryRouter>)
  expect(screen.getByPlaceholderText(/cari tabel/i)).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'Semua' })).toBeInTheDocument()
  expect(screen.getAllByRole('link', { name: /tabel t/i }).length).toBeGreaterThan(0)
})
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `npx vitest run src/pages/Home.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementasi**

Judul serif 40px "Tabel statistik, satu tempat." + subjudul satu baris. Input pencarian besar (garis bawah, bukan kotak) yang memfilter daftar langsung; Enter membuka hasil pertama. Tab `Semua / Parametrik / Nonparametrik` (shadcn Tabs, gaya garis + underline emas). Daftar: baris tipis dengan simbol serif besar di kiri, nama, subtitle, garis pemisah `--color-hair`; tabel `menunggu-sumber` menampilkan badge kecil "menunggu sumber" dan tetap bisa dibuka. `RecentTables` di atas daftar bila ada. `TablePage` memanggil `push(id)` saat dibuka.

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `npx vitest run src/pages/Home.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Home.tsx src/components/home/ src/lib/useRecentTables.ts src/pages/TablePage.tsx
git commit -m "feat: add home page with search categories and recents"
```

---

### Task 16: Palet pencarian ⌘K

**Files:**
- Create: `src/components/search/CommandPalette.tsx`
- Modify: `src/components/layout/SiteHeader.tsx`, `src/App.tsx`
- Test: `src/components/search/CommandPalette.test.tsx`

**Interfaces:**
- Consumes: `searchTables`, `TABLES`.
- Produces: `CommandPalette({ open, onOpenChange })`; `SiteHeader` membuka palet lewat tombol dan `Ctrl/Cmd+K`.

- [ ] **Step 1: Tulis test yang gagal**

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CommandPalette } from './CommandPalette'

test('mencari lewat alias', () => {
  render(<MemoryRouter><CommandPalette open onOpenChange={() => {}} /></MemoryRouter>)
  fireEvent.change(screen.getByPlaceholderText(/cari tabel/i), { target: { value: 'mann whitney' } })
  expect(screen.getByText(/tabel u/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `npx vitest run src/components/search/CommandPalette.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementasi**

shadcn `CommandDialog`; item dikelompokkan `Parametrik` / `Nonparametrik`; `onSelect` → `navigate('/t/' + id)` + tutup. `SiteHeader` memasang listener `keydown` untuk `(e.metaKey || e.ctrlKey) && e.key === 'k'`.

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `npx vitest run src/components/search/CommandPalette.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/search/ src/components/layout/SiteHeader.tsx src/App.tsx
git commit -m "feat: add command palette search with aliases"
```

---

### Task 17: PWA, deploy, halaman Tentang

**Files:**
- Create: `src/pages/About.tsx`, `src/pages/NotFound.tsx`, `public/icon-192.png`, `public/icon-512.png`
- Modify: `vite.config.ts` (VitePWA), `vercel.json`, `src/App.tsx`
- Test: `src/pages/About.test.tsx`

**Interfaces:**
- Produces: rute `/tentang`, `*`; manifest PWA.

- [ ] **Step 1: Tulis test yang gagal**

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { About } from './About'

test('menjelaskan metode dan bukan aplikasi hitung', () => {
  render(<MemoryRouter><About /></MemoryRouter>)
  expect(screen.getByText(/bukan aplikasi hitung/i)).toBeInTheDocument()
  expect(screen.getByText(/dihitung dari rumus/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `npx vitest run src/pages/About.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementasi About dan NotFound**

About: tiga bagian — "Apa ini", "Bagaimana angkanya dibuat" (dihitung dari rumus; tabel kurasi dari sumber tercetak dan diberi label), "Batasan" (K-S dua sampel asymptotik; uji berbasis χ² memakai aproksimasi; eksak hanya sampai n tertentu). NotFound: pesan + tautan ke beranda.

- [ ] **Step 4: Konfigurasi PWA**

`VitePWA({ registerType: 'autoUpdate', manifest: { name: 'Statistictable', short_name: 'Statistictable', start_url: '/', display: 'standalone', background_color: '#FFFDFD', theme_color: '#136207', icons: [...] }, workbox: { globPatterns: ['**/*.{js,css,html,png,svg,woff2}'] } })`. Daftarkan `virtual:pwa-register` di `main.tsx`.

- [ ] **Step 5: Konfigurasi deploy**

`vercel.json`: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`.

- [ ] **Step 6: Jalankan, pastikan lulus**

Run: `npx vitest run && npm run build`
Expected: semua test PASS; `dist/` berisi `manifest.webmanifest` dan `sw.js`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add pwa offline support about page and deploy config"
```

---

### Task 18: Pemeriksaan akhir Plan 1

**Files:**
- Modify: `docs/verifikasi.md` (baru)

- [ ] **Step 1: Jalankan seluruh test**

Run: `npx vitest run`
Expected: semua PASS.

- [ ] **Step 2: Cek manual di browser**

Run: `npm run dev`
Periksa: `/` menampilkan 26 baris; `/t/t?df=30&alpha=0.05&tails=2` menampilkan `2.042`; `/t/f` menggulir horizontal tanpa melebarkan halaman; `Ctrl+K` menemukan "mann whitney"; `Print` pada `/t/t` tidak memotong kolom; mode offline (DevTools → Offline) memuat ulang halaman.

- [ ] **Step 3: Catat hasil verifikasi**

Tulis `docs/verifikasi.md` berisi tabel: tabel, sel yang dicek, nilai yang diharapkan (dari sumber), nilai aplikasi, status. Minimal 5 sel per tabel hitung.

- [ ] **Step 4: Commit**

```bash
git add docs/verifikasi.md
git commit -m "docs: record manual verification of computed tables"
```

---

## Catatan untuk eksekutor

- Tujuh tabel kurasi sengaja kosong di Plan 1; jangan mengisi angkanya. Plan 2 yang mengisinya.
- Bila `@fontsource/instrument-serif` gagal dipasang, ganti `--font-display` ke `Georgia, "Times New Roman", serif` dan lanjut.
- Bila `npx shadcn@latest init` menanyakan hal interaktif, pilih default dan pastikan `components.json` + alias `@/*` terbentuk sebelum Task 12.
