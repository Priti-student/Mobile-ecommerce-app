import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Product } from '@/types/product'
import { useAuth } from './AuthContext'
import { getCart, syncCart, addToCart, updateCartItem, removeCartItem, clearCart as clearCartApi } from '@/lib/api'

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
  loading: boolean
}

const CartContext = createContext<CartContextValue | null>(null)

const GUEST_KEY = 'shopease_cart_guest'

function readGuestCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(GUEST_KEY)
    if (!raw) return []
    return JSON.parse(raw) as CartItem[]
  } catch {
    return []
  }
}

function writeGuestCart(items: CartItem[]) {
  localStorage.setItem(GUEST_KEY, JSON.stringify(items))
}

function removeGuestCart() {
  localStorage.removeItem(GUEST_KEY)
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth()
  const userId = user?.id ?? null
  const isLoggedIn = Boolean(user && token)

  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const initialSyncDone = useRef(false)

  // Load cart from server when user logs in, or from localStorage for guests
  useEffect(() => {
    initialSyncDone.current = false
    setLoading(true)

    if (isLoggedIn && token) {
      // Logged in: fetch from server
      getCart(token)
        .then((data) => {
          setItems(data.items)
          // Clear any guest cart data after successful server fetch
          removeGuestCart()
        })
        .catch((err) => {
          console.error('Failed to load cart from server:', err)
          setItems([])
        })
        .finally(() => {
          setLoading(false)
          initialSyncDone.current = true
        })
    } else {
      // Guest: read from localStorage
      setItems(readGuestCart())
      setLoading(false)
      initialSyncDone.current = true
    }
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

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

      // Persist locally for guest users
      if (!isLoggedIn) {
        writeGuestCart(next)
      }

      // Sync to server for logged-in users
      if (isLoggedIn && token) {
        addToCart(product.id, token, quantity).catch((err) => {
          console.error('Failed to sync add to cart:', err)
        })
      }

      return next
    })
  }, [isLoggedIn, token])

  const removeItem = useCallback((productId: string) => {
    setItems((current) => {
      const next = current.filter((item) => item.productId !== productId)

      if (!isLoggedIn) {
        writeGuestCart(next)
      }

      if (isLoggedIn && token) {
        removeCartItem(productId, token).catch((err) => {
          console.error('Failed to sync remove from cart:', err)
        })
      }

      return next
    })
  }, [isLoggedIn, token])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((current) => {
      let next: CartItem[]

      if (quantity < 1) {
        next = current.filter((item) => item.productId !== productId)
      } else {
        next = current.map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.min(quantity, item.product.stock) }
            : item,
        )
      }

      if (!isLoggedIn) {
        writeGuestCart(next)
      }

      if (isLoggedIn && token) {
        if (quantity < 1) {
          removeCartItem(productId, token).catch((err) => {
            console.error('Failed to sync remove from cart:', err)
          })
        } else {
          updateCartItem(productId, quantity, token).catch((err) => {
            console.error('Failed to sync cart quantity:', err)
          })
        }
      }

      return next
    })
  }, [isLoggedIn, token])

  const clearCart = useCallback(() => {
    if (!isLoggedIn) {
      removeGuestCart()
    }

    if (isLoggedIn && token) {
      clearCartApi(token).catch((err) => {
        console.error('Failed to sync clear cart:', err)
      })
    }

    setItems([])
  }, [isLoggedIn, token])

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  )

  const value = useMemo(
    () => ({ items, itemCount, addItem, removeItem, updateQuantity, clearCart, loading }),
    [items, itemCount, addItem, removeItem, updateQuantity, clearCart, loading],
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