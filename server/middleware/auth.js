import jwt from 'jsonwebtoken'
import { getJwtSecret } from '../config/env.js'

export function requireAuth(req, res, next) {
  const header = req.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required.' })
  }

  try {
    const token = header.slice(7)
    req.user = jwt.verify(token, getJwtSecret())
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session.' })
  }
}

export function requireVendor(req, res, next) {
  if (req.user?.role !== 'vendor') {
    return res.status(403).json({ message: 'Vendor access only.' })
  }
  next()
}
