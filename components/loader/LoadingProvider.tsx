'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

/**
 * Asset groups the homepage loader waits on before revealing the page, with the
 * share of the progress bar each one owns (must sum to 1). The hero media is the
 * heavy download, so it dominates the bar; fonts are quick.
 *
 * NOTE: only assets that load eagerly on first render belong here. Below-the-fold
 * section images are lazy and load on scroll — gating the loader on them would
 * deadlock, since the loader covers the viewport and blocks scrolling.
 */
const WEIGHTS = { fonts: 0.15, hero: 0.85 } as const
type RequiredKey = keyof typeof WEIGHTS
const REQUIRED_KEYS = Object.keys(WEIGHTS) as RequiredKey[]

type LoadingContextValue = {
  /** Mark an asset group as fully loaded. Idempotent. */
  reportReady: (key: RequiredKey) => void
  /** Push fractional load progress (0–1) for a group; only ever advances. */
  setProgress: (key: RequiredKey, value: number) => void
  /** True once every required group has reached 100%. */
  allReady: boolean
  /** Weighted aggregate load progress across all groups, 0–1. */
  progress: number
}

const LoadingContext = createContext<LoadingContextValue | null>(null)

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  // Per-key progress, 0–1. A key at 1 is considered ready.
  const [progressMap, setProgressMap] = useState<Record<RequiredKey, number>>(
    () => Object.fromEntries(REQUIRED_KEYS.map((k) => [k, 0])) as Record<RequiredKey, number>
  )

  const setProgress = useCallback((key: RequiredKey, value: number) => {
    const v = value < 0 ? 0 : value > 1 ? 1 : value
    // Monotonic: never let a group's progress go backwards.
    setProgressMap((prev) => (prev[key] >= v ? prev : { ...prev, [key]: v }))
  }, [])

  const reportReady = useCallback(
    (key: RequiredKey) => setProgress(key, 1),
    [setProgress]
  )

  // Fonts are owned by the provider itself.
  useEffect(() => {
    let cancelled = false
    const done = () => { if (!cancelled) reportReady('fonts') }
    const fonts = typeof document !== 'undefined' ? document.fonts : undefined
    if (!fonts) { done(); return }
    if (fonts.status === 'loaded') done()
    else fonts.ready.then(done).catch(done)
    return () => { cancelled = true }
  }, [reportReady])

  const progress = useMemo(
    () => REQUIRED_KEYS.reduce((sum, k) => sum + (progressMap[k] ?? 0) * WEIGHTS[k], 0),
    [progressMap]
  )

  const allReady = useMemo(
    () => REQUIRED_KEYS.every((k) => (progressMap[k] ?? 0) >= 1),
    [progressMap]
  )

  const value = useMemo(
    () => ({ reportReady, setProgress, allReady, progress }),
    [reportReady, setProgress, allReady, progress]
  )

  return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
}

/** For asset owners (the hero) to report their load state. No-ops without a provider. */
export function useLoadingReporter() {
  const ctx = useContext(LoadingContext)
  return useMemo(
    () => ({
      reportReady: ctx?.reportReady ?? (() => {}),
      setProgress: ctx?.setProgress ?? (() => {}),
    }),
    [ctx]
  )
}

/** For the loader to observe overall readiness. Defaults to "ready" with no provider. */
export function useLoadingStatus() {
  const ctx = useContext(LoadingContext)
  return { allReady: ctx?.allReady ?? true, progress: ctx?.progress ?? 1 }
}
