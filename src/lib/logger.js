/**
 * Remote logger — in dev mode every call is also POSTed to the Vite dev
 * server's /api/log endpoint so you can read iPhone logs in your PC terminal.
 * In production the fetch is skipped entirely; only console.* runs.
 */

function serialize(args) {
  return args.map(arg => {
    if (arg instanceof Error) {
      return { __type: 'Error', message: arg.message, stack: arg.stack }
    }
    try {
      return JSON.parse(JSON.stringify(arg))
    } catch {
      return String(arg)
    }
  })
}

async function send(level, label, args) {
  if (!import.meta.env.DEV) return
  try {
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level,
        label,
        args: serialize(args),
        ua: navigator.userAgent,
      }),
    })
  } catch {
    // Never throw — logging must not break the app
  }
}

export function log(label, ...args) {
  console.log(label, ...args)
  send('log', label, args)
}

export function warn(label, ...args) {
  console.warn(label, ...args)
  send('warn', label, args)
}

export function error(label, ...args) {
  console.error(label, ...args)
  send('error', label, args)
}
