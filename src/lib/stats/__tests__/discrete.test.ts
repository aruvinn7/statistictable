import { expect, test } from 'vitest'
import { binomialCdf, binomialCritical, binomialPmf } from '../binomial'
import { poissonCdf, poissonPmf } from '../poisson'

test('binomial', () => {
  expect(binomialPmf(10, 0.5, 5)).toBeCloseTo(0.246094, 6)
  expect(binomialCdf(10, 0.5, 3)).toBeCloseTo(0.171875, 6)
  expect(binomialCdf(10, 0.5, 10)).toBeCloseTo(1, 10)
})

test('poisson', () => {
  expect(poissonPmf(2, 3)).toBeCloseTo(0.180447, 6)
  expect(poissonCdf(2, 3)).toBeCloseTo(0.857123, 6)
  expect(poissonCdf(2, 0)).toBeCloseTo(0.135335, 6)
})

test('kritis binomial', () => {
  expect(binomialCritical(10, 0.05, 1)).toBe(1)
  expect(binomialCritical(10, 0.05, 2)).toBe(1)
  expect(binomialCritical(20, 0.05, 1)).toBe(5)
})

test('parameter tidak valid ditolak', () => {
  expect(() => binomialCdf(10, 1.2, 3)).toThrow(RangeError)
  expect(() => poissonCdf(-1, 0)).toThrow(RangeError)
})
