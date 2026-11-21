# Statistictable — Plan 2: Tabel Kurasi & Panduan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengisi tujuh tabel yang menunggu sumber (Durbin-Watson, Tukey q, Dunnett, F-max, toleransi, Shapiro-Wilk, Lillefors) dengan angka tersitasi, plus panduan dan halaman Tentang yang menyebut sumbernya.

**Architecture:** Satu format data kurasi (`CuratedData`) + satu interpolator generik. Setiap tabel kurasi adalah satu berkas JSON dengan `source`, sumbu, dan sel; registry memakai interpolator itu. Angka persis dari tabel → tanpa penanda; di antara titik → `≈` + catatan; di luar jangkauan → pesan, bukan angka.

**Tech Stack:** Sama dengan Plan 1 (React 19, TS, Vite, Vitest). Tidak ada dependensi baru.

**Spec:** `docs/superpowers/specs/2026-11-22-statistictable-design.md` (§6.2, §11, §13)

## Global Constraints

- Desimal titik; angka kurasi 3 desimal.
- Setiap berkas data kurasi wajib punya `source` berisi nama tabel, edisi, halaman/bagian, dan URL bila ada. Tidak ada angka tanpa sumber.
- Tidak ada nilai yang dikarang. Bila sumber tidak ditemukan, tabel tetap `menunggu-sumber` dan Plan 2 berhenti untuk tabel itu — jangan diisi angka perkiraan.
- Sumbu yang bersifat kategorik (`alpha`, `gamma`, `P`, `sisi`) **tidak boleh** diinterpolasi; harus cocok persis.
- Semua angka interpolasi ditandai `interpolated: true` dan dirender dengan awalan `≈`.
- UI berbahasa Indonesia.

## Review Focus

1. **Nilai persis** dari tabel sumber → tanpa `≈`, tanpa catatan interpolasi.
2. **Nilai di antara titik** → `≈` + catatan "interpolasi antar nilai tabel", dan angkanya berada di antara dua nilai tetangga.
3. **Di luar jangkauan** (n=5 pada tabel yang mulai n=6, df=200) → pesan "di luar jangkauan tabel", bukan angka dan bukan `NaN`.
4. **Sumbu kategorik** (α 0.05 vs 0.01, sisi 1 vs 2) → tidak pernah menghasilkan nilai campuran; α yang tidak ada di tabel → pesan, bukan interpolasi.
5. **Pasangan dL/dU** → dua angka selalu berurutan `dL < dU`, dan keduanya ikut tersalin.

## File Structure

```
src/lib/tables/curated/
  types.ts            # CuratedData
  lookup.ts           # lookupCurated + interpolasi multilinear
  durbin-watson.json
  tukey-q.json
  dunnett.json
  f-max.json
  toleransi.json
  shapiro-wilk.json
  lillefors.json
  __tests__/lookup.test.ts
  __tests__/anchors.ts
src/lib/tables/curated-tables.ts   # definisi TableDef untuk 7 tabel
```

---

### Task 1: Format data kurasi + interpolator

**Files:**
- Create: `src/lib/tables/curated/types.ts`, `src/lib/tables/curated/lookup.ts`
- Test: `src/lib/tables/curated/__tests__/lookup.test.ts`

**Interfaces:**
- Produces:

```ts
// types.ts
export interface CuratedData {
  id: string
  source: string
  axes: string[]                    // urutan sumbu, mis. ['n', 'k', 'alpha']
  axisValues: Record<string, number[]>
  exactAxes: string[]               // sumbu kategorik yang harus cocok persis
  cells: Record<string, number[]>   // key = nilai sumbu digabung '|', value 1 atau 2 angka
}

// lookup.ts
export type CuratedLookup =
  | { values: number[]; interpolated: boolean; note?: string }
  | { error: string }

export function lookupCurated(data: CuratedData, query: Record<string, number>): CuratedLookup
```

- [ ] **Step 1: Tulis test yang gagal**

