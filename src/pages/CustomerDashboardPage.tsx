import { useEffect, useState } from 'react'
import { ProductCatalog } from '@/components/products/ProductCatalog'
import { BillModal } from '@/components/billing/BillModal'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { formatPrice, getProducts } from '@/lib/api'
import { getPrimaryImage, type Product } from '@/types/product'

type CustomerTab = 'shop' | 'cart' | 'account'

export function CustomerDashboardPage() {
  const { user, logout } = useAuth()
  const { items, itemCount, updateQuantity, removeItem } = useCart()
  const [tab, setTab] = useState<CustomerTab>('shop')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showBill, setShowBill] = useState(false)

  useEffect(() => {
    getProducts()
      .then((response) => setProducts(response.products))
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Could not load products.'),
      )
      .finally(() => setLoading(false))
  }, [])

  const cartTotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  )
  const cartSavings = items.reduce((sum, item) => {
    const printedPrice = item.product.printedPrice || 0
    const salePrice = item.product.price || 0
    const itemSavings = printedPrice > salePrice ? printedPrice - salePrice : 0
    return sum + itemSavings * item.quantity
  }, 0)

  return (
    <div className="min-h-dvh bg-[#f1f3f6]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-white shadow-sm">
        <div className="page-container">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-500">
                Customer Marketplace
              </p>
              <h1 className="text-lg font-bold text-text-primary">
                {tab === 'shop' ? 'Shop Products' : tab === 'cart' ? 'Your Cart' : 'My Account'}
              </h1>
              <p className="text-xs text-text-secondary">Welcome, {user?.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={logout}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="pb-44">
        <div className="page-container py-4 sm:py-6 lg:py-8">
          {tab === 'shop' ? (
            <ProductCatalog
              products={products}
              loading={loading}
              error={error}
              showCartAction
            />
          ) : null}

          {tab === 'cart' ? (
            items.length === 0 ? (
              <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl">
                  🛒
                </div>
                <p className="text-lg font-semibold text-text-primary">Your cart is empty</p>
                <p className="mt-1 text-sm text-text-secondary">
                  Browse products and tap Add to cart when you find something you like.
                </p>
                <button
                  type="button"
                  onClick={() => setTab('shop')}
                  className="btn-primary mt-6"
                >
                  Start shopping
                </button>
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
                {/* Cart Items */}
                <div className="space-y-3">
                  <h2 className="section-title mb-4">Cart Items ({itemCount})</h2>
                  {items.map((item, index) => (
                    <article
                      key={item.productId}
                      className="cart-item-enter flex gap-4 rounded-2xl bg-white p-4 shadow-sm transition-all hover:shadow-md"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <img
                        src={getPrimaryImage(item.product)}
                        alt={item.product.name}
                        className="h-24 w-24 shrink-0 rounded-xl object-contain bg-white p-2 ring-1 ring-border-light"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text-primary line-clamp-2">
                              {item.product.name}
                            </p>
                            <p className="mt-0.5 text-xs text-text-tertiary">{item.product.category}</p>
                          </div>
                        </div>
                        
                        <div className="mt-1 flex flex-wrap items-baseline gap-2">
                          <span className="text-lg font-bold text-text-primary">
                            {formatPrice(item.product.price)}
                          </span>
                          {item.product.printedPrice > item.product.price ? (
                            <span className="text-sm font-semibold text-text-tertiary line-through">
                              {formatPrice(item.product.printedPrice)}
                            </span>
                          ) : null}
                        </div>
                        
                        {item.product.gift?.name ? (
                          <p className="mt-0.5 text-xs font-medium text-accent-600">
                            🎁 Free {item.product.gift.name}
                          </p>
                        ) : null}

                        <div className="mt-3 flex items-center justify-between">
                          {/* Quantity Controls - Flipkart style */}
                          <div className="flex items-center gap-0 overflow-hidden rounded-lg border border-border">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="px-3 py-1.5 text-sm font-semibold text-text-secondary transition hover:bg-slate-50 hover:text-brand-500"
                            >
                              −
                            </button>
                            <span className="min-w-10 border-x border-border px-3 py-1.5 text-center text-sm font-medium text-text-primary">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="px-3 py-1.5 text-sm font-semibold text-text-secondary transition hover:bg-slate-50 hover:text-brand-500"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItem(item.productId)}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Cart Summary Card */}
                <div className="lg:sticky lg:top-24">
                  <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm">
                    <h3 className="text-base font-bold text-text-primary">Price Details</h3>
                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-text-secondary">Price ({itemCount} items)</span>
                        <span className="font-medium text-text-primary">{formatPrice(cartTotal)}</span>
                      </div>
                      <div className="divider" />
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-text-primary">Total Amount</span>
                        <span className="text-xl font-bold text-text-primary">{formatPrice(cartTotal)}</span>
                      </div>
                      <p className="text-xs text-green-700">
                        You will save {formatPrice(cartSavings)} on this order
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowBill(true)}
                      className="btn-accent mt-5 w-full"
                    >
                      Proceed to Checkout
                    </button>
                  </div>
                </div>
              </div>
            )
          ) : null}

          {tab === 'account' ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-lg font-bold text-brand-600">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">{user?.name}</h2>
                    <p className="text-sm text-text-secondary">Customer</p>
                  </div>
                </div>
                <div className="divider my-4" />
                <dl className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-text-secondary">Email</dt>
                    <dd className="font-medium text-text-primary">{user?.email}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-text-secondary">Account type</dt>
                    <dd className="font-medium capitalize text-text-primary">{user?.role}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-text-secondary">Member since</dt>
                    <dd className="font-medium text-text-primary">June 2026</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm">
                <h2 className="text-base font-bold text-text-primary">Recent Orders</h2>
                <p className="mt-4 text-sm text-text-secondary">
                  You have not placed any orders yet. Your order history will appear here.
                </p>
                <button
                  type="button"
                  onClick={() => setTab('shop')}
                  className="btn-primary mt-4"
                >
                  Browse products
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      {/* Bill Modal */}
      {showBill ? (
        <BillModal
          items={items}
          userName={user?.name || 'Customer'}
          shopName="ShopEase"
          onClose={() => setShowBill(false)}
        />
      ) : null}

      {/* Premium Bottom Navigation - Flipkart Inspired */}
      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          {(
            [
              { 
                id: 'shop' as const, 
                label: 'Shop', 
                badge: undefined as number | undefined,
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                )
              },
              { 
                id: 'cart' as const, 
                label: 'Cart', 
                badge: itemCount,
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="8" cy="21" r="1" />
                    <circle cx="19" cy="21" r="1" />
                    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                  </svg>
                )
              },
              { 
                id: 'account' as const, 
                label: 'Account',
                badge: undefined as number | undefined,
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                )
              },
            ]
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`bottom-nav-item ${tab === item.id ? 'active' : ''}`}
            >
              <span className="nav-icon">
                {item.icon}
              </span>
              <span>{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[10px] font-bold text-white shadow-sm">
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
