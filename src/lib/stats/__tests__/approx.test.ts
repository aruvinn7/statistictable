import { expect, test } from 'vitest'
import {
  cochranQCritical,
  friedmanCritical,
  kendallWCritical,
  kruskalWallisCritical,
} from '../approx'

test('semua memakai df = k - 1', () => {
  expect(kruskalWallisCritical(3, 5, 0.05)).toBeCloseTo(5.991, 3)
  expect(friedmanCritical(4, 10, 0.05)).toBeCloseTo(7.815, 3)
  expect(kendallWCritical(3, 5, 0.01)).toBeCloseTo(9.21, 3)
  expect(cochranQCritical(4, 10, 0.05)).toBeCloseTo(7.815, 3)
})

test('k < 2 ditolak', () => {
  expect(() => kruskalWallisCritical(1, 5, 0.05)).toThrow(RangeError)
  expect(() => friedmanCritical(1, 5, 0.05)).toThrow(RangeError)
})
