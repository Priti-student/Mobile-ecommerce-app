import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Product } from '@/types/product'
import { useAuth } from './AuthContext'

export interface CartItem {
  productId: string
  quantity: number
  product: Product
}

interface CartContextValue {
  items: CartItem[]
  itemCount: number
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function storageKey(userId: string | null): string {
  return userId ? `shopease_cart_${userId}` : 'shopease_cart_guest'
}

function readCart(userId: string | null): CartItem[] {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return []
    return JSON.parse(raw) as CartItem[]
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? null

  const [items, setItems] = useState<CartItem[]>(() => readCart(userId))

  // When the logged-in user changes, reload the cart for that user
  useEffect(() => {
    setItems(readCart(userId))
  }, [userId])

  const addItem = useCallback((product: Product, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((item) => item.productId === product.id)
      let next: CartItem[]

      if (existing) {
        const updatedQty = Math.min(existing.quantity + quantity, product.stock)
        next = current.map((item) =>
          item.productId === product.id ? { ...item, quantity: updatedQty, product } : item,
        )
      } else {
        next = [
          ...current,
          { productId: product.id, quantity: Math.min(quantity, product.stock), product },
        ]
      }

      localStorage.setItem(storageKey(userId), JSON.stringify(next))
      return next
    })
  }, [userId])

  const removeItem = useCallback((productId: string) => {
    setItems((current) => {
      const next = current.filter((item) => item.productId !== productId)
      localStorage.setItem(storageKey(userId), JSON.stringify(next))
      return next
    })
  }, [userId])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((current) => {
      if (quantity < 1) {
        const next = current.filter((item) => item.productId !== productId)
        localStorage.setItem(storageKey(userId), JSON.stringify(next))
        return next
      }

      const next = current.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.min(quantity, item.product.stock) }
          : item,
      )
      localStorage.setItem(storageKey(userId), JSON.stringify(next))
      return next
    })
  }, [userId])

  const clearCart = useCallback(() => {
    localStorage.removeItem(storageKey(userId))
    setItems([])
  }, [userId])

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  )

  const value = useMemo(
    () => ({ items, itemCount, addItem, removeItem, updateQuantity, clearCart }),
    [items, itemCount, addItem, removeItem, updateQuantity, clearCart],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}