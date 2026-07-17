export type PollingController = {
  start: () => void
  stop: () => void
  isRunning: () => boolean
}

export function createPollingController(options: {
  intervalMs: number
  onTick: () => void | Promise<void>
}): PollingController {
  let timer: ReturnType<typeof setInterval> | null = null
  let running = false
  let inFlight = false

  const tick = async () => {
    if (inFlight) {
      return
    }
    inFlight = true
    try {
      await options.onTick()
    } finally {
      inFlight = false
    }
  }

  return {
    start() {
      if (running) {
        return
      }
      running = true
      timer = setInterval(() => {
        void tick()
      }, options.intervalMs)
    },
    stop() {
      running = false
      if (timer !== null) {
        clearInterval(timer)
        timer = null
      }
    },
    isRunning() {
      return running
    },
  }
}
