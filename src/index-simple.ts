import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 5000

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body
  // Pour test, accepter n'importe quel email/mot de passe
  res.json({
    token: 'test-token-123',
    user: {
      _id: 'test-id',
      email: email,
      name: 'Test User',
      role: 'client',
      createdAt: new Date().toISOString(),
      loyaltyPoints: 0
    }
  })
})

app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body
  res.status(201).json({
    token: 'test-token-123',
    user: {
      _id: 'new-id',
      email: email,
      name: name,
      role: 'client',
      createdAt: new Date().toISOString(),
      loyaltyPoints: 50
    }
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`)
})