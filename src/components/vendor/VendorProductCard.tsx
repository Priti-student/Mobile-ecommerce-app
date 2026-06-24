import { useState } from 'react'
import { ProductDetailModal } from '@/components/products/ProductDetailModal'
import { formatPrice } from '@/lib/api'
import { getPrimaryImage, getProductImages, getDiscountPercent, type Product } from '@/types/product'

interface VendorProductCardProps {
  product: Product
  onDelete: (product: Product) => void
  onToggleAvailability: (product: Product, newStock: number) => void
  deleting?: boolean
  toggling?: boolean
}

export function VendorProductCard({ product, onDelete, onToggleAvailability, deleting, toggling }: VendorProductCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [showUnavailableDialog, setShowUnavailableDialog] = useState(false)
  const [showAvailableDialog, setShowAvailableDialog] = useState(false)
  const [restockAmount, setRestockAmount] = useState('')
  const outOfStock = product.stock === 0
  const images = getProductImages(product)
  const printedPrice = product.printedPrice || 0
  const salePrice = product.price
  const discountPercent = getDiscountPercent(printedPrice, salePrice)
  const hasDiscount = printedPrice > 0 && discountPercent > 0

  function handleMarkUnavailable() {
    setShowUnavailableDialog(false)
    onToggleAvailability(product, 0)
  }

  function handleMarkAvailable() {
    const amount = parseInt(restockAmount, 10)
    if (isNaN(amount) || amount <= 0) return
    setShowAvailableDialog(false)
    setRestockAmount('')
    onToggleAvailability(product, amount)
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-md">
        <button
          type="button"
          onClick={() => setShowDetails(true)}
          className="flex w-full gap-4 p-4 text-left transition hover:bg-slate-50"
        >
          <div className="relative shrink-0">
            <img
              src={getPrimaryImage(product)}
              alt={product.name}
              className="h-24 w-24 rounded-xl object-cover ring-1 ring-border-light sm:h-28 sm:w-28"
            />
            {images.length > 1 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-black/70 px-1.5 text-[10px] font-semibold text-white">
                +{images.length - 1}
              </span>
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text-primary">{product.name}</p>
                <p className="mt-0.5 text-xs text-text-tertiary">{product.category}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  outOfStock
                    ? 'bg-red-50 text-red-600'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {outOfStock ? 'Out of stock' : `${product.stock} in stock`}
              </span>
            </div>

            <p className="mt-1.5 line-clamp-2 text-xs text-text-secondary">{product.description}</p>

            {product.gift?.name ? (
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2">
                {product.gift.imageUrl ? (
                  <img
                    src={product.gift.imageUrl}
                    alt={product.gift.name}
                    className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-amber-200"
                  />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-base">
                    🎁
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-bold text-amber-900">Free Gift</p>
                  <p className="truncate text-sm font-semibold text-amber-800">{product.gift.name}</p>
                </div>
              </div>
            ) : null}

            <div className="mt-3 flex items-center gap-3">
              <p className="text-base font-bold text-brand-500">{formatPrice(salePrice)}</p>
              {hasDiscount && (
                <div className="flex items-center gap-1">
                  <span className="text-xs line-through text-text-tertiary">{formatPrice(printedPrice)}</span>
                  <span className="rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">-{discountPercent}%</span>
                </div>
              )}
              <span className="text-[11px] text-text-tertiary">Tap to view details</span>
            </div>
          </div>
        </button>

        <div className="border-t border-border-light px-4 py-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onDelete(product)}
              disabled={deleting}
              className="flex-1 rounded-xl border border-red-200 px-4 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (outOfStock) {
                  setShowAvailableDialog(true)
                } else {
                  setShowUnavailableDialog(true)
                }
              }}
              disabled={toggling}
              className={`flex-1 rounded-xl border px-4 py-2 text-xs font-semibold transition disabled:opacity-50 ${
                outOfStock
                  ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                  : 'border-amber-200 text-amber-600 hover:bg-amber-50'
              }`}
            >
              {toggling
                ? 'Updating…'
                : outOfStock
                  ? 'Mark As Available'
                  : 'Mark As Unavailable'}
            </button>
          </div>
        </div>
      </div>

      {/* Unavailable Confirmation Dialog */}
      {showUnavailableDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-2xl">
              ⚠️
            </div>
            <h3 className="mt-3 text-lg font-bold text-text-primary">Mark as Unavailable</h3>
            <p className="mt-2 text-sm text-text-secondary">
              Stock will be set to <strong>0</strong> and the product will be marked as unavailable. Customers will no longer be able to purchase this product.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowUnavailableDialog(false)}
                className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-text-secondary transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMarkUnavailable}
                className="flex-1 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Available Restock Dialog */}
      {showAvailableDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl">
              📦
            </div>
            <h3 className="mt-3 text-lg font-bold text-text-primary">Mark as Available</h3>
            <p className="mt-2 text-sm text-text-secondary">
              Enter the number of stock to make this product available again.
            </p>
            <div className="mt-4">
              <label htmlFor="restock-input" className="sr-only">Stock quantity</label>
              <input
                id="restock-input"
                type="number"
                min="1"
                value={restockAmount}
                onChange={(e) => setRestockAmount(e.target.value)}
                placeholder="Enter stock quantity"
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAvailableDialog(false)
                  setRestockAmount('')
                }}
                className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-text-secondary transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMarkAvailable}
                disabled={!restockAmount || parseInt(restockAmount, 10) <= 0}
                className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showDetails ? (
        <ProductDetailModal product={product} onClose={() => setShowDetails(false)} />
      ) : null}
    </>
  )
}