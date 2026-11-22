export interface CriticalData {
  id: string
  source: string
  method: string
  axes: string[]
  exactAxes: string[]
  axisValues: Record<string, number[]>
  cells: Record<string, number | number[] | null>
}

export type CriticalLookup =
  | { values: number[]; interpolated: boolean; note?: string }
  | { error: string; suggestion?: { field: string; value: number; label: string } }

const TOL = 1e-9

function nearestBracket(values: number[], q: number): [number, number] | null {
  for (let i = 0; i < values.length - 1; i++) {
    if (values[i] - TOL <= q && q <= values[i + 1] + TOL) return [i, i + 1]
  }
  return null
}

/**
 * Cari nilai pada tabel kritikal. Sumbu kategorik harus cocok persis; sumbu
 * kontinu diinterpolasi multilinear dan hasilnya ditandai `interpolated`.
 */
export function lookupCritical(
  data: CriticalData,
  query: Record<string, string | number>,
): CriticalLookup {
  const exact: Record<string, number> = {}
  const cont: Record<string, number> = {}

  for (const axis of data.axes) {
    const raw = query[axis]
    if (raw === undefined || raw === '') return { error: `Parameter ${axis} wajib diisi.` }
    const v = typeof raw === 'number' ? raw : Number(raw)
    if (!Number.isFinite(v)) return { error: `Masukkan angka untuk ${axis}.` }
    const list = data.axisValues[axis]
    if (data.exactAxes.includes(axis)) {
      if (!list.some(x => Math.abs(x - v) < TOL)) {
        return { error: `Nilai ${axis} tidak ada di tabel (pilihan: ${list.join(', ')}).` }
      }
      exact[axis] = v
    } else {
      const lo = Math.min(...list)
      const hi = Math.max(...list)
      if (v < lo - TOL || v > hi + TOL) return { error: `Parameter ${axis} di luar jangkauan tabel (${lo}–${hi}).`, suggestion: { field: axis, value: v < lo ? lo : hi, label: `${axis} terdekat` } }
      cont[axis] = v
    }
  }

  const free = data.axes.filter(a => !data.exactAxes.includes(a))
  const brackets: [number, number][] = []
  for (const axis of free) {
    const list = data.axisValues[axis]
    const q = cont[axis]
    const idx = list.findIndex(x => Math.abs(x - q) < TOL)
    if (idx >= 0) { brackets.push([idx, idx]); continue }
    const b = nearestBracket(list, q)
    if (!b) return { error: `Nilai ${axis} di luar jangkauan tabel.` }
    brackets.push(b)
  }

  const dims = free.length
  const sums: number[] = []
  let totalWeight = 0

  for (let corner = 0; corner < 2 ** dims; corner++) {
    const picked: Record<string, number> = { ...exact }
    let weight = 1
    for (let d = 0; d < dims; d++) {
      const axis = free[d]
      const [lo, hi] = brackets[d]
      const list = data.axisValues[axis]
      const q = cont[axis]
      if (lo === hi) { picked[axis] = list[lo]; continue }
      const side = (corner >> d) & 1
      picked[axis] = list[side === 0 ? lo : hi]
      const t = (q - list[lo]) / (list[hi] - list[lo])
      weight *= side === 0 ? 1 - t : t
    }
    if (weight === 0) continue
    const key = data.axes.map(a => picked[a]).join('|')
    const cell = data.cells[key]
    if (cell === undefined || cell === null) {
      return { error: 'Nilai tabel tidak tersedia untuk kombinasi parameter ini (lihat grid).' }
    }
    const arr = Array.isArray(cell) ? cell : [cell]
    if (sums.length === 0) sums.push(...arr.map(() => 0))
    if (arr.length !== sums.length) return { error: 'Bentuk nilai tabel tidak konsisten.' }
    for (let i = 0; i < arr.length; i++) sums[i] += weight * arr[i]
    totalWeight += weight
  }

  if (!totalWeight) return { error: 'Nilai tabel tidak tersedia untuk kombinasi parameter ini.' }
  const interpolated = free.some((_, d) => brackets[d][0] !== brackets[d][1])
  return {
    values: sums.map(v => v / totalWeight),
    interpolated,
    note: interpolated ? 'interpolasi antar nilai tabel' : undefined,
  }
}
