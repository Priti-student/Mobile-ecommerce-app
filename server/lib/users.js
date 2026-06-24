import bcrypt from 'bcryptjs'
import { User } from '../models/User.js'

export async function ensureVendorAccount() {
  const vendorEmail = process.env.VENDOR_EMAIL ?? 'vendor@shopease.com'
  const vendorPassword = process.env.VENDOR_PASSWORD
  if (!vendorPassword) throw new Error('VENDOR_PASSWORD is not set in .env')

  const vendorExists = await User.findOne({ role: 'vendor' })

  if (vendorExists) {
    // Always sync the password from .env to ensure MongoDB matches
    const passwordHash = bcrypt.hashSync(vendorPassword, 10)
    await User.updateOne(
      { role: 'vendor' },
      { $set: { email: vendorEmail, password_hash: passwordHash } },
    )
    console.log(`Synced vendor password from .env to database for: ${vendorEmail}`)
  } else {
    const passwordHash = bcrypt.hashSync(vendorPassword, 10)

    await User.create({
      name: 'Store Owner',
      email: vendorEmail,
      password_hash: passwordHash,
      role: 'vendor',
    })

    console.log(`Seeded vendor account: ${vendorEmail}`)
  }

  console.log('Override email with VENDOR_EMAIL env var, password with VENDOR_PASSWORD env var')
}

export async function findUserByEmailAndRole(email, role) {
  const normalizedEmail = String(email).trim().toLowerCase()
  return User.findOne({ email: normalizedEmail, role })
}

export async function findUserByEmail(email) {
  const normalizedEmail = String(email).trim().toLowerCase()
  return User.findOne({ email: normalizedEmail })
}

export async function createCustomer({ name, email, passwordHash, securityQuestions }) {
  const data = {
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    password_hash: passwordHash,
    role: 'customer',
  }

  if (securityQuestions && securityQuestions.length > 0) {
    data.securityQuestions = securityQuestions.map((sq) => ({
      question: String(sq.question).trim(),
      answer: String(sq.answer).trim().toLowerCase(),
    }))
  }

  return User.create(data)
}

export function sanitizeUser(user) {
  const json = user.toJSON()
  delete json.securityQuestions
  return json
}
