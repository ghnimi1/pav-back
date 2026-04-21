import jwt from 'jsonwebtoken'
import { env } from '../config/env'

export interface TokenPayload {
  id: string
  email: string
  role: 'admin' | 'user' | 'client'
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload
  } catch (error) {
    return null
  }
}

// Supprimer cette ligne car TokenPayload est déjà exportée comme interface
// export type { TokenPayload }  ← À SUPPRIMER