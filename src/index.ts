import express from 'express'
import cors from 'cors'
import fs from 'node:fs'
import path from 'node:path'
import { connectDB } from './config/database'
import { env } from './config/env'
import authRoutes from './routes/auth.routes'
import stockRoutes from './routes/stock.routes'
import productionRoutes from './routes/production.routes'
import menuRoutes from './routes/menu.routes'  // NOUVEAU

const app = express()
const uploadsDir = path.join(process.cwd(), 'uploads')

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Middlewares
// Middlewares - Version qui accepte TOUT
app.use(cors({
  origin: true,  // true = reflète l'origin de la requête
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use('/uploads', express.static(uploadsDir))
// Routes
app.use('/api/auth', authRoutes)
app.use('/api/stock', stockRoutes)
app.use('/api/production', productionRoutes)
app.use('/api/menu', menuRoutes)  // NOUVEAU

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
