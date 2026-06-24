import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ProductCatalog } from '@/components/products/ProductCatalog'
import { useAuth } from '@/context/AuthContext'
import { getProducts } from '@/lib/api'
import type { Product } from '@/types/product'

export function HomePage() {
  const { user, logout } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getProducts()
      .then((response) => setProducts(response.products))
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Could not load products.'),
      )
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-dvh bg-[#f1f3f6]">
      {/* Premium top navigation bar - Flipkart/Amazon inspired */}
      <header className="sticky top-0 z-50 border-b border-border bg-white shadow-sm">
        <div className="page-container">
          <div className="flex items-center justify-between gap-4 py-3">
            {/* Logo */}
            <Link to="/" className="flex shrink-0 items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-base font-bold text-white shadow-sm">
                S
              </div>
              <div className="hidden sm:block">
                <span className="text-lg font-extrabold tracking-tight text-text-primary">Shop</span>
                <span className="text-lg font-extrabold tracking-tight text-brand-500">Ease</span>
                <p className="-mt-1 text-[10px] font-medium italic text-accent-500">Trusted Mobile Store</p>
              </div>
            </Link>

            {/* Right side actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {user ? (
                <>
                  {user.role === 'customer' ? (
                    <Link
                      to="/customer"
                      className="btn-primary !px-4 !py-2 !text-xs sm:!px-5 sm:!py-2.5 sm:!text-sm"
                    >
                      Dashboard
                    </Link>
                  ) : (
                    <Link
                      to="/vendor"
                      className="btn-primary !px-4 !py-2 !text-xs sm:!px-5 sm:!py-2.5 sm:!text-sm"
                    >
                      Manage Store
                    </Link>
                  )}
                  <div className="flex items-center gap-2 border-l border-border pl-2 sm:pl-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600 sm:h-8 sm:w-8">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <button
                      type="button"
                      onClick={logout}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 sm:px-4 sm:py-2 sm:text-sm"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3">
                  <Link
                    to="/login"
                    className="btn-primary !px-4 !py-2 !text-xs sm:!px-6 sm:!py-2.5 sm:!text-sm"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="btn-outline !px-4 !py-2 !text-xs sm:!px-6 sm:!py-2.5 sm:!text-sm"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="page-container pb-24 py-4 sm:py-6 lg:py-8 sm:pb-8">
        {/* Page heading */}
        <div className="mb-4 sm:mb-6">
          <h1 className="section-title text-2xl sm:text-3xl">Browse Products</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Fresh vendor listings, quick discovery and cart-ready product details.
          </p>
        </div>

        <ProductCatalog
          products={products}
          loading={loading}
          error={error}
          emptyMessage="No products listed yet. Check back soon."
          showCartAction
        />
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-border bg-white py-6">
        <div className="page-container">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-brand-500 to-brand-700 text-[10px] font-bold text-white">
                S
              </div>
              <span className="text-sm font-semibold text-text-primary">ShopEase</span>
            </div>
            <p className="text-xs text-text-tertiary">
              &copy; {new Date().getFullYear()} ShopEase. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}