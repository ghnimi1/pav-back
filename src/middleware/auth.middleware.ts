import type { Request, Response, NextFunction } from 'express'
import { verifyToken, type TokenPayload } from '../utils/jwt'  // ← Fusionner les imports

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Non authentifié' })
  }
  
  const token = authHeader.substring(7)
  const payload = verifyToken(token)
  
  if (!payload) {
    return res.status(401).json({ error: 'Token invalide ou expiré' })
  }
  
  req.user = payload
  next()
}

export function adminOnly(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' })
  }
  next()
}

export function clientOnly(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'client') {
    return res.status(403).json({ error: 'Accès réservé aux clients' })
  }
  next()
}