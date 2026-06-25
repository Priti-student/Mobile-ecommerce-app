import './config/env.js'
import cors from 'cors'
import express from 'express'
import multer from 'multer'
import { connectDb } from './config/db.js'
import { ensureVendorAccount } from './lib/users.js'
import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import cartRoutes from './routes/cart.js'

const PORT = process.env.PORT ?? 3001

async function start() {
  await connectDb()
  await ensureVendorAccount()

  const app = express()
  app.use(cors())
  app.use(express.json())

  app.get('/', (_req, res) => {
    res.json({
      message: 'ShopEase API is running.',
      frontend: 'Open http://localhost:5173 in your browser for the app.',
      health: '/api/health',
      products: '/api/products',
    })
  })

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true })
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/products', productRoutes)
  app.use('/api/cart', cartRoutes)

  app.use((error, _req, res, next) => {
    if (error instanceof multer.MulterError) {
      const message =
        error.code === 'LIMIT_UNEXPECTED_FILE'
          ? 'Upload failed: unexpected file field. Restart the API with npm run dev:all, then try again.'
          : error.message
      return res.status(400).json({ message })
    }
    if (error) {
      return res.status(400).json({ message: error.message ?? 'Request failed.' })
    }
    next()
  })

  app.listen(PORT, () => {
    console.log(`API server running at http://localhost:${PORT}`)
  })
}

start().catch((error) => {
  console.error('Failed to start server:', error.message)
  process.exit(1)
})
