export interface ProductImage {
  url: string
  publicId?: string
}

export interface ProductGift {
  name: string
  description?: string
  imageUrl?: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  printedPrice: number
  sellerMobileNumber?: string
  stock: number
  category: string
  images: ProductImage[]
  imageUrl: string
  gift?: ProductGift | null
  createdAt?: string
  updatedAt?: string
}

export interface CreateProductPayload {
  name: string
  description: string
  price: number
  printedPrice: number
  sellerMobileNumber: string
  stock: number
  category: string
  images: File[]
  gift?: {
    name: string
    description: string
    image?: File | null
  }
}

export function getProductImages(product: Product): ProductImage[] {
  if (product.images?.length) return product.images
  if (product.imageUrl) return [{ url: product.imageUrl }]
  return []
}

export function getPrimaryImage(product: Product): string {
  return getProductImages(product)[0]?.url ?? ''
}

export function getDiscountPercent(printedPrice: number, salePrice: number): number {
  if (!printedPrice || printedPrice <= 0) return 0
  const discount = Math.round(((printedPrice - salePrice) / printedPrice) * 100)
  return Math.max(0, discount)
}
