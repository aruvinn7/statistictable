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
  expect(() => chiSquareCritical(0, 10)).toThrow(RangeError)
})
