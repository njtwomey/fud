import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useLocalStorage } from './use-local-storage'

describe('useLocalStorage', () => {
  it('returns the initial value and persists updates', () => {
    const { result } = renderHook(() => useLocalStorage('k', [1]))
    expect(result.current[0]).toEqual([1])
    act(() => result.current[1]((prev) => [...prev, 2]))
    expect(result.current[0]).toEqual([1, 2])
    expect(JSON.parse(window.localStorage.getItem('k') ?? 'null')).toEqual([1, 2])
  })
  it('reads an existing value', () => {
    window.localStorage.setItem('k2', JSON.stringify('saved'))
    const { result } = renderHook(() => useLocalStorage('k2', 'default'))
    expect(result.current[0]).toBe('saved')
  })
  it('falls back to the initial value when storage holds garbage', () => {
    window.localStorage.setItem('k3', '{not json')
    const { result } = renderHook(() => useLocalStorage('k3', 'default'))
    expect(result.current[0]).toBe('default')
  })
  it('keeps working in memory when storage throws', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    const { result } = renderHook(() => useLocalStorage('k4', 0))
    act(() => result.current[1](5))
    expect(result.current[0]).toBe(5)
    spy.mockRestore()
  })
})
