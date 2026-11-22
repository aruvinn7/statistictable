import { describe, expect, test } from 'vitest'
import {
  erf,
  inverseRegularizedBeta,
  inverseRegularizedGammaP,
  logGamma,
  regularizedBeta,
  regularizedGammaP,
} from '../special'

describe('special', () => {
  test('logGamma cocok dengan faktorial', () => {
    expect(Math.exp(logGamma(6))).toBeCloseTo(120, 6)
    expect(logGamma(0.5)).toBeCloseTo(Math.log(Math.sqrt(Math.PI)), 8)
  })

  test('regularizedBeta simetris', () => {
    expect(regularizedBeta(2, 3, 0.4)).toBeCloseTo(0.5248, 4)
    expect(regularizedBeta(2, 3, 0.4) + regularizedBeta(3, 2, 0.6)).toBeCloseTo(1, 8)
  })

  test('regularizedBeta di batas', () => {
    expect(regularizedBeta(2, 3, 0)).toBe(0)
    expect(regularizedBeta(2, 3, 1)).toBe(1)
  })

  test('regularizedGammaP', () => {
    expect(regularizedGammaP(1, 1)).toBeCloseTo(0.6321205588, 8)
    expect(regularizedGammaP(5, 9.1535)).toBeCloseTo(0.95, 4)
  })

  test('inverseRegularizedGammaP membalik P', () => {
    expect(inverseRegularizedGammaP(0.95, 5)).toBeCloseTo(9.1535, 3)
  })

  test('inverseRegularizedBeta membalik I_x', () => {
    expect(inverseRegularizedBeta(0.5248, 2, 3)).toBeCloseTo(0.4, 4)
  })

  test('erf', () => {
    expect(erf(0)).toBe(0)
    expect(erf(1)).toBeCloseTo(0.8427007929, 8)
    expect(erf(-1)).toBeCloseTo(-0.8427007929, 8)
  })

  test('domain tidak valid ditolak', () => {
    expect(() => regularizedGammaP(0, 1)).toThrow(RangeError)
    expect(() => logGamma(0)).toThrow(RangeError)
  })
})
