import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice, getProduct } from '@/lib/api'
import { getPrimaryImage, getProductImages, getDiscountPercent, type Product } from '@/types/product'

interface ProductDetailModalProps {
  product: Product
  onClose: () => void
  showCartAction?: boolean
  isAuthenticated?: boolean
  onAddToCart?: (product: Product) => void
  cartAdded?: boolean
  similarProducts?: Product[]
  onSimilarProductClick?: (product: Product) => void
}

type ProductWithContactAliases = Product & {
  contactNumber?: string
  mobileNumber?: string
  phone?: string
  sellerContactNumber?: string
  sellerMobile?: string
  sellerPhone?: string
  seller?: {
    contactNumber?: string
    mobileNumber?: string
    phone?: string
  }
}

function getSellerContactNumber(product: Product): string {
  const contactProduct = product as ProductWithContactAliases

  return (
    contactProduct.sellerMobileNumber ||
    contactProduct.sellerContactNumber ||
    contactProduct.sellerMobile ||
    contactProduct.sellerPhone ||
    contactProduct.contactNumber ||
    contactProduct.mobileNumber ||
    contactProduct.phone ||
    contactProduct.seller?.contactNumber ||
    contactProduct.seller?.mobileNumber ||
    contactProduct.seller?.phone ||
    ''
  ).trim()
}

