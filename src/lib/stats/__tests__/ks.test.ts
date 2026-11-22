import { expect, test } from 'vitest'
import { ksOneSampleCritical, ksTwoSampleCritical } from '../ks'

test('K-S satu sampel cocok tabel buku', () => {
  expect(ksOneSampleCritical(20, 0.05)).toBeCloseTo(0.294, 3)
  expect(ksOneSampleCritical(5, 0.05)).toBeCloseTo(0.563, 3)
  expect(ksOneSampleCritical(15, 0.05)).toBeCloseTo(0.338, 3)
  expect(ksOneSampleCritical(50, 0.05)).toBeCloseTo(0.188, 3)
})

// Tabel cetak (Massey) menulis 0.490 untuk n=10, alpha=0.01. Nilai eksak
// dari distribusi kontinu adalah 0.48893, jadi yang dipakai 0.489.
test('K-S satu sampel n kecil memakai nilai eksak', () => {
  expect(ksOneSampleCritical(1, 0.05)).toBeCloseTo(0.975, 3)
  expect(ksOneSampleCritical(10, 0.05)).toBeCloseTo(0.409, 3)
  expect(ksOneSampleCritical(10, 0.01)).toBeCloseTo(0.489, 3)
})

test('K-S dua sampel memakai aproksimasi asymptotik', () => {
  const d = ksTwoSampleCritical(10, 10, 0.05)
  expect(d).toBeCloseTo(1.36 * Math.sqrt(20 / 100), 3)
  expect(ksTwoSampleCritical(10, 10, 0.01)).toBeCloseTo(1.63 * Math.sqrt(20 / 100), 3)
})

test('n tidak valid ditolak', () => {
  expect(() => ksOneSampleCritical(0, 0.05)).toThrow(RangeError)
  expect(() => ksTwoSampleCritical(0, 5, 0.05)).toThrow(RangeError)
  expect(() => ksOneSampleCritical(10, 0)).toThrow(RangeError)
})
