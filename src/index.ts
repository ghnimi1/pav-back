import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { connectDB } from './config/database'
import { env } from './config/env'
import authRoutes from './routes/auth.routes'
import stockRoutes from './routes/stock.routes'
import productionRoutes from './routes/production.routes'
import menuRoutes from './routes/menu.routes'  // NOUVEAU
import ordersRoutes from './routes/orders.routes'

const app = express()
const uploadsDir = path.join(process.cwd(), 'uploads')

const allowedOrigins = new Set(
  env.CORS_ORIGINS
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
)

function isAllowedOrigin(origin: string) {
  if (allowedOrigins.has(origin)) {
    return true
  }

  if (/^https:\/\/.*\.vercel\.app$/i.test(origin)) {
    return true
  }

  if (/^http:\/\/localhost:\d+$/i.test(origin) || /^https:\/\/localhost:\d+$/i.test(origin)) {
    return true
  }

  return false
}

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Middlewares
app.use((req, res, next) => {
  const origin = req.headers.origin

  if (origin && isAllowedOrigin(origin)) {
    res.header('Access-Control-Allow-Origin', origin)
    res.header('Vary', 'Origin')
    res.header('Access-Control-Allow-Credentials', 'true')
  }

  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  res.header(
    'Access-Control-Allow-Headers',
    req.headers['access-control-request-headers'] || 'Content-Type, Authorization'
  )

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }

  next()
})
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use('/uploads', express.static(uploadsDir))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/stock', stockRoutes)
app.use('/api/production', productionRoutes)
app.use('/api/menu', menuRoutes)  // NOUVEAU
app.use('/api/orders', ordersRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if ((err as any)?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Payload trop volumineux' })
  }
  console.error('Error:', err.stack)
  res.status(500).json({ error: 'Erreur interne du serveur' })
})

// Start server
async function start() {
  try {
    await connectDB()
    app.listen(env.PORT, () => {
      console.log(`🚀 Server running on http://localhost:${env.PORT}`)
      console.log(`📝 Environment: ${env.NODE_ENV}`)
      console.log(`🔗 API: http://localhost:${env.PORT}/api`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

start()
