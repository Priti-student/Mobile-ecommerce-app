import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') })

export function getJwtSecret() {
  return process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
}
