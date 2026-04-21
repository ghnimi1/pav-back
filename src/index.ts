import express from 'express'
import cors from 'cors'
import { connectDB } from './config/database'
import { env } from './config/env'
import authRoutes from './routes/auth.routes'
import stockRoutes from './routes/stock.routes'
import productionRoutes from './routes/production.routes'
import menuRoutes from './routes/menu.routes'  // NOUVEAU

const app = express()

// Middlewares
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

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