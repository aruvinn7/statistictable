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