```ts
import { expect, test } from 'vitest'
import { lookupCurated } from '../lookup'
import type { CuratedData } from '../types'

const data: CuratedData = {
  id: 'demo', source: 'uji',
  axes: ['n', 'alpha'], exactAxes: ['alpha'],
  axisValues: { n: [6, 10, 20], alpha: [0.05, 0.01] },
  cells: {
    '6|0.05': [1.0], '10|0.05': [2.0], '20|0.05': [3.0],
    '6|0.01': [4.0], '10|0.01': [5.0], '20|0.01': [6.0],
  },
}

test('nilai persis', () => {
  expect(lookupCurated(data, { n: 10, alpha: 0.05 })).toEqual({ values: [2], interpolated: false })
})
test('interpolasi di antara titik', () => {
  const r = lookupCurated(data, { n: 15, alpha: 0.05 })
  expect('values' in r && r.values[0]).toBeCloseTo(2.5, 10)
  expect('interpolated' in r && r.interpolated).toBe(true)
})
test('sumbu kategorik tidak diinterpolasi', () => {
  const r = lookupCurated(data, { n: 10, alpha: 0.03 })
  expect('error' in r && r.error).toMatch(/alpha/)
})
test('di luar jangkauan', () => {
  const r = lookupCurated(data, { n: 5, alpha: 0.05 })
  expect('error' in r && r.error).toMatch(/jangkauan/)
})
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `npx vitest run src/lib/tables/curated/__tests__/lookup.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementasi `lookupCurated`**

Urutan: (1) validasi semua sumbu ada di `axisValues`; (2) untuk sumbu di `exactAxes`, cari nilai persis (toleransi `1e-9`) — gagal → `{ error: 'Nilai <axis> tidak ada di tabel (pilihan: ...).' }`; (3) untuk sumbu lain, tolak bila di luar `[min, max]` dengan `{ error: 'Parameter <axis> di luar jangkauan tabel (min–max).' }`; (4) bila semua sumbu persis → kembalikan sel; (5) selain itu interpolasi multilinear atas `2^d` sudut (d = jumlah sumbu kontinu yang tidak persis), dengan bobot linear per sumbu; (6) `note: 'interpolasi antar nilai tabel'`.

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `npx vitest run src/lib/tables/curated/__tests__/lookup.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/tables/curated/
git commit -m "feat(tables): add curated data format and multilinear lookup"
```

---

### Task 2: Durbin-Watson

**Files:**
- Create: `src/lib/tables/curated/durbin-watson.json`, `src/lib/tables/curated-tables.ts`
- Test: `src/lib/tables/curated/__tests__/durbin-watson.test.ts`

**Interfaces:**
- Consumes: `lookupCurated`.
- Produces: `CURATED_TABLES: TableDef[]` di `curated-tables.ts`; `registry.ts` menggabungkannya dan membuang definisi `menunggu-sumber` untuk id yang sudah ada.

- [ ] **Step 1: Transkripsi data**

Isi `durbin-watson.json`: `axes: ['n','k','alpha']`, `exactAxes: ['alpha']`, `n` 6–100, `k` 1–5, `alpha` `[0.05, 0.01]`, `cells` berisi `[dL, dU]`. Sumber: tabel Durbin-Watson standar (Savin & White 1977 / Durbin & Watson 1951) — tulis nama tabel, rentang, dan URL/sitasi di `source`. Jangan mengisi sel yang tidak ada di sumber; `lookupCurated` akan melaporkan jangkauan.

- [ ] **Step 2: Tulis test yang gagal**

```ts
import { expect, test } from 'vitest'
import { getTable } from '../../registry'

test('DW mengembalikan pasangan dL < dU', () => {
  const out = getTable('durbin-watson')!.lookup({ n: '15', k: '1', alpha: '0.05' })
  expect('error' in out).toBe(false)
  const r = out as any
  expect(r.kind).toBe('pair')
  expect(r.primary.value).toBeLessThan(r.secondary.value)
})
test('DW di luar jangkauan memberi pesan', () => {
  const out = getTable('durbin-watson')!.lookup({ n: '3', k: '1', alpha: '0.05' })
  expect('error' in out && out.error).toMatch(/jangkauan/)
})
test('DW di antara titik ditandai interpolasi', () => {
  const out = getTable('durbin-watson')!.lookup({ n: '16', k: '1', alpha: '0.05' })
  expect('error' in out).toBe(false)
  expect((out as any).interpolated).toBe(true)
})
```

- [ ] **Step 3: Jalankan, pastikan gagal**

