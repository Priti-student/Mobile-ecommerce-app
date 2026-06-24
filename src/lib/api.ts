import type { AuthResponse, LoginPayload, RegisterPayload } from '@/types/auth'
import type { SecurityQuestion } from '@/types/auth'
import type { CreateProductPayload, Product } from '@/types/product'
import { notifySessionExpired } from '@/lib/session'

const API_BASE = '/api'

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: BodyInit | null
  token?: string
  json?: unknown
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers)

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`)
  }

  if (options.json !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body: options.json !== undefined ? JSON.stringify(options.json) : options.body,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    if (response.status === 401 && options.token) {
      notifySessionExpired()
      throw new Error('Your session expired. Please sign in again.')
    }
    if (response.status === 404) {
      throw new Error(
        'API route not found. Stop any old server on port 3001, then run npm run dev:all again.',
      )
    }
    throw new Error(data.message ?? 'Something went wrong. Please try again.')
  }

  return data as T
}

export function login(payload: LoginPayload) {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    json: payload,
  })
}

export function register(payload: RegisterPayload) {
  return request<AuthResponse & { securityQuestions?: SecurityQuestion[] }>('/auth/register', {
    method: 'POST',
    json: payload,
  })
}

export function getSecurityQuestions(email: string) {
  return request<{ questions: { index: number; text: string }[] }>('/auth/security-questions', {
    method: 'POST',
    json: { email },
  })
}

export function verifySecurityAnswers(email: string, answers: { question: string; answer: string }[]) {
  return request<{ verified: boolean }>('/auth/verify-security', {
    method: 'POST',
    json: { email, answers },
  })
}

export function resetPassword(email: string, newPassword: string) {
  return request<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    json: { email, newPassword },
  })
}

export function getProducts() {
  return request<{ products: Product[] }>('/products')
}

export function getProduct(id: string) {
  return request<{ product: Product }>(`/products/${id}`)
}

export function createProduct(payload: CreateProductPayload, token: string) {
  const formData = new FormData()
  formData.append('name', payload.name)
  formData.append('description', payload.description)
  formData.append('price', String(payload.price))
  formData.append('printedPrice', String(payload.printedPrice))
  formData.append('sellerMobileNumber', payload.sellerMobileNumber)
  formData.append('stock', String(payload.stock))
  formData.append('category', payload.category)

  for (const image of payload.images) {
    formData.append('images', image)
  }

  if (payload.gift) {
    formData.append('hasGift', 'true')
    formData.append('giftName', payload.gift.name)
    formData.append('giftDescription', payload.gift.description)
    if (payload.gift.image) {
      formData.append('giftImage', payload.gift.image)
    }
  }

  return request<{ product: Product }>('/products', {
    method: 'POST',
    token,
    body: formData,
  })
}

export function updateProductStock(id: string, stock: number, token: string) {
  return request<{ product: Product }>(`/products/${id}/stock`, {
    method: 'PATCH',
    token,
    json: { stock },
  })
}

export function deleteProduct(id: string, token: string) {
  return request<{ message: string }>(`/products/${id}`, {
    method: 'DELETE',
    token,
  })
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}