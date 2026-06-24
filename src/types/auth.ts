export type UserRole = 'customer' | 'vendor'

export interface LoginPayload {
  email: string
  password: string
  role: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  securityQuestions?: SecurityQuestion[]
}

export interface SecurityQuestion {
  question: string
  answer: string
}

export interface AuthResponse {
  token: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}