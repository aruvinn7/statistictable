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