Run: `npx vitest run src/lib/tables/curated/__tests__/durbin-watson.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implementasi definisi tabel**

Di `curated-tables.ts`: `fields` = `n` (6–100, default 15), `k` (1–5, default 1), `alpha` (select .05/.01). `lookup` memanggil `lookupCurated` dan memetakan `values` ke `kind: 'pair'` (`primary` label `dL`, `secondary` label `dU`). `buildGrid({ alpha })` merender baris n 6–100, kolom k 1–5, sel = `dL` (dan `dU` di tooltip). `status: 'tersedia'`, `method` menyebut sumber + "nilai di antara titik diinterpolasi".

- [ ] **Step 5: Jalankan, pastikan lulus**

Run: `npx vitest run src/lib/tables/curated/__tests__/durbin-watson.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/tables/curated/durbin-watson.json src/lib/tables/curated-tables.ts src/lib/tables/registry.ts src/lib/tables/curated/__tests__/durbin-watson.test.ts
git commit -m "feat(tables): add durbin-watson table from published source"
```

---

### Task 3: Tukey q dan Dunnett

**Files:**
- Create: `src/lib/tables/curated/tukey-q.json`, `src/lib/tables/curated/dunnett.json`
- Modify: `src/lib/tables/curated-tables.ts`
- Test: `src/lib/tables/curated/__tests__/tukey-dunnett.test.ts`

**Interfaces:**
- Consumes: `lookupCurated`.
- Produces: dua `TableDef` tambahan dengan `kind: 'scalar'`.

- [ ] **Step 1: Transkripsi data**

`tukey-q.json`: `axes ['k','df','alpha']`, `exactAxes ['alpha']`, k 2–10, df 1–60, alpha `[0.05, 0.01]`, satu angka per sel. Sumber: tabel studentized range (Harter 1960 / tabel q standar) — sitasi di `source`.
`dunnett.json`: `axes ['k','df','alpha']`, `exactAxes ['alpha']`, k 2–10 (jumlah grup termasuk kontrol), df 1–60, alpha `[0.05, 0.01]`, dua sisi. Sumber: tabel Dunnett (Dunnett 1955 / tabel standar).

- [ ] **Step 2: Tulis test yang gagal**

```ts
import { expect, test } from 'vitest'
import { getTable } from '../../registry'

test('Tukey q naik saat k naik', () => {
  const t = getTable('tukey-q')!
  const a = t.lookup({ k: '3', df: '20', alpha: '0.05' }) as any
  const b = t.lookup({ k: '5', df: '20', alpha: '0.05' }) as any
  expect(b.primary.value).toBeGreaterThan(a.primary.value)
})
test('Tukey q turun saat df naik', () => {
  const t = getTable('tukey-q')!
  const a = t.lookup({ k: '3', df: '5', alpha: '0.05' }) as any
  const b = t.lookup({ k: '3', df: '40', alpha: '0.05' }) as any
  expect(b.primary.value).toBeLessThan(a.primary.value)
})
test('alpha di luar daftar ditolak, bukan diinterpolasi', () => {
  const out = getTable('tukey-q')!.lookup({ k: '3', df: '20', alpha: '0.03' })
  expect('error' in out).toBe(true)
})
test('Dunnett punya nilai untuk k=3 df=10', () => {
  const out = getTable('dunnett')!.lookup({ k: '3', df: '10', alpha: '0.05' })
  expect('error' in out).toBe(false)
})
```

- [ ] **Step 3: Jalankan, pastikan gagal**

Run: `npx vitest run src/lib/tables/curated/__tests__/tukey-dunnett.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implementasi definisi tabel**

`fields` keduanya: `k` (2–10), `df` (1–60), `alpha` (select). `buildGrid({ alpha })`: baris k, kolom df. `method` menyebut sumber dan interpolasi.

- [ ] **Step 5: Jalankan, pastikan lulus**

Run: `npx vitest run src/lib/tables/curated/__tests__/tukey-dunnett.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/tables/curated/tukey-q.json src/lib/tables/curated/dunnett.json src/lib/tables/curated-tables.ts src/lib/tables/curated/__tests__/tukey-dunnett.test.ts
git commit -m "feat(tables): add tukey q and dunnett tables"
```

---

### Task 4: F-max dan toleransi

**Files:**
- Create: `src/lib/tables/curated/f-max.json`, `src/lib/tables/curated/toleransi.json`
- Modify: `src/lib/tables/curated-tables.ts`
- Test: `src/lib/tables/curated/__tests__/fmax-toleransi.test.ts`

**Interfaces:**
- Consumes: `lookupCurated`.
- Produces: dua `TableDef` (`f-max` scalar; `toleransi` scalar dengan field `sisi`).

- [ ] **Step 1: Transkripsi data**

`f-max.json`: `axes ['k','df','alpha']`, `exactAxes ['alpha']`, k 2–10, df 1–60, alpha `[0.05, 0.01]`. Sumber: tabel Hartley F-max (Hartley 1950 / tabel standar).
`toleransi.json`: `axes ['n','gamma','P','sisi']`, `exactAxes ['gamma','P','sisi']`, n 2–50, gamma `[0.90, 0.95, 0.99]`, P `[0.90, 0.95, 0.99]`, sisi `[1, 2]`. Sumber: tabel faktor toleransi (Natrella / ISO 16269-6 / tabel k standar).

