import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AddProductForm } from '@/components/vendor/AddProductForm'
import { VendorProductCard } from '@/components/vendor/VendorProductCard'
import { useAuth } from '@/context/AuthContext'
import { createProduct, deleteProduct, formatPrice, getProducts, updateProductStock } from '@/lib/api'
import type { CreateProductPayload, Product } from '@/types/product'

export function VendorDashboardPage() {
  const { user, token, logout } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const loadProducts = useCallback(async () => {
    setError('')
    setLoading(true)

    try {
      const response = await getProducts()
      setProducts(response.products)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  async function handleAddProduct(payload: CreateProductPayload) {
    if (!token) throw new Error('You must be signed in as a vendor.')

    const response = await createProduct(payload, token)
    setProducts((current) => [response.product, ...current])
    setShowAddForm(false)
  }

  async function handleDeleteProduct(product: Product) {
    if (!token) return
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return

    setDeletingId(product.id)
    setError('')

    try {
      await deleteProduct(product.id, token)
      setProducts((current) => current.filter((item) => item.id !== product.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product.')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleToggleAvailability(product: Product, newStock: number) {
    if (!token) return

    setTogglingId(product.id)
    setError('')

    try {
      const response = await updateProductStock(product.id, newStock, token)
      setProducts((current) =>
        current.map((item) => (item.id === product.id ? response.product : item)),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product availability.')
    } finally {
      setTogglingId(null)
    }
  }

  const totalStock = products.reduce((sum, product) => sum + product.stock, 0)
  const inventoryValue = products.reduce(
    (sum, product) => sum + product.price * product.stock,
    0,
  )

  return (
    <div className="min-h-dvh bg-[#f1f3f6]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-white shadow-sm">
        <div className="page-container">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">
                  S
                </div>
              </Link>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-500">
                  Vendor Dashboard
                </p>
                <h1 className="text-lg font-bold text-text-primary">Manage Products</h1>
                <p className="text-xs text-text-secondary">Signed in as {user?.name ?? 'Vendor'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadProducts}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-all hover:border-brand-200 hover:text-brand-500"
              >
                Refresh
              </button>
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

      <main className="page-container py-4 sm:py-6 lg:py-8">
        {/* Stats Cards */}
        <section className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">Products</p>
            <p className="mt-1 text-2xl font-bold text-text-primary sm:text-3xl">{products.length}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">Total Stock</p>
            <p className="mt-1 text-2xl font-bold text-text-primary sm:text-3xl">{totalStock}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">Inventory</p>
            <p className="mt-1 text-lg font-bold text-green-700 sm:text-xl">{formatPrice(inventoryValue)}</p>
          </div>
        </section>

        {/* Add Product Section */}
        <section className="mt-6">
          {!showAddForm ? (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="btn-accent w-full"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                <path d="M5 12h14" /><path d="M12 5v14" />
              </svg>
              Add new product
            </button>
          ) : (
            <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-base font-bold text-text-primary">Add new product</h2>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary transition hover:bg-slate-100 hover:text-text-primary"
                >
                  Cancel
                </button>
              </div>
              <AddProductForm
                onSubmit={handleAddProduct}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          )}
        </section>

        {/* Error Display */}
        {error ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {/* Product List */}
        <section className="mt-6">
          <h2 className="section-title mb-4">Your Catalog ({products.length})</h2>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex animate-pulse gap-4 rounded-2xl bg-white p-4 shadow-sm">
                  <div className="h-24 w-24 shrink-0 rounded-xl bg-slate-200" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-3/4 rounded bg-slate-200" />
                    <div className="h-3 w-1/2 rounded bg-slate-200" />
                    <div className="h-3 w-1/4 rounded bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl">
                📦
              </div>
              <p className="text-lg font-semibold text-text-primary">No products yet</p>
              <p className="mt-1 text-sm text-text-secondary">
                Add your first product to make it visible to customers.
              </p>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="btn-primary mt-6"
              >
                Add your first product
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((product) => (
                <VendorProductCard
                  key={product.id}
                  product={product}
                  onDelete={handleDeleteProduct}
                  onToggleAvailability={handleToggleAvailability}
                  deleting={deletingId === product.id}
                  toggling={togglingId === product.id}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}