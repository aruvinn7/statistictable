import { useSyncExternalStore } from 'react'

export interface PwaState { needRefresh: boolean; offlineReady: boolean }

let state: PwaState = { needRefresh: false, offlineReady: false }
const listeners = new Set<() => void>()

export function setPwaState(patch: Partial<PwaState>) {
  state = { ...state, ...patch }
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function usePwaState() {
  return useSyncExternalStore(subscribe, () => state, () => state)
}

export function requestPwaUpdate() {
  window.dispatchEvent(new Event('st:pwa-update'))
}