- [ ] **Step 2: Tulis test yang gagal**

```ts
import { expect, test } from 'vitest'
import { getTable } from '../../registry'

test('F-max naik saat k naik', () => {
  const t = getTable('f-max')!
  const a = t.lookup({ k: '3', df: '10', alpha: '0.05' }) as any
  const b = t.lookup({ k: '6', df: '10', alpha: '0.05' }) as any
  expect(b.primary.value).toBeGreaterThan(a.primary.value)
})
test('toleransi: sisi kategorik tidak dicampur', () => {
  const t = getTable('toleransi')!
  const satu = t.lookup({ n: '10', gamma: '0.95', P: '0.99', sisi: '1' }) as any
  const dua = t.lookup({ n: '10', gamma: '0.95', P: '0.99', sisi: '2' }) as any
  expect(satu.primary.value).not.toBeCloseTo(dua.primary.value, 6)
})
test('toleransi: n di luar jangkauan', () => {
  const out = getTable('toleransi')!.lookup({ n: '1', gamma: '0.95', P: '0.99', sisi: '1' })
  expect('error' in out).toBe(true)
})
```

- [ ] **Step 3: Jalankan, pastikan gagal**

Run: `npx vitest run src/lib/tables/curated/__tests__/fmax-toleransi.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implementasi definisi tabel**

`f-max`: fields `k`, `df`, `alpha`; grid baris k, kolom df.
`toleransi`: fields `n` (2–50), `gamma` (select .90/.95/.99), `P` (select .90/.95/.99), `sisi` (select 1/2, label `Satu sisi` / `Dua sisi`); grid baris n, kolom P, dengan selector gamma + sisi. `method` menyebut sumber.

- [ ] **Step 5: Jalankan, pastikan lulus**

Run: `npx vitest run src/lib/tables/curated/__tests__/fmax-toleransi.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/tables/curated/f-max.json src/lib/tables/curated/toleransi.json src/lib/tables/curated-tables.ts src/lib/tables/curated/__tests__/fmax-toleransi.test.ts
git commit -m "feat(tables): add f-max and tolerance factor tables"
```

---

### Task 5: Shapiro-Wilk dan Lillefors

**Files:**
- Create: `src/lib/tables/curated/shapiro-wilk.json`, `src/lib/tables/curated/lillefors.json`
- Modify: `src/lib/tables/curated-tables.ts`
- Test: `src/lib/tables/curated/__tests__/normality.test.ts`

**Interfaces:**
- Consumes: `lookupCurated`.
- Produces: dua `TableDef` scalar dengan satu sumbu `n` + `alpha`.

- [ ] **Step 1: Transkripsi data**

`shapiro-wilk.json`: `axes ['n','alpha']`, `exactAxes ['alpha']`, n 3–50, alpha `[0.01, 0.05, 0.10]`, nilai W kritis. Sumber: tabel Shapiro-Wilk (Shapiro & Wilk 1965 / tabel standar; bila memakai Royston 1995 sebagai pembanding, catat keduanya di `source`).
`lillefors.json`: `axes ['n','alpha']`, `exactAxes ['alpha']`, n 4–30, alpha `[0.01, 0.05, 0.10, 0.20]`, nilai D kritis Lillefors. Sumber: tabel Lillefors (Lillefors 1967 / tabel standar).

- [ ] **Step 2: Tulis test yang gagal**

```ts
import { expect, test } from 'vitest'
import { getTable } from '../../registry'

test('Shapiro-Wilk turun saat n naik', () => {
  const t = getTable('shapiro-wilk')!
  const a = t.lookup({ n: '10', alpha: '0.05' }) as any
  const b = t.lookup({ n: '30', alpha: '0.05' }) as any
  expect(b.primary.value).toBeLessThan(a.primary.value)
})
test('Lillefors turun saat n naik', () => {
  const t = getTable('lillefors')!
  const a = t.lookup({ n: '10', alpha: '0.05' }) as any
  const b = t.lookup({ n: '25', alpha: '0.05' }) as any
  expect(b.primary.value).toBeLessThan(a.primary.value)
})
test('n di bawah minimum ditolak', () => {
  expect('error' in getTable('shapiro-wilk')!.lookup({ n: '2', alpha: '0.05' })).toBe(true)
  expect('error' in getTable('lillefors')!.lookup({ n: '3', alpha: '0.05' })).toBe(true)
})
```

- [ ] **Step 3: Jalankan, pastikan gagal**

Run: `npx vitest run src/lib/tables/curated/__tests__/normality.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implementasi definisi tabel**

