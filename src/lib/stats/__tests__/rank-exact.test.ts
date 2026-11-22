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
  expect(wilcoxonCritical(8, 0.05, 1)).toBe(5)
})

test('parameter tidak valid ditolak', () => {
  expect(() => mannWhitneyCritical(0, 5, 0.05, 2)).toThrow(RangeError)
  expect(() => wilcoxonCritical(0, 0.05, 2)).toThrow(RangeError)
})
