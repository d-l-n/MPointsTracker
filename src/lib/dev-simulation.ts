export interface DevSimState {
  simulateEmptyState: boolean
  simulateHighVolume: boolean
  simulateLatencyMs: number
  simulateFailureRate: number
  firestoreError: 'permission-denied' | 'unavailable' | null
}

type DevSimListener = (state: DevSimState) => void

let _state: DevSimState = {
  simulateEmptyState: false,
  simulateHighVolume: false,
  simulateLatencyMs: 0,
  simulateFailureRate: 0,
  firestoreError: null,
}

const _listeners = new Set<DevSimListener>()

export function getDevSimState(): DevSimState {
  return _state
}

export function setDevSimState(patch: Partial<DevSimState>): DevSimState {
  _state = { ..._state, ...patch }
  _listeners.forEach(fn => fn(_state))
  return _state
}

export function resetDevSimState(): DevSimState {
  _state = {
    simulateEmptyState: false,
    simulateHighVolume: false,
    simulateLatencyMs: 0,
    simulateFailureRate: 0,
    firestoreError: null,
  }
  _listeners.forEach(fn => fn(_state))
  return _state
}

export function subscribeDevSim(fn: DevSimListener): () => void {
  _listeners.add(fn)
  return () => _listeners.delete(fn)
}
