import { useState } from 'react'
import { ProductDetailModal } from '@/components/products/ProductDetailModal'
import { ProductGridCard } from '@/components/products/ProductGridCard'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { formatPrice } from '@/lib/api'
import { getPrimaryImage } from '@/types/product'
import type { Product } from '@/types/product'

interface ProductCatalogProps {
  products: Product[]
  loading?: boolean
  error?: string
  emptyMessage?: string
  showCartAction?: boolean
}

export function ProductCatalog({
  products,
  loading,
  error,
  emptyMessage = 'No products listed yet.',
  showCartAction = false,
}: ProductCatalogProps) {
  const { user } = useAuth()
  const { addItem } = useCart()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [cartAddedId, setCartAddedId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const showCartFooter = showCartAction && user?.role !== 'vendor'
  const isCustomer = user?.role === 'customer'
  const categories = [
    'All',
    ...Array.from(new Set(products.map((product) => product.category).filter(Boolean))),
  ]
  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredProducts = products.filter((product) => {
    const matchesCategory = activeCategory === 'All' || product.category === activeCategory
    const matchesSearch =
      normalizedSearch.length === 0 ||
      [product.name, product.category, product.description]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch)

    return matchesCategory && matchesSearch
  })
  const featuredProduct = filteredProducts[0] ?? products[0]
  const spotlightProducts = products.filter((product) => product.id !== featuredProduct.id).slice(0, 3)

  function handleAddToCart(product: Product) {
    addItem(product)
    setCartAddedId(product.id)
    setTimeout(() => setCartAddedId(null), 2000)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 w-full animate-pulse rounded-2xl bg-slate-200" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl bg-white">
              <div className="aspect-square bg-slate-200" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-3/4 rounded bg-slate-200" />
                <div className="h-4 w-1/2 rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl">
          ⚠️
        </div>
        <p className="font-semibold text-red-800">Something went wrong</p>
        <p className="mt-1 text-sm text-red-600">{error}</p>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl">
          📦
        </div>
        <p className="text-lg font-semibold text-text-primary">No products yet</p>
        <p className="mt-2 text-sm text-text-secondary">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6 lg:space-y-8">
        {/* Search & Filter Section - Flipkart Inspired */}
        <section className="rounded-2xl bg-white p-4 sm:p-6 shadow-sm">
          <div className="search-bar">
            <span className="search-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search products, brands and more..."
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="mt-4">
            <div className="category-tabs">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`category-tab ${activeCategory === category ? 'active' : ''}`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Featured + Spotlights Section - Amazon Inspired Hero */}
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.8fr)_minmax(320px,0.9fr)]">
          {/* Featured Product - Hero Banner */}
          <button
            type="button"
            onClick={() => setSelectedProduct(featuredProduct)}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-left shadow-sm"
          >
            <img
              src={getPrimaryImage(featuredProduct)}
              alt={featuredProduct.name}
              className="absolute inset-0 h-full w-full object-cover opacity-35 transition duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/70 to-transparent" />
            <div className="relative flex min-h-72 flex-col justify-end p-6 sm:min-h-80 sm:p-8 lg:min-h-96">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm">
                ⚡ Featured Deal
              </span>
              <h2 className="mt-3 text-2xl font-black leading-tight text-white sm:text-3xl lg:text-4xl">
                {featuredProduct.name}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
                Fast browsing, clean product details and easy cart actions for your shoppers.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center rounded-xl bg-white/95 px-4 py-2 text-xl font-black text-slate-900 shadow-sm">
                  {formatPrice(featuredProduct.price)}
                </span>
                <span className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition group-hover:bg-brand-600">
                  View Details →
                </span>
              </div>
            </div>
          </button>

          {/* Side Spotlight Products */}
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {spotlightProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => setSelectedProduct(product)}
                className="group flex items-center gap-4 overflow-hidden rounded-2xl bg-white p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative shrink-0 overflow-hidden rounded-xl bg-slate-100">
                  <img
                    src={getPrimaryImage(product)}
                    alt={product.name}
                    className="h-20 w-20 object-cover transition duration-300 group-hover:scale-110 sm:h-24 sm:w-24"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-brand-500">
                    {product.category}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm font-semibold text-text-primary">
                    {product.name}
                  </p>
                  <p className="mt-1 text-sm font-bold text-text-primary">
                    {formatPrice(product.price)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Product Grid Section */}
        <section>
          <div className="mb-4 flex items-end justify-between gap-4 sm:mb-5">
            <div>
              <p className="section-subtitle">Recommended for you</p>
              <h2 className="section-title mt-0.5">Trending Products</h2>
            </div>
            <div className="flex items-center gap-2">
              {filteredProducts.length > 0 && (
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-text-secondary shadow-sm">
                  {filteredProducts.length} result{filteredProducts.length === 1 ? '' : 's'}
                </span>
              )}
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-xl">
                🔍
              </div>
              <p className="font-semibold text-text-primary">No matching products</p>
              <p className="mt-1 text-sm text-text-secondary">
                Try adjusting your search or filter to find what you are looking for.
              </p>
              <button
                type="button"
                onClick={() => { setSearchTerm(''); setActiveCategory('All') }}
                className="btn-primary mt-4 !px-5 !py-2.5 text-sm"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <ProductGridCard
                  key={product.id}
                  product={product}
                  onClick={() => setSelectedProduct(product)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {selectedProduct ? (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          showCartAction={showCartFooter}
          isAuthenticated={isCustomer}
          onAddToCart={isCustomer ? handleAddToCart : undefined}
          cartAdded={cartAddedId === selectedProduct.id}
          similarProducts={products.filter(
            (p) => p.id !== selectedProduct.id && p.category === selectedProduct.category,
          ).slice(0, 5)}
          onSimilarProductClick={(p) => setSelectedProduct(p)}
        />
      ) : null}
    </>
  )
}