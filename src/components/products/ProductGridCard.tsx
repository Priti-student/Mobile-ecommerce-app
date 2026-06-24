import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { formatPrice } from '@/lib/api'
import { getPrimaryImage, getDiscountPercent, type Product } from '@/types/product'

interface ProductGridCardProps {
  product: Product
  onClick: () => void
}

export function ProductGridCard({ product, onClick }: ProductGridCardProps) {
  const { user } = useAuth()
  const { addItem } = useCart()
  const outOfStock = product.stock === 0
  const isCustomer = user?.role === 'customer'
  const salePrice = product.price
  const printedPrice = product.printedPrice || 0
  const discountPercent = getDiscountPercent(printedPrice, salePrice)
  const hasDiscount = printedPrice > 0 && discountPercent > 0

  function handleAddToCart(event: React.MouseEvent) {
    event.stopPropagation()
    if (!isCustomer) return
    addItem(product)
  }

  return (
    <div className="flex flex-col rounded-lg bg-white shadow-sm">
      <button type="button" onClick={onClick} className="flex flex-col text-left">
        <div className="relative bg-white px-2 pt-2">
          <img
            src={getPrimaryImage(product)}
            alt={product.name}
            className="mx-auto h-20 w-full object-contain sm:h-24"
          />
          {hasDiscount && (
            <span className="absolute right-1 top-1 rounded bg-red-500 px-1 text-[8px] font-bold text-white">
              -{discountPercent}%
            </span>
          )}
          {product.category && (
            <span className="absolute left-1 top-1 rounded bg-white/90 px-1 text-[8px] font-semibold text-brand-500">
              {product.category}
            </span>
          )}
        </div>
        <div className="px-2 pb-1 pt-1">
          <p className="line-clamp-2 text-[11px] font-medium leading-snug text-text-primary">{product.name}</p>
          <div className="mt-0.5">
            <span className="text-xs font-bold text-text-primary">{formatPrice(salePrice)}</span>
            {hasDiscount && (
              <span className="ml-1 text-[9px] line-through text-text-tertiary">{formatPrice(printedPrice)}</span>
            )}
          </div>
        </div>
      </button>
      <div className="px-2 pb-2">
        {isCustomer ? (
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={outOfStock}
            className="w-full rounded bg-orange-500 py-1.5 text-[10px] font-bold text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {outOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
        ) : (
          <p className="py-1 text-center text-[10px] font-semibold text-brand-500">View Details</p>
        )}
      </div>
    </div>
  )
}
