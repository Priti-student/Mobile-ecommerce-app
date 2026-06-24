import { useRef, useState, type FormEvent } from 'react'
import { TextField } from '@/components/TextField'
import type { CreateProductPayload } from '@/types/product'

const MAX_IMAGES = 5

interface ImagePreview {
  file: File
  url: string
}

interface AddProductFormProps {
  onSubmit: (payload: CreateProductPayload) => Promise<void>
  onCancel: () => void
}

export function AddProductForm({ onSubmit, onCancel }: AddProductFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const giftFileInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [printedPrice, setPrintedPrice] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [sellerMobileNumber, setSellerMobileNumber] = useState('')
  const [stock, setStock] = useState('')
  const [category, setCategory] = useState('General')
  const [images, setImages] = useState<ImagePreview[]>([])
  const [includeGift, setIncludeGift] = useState(false)
  const [giftName, setGiftName] = useState('')
  const [giftDescription, setGiftDescription] = useState('')
  const [giftImage, setGiftImage] = useState<File | null>(null)
  const [giftPreviewUrl, setGiftPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const parsedPrintedPrice = Number(printedPrice)
  const parsedSalePrice = Number(salePrice)
  const discountPercent = parsedPrintedPrice > 0 && parsedSalePrice > 0
    ? Math.round(((parsedPrintedPrice - parsedSalePrice) / parsedPrintedPrice) * 100)
    : 0

  function addImages(fileList: FileList | null) {
    if (!fileList?.length) return

    const remaining = MAX_IMAGES - images.length
    if (remaining <= 0) {
      setError(`You can upload up to ${MAX_IMAGES} images per product.`)
      return
    }

    const selected = Array.from(fileList).slice(0, remaining)
    const next = selected.map((file) => ({ file, url: URL.createObjectURL(file) }))
    setImages((current) => [...current, ...next])
    setError('')
  }

  function removeImage(index: number) {
    setImages((current) => {
      const target = current[index]
      if (target) URL.revokeObjectURL(target.url)
      return current.filter((_, i) => i !== index)
    })
  }

  function handleGiftImageChange(file: File | null) {
    setGiftImage(file)
    if (giftPreviewUrl) URL.revokeObjectURL(giftPreviewUrl)
    setGiftPreviewUrl(file ? URL.createObjectURL(file) : null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (images.length < 1) {
      setError('Upload at least 1 product image.')
      return
    }

    if (includeGift && !giftName.trim()) {
      setError('Enter a gift name or turn off the free gift option.')
      return
    }

    if (Number.isNaN(parsedSalePrice) || parsedSalePrice < 0) {
      setError('Enter a valid sale price.')
      return
    }

    if (Number.isNaN(parsedPrintedPrice) || parsedPrintedPrice < 0) {
      setError('Enter a valid printed price (MRP).')
      return
    }

    if (parsedSalePrice > parsedPrintedPrice && parsedPrintedPrice > 0) {
      setError('Sale price cannot be higher than the printed price (MRP).')
      return
    }

    if (!sellerMobileNumber.trim()) {
      setError('Enter the seller mobile number.')
      return
    }

    const parsedStock = Number(stock || 0)
    if (Number.isNaN(parsedStock) || parsedStock < 0) {
      setError('Enter a valid stock quantity.')
      return
    }

    setLoading(true)

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        price: parsedSalePrice,
        printedPrice: parsedPrintedPrice,
        sellerMobileNumber: sellerMobileNumber.trim(),
        stock: parsedStock,
        category: category.trim() || 'General',
        images: images.map((item) => item.file),
        gift: includeGift
          ? {
              name: giftName.trim(),
              description: giftDescription.trim(),
              image: giftImage,
            }
          : undefined,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add product.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-primary">
            Product images ({images.length}/{MAX_IMAGES})
          </span>
          <span className="text-xs text-text-tertiary">Min 1, max 5</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {images.map((image, index) => (
            <div key={image.url} className="relative">
              <img
                src={image.url}
                alt={`Product ${index + 1}`}
                className="aspect-square w-full rounded-xl object-cover ring-1 ring-border"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white"
              >
                ×
              </button>
            </div>
          ))}

          {images.length < MAX_IMAGES ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-border bg-slate-50 text-2xl text-text-tertiary transition hover:border-brand-500 hover:text-brand-500"
            >
              +
            </button>
          ) : null}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => {
            addImages(event.target.files)
            event.target.value = ''
          }}
        />
        <p className="text-xs text-text-tertiary">PNG or JPG, up to 5 MB each</p>
      </div>

      <TextField
        label="Product name"
        name="name"
        placeholder="Vivo T3x"
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
      />

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-text-primary">Description</span>
        <textarea
          name="description"
          rows={3}
          placeholder="Short product details for customers"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="input-premium resize-none"
        />
      </label>

      {/* Price Section - Printed Price (MRP) + Sale Price */}
      <div className="rounded-2xl border border-border bg-slate-50 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">Pricing</p>
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Printed Price (MRP)"
            name="printedPrice"
            type="number"
            min="0"
            step="1"
            placeholder="20000"
            value={printedPrice}
            onChange={(event) => setPrintedPrice(event.target.value)}
            required
          />
          <TextField
            label="Sale Price"
            name="salePrice"
            type="number"
            min="0"
            step="1"
            placeholder="15000"
            value={salePrice}
            onChange={(event) => setSalePrice(event.target.value)}
            required
          />
        </div>
        {discountPercent > 0 && (
          <p className="mt-2 text-sm font-semibold text-green-700">
            Customers will see {discountPercent}% off
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Seller mobile number"
          name="sellerMobileNumber"
          type="tel"
          placeholder="9876543210"
          value={sellerMobileNumber}
          onChange={(event) => setSellerMobileNumber(event.target.value)}
          required
        />
        <TextField
          label="Stock"
          name="stock"
          type="number"
          min="0"
          step="1"
          placeholder="20"
          value={stock}
          onChange={(event) => setStock(event.target.value)}
          required
        />
        <TextField
          label="Category"
          name="category"
          placeholder="Mobile"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        />
      </div>

      <section className="rounded-2xl border border-border bg-slate-50 p-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={includeGift}
            onChange={(event) => setIncludeGift(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500"
          />
          <div>
            <p className="text-sm font-semibold text-text-primary">Include a free gift</p>
            <p className="text-xs text-text-tertiary">
              Optional — e.g. free earbuds when customer buys this phone
            </p>
          </div>
        </label>

        {includeGift ? (
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            <TextField
              label="Gift name"
              name="giftName"
              placeholder="Free wireless earbuds"
              value={giftName}
              onChange={(event) => setGiftName(event.target.value)}
              required
            />
            <TextField
              label="Gift details"
              name="giftDescription"
              placeholder="Included at no extra cost with this purchase"
              value={giftDescription}
              onChange={(event) => setGiftDescription(event.target.value)}
            />

            <div className="space-y-2">
              <span className="text-sm font-medium text-text-primary">Gift image (optional)</span>
              <button
                type="button"
                onClick={() => giftFileInputRef.current?.click()}
                className="flex w-full items-center gap-3 rounded-xl border border-dashed border-border bg-white p-3 text-left"
              >
                {giftPreviewUrl ? (
                  <img src={giftPreviewUrl} alt="Gift preview" className="h-14 w-14 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-xl text-text-tertiary">
                    🎁
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {giftImage ? giftImage.name : 'Upload gift photo'}
                  </p>
                  <p className="text-xs text-text-tertiary">Optional image for the free gift</p>
                </div>
              </button>
              <input
                ref={giftFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleGiftImageChange(event.target.files?.[0] ?? null)}
              />
            </div>
          </div>
        ) : null}
      </section>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="btn-outline flex-1"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex-1"
        >
          {loading ? 'Adding…' : 'Add product'}
        </button>
      </div>
    </form>
  )
}