export function ProductDetailModal({
  product,
  onClose,
  showCartAction = false,
  isAuthenticated = false,
  onAddToCart,
  cartAdded,
  similarProducts,
  onSimilarProductClick,
}: ProductDetailModalProps) {
  const images = getProductImages(product)
  const outOfStock = product.stock === 0
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [showSellerNumber, setShowSellerNumber] = useState(false)
  const [sellerContactNumber, setSellerContactNumber] = useState(() => getSellerContactNumber(product))
  const [contactLoading, setContactLoading] = useState(false)
  
  const salePrice = product.price
  const printedPrice = product.printedPrice || 0
  const discountPercent = getDiscountPercent(printedPrice, salePrice)
  const hasDiscount = printedPrice > 0 && discountPercent > 0

  const stockBadgeClass = outOfStock
    ? 'bg-red-50 text-red-600'
    : 'bg-emerald-50 text-emerald-700'

  async function handleBuyNow() {
    if (outOfStock || contactLoading) return

    setShowSellerNumber(true)
    const currentContact = getSellerContactNumber(product)
    setSellerContactNumber(currentContact)

    try {
      setContactLoading(true)
      const response = await getProduct(product.id)
      setSellerContactNumber(getSellerContactNumber(response.product))
    } catch {
      setSellerContactNumber(currentContact)
    } finally {
      setContactLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#f1f3f6]">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 text-sm font-semibold text-text-secondary transition hover:text-brand-500"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back
          </button>
          <p className="text-sm font-medium text-text-secondary">Product Details</p>
          <div className="w-16" />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <main className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:py-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.7fr)] lg:items-start lg:gap-8">
            
            {/* Image Gallery */}
            <section className="space-y-4">
              {/* Main Image */}
              <div className="relative overflow-hidden rounded-2xl bg-white p-6 sm:p-8 shadow-sm">
                <img
                  src={images[selectedImageIndex]?.url || images[0]?.url}
                  alt={product.name}
                  className="mx-auto h-72 w-full object-contain transition-all duration-300 sm:h-96 lg:h-[420px]"
                />
                {outOfStock && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
                    <span className="rounded-xl bg-red-500 px-6 py-3 text-sm font-bold text-white shadow-lg">
                      Currently Out of Stock
                    </span>
                  </div>
                )}
                {hasDiscount && (
                  <span className="absolute left-4 top-4 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Thumbnail Strip */}
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {images.map((image, index) => (
                    <button
                      key={`${image.url}-${index}`}
                      type="button"
                      onClick={() => setSelectedImageIndex(index)}
                      className={`shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                        selectedImageIndex === index
                          ? 'border-brand-500 shadow-sm'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={`${product.name} ${index + 1}`}
                        className="h-16 w-16 object-cover sm:h-20 sm:w-20"
                      />
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Product Info */}
            <aside className="space-y-4 lg:sticky lg:top-6">
              {/* Title & Price Card */}
              <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700">
                    {product.category}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-sm bg-emerald-500 text-white">
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m2.5 6 2.2 2.2 4.8-4.9" />
                      </svg>
                    </span>
                    Verified
                  </span>
                </div>
                
                <h2 className="mt-4 text-3xl font-black leading-tight text-text-primary sm:text-4xl">
                  {product.name}
                </h2>

                {/* Price - MRP vs Sale */}
                <div className="mt-5 space-y-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-3xl font-black leading-none text-text-primary sm:text-4xl">
                      {formatPrice(salePrice)}
                    </span>
                    {hasDiscount && (
                      <>
                        <span className="text-xl font-bold text-slate-400 line-through">
                          {formatPrice(printedPrice)}
                        </span>
                        <span className="text-base font-black text-green-700">{discountPercent}% off</span>
                      </>
                    )}
                  </div>
                  <p className="text-base font-medium text-slate-400">inclusive of all taxes</p>
                </div>

                {/* Savings message */}
                {hasDiscount && (
                  <div className="mt-5 rounded-xl bg-green-50 px-4 py-3">
                    <p className="flex items-center gap-2 text-base font-bold text-green-800">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-black text-amber-700">
                        Rs
                      </span>
                      <span>You save {formatPrice(printedPrice - salePrice)} ({discountPercent}% off MRP)</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Stock Status */}
              <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${stockBadgeClass}`}>
                    {outOfStock ? 'Out of stock' : `${product.stock} available`}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">Category</p>
                    <p className="mt-0.5 font-medium text-text-primary">{product.category}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">Images</p>
                    <p className="mt-0.5 font-medium text-text-primary">{images.length} photos</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-text-primary">Product Description</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Highlights */}
              <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm">
                <h3 className="text-sm font-bold text-text-primary">Product Highlights</h3>
                <ul className="mt-3 space-y-2 text-sm text-text-secondary">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-green-600">✓</span>
                    Original product with manufacturer warranty
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-green-600">✓</span>
                    Vendor managed stock with real-time availability
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-green-600">✓</span>
                    Easy replacement policy
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-green-600">✓</span>
                    Best price guaranteed
                  </li>
                </ul>
              </div>

              {/* Free Gift */}
              {product.gift?.name && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🎁</span>
                    <h3 className="text-sm font-bold text-amber-900">Free Gift Included</h3>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    {product.gift.imageUrl ? (
                      <img
                        src={product.gift.imageUrl}
                        alt={product.gift.name}
                        className="h-16 w-16 shrink-0 rounded-lg object-cover ring-1 ring-amber-200 sm:h-20 sm:w-20"
                      />
                    ) : (
                      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-2xl sm:h-20 sm:w-20">
                        🎁
                      </span>
                    )}
                    <div>
                      <p className="text-base font-bold text-amber-800">{product.gift.name}</p>
                      {product.gift.description && (
                        <p className="mt-0.5 text-xs text-amber-700">{product.gift.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Add to Cart / Buy Now - Inside scrollable content */}
              {showCartAction && (
                <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
                  {!isAuthenticated ? (
                    <Link
                      to="/login"
                      className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3.5 text-base font-bold text-white shadow-sm transition-all hover:from-blue-700 hover:to-blue-800"
                    >
                      Sign in to buy
                    </Link>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <button
                        type="button"
                        disabled={outOfStock}
                        onClick={() => onAddToCart?.(product)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3.5 text-base font-bold text-white shadow-sm transition-all hover:from-orange-600 hover:to-orange-700 disabled:opacity-50"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="8" cy="21" r="1" />
                          <circle cx="19" cy="21" r="1" />
                          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                        </svg>
                        {outOfStock ? 'Out of stock' : cartAdded ? '✓ Added to cart' : 'Add to cart'}
                      </button>
                      <button
                        type="button"
                        disabled={outOfStock}
                        onClick={handleBuyNow}
                        className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3.5 text-base font-bold text-white shadow-sm transition-all hover:from-blue-700 hover:to-blue-800 disabled:opacity-50"
                      >
                        Buy now
                      </button>
                      <p className="text-center text-xs text-text-tertiary">
                        Safe and secure checkout
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Explore More Similar Products */}
              {similarProducts && similarProducts.length > 0 && (
                <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-text-primary">Explore more similar products</h3>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {similarProducts.map((sp) => (
                      <button
                        key={sp.id}
                        type="button"
                        onClick={() => onSimilarProductClick?.(sp)}
                        className="group overflow-hidden rounded-xl border border-border bg-white text-left shadow-sm transition hover:shadow-md"
                      >
                        <div className="flex items-center justify-center bg-white p-3">
                          <img
                            src={getPrimaryImage(sp)}
                            alt={sp.name}
                            className="h-20 w-full object-contain sm:h-24"
                          />
                        </div>
                        <div className="border-t border-border px-2 pb-2 pt-1.5">
                          <p className="truncate text-[11px] font-medium leading-tight text-text-primary">
                            {sp.name}
                          </p>
                          <p className="mt-0.5 text-xs font-bold text-brand-500">
                            {formatPrice(sp.price)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </main>
      </div>

      {showSellerNumber && (
        <div className="fixed inset-x-0 bottom-24 z-30 px-4 sm:bottom-32 sm:px-6">
          <div className="mx-auto max-h-[45vh] max-w-md rounded-t-3xl rounded-b-2xl border border-blue-100 bg-white p-5 text-center shadow-2xl">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 text-center">
                <p className="text-xs font-bold uppercase tracking-wide text-blue-500">
                  Seller contact number
                </p>
                {contactLoading ? (
                  <p className="mt-3 text-sm font-semibold text-text-secondary">
                    Loading contact number...
                  </p>
                ) : sellerContactNumber ? (
                  <a
                    href={`tel:${sellerContactNumber}`}
                    className="mt-3 block text-3xl font-black text-blue-700"
                  >
                    {sellerContactNumber}
                  </a>
                ) : (
                  <p className="mt-3 text-base font-semibold text-text-secondary">
                    Not provided
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowSellerNumber(false)}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-sm font-bold text-text-secondary transition hover:bg-slate-200"
                aria-label="Close seller contact"
              >
                x
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