Keduanya: fields `n` + `alpha` (select); `buildGrid({ alpha })` satu kolom nilai dengan baris n; `method` menyebut sumber dan bahwa tabel ini kurasi (bukan hitung).

- [ ] **Step 5: Jalankan, pastikan lulus**

Run: `npx vitest run src/lib/tables/curated/__tests__/normality.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/tables/curated/shapiro-wilk.json src/lib/tables/curated/lillefors.json src/lib/tables/curated-tables.ts src/lib/tables/curated/__tests__/normality.test.ts
git commit -m "feat(tables): add shapiro-wilk and lillefors tables"
```

---

### Task 6: Panduan, Tentang, dan verifikasi

**Files:**
- Modify: `src/lib/tables/guides.ts`, `src/pages/About.tsx`, `src/pages/TablePage.tsx`
- Create: `docs/verifikasi-kurasi.md`
- Test: `src/lib/tables/__tests__/guides.test.ts`

**Interfaces:**
- Consumes: `TABLES`, `CuratedData.source`.
- Produces: panduan lengkap 26 tabel; About mencantumkan sumber tiap tabel kurasi.

- [ ] **Step 1: Tulis test yang gagal**

```ts
import { expect, test } from 'vitest'
import { getTable, TABLES } from '../registry'

const CURATED_IDS = ['durbin-watson', 'tukey-q', 'dunnett', 'f-max', 'toleransi', 'shapiro-wilk', 'lillefors']

test('setiap tabel punya panduan dan catatan metode', () => {
  for (const t of TABLES) {
    expect(t.guide.length, t.id).toBeGreaterThanOrEqual(1)
    expect(t.guide.join(' ').length, t.id).toBeGreaterThan(60)
    expect(t.method.length, t.id).toBeGreaterThan(10)
  }
})
test('setiap tabel kurasi punya sumber atau alasan tertunda', () => {
  for (const id of CURATED_IDS) {
    const t = getTable(id)!
    expect(t.status, id).toMatch(/tersedia|menunggu-sumber/)
    expect(t.method, id).toMatch(/sumber|tertunda/i)
  }
})
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `npx vitest run src/lib/tables/__tests__/guides.test.ts`
Expected: FAIL (panduan kurasi belum ada / status masih menunggu).

- [ ] **Step 3: Tulis panduan**

Untuk 7 tabel kurasi, tulis 3–5 kalimat: untuk apa, cara membaca, catatan ekor/sisi, dan satu kalimat "nilai di antara titik diinterpolasi dan ditandai ≈". Untuk 19 tabel hitung, rapikan panduan Plan 1 agar menyebut batas eksak/approx (U ≤ 20, T ≤ 25, ρ ≤ 10, K-S dua sampel asymptotik, uji berbasis χ² memakai aproksimasi).

- [ ] **Step 4: Perbarui halaman Tentang**

Bagian "Bagaimana angkanya dibuat" menjelaskan dua jalur (hitung vs kurasi). Tambahkan daftar tujuh tabel kurasi dengan `source` masing-masing, dan tautan ke `docs/verifikasi-kurasi.md` di repo.

- [ ] **Step 5: Tandai interpolasi di UI**

Di `ResultDisplay`, bila `interpolated` benar: awali angka dengan `≈` dan tampilkan catatan kecil `interpolasi antar nilai tabel`. Bila `error`, tidak ada angka.

- [ ] **Step 6: Jalankan seluruh test**

Run: `npx vitest run && npm run build`
Expected: semua PASS, build sukses.

- [ ] **Step 7: Verifikasi manual dan catat**

Buka setiap tabel kurasi, cek minimal 5 sel terhadap sumber cetak, catat di `docs/verifikasi-kurasi.md` (tabel, parameter, nilai sumber, nilai aplikasi, status). Bila ada yang tidak cocok, perbaiki JSON — jangan mengubah test.

- [ ] **Step 8: Commit**

```bash
git add src/lib/tables/guides.ts src/pages/About.tsx src/pages/TablePage.tsx docs/verifikasi-kurasi.md
git commit -m "docs: add guides sources and verification for curated tables"
```

---

## Catatan untuk eksekutor

- Urutan tugas ini disengaja: Task 1 harus lulus sebelum tabel mana pun diisi.
- Bila sebuah tabel tidak menemukan sumber yang layak, **jangan** mengisi angkanya. Biarkan `menunggu-sumber`, catat di `docs/verifikasi-kurasi.md`, dan lanjut ke tabel berikutnya. Selesaikan Plan 2 dengan tabel yang tersedia dan laporkan yang tertunda.
- Jangan mengubah test agar cocok dengan angka; ubah angkanya agar cocok dengan sumber.
