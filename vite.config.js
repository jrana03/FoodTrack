import react from '@vitejs/plugin-react'

function remoteLogPlugin() {
  return {
    name: 'remote-log',
    configureServer(server) {
      server.middlewares.use('/api/log', (req, res) => {
        // Handle CORS preflight
        if (req.method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
          })
          res.end()
          return
        }

        let body = ''
        req.on('data', chunk => { body += chunk.toString() })
        req.on('end', () => {
          try {
            const { level, label, args, ua } = JSON.parse(body)

            // Detect device name from user-agent string
            const device = ua?.includes('iPhone') ? 'iPhone'
              : ua?.includes('iPad')    ? 'iPad'
              : ua?.includes('Android') ? 'Android'
              : 'Remote'

            const time   = `\x1b[2m${new Date().toLocaleTimeString()}\x1b[0m`
            const tag    = `\x1b[36m[${device}]\x1b[0m`
            const prefix = [time, tag, label]

            if (level === 'error') console.error(...prefix, ...args)
            else if (level === 'warn')  console.warn(...prefix,  ...args)
            else                        console.log(...prefix,   ...args)
          } catch (e) {
            console.log('\x1b[31m[remote-log] Failed to parse:\x1b[0m', e.message, body.slice(0, 200))
          }

          res.writeHead(204, { 'Access-Control-Allow-Origin': '*' })
          res.end()
        })
      })
    },
  }
}

export default {
  plugins: [react(), remoteLogPlugin()],
  base: '/',
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
}
