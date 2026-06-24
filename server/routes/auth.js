import bcrypt from 'bcryptjs'
import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { getJwtSecret } from '../config/env.js'
import {
  createCustomer,
  findUserByEmail,
  findUserByEmailAndRole,
  sanitizeUser,
} from '../lib/users.js'

const router = Router()

router.post('/login', async (req, res) => {
  const { email, password, role } = req.body ?? {}

  if (!email || !password || !role) {
    return res.status(400).json({ message: 'Email, password, and role are required.' })
  }

  if (role !== 'customer' && role !== 'vendor') {
    return res.status(400).json({ message: 'Invalid role.' })
  }

  const user = await findUserByEmailAndRole(email, role)

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ message: 'Invalid email or password for this role.' })
  }

  const token = jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    getJwtSecret(),
    { expiresIn: '7d' },
  )

  return res.json({ token, user: sanitizeUser(user) })
})

router.post('/register', async (req, res) => {
  const { name, email, password, securityQuestions } = req.body ?? {}

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' })
  }

  if (String(password).length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' })
  }

  if (await findUserByEmail(email)) {
    return res.status(409).json({ message: 'An account with this email already exists.' })
  }

  const passwordHash = bcrypt.hashSync(password, 10)
  const user = await createCustomer({ name, email, passwordHash, securityQuestions })

  const token = jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    getJwtSecret(),
    { expiresIn: '7d' },
  )

  return res.status(201).json({ token, user: sanitizeUser(user), securityQuestions })
})

router.post('/security-questions', async (req, res) => {
  const { email } = req.body ?? {}

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' })
  }

  const user = await findUserByEmail(email)

  if (!user || !user.securityQuestions || user.securityQuestions.length === 0) {
    return res.status(404).json({ message: 'No security questions found for this email.' })
  }

  const questions = user.securityQuestions.map((sq, index) => ({
    index,
    text: sq.question,
  }))

  return res.json({ questions })
})

router.post('/verify-security', async (req, res) => {
  const { email, answers } = req.body ?? {}

  if (!email || !answers || !Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ message: 'Email and answers are required.' })
  }

  const user = await findUserByEmail(email)

  if (!user || !user.securityQuestions || user.securityQuestions.length === 0) {
    return res.status(404).json({ message: 'No security questions found for this email.' })
  }

  for (const submitted of answers) {
    const stored = user.securityQuestions.find(
      (sq) => sq.question === submitted.question,
    )
    if (!stored || stored.answer !== String(submitted.answer).trim().toLowerCase()) {
      return res.json({ verified: false })
    }
  }

  return res.json({ verified: true })
})

router.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body ?? {}

  if (!email || !newPassword) {
    return res.status(400).json({ message: 'Email and new password are required.' })
  }

  if (String(newPassword).length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' })
  }

  const user = await findUserByEmail(email)

  if (!user) {
    return res.status(404).json({ message: 'User not found.' })
  }

  const passwordHash = bcrypt.hashSync(newPassword, 10)
  user.password_hash = passwordHash
  await user.save()

  return res.json({ message: 'Password changed successfully.' })
})

export default router
