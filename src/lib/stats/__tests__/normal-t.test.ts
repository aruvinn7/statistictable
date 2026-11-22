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
  expect(tCritical(0.01, 60, 2)).toBeCloseTo(2.66, 3)
})

test('tCdf berhingga di nilai ekstrem', () => {
  expect(Number.isFinite(tCdf(1e6, 1))).toBe(true)
  expect(tCdf(0, 30)).toBeCloseTo(0.5, 10)
})

test('df tidak valid ditolak', () => {
  expect(() => tCritical(0.05, 0, 2)).toThrow(RangeError)
})

test('alpha tidak valid ditolak', () => {
  expect(() => tCritical(0, 30, 2)).toThrow(RangeError)
  expect(() => tCritical(1, 30, 2)).toThrow(RangeError)
  expect(() => normalQuantile(0)).toThrow(RangeError)
})
