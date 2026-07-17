import { afterEach, describe, expect, it, vi } from 'vitest'
import { createPollingController } from '../polling'

afterEach(() => {
  vi.useRealTimers()
})

describe('createPollingController', () => {
  it('ticks on interval and can stop', async () => {
    vi.useFakeTimers()
    const onTick = vi.fn()
    const polling = createPollingController({
      intervalMs: 1000,
      onTick,
    })

    expect(polling.isRunning()).toBe(false)
    polling.start()
    expect(polling.isRunning()).toBe(true)
    polling.start() // idempotent

    await vi.advanceTimersByTimeAsync(1000)
    expect(onTick).toHaveBeenCalledTimes(1)

    polling.stop()
    expect(polling.isRunning()).toBe(false)
    await vi.advanceTimersByTimeAsync(3000)
    expect(onTick).toHaveBeenCalledTimes(1)
  })

  it('skips overlapping ticks', async () => {
    vi.useFakeTimers()
    let resolveTick: () => void = () => undefined
    const onTick = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveTick = resolve
        }),
    )
    const polling = createPollingController({
      intervalMs: 100,
      onTick,
    })
    polling.start()
    await vi.advanceTimersByTimeAsync(100)
    expect(onTick).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(200)
    expect(onTick).toHaveBeenCalledTimes(1)
    resolveTick()
    await Promise.resolve()
    await vi.advanceTimersByTimeAsync(100)
    expect(onTick).toHaveBeenCalledTimes(2)
    polling.stop()
  })
})
